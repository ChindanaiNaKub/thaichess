import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from '../../../shared/engine';
import { analysisPositionHash } from '../../../shared/engineAdapter';
import type { Move } from '../../../shared/types';

const sampleMoves: Move[] = [
  {
    from: { row: 2, col: 4 },
    to: { row: 3, col: 4 },
    movedPiece: { type: 'P', color: 'white' },
    capturedPiece: null,
    promoted: false,
    promotion: null,
  },
];

describe('database game search and opening explorer', () => {
  let tempDir: string;
  const originalEnv = {
    DATA_DIR: process.env.DATA_DIR,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-search-'));
    process.env.DATA_DIR = tempDir;
    process.env.TURSO_DATABASE_URL = '';
    process.env.TURSO_AUTH_TOKEN = '';
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

  it('returns empty search and opening results on a fresh database', async () => {
    const database = await import('../database');
    await database.initDatabase();

    const search = await database.searchGames({ player: 'ab', limit: 10, offset: 0 });
    expect(search).toEqual({ games: [], total: 0 });

    const stats = await database.getOpeningStats('missing-hash');
    expect(stats.totalGames).toBe(0);
    expect(stats.moves).toEqual([]);

    const positionGames = await database.getPositionGames('missing-hash');
    expect(positionGames).toEqual({ games: [], total: 0 });
  });

  it('searches finished games and returns opening stats for indexed positions', async () => {
    const database = await import('../database');
    await database.initDatabase();

    await database.saveCompletedGame({
      id: 'search-game-1',
      result: 'white',
      resultReason: 'checkmate',
      whiteName: 'AlicePlayer',
      blackName: 'BobPlayer',
      rated: false,
      gameMode: 'quick_play',
      timeControl: { initial: 300, increment: 0 },
      moves: sampleMoves,
      finalBoard: createInitialGameState(0, 0).board,
      moveCount: 1,
    });

    const byPlayer = await database.searchGames({ player: 'Alice', limit: 10, offset: 0 });
    expect(byPlayer.total).toBe(1);
    expect(byPlayer.games[0]?.id).toBe('search-game-1');
    expect(byPlayer.games[0]?.white_name).toBe('AlicePlayer');

    const missingPlayer = await database.searchGames({ player: 'Zz', limit: 10, offset: 0 });
    expect(missingPlayer).toEqual({ games: [], total: 0 });

    const initial = createInitialGameState(0, 0);
    const startHash = analysisPositionHash({
      board: initial.board,
      turn: initial.turn,
      counting: initial.counting,
    });

    const stats = await database.getOpeningStats(startHash);
    expect(stats.totalGames).toBe(1);
    expect(stats.moves.some((move) => move.moveUci === 'e3e4')).toBe(true);

    const positionGames = await database.getPositionGames(startHash, 'e3e4', 10, 0);
    expect(positionGames.total).toBe(1);
    expect(positionGames.games[0]?.id).toBe('search-game-1');
  });
});
