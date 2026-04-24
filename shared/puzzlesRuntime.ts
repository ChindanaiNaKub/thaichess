import { IMPORTED_PUZZLE_CANDIDATES } from './puzzleImportQueue';
import type { Puzzle, PuzzlePoolDiagnostics } from './puzzles';

export type { Puzzle, PuzzlePoolDiagnostics } from './puzzles';

const RUNTIME_EXCLUDED_PUZZLE_IDS = new Set<number>([
  // The full audit catalog rejects this editorial draft; keep that expensive gate out of runtime imports.
  9004,
]);

function hasPassingReviewChecklist(puzzle: Puzzle): boolean {
  return puzzle.reviewChecklist.themeClarity === 'pass' &&
    puzzle.reviewChecklist.teachingValue === 'pass' &&
    puzzle.reviewChecklist.duplicateRisk === 'clear';
}

function isRuntimeLivePuzzle(puzzle: Puzzle): boolean {
  const isEligibleOrigin = puzzle.origin === 'engine-generated' || puzzle.origin === 'curated-manual';
  return puzzle.reviewStatus === 'ship' &&
    hasPassingReviewChecklist(puzzle) &&
    isEligibleOrigin &&
    puzzle.tags.includes('editorial-live') &&
    puzzle.duplicateOf === null &&
    puzzle.verification.verificationStatus !== 'unverified' &&
    puzzle.verification.verificationStatus !== 'ambiguous' &&
    !RUNTIME_EXCLUDED_PUZZLE_IDS.has(puzzle.id);
}

export const ALL_PUZZLES: Puzzle[] = IMPORTED_PUZZLE_CANDIDATES;
export const PUZZLES: Puzzle[] = ALL_PUZZLES.filter(isRuntimeLivePuzzle);

export const PUZZLE_POOL_DIAGNOSTICS: PuzzlePoolDiagnostics = {
  totalCandidates: ALL_PUZZLES.length,
  validCandidates: PUZZLES.length,
  shippedCandidates: PUZZLES.length,
  rejectedCandidates: Math.max(0, ALL_PUZZLES.length - PUZZLES.length),
  rejectionReasons: [],
  publishableByDifficulty: {
    beginner: PUZZLES.filter(puzzle => puzzle.difficulty === 'beginner').length,
    intermediate: PUZZLES.filter(puzzle => puzzle.difficulty === 'intermediate').length,
    advanced: PUZZLES.filter(puzzle => puzzle.difficulty === 'advanced').length,
  },
  publishableBySource: {
    curated: PUZZLES.filter(puzzle => puzzle.origin !== 'engine-generated').length,
    generated: PUZZLES.filter(puzzle => puzzle.origin === 'engine-generated').length,
  },
};

export function getPuzzleById(id: number): Puzzle | undefined {
  return PUZZLES.find(puzzle => puzzle.id === id);
}

export function getPuzzlesByDifficulty(difficulty: Puzzle['difficulty']): Puzzle[] {
  return PUZZLES.filter(puzzle => puzzle.difficulty === difficulty);
}

function dedupeById(puzzles: Puzzle[]): Puzzle[] {
  const seen = new Set<number>();
  return puzzles.filter((puzzle) => {
    if (seen.has(puzzle.id)) return false;
    seen.add(puzzle.id);
    return true;
  });
}

const FEATURED_STREAK_DRAFTS = ALL_PUZZLES
  .filter((puzzle) => puzzle.reviewStatus !== 'ship' && puzzle.tags.includes('candidate-from-photo'))
  .sort((left, right) => right.id - left.id);

export const STREAK_SURFACE_PUZZLES: Puzzle[] = dedupeById([
  ...FEATURED_STREAK_DRAFTS,
  ...PUZZLES,
]);
