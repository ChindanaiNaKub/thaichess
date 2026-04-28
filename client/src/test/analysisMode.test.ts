import { describe, expect, it } from 'vitest';
import { resolveAnalysisRouteMode } from '../lib/analysisMode';

describe('analysis route mode', () => {
  it('routes bare analysis to quick analysis', () => {
    expect(resolveAnalysisRouteMode({
      gameId: undefined,
      searchParams: new URLSearchParams(),
    })).toBe('quick');
  });

  it('preserves explicit editor mode', () => {
    expect(resolveAnalysisRouteMode({
      gameId: undefined,
      searchParams: new URLSearchParams('mode=editor'),
    })).toBe('editor');
  });

  it('keeps saved and inline move analysis in game mode', () => {
    expect(resolveAnalysisRouteMode({
      gameId: 'abc123',
      searchParams: new URLSearchParams(),
    })).toBe('game');

    expect(resolveAnalysisRouteMode({
      gameId: undefined,
      searchParams: new URLSearchParams('moves=[]'),
    })).toBe('game');
  });
});
