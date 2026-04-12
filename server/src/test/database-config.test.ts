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

    const database = await import('../database');
    const repoRoot = path.resolve(__dirname, '../../..');

    expect(database.getLibsqlConnectionOptions()).toEqual({
      url: `file:${path.join(repoRoot, 'data', 'thaichess.db')}`,
    });
  });

  it('honors DATA_DIR overrides for local database clients', async () => {
    process.env.DATA_DIR = '/tmp/thaichess-custom-data';
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.TURSO_DATABASE_URL;

    const database = await import('../database');

    expect(database.getLibsqlConnectionOptions()).toEqual({
      url: 'file:/tmp/thaichess-custom-data/thaichess.db',
    });
  });
});
