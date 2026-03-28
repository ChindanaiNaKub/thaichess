import type { Board, Piece, PieceColor, PieceType, Position } from './types';
import type { Puzzle } from './puzzles';

export type PuzzleCandidateDraft = Omit<Puzzle, 'reviewStatus' | 'reviewChecklist'>;

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

function createReviewedImportedPuzzleCandidate(draft: PuzzleCandidateDraft, reviewNotes: string): Puzzle {
  return {
    ...draft,
    reviewStatus: 'ship',
    reviewChecklist: {
      themeClarity: 'pass',
      teachingValue: 'pass',
      duplicateRisk: 'clear',
      reviewNotes,
    },
  };
}

const CANDIDATE_DRAFTS: PuzzleCandidateDraft[] = [
  {
    id: 1001,
    title: 'Pivot Corridor',
    description: 'Mate in 2. Shift the rook to the corridor, then drop for mate on the first rank.',
    explanation: 'The rook step cuts the black king to one file. After the forced reply, the rook lands on e1 and closes the mating net.',
    source: 'Imported candidate batch: mirrored mate-in-2 review set',
    theme: 'MateIn2',
    motif: 'Mirrored rook pivot mate in 2',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['d1', 'K', 'black'],
      ['c3', 'K', 'white'],
      ['f5', 'R', 'white'],
      ['e6', 'M', 'white'],
      ['c8', 'S', 'white'],
    ),
    solution: line('f5-e5', 'd1-c1', 'e5-e1'),
  },
  {
    id: 1002,
    title: 'Back-Rank Detour',
    description: 'Mate in 2. Re-route the rook across the second rank, then invade the back rank for mate.',
    explanation: 'The rook swing to e2 traps the king into a single retreat. Once that square is fixed, the rook climbs to e8 and seals every escape.',
    source: 'Imported candidate batch: mirrored mate-in-2 review set',
    theme: 'BackRank',
    motif: 'Mirrored back-rank rook switch mate in 2',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['h2', 'R', 'white'],
      ['h5', 'P', 'white'],
      ['a5', 'N', 'white'],
      ['c6', 'K', 'white'],
      ['d8', 'K', 'black'],
    ),
    solution: line('h2-e2', 'd8-c8', 'e2-e8'),
  },
  {
    id: 1003,
    title: 'Fence From the Right',
    description: 'Mate in 2. Build the rook fence first, then drop straight down for mate.',
    explanation: 'The rook shift to f5 boxes the king in on the edge. With the knight covering the key jump squares, the follow-up on f1 is checkmate.',
    source: 'Imported candidate batch: mirrored mate-in-2 review set',
    theme: 'MateIn2',
    motif: 'Mirrored rook fence mate in 2',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['g1', 'K', 'black'],
      ['d1', 'N', 'white'],
      ['h3', 'K', 'white'],
      ['c5', 'R', 'white'],
    ),
    solution: line('c5-f5', 'g1-h1', 'f5-f1'),
  },
  {
    id: 1004,
    title: 'Wide Fifth-Rank Sweep',
    description: 'Mate in 2. Lift the rook first, then sweep across the fifth rank for mate.',
    explanation: 'The rook climb forces the king one square farther into the corner. After that, the sweep to h5 shuts the last escape and closes the mating net.',
    source: 'Imported candidate batch: mirrored mate-in-2 review set',
    theme: 'MateIn2',
    motif: 'Mirrored fifth-rank rook sweep mate in 2',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['f1', 'M', 'white'],
      ['c2', 'R', 'white'],
      ['h6', 'K', 'black'],
      ['f7', 'K', 'white'],
    ),
    solution: line('c2-c5', 'h6-h7', 'c5-h5'),
  },
  {
    id: 1005,
    title: 'Twin Rua Wall',
    description: 'Mate in 2. Lift one rook to the back rank, then bring the second rook across to finish.',
    explanation: 'The first rook move forces the black king sideways. The second rook then crashes onto c8 and the two rooks seal the full back-rank mate.',
    source: 'Imported candidate batch: mirrored mate-in-2 review set',
    theme: 'BackRank',
    motif: 'Mirrored double rook mate in 2',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['c2', 'R', 'white'],
      ['h6', 'R', 'white'],
      ['f6', 'K', 'white'],
      ['b8', 'K', 'black'],
    ),
    solution: line('h6-h7', 'b8-a8', 'c2-c8'),
  },
  {
    id: 5001,
    title: 'Real-Game Trapped Knight (8eb070e4 @ ply 17)',
    description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
    explanation: 'The first move shuts the knight inside the corner. Black can shuffle, but the trapped knight still falls on the next move.',
    source: 'Exported rated game 8eb070e4 (ply 17)',
    theme: 'TrappedPiece',
    motif: 'Real-game trapped knight candidate',
    difficulty: 'intermediate',
    toMove: 'white',
    board: board(
      ['a1', 'N', 'black'],
      ['c1', 'S', 'white'],
      ['d1', 'K', 'white'],
      ['e1', 'M', 'white'],
      ['f1', 'S', 'white'],
      ['g1', 'N', 'white'],
      ['h1', 'R', 'white'],
      ['a3', 'P', 'white'],
      ['c3', 'N', 'white'],
      ['f3', 'P', 'white'],
      ['g3', 'P', 'white'],
      ['h3', 'P', 'white'],
      ['c4', 'P', 'white'],
      ['a6', 'P', 'black'],
      ['d6', 'P', 'black'],
      ['e6', 'P', 'black'],
      ['f6', 'P', 'black'],
      ['g6', 'P', 'black'],
      ['h6', 'P', 'black'],
      ['e7', 'N', 'black'],
      ['a8', 'R', 'black'],
      ['c8', 'S', 'black'],
      ['d8', 'M', 'black'],
      ['e8', 'K', 'black'],
      ['f8', 'S', 'black'],
      ['h8', 'R', 'black'],
    ),
    solution: line('c1-b2', 'a1-b3', 'b2-b3'),
  },
];

const REVIEWED_IMPORT_IDS = new Set([5001]);

export const IMPORTED_PUZZLE_CANDIDATES: Puzzle[] = CANDIDATE_DRAFTS.map(draft =>
  REVIEWED_IMPORT_IDS.has(draft.id)
    ? createReviewedImportedPuzzleCandidate(
      draft,
      'Promoted for local play-testing because the trapped-knight idea reads cleanly in review.',
    )
    : createImportedPuzzleCandidate(draft),
);
