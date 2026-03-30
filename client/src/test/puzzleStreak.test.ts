import { describe, expect, it } from 'vitest';
import {
  getPuzzleBaseScore,
  getInitialStreakDifficultyScore,
  getNextStreakDifficultyScore,
  getStreakMultiplier,
  getStreakPoints,
  selectNextStreakPuzzle,
} from '../lib/puzzleStreak';
import { PUZZLES } from '@shared/puzzles';

describe('puzzle streak helpers', () => {
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
});
