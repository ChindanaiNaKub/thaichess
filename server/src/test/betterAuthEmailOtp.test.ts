import fs from 'fs';
import os from 'os';
import path from 'path';
import { createClient } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('configures Better Auth with email OTP support', async () => {
    const { auth } = await import('../betterAuth');

    expect(typeof auth.api.sendVerificationOTP).toBe('function');
    expect(typeof auth.api.signInEmailOTP).toBe('function');
    expect(typeof auth.api.getVerificationOTP).toBe('function');
  });

  it('sends a sign-in otp without touching the legacy login_codes table', async () => {
    const database = await import('../database');
    const { auth } = await import('../betterAuth');

    await database.initDatabase();
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

    const verification = await auth.api.getVerificationOTP({
      query: {
        email: 'player@example.com',
        type: 'sign-in',
      },
      headers,
    });

    expect(verification.otp).toMatch(/^\d{6}$/);
    expect(await database.getLoginCodeByEmail('player@example.com')).toBeNull();
  });

  it('signs in an existing admin user with email otp and creates a better-auth session', async () => {
    const database = await import('../database');
    const { auth } = await import('../betterAuth');

    await database.initDatabase();
    await database.upsertUserByEmail({
      id: 'admin-user',
      email: 'admin@example.com',
      role: 'admin',
    });

    const client = createClient({
      url: `file:${path.join(tempDir, 'thaichess.db')}`,
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

    const verification = await auth.api.getVerificationOTP({
      query: {
        email: 'admin@example.com',
        type: 'sign-in',
      },
      headers,
    });

    if (!verification.otp) {
      throw new Error('Expected email OTP to be retrievable for sign-in.');
    }

    const signIn = await auth.api.signInEmailOTP({
      body: {
        email: 'admin@example.com',
        otp: verification.otp,
      },
      headers,
    });

    expect(signIn.token).toEqual(expect.any(String));
    expect(signIn.user.email).toBe('admin@example.com');
    expect(signIn.user.role).toBe('admin');
    expect(signIn.user.username).toBe('admin_master');
    expect(signIn.user.rating).toBe(1875);
    expect(signIn.user.fair_play_status).toBe('restricted');

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
  });
});
