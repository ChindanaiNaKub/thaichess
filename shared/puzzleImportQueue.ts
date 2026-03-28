import type { Puzzle } from './puzzles';

export type PuzzleCandidateDraft = Omit<Puzzle, 'reviewStatus'>;

export function createImportedPuzzleCandidate(draft: PuzzleCandidateDraft): Puzzle {
  return {
    ...draft,
    reviewStatus: 'quarantine',
  };
}

export const IMPORTED_PUZZLE_CANDIDATES: Puzzle[] = [];
