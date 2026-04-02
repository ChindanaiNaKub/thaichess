import type { Board, Piece, PieceColor, PieceType, Position } from './types';

type Placement = [square: string, type: PieceType, color: PieceColor];

function piece(type: PieceType, color: PieceColor): Piece {
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
    row: Number.parseInt(name[1], 10) - 1,
  };
}

function board(...placements: Placement[]): Board {
  const next = emptyBoard();

  for (const [name, type, color] of placements) {
    const pos = square(name);
    next[pos.row][pos.col] = piece(type, color);
  }

  return next;
}

function move(from: string, to: string): { from: Position; to: Position } {
  return { from: square(from), to: square(to) };
}

export type MakrukRulePuzzleGoal =
  | 'force-mate'
  | 'win-before-count-expires'
  | 'hold-draw'
  | 'evaluate-counting-outcome'
  | 'choose-counting-action';

export type MakrukRulePuzzleAction =
  | { type: 'move'; move: { from: Position; to: Position } }
  | { type: 'start-board-honor' }
  | { type: 'evaluate'; verdict: 'white-win' | 'black-win' | 'draw' };

export interface MakrukRulePuzzle {
  id: string;
  title: string;
  goal: MakrukRulePuzzleGoal;
  prompt: string;
  board: Board;
  toMove: PieceColor;
  counting: {
    type: 'board_honor' | 'pieces_honor' | null;
    active: boolean;
    countingColor: PieceColor | null;
    strongerColor: PieceColor | null;
    currentCount: number | null;
    limit: number | null;
  };
  expectedAction: MakrukRulePuzzleAction;
  feedback: {
    correct: string;
    incorrect: string;
  };
  evaluation: {
    result: 'white-win' | 'black-win' | 'draw';
    reason: string;
  };
  tags: string[];
}

export interface MakrukRulePuzzleSystem {
  designPrinciples: string[];
  supportedGoals: MakrukRulePuzzleGoal[];
  evaluationAxes: string[];
  examplePuzzles: MakrukRulePuzzle[];
}

export const MAKRUK_RULE_PUZZLE_SYSTEM: MakrukRulePuzzleSystem = {
  designPrinciples: [
    'Treat counting as a first-class Makruk outcome, not as a side note.',
    'Allow decision puzzles as well as move puzzles when the correct action is to start Sak Kradan or recognize Sak Mak.',
    'Evaluate puzzles by official Makruk result states: win, draw, checkmate, timeout resolution, or counting exhaustion.',
    'Store counting context beside the board so puzzle validation can distinguish ordinary tactics from count-sensitive tactics.',
  ],
  supportedGoals: [
    'force-mate',
    'win-before-count-expires',
    'hold-draw',
    'evaluate-counting-outcome',
    'choose-counting-action',
  ],
  evaluationAxes: [
    'Board legality under Makruk movement',
    'Result legality under Makruk counting and draw rules',
    'Whether the puzzle goal is win-oriented or draw-oriented',
    'Whether counting state changes after the solution',
  ],
  examplePuzzles: [
    {
      id: 'sak-mak-immediate-draw',
      title: 'Too Much Material To Count',
      goal: 'evaluate-counting-outcome',
      prompt: 'Black has only the Khun left and no unpromoted pawns remain. White has two Rua and many extra pieces. What is the correct result right now under Sak Mak?',
      board: board(
        ['a1', 'K', 'white'],
        ['b1', 'R', 'white'],
        ['c1', 'R', 'white'],
        ['d1', 'N', 'white'],
        ['e1', 'N', 'white'],
        ['f1', 'S', 'white'],
        ['g1', 'S', 'white'],
        ['h1', 'M', 'white'],
        ['a2', 'PM', 'white'],
        ['h8', 'K', 'black'],
      ),
      toMove: 'black',
      counting: {
        type: 'pieces_honor',
        active: true,
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 10,
        limit: 8,
      },
      expectedAction: { type: 'evaluate', verdict: 'draw' },
      feedback: {
        correct: 'Correct. With two Rua the Sak Mak limit is 8, and this position is already beyond that threshold, so the game is an immediate draw.',
        incorrect: 'The right answer comes from Makruk counting, not from raw material. Sak Mak can draw a position even when one side has far more pieces.',
      },
      evaluation: {
        result: 'draw',
        reason: 'Immediate Sak Mak draw because the start count is already beyond the two-Rua limit.',
      },
      tags: ['counting', 'sak-mak', 'evaluation', 'draw'],
    },
    {
      id: 'claim-sak-kradan',
      title: 'Claim The Right Draw Resource',
      goal: 'choose-counting-action',
      prompt: 'No unpromoted pawns remain. Black is behind in material and cannot agree a draw. What is the correct Makruk action?',
      board: board(
        ['c2', 'K', 'white'],
        ['d5', 'R', 'white'],
        ['g7', 'K', 'black'],
        ['f6', 'PM', 'black'],
      ),
      toMove: 'black',
      counting: {
        type: 'board_honor',
        active: false,
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 0,
        limit: 64,
      },
      expectedAction: { type: 'start-board-honor' },
      feedback: {
        correct: 'Yes. This is a Sak Kradan position, so the right resource is to declare board-honor counting.',
        incorrect: 'The Makruk-native resource here is not a random waiting move. It is the decision to start Sak Kradan.',
      },
      evaluation: {
        result: 'draw',
        reason: 'Black can invoke Sak Kradan because no unpromoted pawns remain and Black is the materially weaker side.',
      },
      tags: ['counting', 'sak-kradan', 'decision', 'draw-resource'],
    },
    {
      id: 'win-before-sak-mak-closes',
      title: 'Finish Before The Count Closes',
      goal: 'win-before-count-expires',
      prompt: 'Sak Mak is active and Black is almost out of counted moves. Find the winning move before the draw arrives.',
      board: board(
        ['f6', 'K', 'white'],
        ['h7', 'R', 'white'],
        ['f8', 'K', 'black'],
      ),
      toMove: 'white',
      counting: {
        type: 'pieces_honor',
        active: true,
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 15,
        limit: 16,
      },
      expectedAction: { type: 'move', move: move('h7', 'h8') },
      feedback: {
        correct: 'Right. Rh8 ends the game immediately, so Sak Mak never gets the chance to save Black.',
        incorrect: 'This puzzle is not about preserving material. It is about ending the game before the Makruk count can bail Black out.',
      },
      evaluation: {
        result: 'white-win',
        reason: 'Checkmate lands before Sak Mak can produce a draw.',
      },
      tags: ['counting', 'sak-mak', 'mate', 'win-before-count'],
    },
  ],
};
