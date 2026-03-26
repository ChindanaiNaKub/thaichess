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

  it('applies Elo exactly once when duplicate rated saves race concurrently', async () => {
    const database = await import('../database');

    await database.initDatabase();

    await database.upsertUserByEmail({
      id: 'white-user',
      email: 'white@example.com',
      role: 'user',
    });
    await database.upsertUserByEmail({
      id: 'black-user',
      email: 'black@example.com',
      role: 'user',
    });

    const payload = {
      id: 'rated-game-race',
      result: 'white' as const,
      resultReason: 'checkmate',
      whiteUserId: 'white-user',
      blackUserId: 'black-user',
      rated: true,
      gameMode: 'quick_play',
      timeControl: { initial: 300, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 42,
    };

    vi.useRealTimers();
    const [first, second] = await Promise.all([
      database.saveCompletedGame(payload),
      database.saveCompletedGame(payload),
    ]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'));

    const whiteAfter = await database.getUserById('white-user');
    const blackAfter = await database.getUserById('black-user');
    const savedGame = await database.getGame('rated-game-race');

    expect(whiteAfter?.rating).toBe(1512);
    expect(blackAfter?.rating).toBe(1488);
    expect(whiteAfter?.rated_games).toBe(1);
    expect(blackAfter?.rated_games).toBe(1);
    expect(savedGame?.white_rating_after).toBe(1512);
    expect(savedGame?.black_rating_after).toBe(1488);
    expect([first.ratingChange, second.ratingChange]).toEqual([
      {
        whiteBefore: 1500,
        blackBefore: 1500,
        whiteAfter: 1512,
        blackAfter: 1488,
      },
      {
        whiteBefore: 1500,
        blackBefore: 1500,
        whiteAfter: 1512,
        blackAfter: 1488,
      },
    ]);
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

  it('returns leaderboard entries ordered by rating with public display names', async () => {
    const database = await import('../database');

    await database.initDatabase();

    await database.upsertUserByEmail({
      id: 'top-user',
      email: 'topplayer@example.com',
      role: 'user',
    });
    await database.upsertUserByEmail({
      id: 'second-user',
      email: 'second@example.com',
      role: 'user',
    });
    await database.updateUsername('top-user', 'Champion');

    await database.saveCompletedGame({
      id: 'leaderboard-game-1',
      result: 'white',
      resultReason: 'checkmate',
      whiteUserId: 'top-user',
      blackUserId: 'second-user',
      rated: true,
      gameMode: 'quick_play',
      timeControl: { initial: 300, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 20,
    });

    const leaderboard = await database.getLeaderboard(10, 0);
    const total = await database.getLeaderboardCount();

    expect(total).toBe(2);
    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0]).toMatchObject({
      id: 'top-user',
      display_name: 'Champion',
      rating: 1512,
      rated_games: 1,
      wins: 1,
      losses: 0,
      draws: 0,
    });
    expect(leaderboard[1]).toMatchObject({
      id: 'second-user',
      display_name: 'se***',
      rating: 1488,
      rated_games: 1,
      wins: 0,
      losses: 1,
      draws: 0,
    });
  });
});
