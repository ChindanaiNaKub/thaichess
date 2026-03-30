import { PUZZLES, type Puzzle } from '@shared/puzzles';

export const STREAK_CHECKPOINT_INTERVAL = 5;
export const STREAK_RECENT_WINDOW = 8;
export const STREAK_START_DIFFICULTY = 900;
export const STREAK_MIN_DIFFICULTY = 780;
export const STREAK_MAX_DIFFICULTY = 2200;

export interface PuzzleStreakSelectionInput {
  currentPuzzleId?: number | null;
  adaptiveDifficultyScore: number;
  recentPuzzleIds?: number[];
  solvedCount?: number;
}

export type PuzzleStreakFeedbackTone = 'improving' | 'harder';

function clampDifficulty(score: number): number {
  return Math.max(STREAK_MIN_DIFFICULTY, Math.min(STREAK_MAX_DIFFICULTY, Math.round(score)));
}

function getFallbackPuzzle(currentPuzzleId?: number | null): Puzzle {
  return PUZZLES.find((candidate) => candidate.id !== currentPuzzleId) ?? PUZZLES[0];
}

export function getInitialStreakDifficultyScore(recommendedDifficultyScore: number, attemptCount: number): number {
  if (attemptCount <= 0) {
    return STREAK_START_DIFFICULTY;
  }

  return clampDifficulty(Math.min(recommendedDifficultyScore, 1180));
}

export function getNextStreakDifficultyScore(
  adaptiveDifficultyScore: number,
  result: 'success' | 'failed',
  streak: number,
): number {
  if (result === 'success') {
    return clampDifficulty(adaptiveDifficultyScore + 50 + Math.min(60, Math.max(0, streak - 1) * 6));
  }

  return clampDifficulty(adaptiveDifficultyScore - 110);
}

export function getPuzzleBaseScore(puzzle: Puzzle): number {
  switch (puzzle.difficulty) {
    case 'advanced':
      return 30;
    case 'intermediate':
      return 20;
    case 'beginner':
    default:
      return 10;
  }
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 11) return 2.5;
  if (streak >= 7) return 2;
  if (streak >= 4) return 1.5;
  return 1;
}

export function getStreakPoints(puzzle: Puzzle, streak: number): number {
  return Math.round(getPuzzleBaseScore(puzzle) * getStreakMultiplier(Math.max(1, streak)));
}

export function getCheckpointFeedbackTone(
  solvedCount: number,
  previousDifficultyScore: number,
  nextDifficultyScore: number,
): PuzzleStreakFeedbackTone | null {
  if (solvedCount <= 0 || solvedCount % STREAK_CHECKPOINT_INTERVAL !== 0) {
    return null;
  }

  return nextDifficultyScore > previousDifficultyScore + 55 ? 'harder' : 'improving';
}

export function selectNextStreakPuzzle({
  currentPuzzleId = null,
  adaptiveDifficultyScore,
  recentPuzzleIds = [],
  solvedCount = 0,
}: PuzzleStreakSelectionInput): Puzzle {
  const targetScore = clampDifficulty(adaptiveDifficultyScore);
  const recentWindow = recentPuzzleIds.slice(-STREAK_RECENT_WINDOW);
  const recentSet = new Set(recentWindow);
  const themeRecency = recentWindow.reduce((themes, puzzleId, index) => {
    const puzzle = PUZZLES.find((candidate) => candidate.id === puzzleId);
    if (!puzzle) return themes;

    const distanceFromLatest = recentWindow.length - index;
    const currentPenalty = themes.get(puzzle.theme) ?? 0;
    themes.set(puzzle.theme, currentPenalty + distanceFromLatest * 20);
    return themes;
  }, new Map<string, number>());

  let candidates = PUZZLES.filter((candidate) => candidate.id !== currentPuzzleId && !recentSet.has(candidate.id));
  if (candidates.length === 0) {
    candidates = PUZZLES.filter((candidate) => candidate.id !== currentPuzzleId);
  }
  if (candidates.length === 0) {
    return getFallbackPuzzle(currentPuzzleId);
  }

  const ranked = [...candidates].sort((left, right) => {
    const leftDistance = Math.abs(left.difficultyScore - targetScore);
    const rightDistance = Math.abs(right.difficultyScore - targetScore);

    const warmupCap = solvedCount < 2 ? 900 : solvedCount < 3 ? 1080 : Number.POSITIVE_INFINITY;
    const warmupPenaltyLeft = left.difficultyScore > warmupCap ? left.difficultyScore - warmupCap : 0;
    const warmupPenaltyRight = right.difficultyScore > warmupCap ? right.difficultyScore - warmupCap : 0;

    const advancedPenaltyLeft = solvedCount < 5 && left.difficulty === 'advanced' ? 160 : 0;
    const advancedPenaltyRight = solvedCount < 5 && right.difficulty === 'advanced' ? 160 : 0;

    const leftThemePenalty = themeRecency.get(left.theme) ?? 0;
    const rightThemePenalty = themeRecency.get(right.theme) ?? 0;

    const leftScore = leftDistance + warmupPenaltyLeft + advancedPenaltyLeft + leftThemePenalty;
    const rightScore = rightDistance + warmupPenaltyRight + advancedPenaltyRight + rightThemePenalty;

    if (leftScore !== rightScore) return leftScore - rightScore;
    if (left.difficultyScore !== right.difficultyScore) return left.difficultyScore - right.difficultyScore;
    return left.id - right.id;
  });

  return ranked[0] ?? getFallbackPuzzle(currentPuzzleId);
}
