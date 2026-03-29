import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('database puzzle progress persistence', () => {
  let tempDir: string;
  const originalTursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
  const originalTursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-puzzle-progress-'));
    process.env.DATA_DIR = tempDir;
    process.env.TURSO_DATABASE_URL = '';
    process.env.TURSO_AUTH_TOKEN = '';
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.DATA_DIR;
    if (originalTursoDatabaseUrl === undefined) {
      delete process.env.TURSO_DATABASE_URL;
    } else {
      process.env.TURSO_DATABASE_URL = originalTursoDatabaseUrl;
    }
    if (originalTursoAuthToken === undefined) {
      delete process.env.TURSO_AUTH_TOKEN;
    } else {
      process.env.TURSO_AUTH_TOKEN = originalTursoAuthToken;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('merges and deduplicates completed puzzle ids per user', async () => {
    const database = await import('../database');

    await database.initDatabase();
    await database.upsertUserByEmail({
      id: 'player-1',
      email: 'player1@example.com',
      role: 'user',
    });

    expect(await database.getCompletedPuzzleIdsForUser('player-1')).toEqual([]);

    expect(await database.markPuzzleCompleted('player-1', 10)).toEqual([10]);
    expect(await database.markPuzzleCompleted('player-1', 10)).toEqual([10]);
    expect(await database.mergeCompletedPuzzles('player-1', [8, 10, 12, 12])).toEqual([8, 10, 12]);
  });

  it('keeps progress isolated between users', async () => {
    const database = await import('../database');

    await database.initDatabase();
    await Promise.all([
      database.upsertUserByEmail({
        id: 'player-a',
        email: 'playera@example.com',
        role: 'user',
      }),
      database.upsertUserByEmail({
        id: 'player-b',
        email: 'playerb@example.com',
        role: 'user',
      }),
    ]);

    await database.mergeCompletedPuzzles('player-a', [1, 6, 8]);
    await database.mergeCompletedPuzzles('player-b', [5001]);

    expect(await database.getCompletedPuzzleIdsForUser('player-a')).toEqual([1, 6, 8]);
    expect(await database.getCompletedPuzzleIdsForUser('player-b')).toEqual([5001]);
  });
});
