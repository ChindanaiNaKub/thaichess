import fs from 'fs';
import os from 'os';
import path from 'path';
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

  it('creates new logins as normal users even when ADMIN_EMAILS includes the email', async () => {
    const database = await import('../database');
    const auth = await import('../auth');

    await database.initDatabase();
    await database.createLoginCode({
      id: 'code-new-user',
      email: 'admin@example.com',
      codeHash: auth.hashAuthValue('admin@example.com:123456'),
      expiresAt: Math.floor(Date.now() / 1000) + 600,
    });

    const result = await auth.verifyLoginCode('admin@example.com', '123456');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`Expected login success, received: ${result.error}`);
    }
    expect(result.user.role).toBe('user');

    const storedUser = await database.getUserByEmail('admin@example.com');
    expect(storedUser?.role).toBe('user');
  });

  it('preserves an existing admin role instead of downgrading on login', async () => {
    const database = await import('../database');
    const auth = await import('../auth');

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

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`Expected login success, received: ${result.error}`);
    }
    expect(result.user.role).toBe('admin');

    const storedUser = await database.getUserByEmail('admin@example.com');
    expect(storedUser?.role).toBe('admin');
  });
});
