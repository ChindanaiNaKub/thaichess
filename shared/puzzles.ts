import type { Board, Piece, PieceColor, PieceType, Position } from './types';

export interface Puzzle {
  id: number;
  title: string;
  description: string;
  explanation: string;
  source: string;
  theme: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  toMove: PieceColor;
  board: Board;
  solution: { from: Position; to: Position }[];
}

const SHIPPED_PUZZLE_IDS = new Set([1, 6, 8, 10, 12, 13, 15, 17, 19]);

type Placement = [square: string, type: PieceType, color: PieceColor];

function p(type: PieceType, color: PieceColor): Piece {
  return { type, color };
}

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function square(name: string): Position {
  if (!/^[a-h][1-8]$/.test(name)) {
    throw new Error(`Invalid square: ${name}`);
  }

  return {
    col: name.charCodeAt(0) - 97,
    row: parseInt(name[1], 10) - 1,
  };
}

function board(...placements: Placement[]): Board {
  const next = emptyBoard();

  for (const [name, type, color] of placements) {
    const { row, col } = square(name);
    next[row][col] = p(type, color);
  }

  return next;
}

function line(...steps: string[]): { from: Position; to: Position }[] {
  return steps.map(step => {
    const [from, to] = step.split('-');
    if (!from || !to) {
      throw new Error(`Invalid move step: ${step}`);
    }

    return { from: square(from), to: square(to) };
  });
}

