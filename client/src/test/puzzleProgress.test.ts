import { describe, expect, it } from 'vitest';

import { getPuzzleProgressSummary } from '../lib/puzzleProgress';
import { PUZZLES } from '@shared/puzzles';

describe('puzzleProgress summary', () => {
  it('computes success rate and adaptive difficulty from attempts', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(2);
    const [completedPuzzle, failedPuzzle] = PUZZLES;

    const summary = getPuzzleProgressSummary([
      {
        puzzleId: completedPuzzle.id,
        lastPlayedAt: 1711660000,
        completedAt: 1711660000,
        attempts: 1,
        successes: 1,
        failures: 0,
      },
      {
        puzzleId: failedPuzzle.id,
        lastPlayedAt: 1711660100,
        completedAt: null,
        attempts: 2,
        successes: 0,
        failures: 2,
      },
    ]);

    expect(summary.completedCount).toBeGreaterThanOrEqual(1);
    expect(summary.attemptCount).toBe(3);
    expect(summary.successRate).toBe(33);
    expect(summary.recommendedDifficultyScore).toBeGreaterThan(0);
    expect(summary.nextPuzzle).not.toBeNull();
  });
});
