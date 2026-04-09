import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth hardening', () => {
  let tempDir: string;
  const originalEnv = {
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATA_DIR: process.env.DATA_DIR,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    AUTH_FROM_EMAIL: process.env.AUTH_FROM_EMAIL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-auth-'));
    process.env.ADMIN_EMAILS = 'admin@example.com';
    process.env.AUTH_SECRET = 'test-auth-secret';
    process.env.DATA_DIR = tempDir;
    process.env.NODE_ENV = 'test';
    process.env.RESEND_API_KEY = '';
    process.env.AUTH_FROM_EMAIL = '';
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

  it('fails to load in production when AUTH_SECRET is missing even if TURSO_AUTH_TOKEN exists', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SECRET = '';
    process.env.TURSO_AUTH_TOKEN = 'should-not-be-used';
    vi.resetModules();

    return expect(import('../auth')).rejects.toThrow('AUTH_SECRET must be set in production.');
  });

  it('uses a 7-day session cookie max age', async () => {
    const database = await import('../database');
    const auth = await import('../auth');

    await database.initDatabase();

    const response = {
      setHeader: vi.fn(),
    } as unknown as Response;

    await auth.setSessionCookie(response, 'user-1');

    expect(response.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('Max-Age=604800'),
    );
  });

  it('creates new logins as normal users even when ADMIN_EMAILS includes the email', async () => {
    const logger = await import('../logger');
    const database = await import('../database');
    const auth = await import('../auth');
    const logInfoSpy = vi.spyOn(logger, 'logInfo').mockImplementation(() => {});

    await database.initDatabase();
    await auth.issueLoginCode('admin@example.com', '127.0.0.1');

    const code = '123456';
    await database.createLoginCode({
      id: 'code-new-user',
      email: 'admin@example.com',
      codeHash: auth.hashAuthValue('admin@example.com:123456'),
      expiresAt: Math.floor(Date.now() / 1000) + 600,
    });

    const result = await auth.verifyLoginCode('admin@example.com', code);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`Expected login success, received: ${result.error}`);
    }
    expect(result.user.role).toBe('user');

    const storedUser = await database.getUserByEmail('admin@example.com');
    expect(storedUser?.role).toBe('user');
    expect(logInfoSpy).toHaveBeenCalledWith('auth_login_code_generated', expect.objectContaining({
      email: 'admin@example.com',
      ip: '127.0.0.1',
      result: 'issued',
    }));
    expect(logInfoSpy).toHaveBeenCalledWith('auth_login_code_verified', expect.objectContaining({
      email: 'admin@example.com',
      result: 'success',
    }));
  });

  it('blocks admin accounts from using the custom email-code login flow', async () => {
    const logger = await import('../logger');
    const database = await import('../database');
    const auth = await import('../auth');
    const logWarnSpy = vi.spyOn(logger, 'logWarn').mockImplementation(() => {});

    await database.initDatabase();
    await database.upsertUserByEmail({
      id: 'admin-user',
      email: 'admin@example.com',
      role: 'admin',
    });
    await database.createLoginCode({
      id: 'code-existing-admin',
      email: 'admin@example.com',
      codeHash: auth.hashAuthValue('admin@example.com:654321'),
      expiresAt: Math.floor(Date.now() / 1000) + 600,
    });

    const result = await auth.verifyLoginCode('admin@example.com', '654321');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected admin email-code login to be rejected.');
    }
    expect(result.error).toBe('Admin accounts must sign in with Google or Facebook to use MFA.');

    const storedUser = await database.getUserByEmail('admin@example.com');
    expect(storedUser?.role).toBe('admin');
    expect(logWarnSpy).toHaveBeenCalledWith('auth_login_code_rejected', expect.objectContaining({
      email: 'admin@example.com',
      result: 'admin_requires_social',
    }));
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

  it('logs when a login code is rejected after too many attempts', async () => {
    const logger = await import('../logger');
    const database = await import('../database');
    const auth = await import('../auth');
    const logWarnSpy = vi.spyOn(logger, 'logWarn').mockImplementation(() => {});

    await database.initDatabase();
    await database.createLoginCode({
      id: 'code-too-many-attempts',
      email: 'player@example.com',
      codeHash: auth.hashAuthValue('player@example.com:111111'),
      expiresAt: Math.floor(Date.now() / 1000) + 600,
    });
    const record = await database.getLoginCodeByEmail('player@example.com');
    if (!record) {
      throw new Error('Expected exhausted login code record to exist.');
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await database.markLoginCodeAttempt(record.id);
    }

    const result = await auth.verifyLoginCode('player@example.com', '111111');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected too-many-attempts login to be rejected.');
    }
    expect(result.error).toBe('Too many attempts. Please request a new code.');
    expect(logWarnSpy).toHaveBeenCalledWith('auth_login_code_rejected', expect.objectContaining({
      email: 'player@example.com',
      result: 'too_many_attempts',
    }));
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

    const setHeaderMock = vi.fn();
    const response = {
      setHeader: setHeaderMock,
      getHeader: vi.fn(),
    } as unknown as Response;

    await auth.setSessionCookie(response, 'logout-user');
    const cookieHeader = String(setHeaderMock.mock.calls.at(-1)?.[1] ?? '');
    const sessionValue = cookieHeader.split(';')[0];

    const request = {
      headers: {
        cookie: sessionValue,
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
