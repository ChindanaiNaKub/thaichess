import type { Puzzle } from './puzzles';

export type PuzzleCandidateDraft = Omit<Puzzle, 'reviewStatus' | 'reviewChecklist'>;

export function createImportedPuzzleCandidate(draft: PuzzleCandidateDraft): Puzzle {
  return {
    ...draft,
    reviewStatus: 'quarantine',
    reviewChecklist: {
      themeClarity: 'unreviewed',
      teachingValue: 'unreviewed',
      duplicateRisk: 'unreviewed',
      reviewNotes: '',
    },
  };
}

export const IMPORTED_PUZZLE_CANDIDATES: Puzzle[] = [];
