export type { Puzzle, PuzzlePoolDiagnostics } from './puzzles';
export {
  ALL_PUZZLES,
  PUZZLES,
  PUZZLE_POOL_DIAGNOSTICS,
  getPuzzleById,
  getPuzzlesByDifficulty,
} from './puzzles';

import { ALL_PUZZLES, PUZZLES, type Puzzle } from './puzzles';

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
