import { PUZZLES, type Puzzle } from '@shared/puzzlesRuntime';

export interface PuzzleProgressRecord {
  puzzleId: number;
  lastPlayedAt: number;
  completedAt: number | null;
  attempts: number;
  successes: number;
  failures: number;
}

export interface PuzzleProgressActivity {
  puzzle: Puzzle;
  lastPlayedAt: number;
  completedAt: number | null;
}

export interface PuzzleProgressSummary {
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  attemptCount: number;
  successRate: number;
  recommendedDifficultyScore: number;
  nextPuzzle: Puzzle | null;
  continuePuzzle: Puzzle | null;
  favoriteTheme: string | null;
  lastPlayed: PuzzleProgressActivity | null;
  recentCompleted: PuzzleProgressActivity[];
}

export function normalizePuzzleProgressRecords(records: PuzzleProgressRecord[]): PuzzleProgressRecord[] {
  const deduped = new Map<number, PuzzleProgressRecord>();

  for (const record of records) {
    const puzzleId = Number(record.puzzleId);
    if (!Number.isInteger(puzzleId) || puzzleId <= 0) continue;

    const lastPlayedAt = Number(record.lastPlayedAt);
    const completedAt = record.completedAt === null || record.completedAt === undefined
      ? null
      : Number(record.completedAt);
    const attempts = Math.max(0, Number(record.attempts ?? 0));
    const successes = Math.max(0, Number(record.successes ?? (completedAt ? 1 : 0)));
    const failures = Math.max(0, Number(record.failures ?? 0));
    const existing = deduped.get(puzzleId);

    if (!existing) {
      deduped.set(puzzleId, {
        puzzleId,
        lastPlayedAt: Number.isFinite(lastPlayedAt) && lastPlayedAt > 0 ? lastPlayedAt : 0,
        completedAt: Number.isFinite(completedAt ?? NaN) && (completedAt ?? 0) > 0 ? completedAt : null,
        attempts,
        successes,
        failures,
      });
      continue;
    }

    deduped.set(puzzleId, {
      puzzleId,
      lastPlayedAt: Math.max(
        existing.lastPlayedAt,
        Number.isFinite(lastPlayedAt) && lastPlayedAt > 0 ? lastPlayedAt : 0,
      ),
      completedAt: existing.completedAt === null
        ? (Number.isFinite(completedAt ?? NaN) && (completedAt ?? 0) > 0 ? completedAt : null)
        : completedAt === null
          ? existing.completedAt
          : Math.max(existing.completedAt, completedAt),
      attempts: existing.attempts + attempts,
      successes: existing.successes + successes,
      failures: existing.failures + failures,
    });
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (b.lastPlayedAt !== a.lastPlayedAt) return b.lastPlayedAt - a.lastPlayedAt;
    return a.puzzleId - b.puzzleId;
  });
}

export function getPuzzleProgressSummary(progressRecords: PuzzleProgressRecord[]): PuzzleProgressSummary {
  const normalizedRecords = normalizePuzzleProgressRecords(progressRecords);
  const shippedPuzzlesById = new Map(PUZZLES.map(puzzle => [puzzle.id, puzzle]));
  const progressByPuzzleId = new Map(normalizedRecords.map(record => [record.puzzleId, record]));
  const activity = normalizedRecords
    .map((record) => {
      const puzzle = shippedPuzzlesById.get(record.puzzleId);
      if (!puzzle) return null;
      return {
        puzzle,
        lastPlayedAt: record.lastPlayedAt,
        completedAt: record.completedAt,
      } satisfies PuzzleProgressActivity;
    })
    .filter((record): record is PuzzleProgressActivity => record !== null);

  const completedActivity = activity.filter(record => record.completedAt !== null);
  const completedSet = new Set(completedActivity.map(record => record.puzzle.id));
  const completedCount = completedActivity.length;
  const totalCount = PUZZLES.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const attemptCount = normalizedRecords.reduce((total, record) => total + record.attempts, 0);
  const successCount = normalizedRecords.reduce((total, record) => total + record.successes, 0);
  const successRate = attemptCount > 0 ? Math.round((successCount / attemptCount) * 100) : 0;
  const weightedDifficulty = attemptCount > 0
    ? Math.round(
      normalizedRecords.reduce((total, record) => {
        const puzzle = shippedPuzzlesById.get(record.puzzleId);
        return total + (puzzle ? puzzle.difficultyScore * record.attempts : 0);
      }, 0) / Math.max(1, attemptCount),
    )
    : 980;
  const recommendedDifficultyScore = Math.max(
    650,
    Math.min(
      2200,
      weightedDifficulty + (successRate >= 80 ? 120 : successRate <= 45 && attemptCount > 0 ? -120 : 0),
    ),
  );
  const nextPuzzle = [...PUZZLES]
    .sort((left, right) => {
      const leftRecord = progressByPuzzleId.get(left.id);
      const rightRecord = progressByPuzzleId.get(right.id);
      const leftCompleted = completedSet.has(left.id);
      const rightCompleted = completedSet.has(right.id);
      if (leftCompleted !== rightCompleted) return leftCompleted ? 1 : -1;

      const leftContinue = leftRecord && leftRecord.completedAt === null && leftRecord.attempts > 0 ? -80 : 0;
      const rightContinue = rightRecord && rightRecord.completedAt === null && rightRecord.attempts > 0 ? -80 : 0;
      const leftScore = Math.abs(left.difficultyScore - recommendedDifficultyScore) + leftContinue;
      const rightScore = Math.abs(right.difficultyScore - recommendedDifficultyScore) + rightContinue;
      if (leftScore !== rightScore) return leftScore - rightScore;
      return left.id - right.id;
    })[0] ?? null;
  const lastPlayed = activity[0] ?? null;
  const continuePuzzle = lastPlayed && lastPlayed.completedAt === null
    ? lastPlayed.puzzle
    : nextPuzzle;

  const favoriteTheme = Array.from(
    completedActivity.reduce((themes, record) => {
      themes.set(record.puzzle.theme, (themes.get(record.puzzle.theme) ?? 0) + 1);
      return themes;
    }, new Map<string, number>()),
  )
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })[0]?.[0] ?? null;

  const recentCompleted = [...completedActivity]
    .sort((a, b) => {
      const aCompletedAt = a.completedAt ?? 0;
      const bCompletedAt = b.completedAt ?? 0;
      if (bCompletedAt !== aCompletedAt) return bCompletedAt - aCompletedAt;
      return a.puzzle.id - b.puzzle.id;
    })
    .slice(0, 3);

  return {
    completedCount,
    totalCount,
    percentComplete,
    attemptCount,
    successRate,
    recommendedDifficultyScore,
    nextPuzzle,
    continuePuzzle,
    favoriteTheme,
    lastPlayed,
    recentCompleted,
  };
}
