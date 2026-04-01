import { describe, expect, it } from 'vitest';
import { lessonRoute, liveGameRoute, puzzleRoute, routes, savedGameAnalysisRoute, spectatorGameRoute, watchRoute } from '../lib/routes';

describe('routes', () => {
  it('builds distinct routes for live games, spectator games, watch, and saved-game analysis', () => {
    expect(liveGameRoute('abc123')).toBe('/game/abc123');
    expect(spectatorGameRoute('abc123')).toBe('/spectate/abc123');
    expect(watchRoute()).toBe('/watch');
    expect(savedGameAnalysisRoute('abc123')).toBe('/analysis/abc123');
    expect(lessonRoute('77')).toBe('/lessons/77');
    expect(puzzleRoute('77')).toBe('/puzzle/77');
  });

  it('keeps lesson, puzzle, and legacy route patterns centralized for the router', () => {
    expect(routes.liveGamePattern).toBe('/game/:gameId');
    expect(routes.spectatorGamePattern).toBe('/spectate/:gameId');
    expect(routes.watch).toBe('/watch');
    expect(routes.lessons).toBe('/lessons');
    expect(routes.course).toBe('/course');
    expect(routes.coursePath).toBe('/course-path');
    expect(routes.learn).toBe('/lessons');
    expect(routes.legacyLearn).toBe('/learn');
    expect(routes.lessonPattern).toBe('/lessons/:id');
    expect(routes.coursePattern).toBe('/course/:id');
    expect(routes.legacyLessonPattern).toBe('/learn/:id');
    expect(routes.puzzlePattern).toBe('/puzzle/:id');
    expect(routes.analysisPattern).toBe('/analysis/:gameId');
  });

  it('exposes the evergreen guide routes for SEO pages', () => {
    expect(routes.whatIsMakruk).toBe('/what-is-makruk');
    expect(routes.howToPlayMakruk).toBe('/how-to-play-makruk');
    expect(routes.playMakrukOnline).toBe('/play-makruk-online');
  });
});
