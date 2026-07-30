import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  gameSearchQueryOptions,
  openingGamesQueryOptions,
  openingStatsQueryOptions,
} from '../queries/games';

const fetchMock = vi.fn();

describe('game database and opening explorer query hooks', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('builds search query keys and requests the search endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ games: [], total: 0, page: 0, limit: 20 }),
    });

    const options = gameSearchQueryOptions({
      player: 'Alice',
      result: 'draw',
      gameMode: 'bot',
      rated: true,
      page: 1,
      limit: 10,
    });

    expect(options.queryKey).toEqual([
      'games',
      'search',
      {
        player: 'Alice',
        result: 'draw',
        gameMode: 'bot',
        rated: true,
        page: 1,
        limit: 10,
      },
    ]);

    await options.queryFn!({} as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0]?.[0] ?? '');
    expect(requestedUrl).toContain('/api/games/search?');
    expect(requestedUrl).toContain('player=Alice');
    expect(requestedUrl).toContain('result=draw');
    expect(requestedUrl).toContain('gameMode=bot');
    expect(requestedUrl).toContain('rated=true');
    expect(requestedUrl).toContain('page=1');
    expect(requestedUrl).toContain('limit=10');
  });

  it('builds opening explorer query keys and requests stats/games endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ positionHash: 'hash-1', totalGames: 0, moves: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ games: [], total: 0, page: 0, limit: 20, position: 'hash-1', move: 'e2e3' }),
      });

    const statsOptions = openingStatsQueryOptions('hash-1');
    expect(statsOptions.queryKey).toEqual(['openings', 'stats', 'hash-1']);
    await statsOptions.queryFn!({} as never);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/openings/stats?position=hash-1');

    const gamesOptions = openingGamesQueryOptions('hash-1', 'e2e3', 2, 5);
    expect(gamesOptions.queryKey).toEqual(['openings', 'games', 'hash-1', 'e2e3', { page: 2, limit: 5 }]);
    await gamesOptions.queryFn!({} as never);

    const gamesUrl = String(fetchMock.mock.calls[1]?.[0] ?? '');
    expect(gamesUrl).toContain('/api/openings/games?');
    expect(gamesUrl).toContain('position=hash-1');
    expect(gamesUrl).toContain('move=e2e3');
    expect(gamesUrl).toContain('page=2');
    expect(gamesUrl).toContain('limit=5');
  });

  it('throws when the search API returns a non-OK response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
    });

    await expect(gameSearchQueryOptions({ player: 'ab' }).queryFn!({} as never))
      .rejects
      .toThrow('Failed to search games: 400');
  });
});
