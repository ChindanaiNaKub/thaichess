import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  otps: new Map<string, string>(),
}));

vi.mock('../authEmailOtp', () => ({
  sendAuthEmailOtp: vi.fn(async ({ email, otp }: { email: string; otp: string }) => {
    testState.otps.set(email, otp);
  }),
}));

describe('auth hardening', () => {
  let tempDir: string;
  const originalEnv = {
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_FROM_EMAIL: process.env.AUTH_FROM_EMAIL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATA_DIR: process.env.DATA_DIR,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SITE_URL: process.env.SITE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-auth-'));
    process.env.ADMIN_EMAILS = 'admin@example.com';
    process.env.AUTH_SECRET = 'test-auth-secret';
    process.env.AUTH_FROM_EMAIL = '';
    process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret-0123456789abcdef';
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.DATA_DIR = tempDir;
    process.env.NODE_ENV = 'test';
    process.env.RESEND_API_KEY = '';
    process.env.SITE_URL = 'http://localhost:3000';
    process.env.TURSO_AUTH_TOKEN = '';
    process.env.TURSO_DATABASE_URL = '';
  });

  afterEach(() => {
    vi.resetModules();
    testState.otps.clear();

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('fails to load in production when AUTH_SECRET is missing even if TURSO_AUTH_TOKEN exists', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SECRET = '';
    process.env.TURSO_AUTH_TOKEN = 'should-not-be-used';
    vi.resetModules();

    return expect(import('../auth')).rejects.toThrow('AUTH_SECRET must be set in production.');
  });

  it('uses Better Auth email OTP sign-in without writing legacy login_codes or sessions', async () => {
    const database = await import('../database');
    const { auth } = await import('../betterAuth');

    await database.initDatabase();
    await database.upsertUserByEmail({
      id: 'email-otp-user',
      email: 'player@example.com',
      role: 'user',
    });

    const client = database.getDatabaseConfig().client;
    const headers = new Headers({ origin: 'http://localhost:3000' });

    const sendResult = await auth.api.sendVerificationOTP({
      body: {
        email: 'player@example.com',
        type: 'sign-in',
      },
      headers,
    });

    expect(sendResult).toEqual({ success: true });

    const otp = testState.otps.get('player@example.com');
    if (!otp) {
      throw new Error('Expected OTP to be captured by the mocked sender.');
    }

    const loginCodesAfterRequest = await client.execute({
      sql: 'SELECT id FROM login_codes WHERE email = ?',
      args: ['player@example.com'],
    });
    expect(loginCodesAfterRequest.rows).toHaveLength(0);

    const signIn = await auth.api.signInEmailOTP({
      body: {
        email: 'player@example.com',
        otp,
      },
      headers,
    });

    expect(signIn.token).toEqual(expect.any(String));
    expect(signIn.user.email).toBe('player@example.com');
    const storedUser = await database.getUserByEmail('player@example.com');
    expect(storedUser?.role).toBe('user');
    expect(storedUser?.rating).toBe(500);

    const loginCodesAfterSignIn = await client.execute({
      sql: 'SELECT id FROM login_codes WHERE email = ?',
      args: ['player@example.com'],
    });
    expect(loginCodesAfterSignIn.rows).toHaveLength(0);

    const legacySessions = await client.execute({
      sql: 'SELECT id FROM sessions WHERE user_id = ?',
      args: ['email-otp-user'],
    });
    expect(legacySessions.rows).toHaveLength(0);

    const authSessions = await client.execute({
      sql: 'SELECT user_id, token FROM auth_sessions WHERE user_id = ?',
      args: ['email-otp-user'],
    });
    expect(authSessions.rows).toHaveLength(1);
    expect(String(authSessions.rows[0].token)).toBe(signIn.token);
  });

  it('treats only admins with MFA enabled as admin-ready', async () => {
    const auth = await import('../auth');

    expect(auth.hasAdminMfaAccess({
      role: 'admin',
      twoFactorEnabled: false,
    } as const)).toBe(false);

    expect(auth.hasAdminMfaAccess({
      role: 'admin',
      twoFactorEnabled: true,
    } as const)).toBe(true);
  });

  it('logs session termination on logout', async () => {
    const logger = await import('../logger');
    const database = await import('../database');
    const auth = await import('../auth');
    const logInfoSpy = vi.spyOn(logger, 'logInfo').mockImplementation(() => {});

    await database.initDatabase();
    await database.upsertUserByEmail({
      id: 'logout-user',
      email: 'logout@example.com',
      role: 'user',
    });

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto
      .createHmac('sha256', process.env.AUTH_SECRET?.trim() ?? '')
      .update(rawToken)
      .digest('hex');

    await database.createSession({
      id: 'legacy-session',
      userId: 'logout-user',
      tokenHash,
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    });

    const request = {
      headers: {
        cookie: `thaichess_session=${encodeURIComponent(rawToken)}`,
      },
    } as never;

    const logoutResponse = {
      setHeader: vi.fn(),
    } as unknown as Response;

    await auth.logoutRequest(request, logoutResponse);

    expect(logInfoSpy).toHaveBeenCalledWith('auth_session_terminated', expect.objectContaining({
      userId: 'logout-user',
      email: 'logout@example.com',
      result: 'logout',
    }));
  });
});
