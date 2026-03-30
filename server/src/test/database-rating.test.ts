import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('database rated game persistence', () => {
  let tempDir: string;
  const originalTursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
  const originalTursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'));
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaichess-db-test-'));
    process.env.DATA_DIR = tempDir;
    process.env.TURSO_DATABASE_URL = '';
    process.env.TURSO_AUTH_TOKEN = '';
  });

  afterEach(async () => {
    vi.useRealTimers();
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

  it('filters recent games and counts by rated status while including bot games in the shared history', async () => {
    const database = await import('../database');

    await database.initDatabase();

    await database.upsertUserByEmail({
      id: 'rated-white',
      email: 'rated-white@example.com',
      role: 'user',
    });
    await database.upsertUserByEmail({
      id: 'rated-black',
      email: 'rated-black@example.com',
      role: 'user',
    });

    await database.saveCompletedGame({
      id: 'rated-game-filter',
      result: 'white',
      resultReason: 'checkmate',
      whiteUserId: 'rated-white',
      blackUserId: 'rated-black',
      rated: true,
      gameMode: 'quick_play',
      timeControl: { initial: 300, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 22,
    });
    vi.advanceTimersByTime(1000);

    await database.saveCompletedGame({
      id: 'casual-game-filter',
      result: 'draw',
      resultReason: 'draw_agreement',
      whiteUserId: null,
      blackUserId: null,
      rated: false,
      gameMode: 'private',
      timeControl: { initial: 300, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 18,
    });
    vi.advanceTimersByTime(1000);

    await database.saveCompletedGame({
      id: 'bot-game-filter',
      result: 'white',
      resultReason: 'checkmate',
      whiteName: 'Guest Player',
      blackName: 'Makruk Bot Lv.3',
      whiteUserId: null,
      blackUserId: null,
      rated: false,
      gameMode: 'bot',
      opponentName: 'Makruk Bot Lv.3',
      botLevel: 3,
      botColor: 'black',
      timeControl: { initial: 600, increment: 0 },
      moves: [],
      finalBoard: [],
      moveCount: 28,
    });

    const allGames = await database.getRecentGames(10, 0, 'all');
    const ratedGames = await database.getRecentGames(10, 0, 'rated');
    const casualGames = await database.getRecentGames(10, 0, 'casual');
    const botGames = await database.getRecentGames(10, 0, 'bot');
    const allCount = await database.getGameCount('all');
    const ratedCount = await database.getGameCount('rated');
    const casualCount = await database.getGameCount('casual');
    const botCount = await database.getGameCount('bot');
    const botStats = await database.getBotPerformanceStats();

    expect(allGames).toHaveLength(3);
    expect(ratedGames).toHaveLength(1);
    expect(casualGames).toHaveLength(1);
    expect(botGames).toHaveLength(1);
    expect(allGames.map(game => game.id)).toContain('bot-game-filter');
    expect(allGames.map(game => game.id)).toContain('rated-game-filter');
    expect(allGames.map(game => game.id)).toContain('casual-game-filter');
    expect(ratedGames[0]?.id).toBe('rated-game-filter');
    expect(casualGames[0]?.id).toBe('casual-game-filter');
    expect(botGames[0]?.id).toBe('bot-game-filter');
    expect(botGames[0]?.game_type).toBe('bot');
    expect(botGames[0]?.opponent_name).toBe('Makruk Bot Lv.3');
    expect(allCount).toBe(3);
    expect(ratedCount).toBe(1);
    expect(casualCount).toBe(1);
    expect(botCount).toBe(1);
    expect(botStats).toEqual({
      gamesCount: 1,
      winRate: 100,
      highestBotLevelDefeated: 3,
    });
  });
});
