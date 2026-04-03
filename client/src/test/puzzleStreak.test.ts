import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPuzzleBaseScore,
  getInitialStreakDifficultyScore,
  getNextStreakDifficultyScore,
  isPuzzleUnlockedForStreak,
  resetPuzzleStreakDiagnosticsForTest,
  getStreakMultiplier,
  getStreakPoints,
  STREAK_RECENT_WINDOW,
  selectNextStreakPuzzle,
} from '../lib/puzzleStreak';
import { PUZZLES } from '@shared/puzzles';

describe('puzzle streak helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetPuzzleStreakDiagnosticsForTest();
  });

  it('starts new players easy and keeps experienced players within a capped adaptive range', () => {
    expect(getInitialStreakDifficultyScore(1600, 0)).toBe(900);
    expect(getInitialStreakDifficultyScore(1600, 8)).toBeLessThanOrEqual(1180);
  });

  it('raises difficulty after success and lowers it after failure', () => {
    const afterSuccess = getNextStreakDifficultyScore(900, 'success', 3);
    const afterFailure = getNextStreakDifficultyScore(afterSuccess, 'failed', 0);

    expect(afterSuccess).toBeGreaterThan(900);
    expect(afterFailure).toBeLessThan(afterSuccess);
  });

  it('scales points from puzzle difficulty and streak tiers while avoiding immediate repeats', () => {
    const openingPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 900,
      solvedCount: 0,
      recentPuzzleIds: [],
    });

    const followUpPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 980,
      solvedCount: 1,
      currentPuzzleId: openingPuzzle.id,
      recentPuzzleIds: [openingPuzzle.id],
    });

    const beginnerPuzzle = PUZZLES.find(puzzle => puzzle.difficulty === 'beginner');
    const intermediatePuzzle = PUZZLES.find(puzzle => puzzle.difficulty === 'intermediate');
    const advancedPuzzle = PUZZLES.find(puzzle => puzzle.difficulty === 'advanced');

    expect(beginnerPuzzle).toBeDefined();
    expect(intermediatePuzzle).toBeDefined();
    expect(advancedPuzzle).toBeDefined();

    expect(getPuzzleBaseScore(beginnerPuzzle!)).toBe(10);
    expect(getPuzzleBaseScore(intermediatePuzzle!)).toBe(20);
    expect(getPuzzleBaseScore(advancedPuzzle!)).toBe(30);

    expect(getStreakMultiplier(2)).toBe(1);
    expect(getStreakMultiplier(4)).toBe(1.5);
    expect(getStreakMultiplier(8)).toBe(2);
    expect(getStreakMultiplier(11)).toBe(2.5);

    expect(getStreakPoints(beginnerPuzzle!, 1)).toBe(10);
    expect(getStreakPoints(intermediatePuzzle!, 4)).toBe(30);
    expect(getStreakPoints(advancedPuzzle!, 11)).toBe(75);
    expect(followUpPuzzle.id).not.toBe(openingPuzzle.id);
  });

  it('falls back safely when the publishable pool is smaller than the recent-history exclusion window', () => {
    const recentPuzzleIds = PUZZLES.slice(0, STREAK_RECENT_WINDOW).map(puzzle => puzzle.id);

    const nextPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 980,
      currentPuzzleId: recentPuzzleIds[recentPuzzleIds.length - 1],
      recentPuzzleIds,
      solvedCount: 6,
    });

    expect(nextPuzzle).toBeDefined();
  });

  it('logs pool diagnostics for the current live pool and only warns when the pool is genuinely tight', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const recentPuzzleIds = PUZZLES.slice(0, STREAK_RECENT_WINDOW).map(puzzle => puzzle.id);

    const nextPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1000,
      currentPuzzleId: recentPuzzleIds[recentPuzzleIds.length - 1],
      recentPuzzleIds,
      solvedCount: 10,
    });

    expect(nextPuzzle).toBeDefined();
    expect(infoSpy).toHaveBeenCalledWith(
      '[puzzle-streak] pool diagnostics',
      expect.objectContaining({
        totalCandidates: expect.any(Number),
        validCandidates: expect.any(Number),
        shippedCandidates: expect.any(Number),
      }),
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('keeps the capstone puzzle out of early streak selection until its unlock threshold', () => {
    const capstone = PUZZLES.find(puzzle => puzzle.id === 7004);

    expect(capstone).toBeDefined();
    expect(isPuzzleUnlockedForStreak(capstone!, 0)).toBe(false);
    expect(isPuzzleUnlockedForStreak(capstone!, 7)).toBe(false);
    expect(isPuzzleUnlockedForStreak(capstone!, 8)).toBe(true);

    const earlySelection = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1200,
      solvedCount: 0,
      recentPuzzleIds: [],
    });
    const lateSelection = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1600,
      solvedCount: 8,
      recentPuzzleIds: [],
    });

    expect(earlySelection.id).not.toBe(7004);
    expect(lateSelection.id).toBeDefined();
  });

  it('keeps streak selection on white-to-move puzzles whenever an eligible white pool exists', () => {
    const selections = Array.from({ length: 6 }, (_, index) => selectNextStreakPuzzle({
      adaptiveDifficultyScore: 980 + index * 20,
      solvedCount: 2,
      recentPuzzleIds: [],
    }));

    expect(selections.length).toBeGreaterThan(0);
    expect(selections.every(puzzle => puzzle.sideToMove === 'white')).toBe(true);
  });
});
