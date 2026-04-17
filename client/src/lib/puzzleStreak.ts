import { PUZZLE_POOL_DIAGNOSTICS, PUZZLES, type Puzzle } from '@shared/puzzlesRuntime';

export const STREAK_CHECKPOINT_INTERVAL = 5;
export const STREAK_RECENT_WINDOW = 8;
export const STREAK_START_DIFFICULTY = 900;
export const STREAK_MIN_DIFFICULTY = 780;
export const STREAK_MAX_DIFFICULTY = 2200;
const STREAK_TIER_ORDER: Puzzle['streakTier'][] = ['foundation', 'practical_attack', 'forcing_conversion', 'mate_pressure'];

let hasLoggedPoolDiagnostics = false;
let hasWarnedAboutSmallPool = false;
let hasWarnedAboutLockedPool = false;

export function resetPuzzleStreakDiagnosticsForTest(): void {
  hasLoggedPoolDiagnostics = false;
  hasWarnedAboutSmallPool = false;
  hasWarnedAboutLockedPool = false;
}

function logPuzzlePoolDiagnosticsOnce(): void {
  if (hasLoggedPoolDiagnostics) return;

  hasLoggedPoolDiagnostics = true;
  console.info('[puzzle-streak] pool diagnostics', {
    totalCandidates: PUZZLE_POOL_DIAGNOSTICS.totalCandidates,
    validCandidates: PUZZLE_POOL_DIAGNOSTICS.validCandidates,
    shippedCandidates: PUZZLE_POOL_DIAGNOSTICS.shippedCandidates,
    rejectedCandidates: PUZZLE_POOL_DIAGNOSTICS.rejectedCandidates,
    topRejectionReasons: PUZZLE_POOL_DIAGNOSTICS.rejectionReasons.slice(0, 5),
  });
}

function warnIfPoolIsTooSmall(): void {
  if (hasWarnedAboutSmallPool || PUZZLES.length > STREAK_RECENT_WINDOW + 1) {
    return;
  }

  hasWarnedAboutSmallPool = true;
  console.warn('[puzzle-streak] valid pool is smaller than the repeat-exclusion window', {
    poolSize: PUZZLES.length,
    repeatExclusionWindow: STREAK_RECENT_WINDOW,
  });
}

export function isPuzzleUnlockedForStreak(puzzle: Puzzle, solvedCount: number): boolean {
  if (puzzle.pool !== 'advanced_only') {
    return true;
  }

  return solvedCount >= puzzle.minimumStreakRequired;
}

function getPreferredPerspectivePool(pool: Puzzle[]): Puzzle[] {
  return pool;
}

function getTargetStreakTier(solvedCount: number): Puzzle['streakTier'] {
  if (solvedCount <= 2) {
    return 'foundation';
  }

  if (solvedCount <= 5) {
    return 'practical_attack';
  }

  if (solvedCount <= 8) {
    return 'forcing_conversion';
  }

  return 'mate_pressure';
}

function getTierFallbackOrder(targetTier: Puzzle['streakTier']): Puzzle['streakTier'][] {
  const tierIndex = STREAK_TIER_ORDER.indexOf(targetTier);
  const order: Puzzle['streakTier'][] = [targetTier];

  if (tierIndex > 0) {
    order.push(STREAK_TIER_ORDER[tierIndex - 1]);
  }

  if (tierIndex < STREAK_TIER_ORDER.length - 1) {
    order.push(STREAK_TIER_ORDER[tierIndex + 1]);
  }

  return order;
}

function getExpandedTierFallbackOrder(targetTier: Puzzle['streakTier']): Puzzle['streakTier'][] {
  const baseOrder = getTierFallbackOrder(targetTier);
  const seen = new Set(baseOrder);
  const remaining = STREAK_TIER_ORDER.filter((tier) => !seen.has(tier));
  return [...baseOrder, ...remaining];
}

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

function getFallbackPuzzle(currentPuzzleId?: number | null, pool: Puzzle[] = PUZZLES): Puzzle {
  return pool.find((candidate) => candidate.id !== currentPuzzleId) ?? pool[0] ?? PUZZLES[0];
}

