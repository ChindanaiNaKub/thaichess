import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('database rated game persistence', () => {
  let tempDir: string;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'));
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-db-test-'));
    process.env.DATA_DIR = tempDir;
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.resetModules();
    delete process.env.DATA_DIR;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('applies Elo exactly once for rated quick-play games', async () => {
    const database = await import('../database');

    await database.initDatabase();

    const white = await database.upsertUserByEmail({
      id: 'white-user',
      email: 'white@example.com',
      role: 'user',
    });
    const black = await database.upsertUserByEmail({
      id: 'black-user',
      email: 'black@example.com',
      role: 'user',
    });

    expect(white?.rating).toBe(1500);
    expect(black?.rating).toBe(1500);

    await database.saveCompletedGame({
      id: 'rated-game-1',
      result: 'white',
      resultReason: 'checkmate',
      whiteUserId: 'white-user',
      blackUserId: 'black-user',
      rated: true,
      gameMode: 'quick_play',
      timeControl: { initial: 300, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 42,
    });

    const whiteAfterFirst = await database.getUserById('white-user');
    const blackAfterFirst = await database.getUserById('black-user');
    const savedGame = await database.getGame('rated-game-1');

    expect(whiteAfterFirst?.rating).toBe(1512);
    expect(blackAfterFirst?.rating).toBe(1488);
    expect(whiteAfterFirst?.rated_games).toBe(1);
    expect(blackAfterFirst?.rated_games).toBe(1);
    expect(whiteAfterFirst?.wins).toBe(1);
    expect(blackAfterFirst?.losses).toBe(1);
    expect(savedGame?.rated).toBe(1);
    expect(savedGame?.game_mode).toBe('quick_play');
    expect(savedGame?.white_rating_before).toBe(1500);
    expect(savedGame?.black_rating_before).toBe(1500);
    expect(savedGame?.white_rating_after).toBe(1512);
    expect(savedGame?.black_rating_after).toBe(1488);

    await database.saveCompletedGame({
      id: 'rated-game-1',
      result: 'white',
      resultReason: 'checkmate',
      whiteUserId: 'white-user',
      blackUserId: 'black-user',
      rated: true,
      gameMode: 'quick_play',
      timeControl: { initial: 300, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 42,
    });

    const whiteAfterSecond = await database.getUserById('white-user');
    const blackAfterSecond = await database.getUserById('black-user');

    expect(whiteAfterSecond?.rating).toBe(1512);
    expect(blackAfterSecond?.rating).toBe(1488);
    expect(whiteAfterSecond?.rated_games).toBe(1);
    expect(blackAfterSecond?.rated_games).toBe(1);
  });

  it('keeps mixed-auth games casual with no rating changes', async () => {
    const database = await import('../database');

    await database.initDatabase();

    await database.upsertUserByEmail({
      id: 'white-user',
      email: 'white@example.com',
      role: 'user',
    });

    await database.saveCompletedGame({
      id: 'casual-game-1',
      result: 'draw',
      resultReason: 'draw_agreement',
      whiteUserId: 'white-user',
      blackUserId: null,
      rated: true,
      gameMode: 'quick_play',
      timeControl: { initial: 300, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 18,
    });

    const whiteAfter = await database.getUserById('white-user');
    const savedGame = await database.getGame('casual-game-1');

    expect(whiteAfter?.rating).toBe(1500);
    expect(whiteAfter?.rated_games).toBe(0);
    expect(savedGame?.rated).toBe(0);
    expect(savedGame?.white_rating_after).toBeNull();
  });
});