export const ALL_PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: 'Corner Clamp',
    description: 'Mate in 1. Slide the Rua down to finish the trapped king.',
    explanation: 'The rook lands on the mating rank while your Khon and king cover the last escape squares.',
    source: 'Starter pack: mate in 1',
    theme: 'Checkmate',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['a1', 'S', 'white'],
      ['c1', 'K', 'black'],
      ['f2', 'R', 'white'],
      ['c3', 'K', 'white'],
    ),
    solution: line('f2-f1'),
  },
  {
    id: 2,
    title: 'Long File Finish',
    description: 'Mate in 1. A long rook slide ends the game immediately.',
    explanation: 'Open files are deadly in Makruk. Once the rook reaches the first rank, the black king has no safe square left.',
    source: 'Starter pack: mate in 1',
    theme: 'Checkmate',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['g1', 'K', 'black'],
      ['g3', 'K', 'white'],
      ['e7', 'R', 'white'],
    ),
    solution: line('e7-e1'),
  },
  {
    id: 3,
    title: 'Sidewall Mate',
    description: 'Mate in 1. Check from the side and seal the edge.',
    explanation: 'The rook checks across the third rank, and your king keeps the black king boxed in on the rim.',
    source: 'Starter pack: mate in 1',
    theme: 'Checkmate',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['g3', 'R', 'white'],
      ['f8', 'K', 'white'],
      ['h8', 'K', 'black'],
    ),
    solution: line('g3-h3'),
  },
  {
    id: 4,
    title: 'Seventh-Rank Ladder',
    description: 'Mate in 1. Lift the rook one square for mate.',
    explanation: 'The rook climbs to the back rank, while the Khon and king close every reply around the cornered king.',
    source: 'Starter pack: mate in 1',
    theme: 'Checkmate',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['d5', 'S', 'white'],
      ['f6', 'K', 'white'],
      ['h7', 'R', 'white'],
      ['f8', 'K', 'black'],
    ),
    solution: line('h7-h8'),
  },
  {
    id: 5,
    title: 'Central Ladder',
    description: 'Mate in 1. Use the central rook lift to end it.',
    explanation: 'The rook invades the eighth rank and the supporting pieces take away the king squares around f8.',
    source: 'Starter pack: mate in 1',
    theme: 'Checkmate',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['d4', 'S', 'white'],
      ['f6', 'K', 'white'],
      ['d7', 'R', 'white'],
      ['f8', 'K', 'black'],
    ),
    solution: line('d7-d8'),
  },
  {
    id: 6,
    title: 'Met-Supported Sweep',
    description: 'Mate in 1. Let the Met support a horizontal rook finish.',
    explanation: 'The Met covers the key diagonals, so the rook can sweep across and deliver a clean mate on the sixth rank.',
    source: 'Starter pack: mate in 1',
    theme: 'Checkmate',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['f3', 'M', 'white'],
      ['d6', 'R', 'white'],
      ['f7', 'K', 'white'],
      ['h8', 'K', 'black'],
    ),
    solution: line('d6-h6'),
  },
  {
    id: 7,
    title: 'Supported Promotion',
    description: 'Promote the pawn safely with king support.',
    explanation: 'A single quiet step is enough. Once the pawn reaches the sixth rank, it becomes a promoted Met.',
    source: 'Starter pack: promotion',
    theme: 'Promotion',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['g4', 'S', 'black'],
      ['c5', 'P', 'white'],
      ['d7', 'K', 'black'],
      ['g7', 'K', 'white'],
    ),
    solution: line('c5-c6'),
  },
  {
    id: 8,
    title: 'Quiet Promotion',
    description: 'Promote with the simplest legal pawn push.',
    explanation: 'This is the basic Makruk promotion pattern: step to the sixth rank and the Bia turns into a promoted Met.',
    source: 'Starter pack: promotion',
    theme: 'Promotion',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['b2', 'K', 'white'],
      ['e5', 'P', 'white'],
      ['a7', 'K', 'black'],
    ),
    solution: line('e5-e6'),
  },
  {
    id: 9,
    title: 'Met Escort',
    description: 'Promote while the Met guards the route.',
    explanation: 'The Met and king keep the key squares under control, so the pawn can promote cleanly on the next step.',
    source: 'Starter pack: promotion',
    theme: 'Promotion',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['f2', 'K', 'black'],
      ['h3', 'K', 'white'],
      ['b5', 'P', 'white'],
      ['e7', 'M', 'white'],
    ),
    solution: line('b5-b6'),
  },
  {
    id: 10,
    title: 'Rook Harvest',
    description: 'Win material by grabbing the loose knight.',
    explanation: 'The rook has a clear file to the target, and taking the knight leaves White with a clean material gain.',
    source: 'Starter pack: tactic',
    theme: 'Tactic',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['b1', 'K', 'black'],
      ['a3', 'N', 'black'],
      ['h5', 'K', 'white'],
      ['a8', 'R', 'white'],
    ),
    solution: line('a8-a3'),
  },
  {
    id: 11,
    title: 'Backward Cleanup',
    description: 'Use the rook to collect the hanging Khon.',
    explanation: 'The rook can retreat and capture because the black king cannot punish it, turning a safe line into free material.',
    source: 'Starter pack: tactic',
    theme: 'Tactic',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['d1', 'K', 'black'],
      ['a2', 'K', 'white'],
      ['h3', 'S', 'black'],
      ['h5', 'R', 'white'],
      ['c8', 'N', 'white'],
    ),
    solution: line('h5-h3'),
  },
  {
    id: 12,
    title: 'Open File Pickup',
    description: 'Use the open rank to win the opposing rook.',
    explanation: 'Horizontal rook moves are powerful when the path is clear. Capture the black rook and keep the extra material.',
    source: 'Starter pack: tactic',
    theme: 'Tactic',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['a2', 'R', 'black'],
      ['e2', 'R', 'white'],
      ['g3', 'K', 'white'],
      ['g6', 'K', 'black'],
      ['h6', 'M', 'white'],
      ['a7', 'P', 'black'],
    ),
    solution: line('e2-a2'),
  },
  {
    id: 13,
    title: 'Met Wins the Rua',
    description: 'A short diagonal step wins a rook outright.',
    explanation: 'Makruk Mets are small but sharp. The diagonal capture on d1 wins a full rook with no tactical drawback.',
    source: 'Starter pack: tactic',
    theme: 'Tactic',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['d1', 'R', 'black'],
      ['e2', 'M', 'white'],
      ['g5', 'K', 'white'],
      ['d7', 'K', 'black'],
    ),
    solution: line('e2-d1'),
  },
  {
    id: 14,
    title: 'Sideways Pickup',
    description: 'Slide the rook across the rank to collect the Met.',
    explanation: 'When a high-value piece is loose on an open rank, the rook should not hesitate. This capture wins material cleanly.',
    source: 'Starter pack: tactic',
    theme: 'Tactic',
    difficulty: 'beginner',
    toMove: 'white',
    board: board(
      ['f2', 'K', 'black'],
      ['g3', 'N', 'white'],
      ['c4', 'R', 'white'],
      ['h4', 'M', 'black'],
      ['f5', 'K', 'white'],
    ),
    solution: line('c4-h4'),
  },
  {
    id: 15,
    title: 'Rook Pivot Mate',
    description: 'Mate in 2. Pivot the rook first, then drop to the back rank.',
    explanation: 'The first rook move cuts the king off and forces a single reply. After that, the rook drops to d1 for mate.',
    source: 'Starter pack: mate in 2',
    theme: 'Checkmate',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['e1', 'K', 'black'],
      ['f3', 'K', 'white'],
      ['c5', 'R', 'white'],
      ['d6', 'M', 'white'],
      ['f8', 'S', 'white'],
    ),
    solution: line('c5-d5', 'e1-f1', 'd5-d1'),
  },
  {
    id: 16,
    title: 'Back Rank Switch',
    description: 'Mate in 2. Swing the rook across, then invade the eighth rank.',
    explanation: 'The rook first changes files to trap the king’s path, and the follow-up on d8 completes the mating net.',
    source: 'Starter pack: mate in 2',
    theme: 'Checkmate',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['a2', 'R', 'white'],
      ['a5', 'P', 'white'],
      ['h5', 'N', 'white'],
      ['f6', 'K', 'white'],
      ['e8', 'K', 'black'],
    ),
    solution: line('a2-d2', 'e8-f8', 'd2-d8'),
  },
  {
    id: 17,
    title: 'File Fence',
    description: 'Mate in 2. Build the fence with the rook, then strike on c1.',
    explanation: 'The rook shift to c5 restricts the king, and the knight helps make the final rook drop on c1 checkmate.',
    source: 'Starter pack: mate in 2',
    theme: 'Checkmate',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['b1', 'K', 'black'],
      ['e1', 'N', 'white'],
      ['a3', 'K', 'white'],
      ['f5', 'R', 'white'],
    ),
    solution: line('f5-c5', 'b1-a1', 'c5-c1'),
  },
  {
    id: 18,
    title: 'Fifth-Rank Sweep',
    description: 'Mate in 2. Swing the rook up, then across for the finish.',
    explanation: 'The first rook lift forces the black king one square, and the second sweep along the fifth rank closes the net.',
    source: 'Starter pack: mate in 2',
    theme: 'Checkmate',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['c1', 'M', 'white'],
      ['f2', 'R', 'white'],
      ['a6', 'K', 'black'],
      ['c7', 'K', 'white'],
    ),
    solution: line('f2-f5', 'a6-a7', 'f5-a5'),
  },
  {
    id: 19,
    title: 'Double Rua Finish',
    description: 'Mate in 2. One rook lifts, the other seals the back rank.',
    explanation: 'Two rooks coordinate beautifully in Makruk. The first move forces the king deeper, and the second rook lands the mate.',
    source: 'Starter pack: mate in 2',
    theme: 'Checkmate',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['f2', 'R', 'white'],
      ['a6', 'R', 'white'],
      ['c6', 'K', 'white'],
      ['g8', 'K', 'black'],
    ),
    solution: line('a6-a7', 'g8-h8', 'f2-f8'),
  },
];

export const PUZZLES: Puzzle[] = ALL_PUZZLES.filter(puzzle => SHIPPED_PUZZLE_IDS.has(puzzle.id));

export const QUARANTINED_PUZZLES: Puzzle[] = ALL_PUZZLES.filter(puzzle => !SHIPPED_PUZZLE_IDS.has(puzzle.id));

export function getPuzzleById(id: number): Puzzle | undefined {
  return PUZZLES.find(p => p.id === id);
}

export function getPuzzlesByDifficulty(difficulty: Puzzle['difficulty']): Puzzle[] {
  return PUZZLES.filter(p => p.difficulty === difficulty);
}