function chooseCandidateWithinTier(
  candidates: Puzzle[],
  targetScore: number,
  solvedCount: number,
  recentWindow: number[],
  themeRecency: Map<string, number>,
): Puzzle | null {
  if (candidates.length === 0) {
    return null;
  }

  const rankCandidate = (candidate: Puzzle): number => {
    const distance = Math.abs(candidate.difficultyScore - targetScore);
    const warmupCap = solvedCount < 2 ? 900 : solvedCount < 3 ? 1080 : Number.POSITIVE_INFINITY;
    const warmupPenalty = candidate.difficultyScore > warmupCap ? candidate.difficultyScore - warmupCap : 0;
    const advancedPenalty = solvedCount < 5 && candidate.difficulty === 'advanced' ? 160 : 0;
    const themePenalty = themeRecency.get(candidate.theme) ?? 0;
    return distance + warmupPenalty + advancedPenalty + themePenalty;
  };

  const ranked = [...candidates].sort((left, right) => {
    const leftScore = rankCandidate(left);
    const rightScore = rankCandidate(right);

    if (leftScore !== rightScore) return leftScore - rightScore;
    if (left.difficultyScore !== right.difficultyScore) return left.difficultyScore - right.difficultyScore;
    return left.id - right.id;
  });

  const topScore = rankCandidate(ranked[0]);
  const shortlist = ranked.filter(candidate => rankCandidate(candidate) <= topScore + 140).slice(0, 10);

  if (shortlist.length === 0) {
    return ranked[0] ?? null;
  }

  const rotationSeed = recentWindow.reduce((sum, puzzleId, index) => sum + puzzleId * (index + 1), solvedCount * 31 + targetScore);
  return shortlist[rotationSeed % shortlist.length] ?? ranked[0] ?? null;
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
  logPuzzlePoolDiagnosticsOnce();
  warnIfPoolIsTooSmall();

  const unlockedPool = PUZZLES.filter(candidate => isPuzzleUnlockedForStreak(candidate, solvedCount));
  const streakPool = getPreferredPerspectivePool(unlockedPool);
  if (streakPool.length === 0) {
    if (!hasWarnedAboutLockedPool) {
      hasWarnedAboutLockedPool = true;
      console.warn('[puzzle-streak] no puzzles are unlocked for the current progression state', {
        solvedCount,
        livePoolSize: PUZZLES.length,
      });
    }
    const nonAdvancedFallback = getPreferredPerspectivePool(PUZZLES.filter(candidate => candidate.pool !== 'advanced_only'));
    return getFallbackPuzzle(currentPuzzleId, nonAdvancedFallback);
  }

  const targetScore = clampDifficulty(adaptiveDifficultyScore);
  const recentWindow = recentPuzzleIds.slice(-STREAK_RECENT_WINDOW);
  const recentSet = new Set(recentWindow);
  const themeRecency = recentWindow.reduce((themes, puzzleId, index) => {
    const puzzle = streakPool.find((candidate) => candidate.id === puzzleId);
    if (!puzzle) return themes;

    const distanceFromLatest = recentWindow.length - index;
    const currentPenalty = themes.get(puzzle.theme) ?? 0;
    themes.set(puzzle.theme, currentPenalty + distanceFromLatest * 20);
    return themes;
  }, new Map<string, number>());

  const targetTier = getTargetStreakTier(solvedCount);
  const tierFallbackOrder = solvedCount >= 20
    ? getExpandedTierFallbackOrder(targetTier)
    : getTierFallbackOrder(targetTier);
  const strictTierCandidates = tierFallbackOrder
    .map((tier) => streakPool.filter((candidate) => candidate.streakTier === tier && candidate.id !== currentPuzzleId && !recentSet.has(candidate.id)))
    .find((candidates) => candidates.length > 0);

  if (strictTierCandidates) {
    const picked = chooseCandidateWithinTier(strictTierCandidates, targetScore, solvedCount, recentWindow, themeRecency);
    if (picked) {
      return picked;
    }
  }

  const relaxedTierCandidates = tierFallbackOrder
    .map((tier) => streakPool.filter((candidate) => candidate.streakTier === tier && candidate.id !== currentPuzzleId))
    .find((candidates) => candidates.length > 0);

  if (relaxedTierCandidates) {
    console.warn('[puzzle-streak] recent-history fallback activated', {
      currentPuzzleId,
      recentWindow,
      poolSize: streakPool.length,
      targetTier,
    });
    const picked = chooseCandidateWithinTier(relaxedTierCandidates, targetScore, solvedCount, recentWindow, themeRecency);
    if (picked) {
      return picked;
    }
  }

  console.warn('[puzzle-streak] falling back to any available puzzle because the live pool is exhausted', {
    currentPuzzleId,
    poolSize: streakPool.length,
    targetTier,
  });
  return getFallbackPuzzle(currentPuzzleId, streakPool);
}
