import { PUZZLES } from './puzzlesRuntime';

export type SeoPuzzleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SeoPuzzleEntry {
  id: number;
  title: string;
  description: string;
  difficulty: SeoPuzzleDifficulty;
}

export const SEO_PUZZLES: SeoPuzzleEntry[] = PUZZLES.map((puzzle) => ({
  id: puzzle.id,
  title: puzzle.title,
  description: puzzle.description,
  difficulty: puzzle.difficulty,
}));

const SEO_PUZZLES_BY_ID = new Map(SEO_PUZZLES.map((puzzle) => [puzzle.id, puzzle]));

export function findSeoPuzzleById(id: number): SeoPuzzleEntry | undefined {
  return SEO_PUZZLES_BY_ID.get(id);
}

export function getSeoPuzzlePaths(): string[] {
  return SEO_PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`);
}
