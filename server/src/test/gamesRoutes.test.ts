import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGamesRouter } from '../routes/games';

interface ValidationErrorResponse {
  error: string;
  details: Record<string, string[] | undefined>;
}

const databaseMocks = vi.hoisted(() => ({
  getGame: vi.fn(),
  getRecentGames: vi.fn(),
  getGameCount: vi.fn(),
  getBotPerformanceStats: vi.fn(),
  searchGames: vi.fn(),
  getOpeningStats: vi.fn(),
  getPositionGames: vi.fn(),
  saveCompletedGame: vi.fn(),
}));

vi.mock('../database', () => ({
  getGame: databaseMocks.getGame,
  getRecentGames: databaseMocks.getRecentGames,
  getGameCount: databaseMocks.getGameCount,
  getBotPerformanceStats: databaseMocks.getBotPerformanceStats,
  searchGames: databaseMocks.searchGames,
  getOpeningStats: databaseMocks.getOpeningStats,
  getPositionGames: databaseMocks.getPositionGames,
  saveCompletedGame: databaseMocks.saveCompletedGame,
}));

vi.mock('../auth', () => ({
  getAuthenticatedUser: vi.fn(async () => null),
}));

describe('games routes query validation', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl = '';

  beforeEach(async () => {
    databaseMocks.searchGames.mockResolvedValue({ games: [], total: 0 });
    databaseMocks.getOpeningStats.mockResolvedValue({ positionHash: 'abc', totalGames: 0, moves: [] });
    databaseMocks.getPositionGames.mockResolvedValue({ games: [], total: 0 });

    const app = express();
    app.use(createGamesRouter({
      gameManager: {
        getGame: () => null,
        getPublicLiveGames: () => [],
      } as never,
    }));

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          throw new Error('Expected test server to listen on a port');
        }
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  it('rejects invalid game search query parameters with 400', async () => {
    const response = await fetch(`${baseUrl}/api/games/search?gameMode=blitz`);
    const payload = await response.json() as ValidationErrorResponse;

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid game search query');
    expect(payload.details.gameMode).toBeTruthy();
    expect(databaseMocks.searchGames).not.toHaveBeenCalled();
  });

  it('coerces valid opening explorer queries before hitting the database', async () => {
    const statsResponse = await fetch(`${baseUrl}/api/openings/stats?position=hash-123`);
    expect(statsResponse.status).toBe(200);
    expect(databaseMocks.getOpeningStats).toHaveBeenCalledWith('hash-123');

    const gamesResponse = await fetch(`${baseUrl}/api/openings/games?position=hash-123&move=e2e4&page=1&limit=5`);
    expect(gamesResponse.status).toBe(200);
    expect(databaseMocks.getPositionGames).toHaveBeenCalledWith('hash-123', 'e2e4', 5, 5);
  });

  it('rejects one-character player searches before querying the database', async () => {
    const response = await fetch(`${baseUrl}/api/games/search?player=a`);
    const payload = await response.json() as ValidationErrorResponse;

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid game search query');
    expect(payload.details.player).toBeTruthy();
    expect(databaseMocks.searchGames).not.toHaveBeenCalled();
  });
});
