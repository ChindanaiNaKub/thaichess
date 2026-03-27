import { describe, expect, it } from 'vitest';
import { liveGameRoute, routes, savedGameAnalysisRoute } from '../lib/routes';

describe('routes', () => {
  it('builds distinct routes for live games and saved-game analysis', () => {
    expect(liveGameRoute('abc123')).toBe('/game/abc123');
    expect(savedGameAnalysisRoute('abc123')).toBe('/analysis/abc123');
  });

  it('keeps the route patterns centralized for the router', () => {
    expect(routes.liveGamePattern).toBe('/game/:gameId');
    expect(routes.analysisPattern).toBe('/analysis/:gameId');
  });

  it('exposes the evergreen guide routes for SEO pages', () => {
    expect(routes.whatIsMakruk).toBe('/what-is-makruk');
    expect(routes.howToPlayMakruk).toBe('/how-to-play-makruk');
    expect(routes.playMakrukOnline).toBe('/play-makruk-online');
  });
});
