import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = {
  DATA_DIR: process.env.DATA_DIR,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
};

describe('database connection config', () => {
  afterEach(() => {
    vi.resetModules();

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('uses the workspace data directory by default for local auth and database clients', async () => {
    delete process.env.DATA_DIR;
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.TURSO_DATABASE_URL;

    vi.doMock('../env', () => ({ env: {} }));
    const database = await import('../database');
    const repoRoot = path.resolve(__dirname, '../../..');
    const options = database.getLibsqlConnectionOptions();
    const expectedDbFile = fs.existsSync(path.join(repoRoot, 'data', 'makruk.db')) ? 'makruk.db' : 'thaichess.db';

    expect(options).toEqual({
      url: `file:${path.join(repoRoot, 'data', expectedDbFile)}`,
    });
  });

  it('honors DATA_DIR overrides for local database clients', async () => {
    process.env.DATA_DIR = '/tmp/thaichess-custom-data';
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.TURSO_DATABASE_URL;

    vi.doMock('../env', () => ({ env: {} }));
    const database = await import('../database');

    expect(database.getLibsqlConnectionOptions()).toEqual({
      url: 'file:/tmp/thaichess-custom-data/thaichess.db',
    });
  });
});
