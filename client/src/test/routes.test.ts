import { describe, expect, it } from 'vitest';
import { lessonRoute, liveGameRoute, puzzleRoute, routes, savedGameAnalysisRoute, spectatorGameRoute, watchRoute } from '../lib/routes';

describe('routes', () => {
  it('builds distinct routes for live games, spectator games, watch, and saved-game analysis', () => {
    expect(liveGameRoute('abc123')).toBe('/game/abc123');
    expect(spectatorGameRoute('abc123')).toBe('/spectate/abc123');
    expect(watchRoute()).toBe('/watch');
    expect(savedGameAnalysisRoute('abc123')).toBe('/analysis/abc123');
    expect(lessonRoute('77')).toBe('/learn/77');
    expect(puzzleRoute('77')).toBe('/learn/77');
  });

  it('keeps the route patterns centralized for the router', () => {
    expect(routes.liveGamePattern).toBe('/game/:gameId');
    expect(routes.spectatorGamePattern).toBe('/spectate/:gameId');
    expect(routes.watch).toBe('/watch');
    expect(routes.learn).toBe('/learn');
    expect(routes.lessonPattern).toBe('/learn/:id');
    expect(routes.analysisPattern).toBe('/analysis/:gameId');
  });

  it('exposes the evergreen guide routes for SEO pages', () => {
    expect(routes.whatIsMakruk).toBe('/what-is-makruk');
    expect(routes.howToPlayMakruk).toBe('/how-to-play-makruk');
    expect(routes.playMakrukOnline).toBe('/play-makruk-online');
  });
});
