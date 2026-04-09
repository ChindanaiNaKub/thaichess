import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  otps: new Map<string, string>(),
}));

vi.mock('../authEmailOtp', () => ({
  sendAuthEmailOtp: vi.fn(async ({ email, otp }: { email: string; otp: string }) => {
    testState.otps.set(email, otp);
  }),
}));

describe('better-auth email otp', () => {
  let tempDir: string;
  const originalEnv = {
    AUTH_FROM_EMAIL: process.env.AUTH_FROM_EMAIL,
    AUTH_SECRET: process.env.AUTH_SECRET,
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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-better-auth-otp-'));
    process.env.AUTH_FROM_EMAIL = '';
    process.env.AUTH_SECRET = 'test-auth-secret-0123456789abcdef';
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

  function buildSignedSessionCookie(token: string) {
    const secret = process.env.BETTER_AUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
    if (!secret) {
      throw new Error('Expected a Better Auth signing secret for the test.');
    }

    const signature = crypto
      .createHmac('sha256', secret)
      .update(token)
      .digest('base64');

    return `better-auth.session_token=${token}.${signature}`;
  }

  it('configures Better Auth with email OTP support', async () => {
    const { auth } = await import('../betterAuth');

    expect(typeof auth.api.sendVerificationOTP).toBe('function');
    expect(typeof auth.api.signInEmailOTP).toBe('function');
  });

  it('stores sign-in otp hashes without touching the legacy login_codes table', async () => {
    const database = await import('../database');
    const { auth } = await import('../betterAuth');

    await database.initDatabase();
    const client = database.getDatabaseConfig().client;

    await database.upsertUserByEmail({
      id: 'email-otp-user',
      email: 'player@example.com',
      role: 'user',
    });

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

    const verification = await client.execute({
      sql: 'SELECT value FROM verifications WHERE identifier = ?',
      args: ['sign-in-otp-player@example.com'],
    });
    const storedValue = String(verification.rows[0]?.value ?? '');

    expect(storedValue).not.toBe('');
    expect(storedValue).toContain(':0');
    expect(storedValue).not.toBe(`${otp}:0`);
    expect(await database.getLoginCodeByEmail('player@example.com')).toBeNull();
  });

  it('lets an admin start 2fa setup after email otp sign-in', async () => {
    const database = await import('../database');
    const { auth } = await import('../betterAuth');

    await database.initDatabase();
    const client = database.getDatabaseConfig().client;

    await database.upsertUserByEmail({
      id: 'admin-user',
      email: 'admin@example.com',
      role: 'admin',
    });

    await client.execute({
      sql: `
        UPDATE users
        SET username = ?, rating = ?, fair_play_status = ?, twoFactorEnabled = 0
        WHERE email = ?
      `,
      args: ['admin_master', 1875, 'restricted', 'admin@example.com'],
    });

    const headers = new Headers({ origin: 'http://localhost:3000' });
    await auth.api.sendVerificationOTP({
      body: {
        email: 'admin@example.com',
        type: 'sign-in',
      },
      headers,
    });

    const otp = testState.otps.get('admin@example.com');
    if (!otp) {
      throw new Error('Expected OTP to be captured by the mocked sender.');
    }

    const signIn = await auth.api.signInEmailOTP({
      body: {
        email: 'admin@example.com',
        otp,
      },
      headers,
    });

    expect(signIn.token).toEqual(expect.any(String));
    expect(signIn.user.email).toBe('admin@example.com');
    expect(signIn.user.role).toBe('admin');
    expect(signIn.user.username).toBe('admin_master');
    expect(signIn.user.rating).toBe(1875);
    expect(signIn.user.fair_play_status).toBe('restricted');

    const enableTwoFactor = await auth.api.enableTwoFactor({
      body: {},
      headers: new Headers({
        cookie: buildSignedSessionCookie(signIn.token),
        origin: 'http://localhost:3000',
      }),
    });

    expect(enableTwoFactor.totpURI).toContain('otpauth://totp/');
    expect(enableTwoFactor.backupCodes.length).toBeGreaterThan(0);

    const storedUser = await database.getUserByEmail('admin@example.com');
    expect(storedUser).toMatchObject({
      id: 'admin-user',
      email: 'admin@example.com',
      role: 'admin',
      username: 'admin_master',
      rating: 1875,
      fair_play_status: 'restricted',
      twoFactorEnabled: false,
    });

    const sessions = await client.execute({
      sql: 'SELECT user_id, token FROM auth_sessions WHERE user_id = ?',
      args: ['admin-user'],
    });

    expect(sessions.rows.length).toBe(1);
    expect(String(sessions.rows[0].token)).toBe(signIn.token);

    const twoFactor = await client.execute({
      sql: 'SELECT userId, secret, backupCodes FROM twoFactor WHERE userId = ?',
      args: ['admin-user'],
    });

    expect(twoFactor.rows.length).toBe(1);
    expect(String(twoFactor.rows[0].userId)).toBe('admin-user');
    expect(String(twoFactor.rows[0].secret)).not.toBe('');
    expect(String(twoFactor.rows[0].backupCodes)).not.toBe('');
  });

  it('requires 2fa redirect for admins who already enabled two-factor', async () => {
    const database = await import('../database');
    const { auth } = await import('../betterAuth');

    await database.initDatabase();
    const client = database.getDatabaseConfig().client;

    await database.upsertUserByEmail({
      id: 'mfa-admin',
      email: 'mfa-admin@example.com',
      role: 'admin',
    });

    await client.execute({
      sql: `
        UPDATE users
        SET twoFactorEnabled = 1
        WHERE email = ?
      `,
      args: ['mfa-admin@example.com'],
    });

    const headers = new Headers({ origin: 'http://localhost:3000' });
    await auth.api.sendVerificationOTP({
      body: {
        email: 'mfa-admin@example.com',
        type: 'sign-in',
      },
      headers,
    });

    const otp = testState.otps.get('mfa-admin@example.com');
    if (!otp) {
      throw new Error('Expected OTP to be captured by the mocked sender.');
    }

    const result = await auth.api.signInEmailOTP({
      body: {
        email: 'mfa-admin@example.com',
        otp,
      },
      headers,
    });

    expect(result).toEqual({ twoFactorRedirect: true });

    const sessions = await client.execute({
      sql: 'SELECT id FROM auth_sessions WHERE user_id = ?',
      args: ['mfa-admin'],
    });

    expect(sessions.rows.length).toBe(0);
  });
});
