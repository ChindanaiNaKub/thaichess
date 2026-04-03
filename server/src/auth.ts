import './env';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createLoginCode,
  createSession,
  consumeLoginCode,
  deleteSessionByTokenHash,
  getLoginCodeByEmail,
  getUserBySessionTokenHash,
  type AuthUser,
  markLoginCodeAttempt,
  upsertUserByEmail,
} from './database';
import { logInfo, logWarn } from './logger';

const SESSION_COOKIE_NAME = 'thaichess_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const LOGIN_CODE_TTL_SECONDS = 60 * 10;
const LOGIN_CODE_MAX_ATTEMPTS = 5;
const GUEST_PLAYER_ID_PATTERN = /^guest_[A-Za-z0-9-]{16,128}$/;
const AUTH_SECRET = resolveAuthSecret();
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || '';
const AUTH_FROM_EMAIL = process.env.AUTH_FROM_EMAIL?.trim() || '';

function resolveAuthSecret() {
  const authSecret = process.env.AUTH_SECRET?.trim();
  if (authSecret) {
    return authSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set in production.');
  }

  logWarn('auth_secret_missing', {
    source: process.env.TURSO_AUTH_TOKEN ? 'turso_auth_token_ignored' : 'dev_fallback',
  });

  return 'dev-insecure-auth-secret';
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim().replace(/\s+/g, ' ');
}

export function normalizeGuestPlayerId(value: unknown) {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  return GUEST_PLAYER_ID_PATTERN.test(normalized) ? normalized : null;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string) {
  return /^[A-Za-z0-9_]{3,20}$/.test(username);
}

export function createLoginCodeValue() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashAuthValue(value: string) {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(value)
    .digest('hex');
}

export function parseCookies(cookieHeader?: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const pair of cookieHeader.split(';')) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

function buildCookie(value: string, maxAgeSeconds: number) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', buildCookie('', 0));
}

export async function setSessionCookie(res: Response, userId: string) {
  const rawToken = createSessionToken();
  const tokenHash = hashAuthValue(rawToken);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;

  await createSession({
    id: uuidv4(),
    userId,
    tokenHash,
    expiresAt,
  });

  res.setHeader('Set-Cookie', buildCookie(rawToken, SESSION_MAX_AGE_SECONDS));
}

export async function getAuthenticatedUser(req: Request): Promise<AuthUser | null> {
  return getAuthenticatedUserFromCookieHeader(req.headers.cookie);
}

export async function getAuthenticatedUserFromCookieHeader(cookieHeader?: string): Promise<AuthUser | null> {
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  return getUserBySessionTokenHash(hashAuthValue(token));
}

export async function logoutRequest(req: Request, res: Response) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];

  if (token) {
    await deleteSessionByTokenHash(hashAuthValue(token));
  }

  clearSessionCookie(res);
}

export async function issueLoginCode(email: string, requestedIp?: string) {
  const code = createLoginCodeValue();
  const expiresAt = Math.floor(Date.now() / 1000) + LOGIN_CODE_TTL_SECONDS;

  await createLoginCode({
    id: uuidv4(),
    email,
    codeHash: hashAuthValue(`${email}:${code}`),
    expiresAt,
    requestedIp,
  });

  await sendLoginCode(email, code);
}

export async function verifyLoginCode(email: string, code: string) {
  const record = await getLoginCodeByEmail(email);
  const now = Math.floor(Date.now() / 1000);

  if (!record || record.consumed_at || record.expires_at <= now) {
    return { ok: false as const, error: 'Code expired. Please request a new one.' };
  }

  if (record.attempts >= LOGIN_CODE_MAX_ATTEMPTS) {
    return { ok: false as const, error: 'Too many attempts. Please request a new code.' };
  }

  const candidateHash = hashAuthValue(`${email}:${code}`);
  if (candidateHash !== record.code_hash) {
    await markLoginCodeAttempt(record.id);
    return { ok: false as const, error: 'Invalid code.' };
  }

  await consumeLoginCode(record.id);
  const user = await upsertUserByEmail({
    id: uuidv4(),
    email,
    role: 'user',
  });

  if (!user) {
    return { ok: false as const, error: 'Failed to sign in.' };
  }

  return { ok: true as const, user };
}

async function sendLoginCode(email: string, code: string) {
  if (RESEND_API_KEY && AUTH_FROM_EMAIL) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: AUTH_FROM_EMAIL,
        to: [email],
        subject: 'Your ThaiChess sign-in code',
        text: `Your ThaiChess sign-in code is ${code}. It expires in 10 minutes.`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Email delivery failed: ${body}`);
    }

    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    logInfo('auth_login_code_generated', { email, code });
    return;
  }

  throw new Error('Email delivery is not configured.');
}
