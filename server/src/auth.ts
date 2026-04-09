import './env';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createSession,
  deleteSessionByTokenHash,
  getUserBySessionTokenHash,
  type AuthUser,
} from './database';
import { getBetterAuthUserFromCookieHeader } from './betterAuth';
import { logInfo, logWarn } from './logger';

const SESSION_COOKIE_NAME = 'thaichess_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const GUEST_PLAYER_ID_PATTERN = /^guest_[A-Za-z0-9-]{16,128}$/;
const AUTH_SECRET = resolveAuthSecret();

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

export function normalizeGuestPlayerId(value: unknown) {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  return GUEST_PLAYER_ID_PATTERN.test(normalized) ? normalized : null;
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashAuthValue(value: string) {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(value)
    .digest('hex');
}

export function hasAdminMfaAccess(user: Pick<AuthUser, 'role' | 'twoFactorEnabled'>) {
  return user.role === 'admin' && user.twoFactorEnabled;
}

function parseCookies(cookieHeader?: string) {
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
  const betterAuthUser = await getBetterAuthUserFromCookieHeader(cookieHeader);
  if (betterAuthUser) {
    return betterAuthUser;
  }

  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  return getUserBySessionTokenHash(hashAuthValue(token));
}

export async function logoutRequest(req: Request, res: Response) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];

  if (token) {
    const user = await getUserBySessionTokenHash(hashAuthValue(token));
    await deleteSessionByTokenHash(hashAuthValue(token));
    logInfo('auth_session_terminated', {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      result: 'logout',
    });
  } else {
    logInfo('auth_session_terminated', {
      userId: null,
      email: null,
      result: 'logout_without_session',
    });
  }

  clearSessionCookie(res);
}
