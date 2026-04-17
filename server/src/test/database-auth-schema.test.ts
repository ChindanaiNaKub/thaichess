import fs from 'fs';
import os from 'os';
import path from 'path';
import { createClient } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('better-auth database schema', () => {
  let tempDir: string;
  const originalEnv = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATA_DIR: process.env.DATA_DIR,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    SITE_URL: process.env.SITE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-better-auth-'));
    process.env.DATA_DIR = tempDir;
    process.env.NODE_ENV = 'test';
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

  it('creates the better-auth tables and required user profile columns', async () => {
    const database = await import('../database');

    await database.initDatabase();

    const client = createClient({
      url: `file:${path.join(tempDir, 'thaichess.db')}`,
    });

    const tableInfo = await client.execute('PRAGMA table_info(users)');
    const userColumns = new Set(tableInfo.rows.map((row) => String(row.name)));

    expect(userColumns.has('name')).toBe(true);
    expect(userColumns.has('image')).toBe(true);
    expect(userColumns.has('email_verified')).toBe(true);
    expect(userColumns.has('twoFactorEnabled')).toBe(true);
    expect(userColumns.has('username_updated_at')).toBe(true);

    const tables = await client.execute(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('accounts', 'auth_sessions', 'twoFactor', 'verifications')
      ORDER BY name
    `);

    expect(tables.rows.map((row) => String(row.name))).toEqual([
      'accounts',
      'auth_sessions',
      'twoFactor',
      'verifications',
    ]);
  });

  it('can initialize better-auth social sign-in without schema lookup errors', async () => {
    process.env.AUTH_SECRET = 'test-auth-secret-0123456789abcdef';
    process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret-0123456789abcdef';
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.SITE_URL = 'http://localhost:3000';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

    const database = await import('../database');
    const { auth } = await import('../betterAuth');

    await database.initDatabase();

    const response = await auth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL: 'http://localhost:5173/account',
        disableRedirect: true,
      },
      headers: new Headers({
        origin: 'http://localhost:3000',
      }),
    });

    expect(response.redirect).toBe(false);
    expect(response.url).toContain('accounts.google.com');
  });
});
