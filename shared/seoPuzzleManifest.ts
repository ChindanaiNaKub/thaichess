export type SeoPuzzleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SeoPuzzleEntry {
  id: number;
  title: string;
  description: string;
  difficulty: SeoPuzzleDifficulty;
}

export const SEO_PUZZLES: SeoPuzzleEntry[] = [
  {
    id: 7001,
    title: 'Ma Fork Through the Shell',
    description: 'White to move. Find the only Ma fork that checks the Khun and wins the trapped Ruea next.',
    difficulty: 'beginner',
  },
  {
    id: 7003,
    title: 'Mate Before Sak Mak Closes',
    description: 'White to move. Sak Mak is already on 15 out of 16 counted moves. Find the only mate before the draw arrives.',
    difficulty: 'intermediate',
  },
  {
    id: 7004,
    title: 'Capstone Mate Through d6',
    description: 'White to move. Force mate in 3 with the exact d6 interference line.',
    difficulty: 'advanced',
  },
  {
    id: 9000,
    title: 'Real-Game Discovery (selfplay-0001 @ ply 14)',
    description: 'Win material in 2. Find the discovered attack that reveals the winning line.',
    difficulty: 'advanced',
  },
  {
    id: 9001,
    title: 'Real-Game Promotion (selfplay-0001 @ ply 20)',
    description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
    difficulty: 'beginner',
  },
  {
    id: 9003,
    title: 'Real-Game Fork (selfplay-0001 @ ply 62)',
    description: 'Win material in 2. Start with the fork that attacks the king and the khon.',
    difficulty: 'advanced',
  },
  {
    id: 9005,
    title: 'Real-Game Trapped Piece (selfplay-0002 @ ply 29)',
    description: 'Win material in 2. Start with the move that traps the piece before collecting it.',
    difficulty: 'advanced',
  },
  {
    id: 9006,
    title: 'Real-Game Pin (selfplay-0002 @ ply 44)',
    description: 'Win material in 1. Start with the pin that leaves the knight stuck.',
    difficulty: 'intermediate',
  },
  {
    id: 9007,
    title: 'Real-Game Pin (selfplay-0002 @ ply 44)',
    description: 'Win material in 2. Start with the pin that leaves the knight stuck.',
    difficulty: 'advanced',
  },
  {
    id: 9008,
    title: 'Real-Game Double Attack (selfplay-0002 @ ply 50)',
    description: 'Win material in 1. Start with the double attack that overloads the defense.',
    difficulty: 'intermediate',
  },
  {
    id: 9009,
    title: 'Real-Game Double Attack (selfplay-0002 @ ply 52)',
    description: 'Win material in 1. Start with the double attack that overloads the defense.',
    difficulty: 'intermediate',
  },
  {
    id: 9010,
    title: 'Real-Game Promotion (selfplay-0002 @ ply 71)',
    description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
    difficulty: 'beginner',
  },
  {
    id: 9011,
    title: 'Real-Game Trapped Piece (selfplay-0003 @ ply 24)',
    description: 'Win material in 2. Start with the move that traps the piece before collecting it.',
    difficulty: 'advanced',
  },
  {
    id: 9012,
    title: 'Real-Game Promotion (selfplay-0003 @ ply 30)',
    description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
    difficulty: 'beginner',
  },
  {
    id: 9013,
    title: 'Real-Game Double Attack (selfplay-0003 @ ply 32)',
    description: 'Win material in 1. Start with the double attack that overloads the defense.',
    difficulty: 'intermediate',
  },
  {
    id: 9014,
    title: 'Real-Game Pin (selfplay-0004 @ ply 18)',
    description: 'Win material in 1. Start with the pin that leaves the knight stuck.',
    difficulty: 'intermediate',
  },
  {
    id: 9015,
    title: 'Real-Game Pin (selfplay-0004 @ ply 18)',
    description: 'Win material in 2. Start with the pin that leaves the knight stuck.',
    difficulty: 'advanced',
  },
  {
    id: 9016,
    title: 'Real-Game Promotion (selfplay-0004 @ ply 22)',
    description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
    difficulty: 'beginner',
  },
  {
    id: 9017,
    title: 'Real-Game Discovery (selfplay-0004 @ ply 22)',
    description: 'Win material in 2. Find the discovered attack that reveals the winning line.',
    difficulty: 'advanced',
  },
  {
    id: 9018,
    title: 'Real-Game Trapped Piece (selfplay-0004 @ ply 37)',
    description: 'Win material in 2. Start with the move that traps the piece before collecting it.',
    difficulty: 'advanced',
  },
  {
    id: 9019,
    title: 'Real-Game Promotion (selfplay-0004 @ ply 45)',
    description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
    difficulty: 'beginner',
  },
  {
    id: 9020,
    title: 'Real-Game Pin (selfplay-0004 @ ply 54)',
    description: 'Win material in 1. Start with the pin that leaves the knight stuck.',
    difficulty: 'intermediate',
  },
  {
    id: 9021,
    title: 'Real-Game Promotion (selfplay-0004 @ ply 65)',
    description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
    difficulty: 'beginner',
  },
  {
    id: 9022,
    title: 'Real-Game Promotion (selfplay-0005 @ ply 46)',
    description: 'Promote in 2. Start with the forcing move that escorts the bia to promotion.',
    difficulty: 'beginner',
  },
  {
    id: 9023,
    title: 'Real-Game Hanging Piece (selfplay-0005 @ ply 55)',
    description: 'Win material in 2. Start by taking the loose knight.',
    difficulty: 'advanced',
  },
];

const SEO_PUZZLES_BY_ID = new Map(SEO_PUZZLES.map((puzzle) => [puzzle.id, puzzle]));

export function findSeoPuzzleById(id: number): SeoPuzzleEntry | undefined {
  return SEO_PUZZLES_BY_ID.get(id);
}

export function getSeoPuzzlePaths(): string[] {
  return SEO_PUZZLES.map((puzzle) => `/puzzle/${puzzle.id}`);
}
