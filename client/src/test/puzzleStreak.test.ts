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
import { PUZZLES as RUNTIME_PUZZLES } from '@shared/puzzlesRuntime';

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

  it('keeps the live generated pool immediately available instead of hiding old capstone samples', () => {
    expect(PUZZLES.every(puzzle => puzzle.pool !== 'advanced_only')).toBe(true);
    expect(PUZZLES.every(puzzle => isPuzzleUnlockedForStreak(puzzle, 0))).toBe(true);

    const earlySelection = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1200,
      solvedCount: 0,
      recentPuzzleIds: [],
    });

    expect(earlySelection).toBeDefined();
  });

  it('keeps the client runtime pool aligned to the generated live pool without legacy sample-pack puzzles', () => {
    expect(RUNTIME_PUZZLES.map(puzzle => puzzle.id)).toEqual(PUZZLES.map(puzzle => puzzle.id));
    expect(RUNTIME_PUZZLES.every((puzzle) => !puzzle.source.startsWith('Makruk-native sample pack:'))).toBe(true);
  });

  it('keeps both white-to-move and black-to-move puzzles available in streak rotation', () => {
    const seenIds: number[] = [];
    const selections = Array.from({ length: 8 }, (_, index) => {
      const puzzle = selectNextStreakPuzzle({
        adaptiveDifficultyScore: 920 + index * 70,
        solvedCount: 2 + index,
        currentPuzzleId: seenIds.at(-1) ?? null,
        recentPuzzleIds: seenIds,
      });
      seenIds.push(puzzle.id);
      return puzzle;
    });

    expect(new Set(PUZZLES.map(puzzle => puzzle.sideToMove))).toEqual(new Set(['white', 'black']));
    expect(new Set(selections.map(puzzle => puzzle.sideToMove)).size).toBeGreaterThan(1);
  });

  it('starts streaks from foundation and keeps early selections away from mate pressure', () => {
    const openingPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 2200,
      solvedCount: 0,
      recentPuzzleIds: [],
    });

    const secondPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 2200,
      solvedCount: 1,
      currentPuzzleId: openingPuzzle.id,
      recentPuzzleIds: [openingPuzzle.id],
    });

    expect(openingPuzzle.streakTier).toBe('foundation');
    expect(secondPuzzle.streakTier).not.toBe('mate_pressure');
  });

  it('keeps solved counts 0 through 2 in the foundation tier', () => {
    const foundationSelection = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1600,
      solvedCount: 2,
      recentPuzzleIds: [],
    });

    expect(foundationSelection.streakTier).toBe('foundation');
  });

  it('falls back to an adjacent tier before replaying a recent puzzle from the target tier', () => {
    const foundationIds = PUZZLES.filter(puzzle => puzzle.streakTier === 'foundation').map(puzzle => puzzle.id);

    const adjacentTierFallback = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 2200,
      solvedCount: 0,
      currentPuzzleId: foundationIds[0],
      recentPuzzleIds: foundationIds,
    });

    expect(adjacentTierFallback.streakTier).toBe('practical_attack');
  });

  it('opens practical attack before forcing conversion, then reaches mate pressure late', () => {
    const practicalAttackPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1350,
      solvedCount: 5,
      recentPuzzleIds: [],
    });

    const forcingConversionPuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1650,
      solvedCount: 8,
      recentPuzzleIds: [practicalAttackPuzzle.id],
      currentPuzzleId: practicalAttackPuzzle.id,
    });

    const matePressurePuzzle = selectNextStreakPuzzle({
      adaptiveDifficultyScore: 1900,
      solvedCount: 9,
      recentPuzzleIds: [forcingConversionPuzzle.id],
      currentPuzzleId: forcingConversionPuzzle.id,
    });

    expect(practicalAttackPuzzle.streakTier).toBe('practical_attack');
    expect(forcingConversionPuzzle.streakTier).toBe('forcing_conversion');
    expect(matePressurePuzzle.streakTier).toBe('mate_pressure');
  });

  it('keeps tier-first picks from repeating the same puzzle while still varying colors over time', () => {
    const solvedCounts = [0, 1, 2, 5, 6, 7, 8, 9];
    const selections = solvedCounts.reduce<Array<(typeof PUZZLES)[number]>>((picked, solvedCount, index) => {
      const currentPuzzleId = picked.at(-1)?.id ?? null;
      const recentPuzzleIds = picked.map(puzzle => puzzle.id);
      picked.push(
        selectNextStreakPuzzle({
          adaptiveDifficultyScore: 900 + index * 150,
          solvedCount,
          currentPuzzleId,
          recentPuzzleIds,
        }),
      );
      return picked;
    }, []);

    expect(new Set(selections.map(puzzle => puzzle.id)).size).toBe(selections.length);
    expect(new Set(selections.map(puzzle => puzzle.sideToMove)).size).toBeGreaterThan(1);
  });
});
