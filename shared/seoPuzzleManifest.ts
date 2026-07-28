import { ALL_PUZZLES, PUZZLES, type Puzzle } from './puzzlesRuntime';

export type SeoPuzzleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SeoPuzzleEntry {
  id: number;
  title: string;
  description: string;
  difficulty: SeoPuzzleDifficulty;
}

function toSeoPuzzleEntry(puzzle: Puzzle): SeoPuzzleEntry {
  return {
    id: puzzle.id,
    title: puzzle.title,
    description: puzzle.description,
    difficulty: puzzle.difficulty,
  };
}

/** Indexable puzzle URLs — only live editorial puzzles belong in the sitemap. */
export const SEO_PUZZLES: SeoPuzzleEntry[] = PUZZLES.map(toSeoPuzzleEntry);

const SEO_PUZZLES_BY_ID = new Map(SEO_PUZZLES.map((puzzle) => [puzzle.id, puzzle]));
const ALL_PUZZLES_BY_ID = new Map(ALL_PUZZLES.map((puzzle) => [puzzle.id, toSeoPuzzleEntry(puzzle)]));

export function isIndexableSeoPuzzle(id: number): boolean {
  return SEO_PUZZLES_BY_ID.has(id);
}

export function findSeoPuzzleById(id: number): SeoPuzzleEntry | undefined {
  return SEO_PUZZLES_BY_ID.get(id) ?? ALL_PUZZLES_BY_ID.get(id);
}

export function getSeoPuzzlePaths(): string[] {
  return SEO_PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`);
}
