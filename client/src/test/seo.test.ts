import { describe, expect, it } from 'vitest';
import { getIndexablePaths, getPublicSeoRoute } from '@shared/seo';
import { PUZZLES } from '@shared/puzzles';
import { routes } from '../lib/routes';

describe('shared SEO routes', () => {
  it('keeps every public static route in the indexable sitemap', () => {
    expect(getIndexablePaths()).toEqual([
      routes.home,
      routes.about,
      routes.games,
      routes.leaderboard,
      routes.puzzles,
      routes.quickPlay,
      routes.bot,
      routes.local,
      ...PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`),
    ]);
  });

  it('returns dedicated leaderboard metadata', () => {
    const seo = getPublicSeoRoute('/leaderboard', 'https://thaichess.dev');

    expect(seo.path).toBe('/leaderboard');
    expect(seo.title).toContain('Leaderboard');
    expect(seo.description).toContain('Makruk ratings');
    expect(seo.robots).toBeUndefined();
  });

  it('marks non-public app routes as noindex', () => {
    expect(getPublicSeoRoute(routes.feedback, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute(routes.login, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute(routes.account, 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute('/game/abc123', 'https://thaichess.dev').robots).toBe('noindex, nofollow');
    expect(getPublicSeoRoute('/analysis/abc123', 'https://thaichess.dev').robots).toBe('noindex, nofollow');
  });
});
