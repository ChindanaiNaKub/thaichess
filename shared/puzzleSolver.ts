import { getLegalMoves, isInCheck, makeMove } from './engine';
import type { Board, GameState, Move, PieceColor, PieceType } from './types';
import type { Puzzle } from './puzzles';
import {
  isMateTheme,
  isPromotionTheme,
  isTacticalTheme as isMaterialTheme,
} from './puzzleThemes';
const PIECE_VALUES: Record<Exclude<PieceType, 'K'>, number> = {
  R: 500,
  N: 300,
  S: 250,
  M: 200,
  PM: 200,
  P: 100,
};

export const TACTICAL_WIN_SWING = 200;

function getMaterialBalance(board: Board, color: PieceColor): number {
  let own = 0;
  let opponent = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.type === 'K') continue;

      if (piece.color === color) own += PIECE_VALUES[piece.type];
      else opponent += PIECE_VALUES[piece.type];
    }
  }

  return own - opponent;
}

export function getMaterialSwing(puzzle: Puzzle, state: GameState): number {
  return getMaterialBalance(state.board, puzzle.toMove) - getMaterialBalance(puzzle.board, puzzle.toMove);
}

export function isTacticalTheme(theme: string): boolean {
  return isMaterialTheme(theme);
}

export function createGameStateFromPuzzle(puzzle: Puzzle): GameState {
  return {
    board: puzzle.board.map(row => row.map(cell => (cell ? { ...cell } : null))),
    turn: puzzle.toMove,
    moveHistory: [],
    isCheck: isInCheck(puzzle.board, puzzle.toMove),
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    gameOver: false,
    winner: null,
    resultReason: null,
    counting: null,
    whiteTime: 0,
    blackTime: 0,
    lastMoveTime: 0,
    moveCount: 0,
  };
}

export function isThemeSatisfied(puzzle: Puzzle, state: GameState): boolean {
  const lastMove = state.moveHistory[state.moveHistory.length - 1];

  if (isMateTheme(puzzle.theme)) {
    return state.isCheckmate;
  }

  if (isPromotionTheme(puzzle.theme)) {
    return Boolean(lastMove?.promoted);
  }

  if (isMaterialTheme(puzzle.theme)) {
    return getMaterialSwing(puzzle, state) >= TACTICAL_WIN_SWING;
  }

  return false;
}

export function getPliesRemaining(puzzle: Puzzle, state: GameState): number {
  return Math.max(0, puzzle.solution.length - state.moveHistory.length);
}

export function getAllLegalMoves(board: Board, color: PieceColor): Move[] {
  const legalMoves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;

      for (const target of getLegalMoves(board, { row, col })) {
        legalMoves.push({
          from: { row, col },
          to: target,
        });
      }
    }
  }

  return legalMoves;
}

function encodeState(state: GameState, pliesRemaining: number): string {
  return JSON.stringify({
    board: state.board,
    turn: state.turn,
    moveHistory: state.moveHistory,
    pliesRemaining,
  });
}

export function canForceTheme(
  state: GameState,
  puzzle: Puzzle,
  solverColor: PieceColor,
  pliesRemaining: number,
  memo: Map<string, boolean>,
): boolean {
  if (isThemeSatisfied(puzzle, state)) {
    return true;
  }

  if (pliesRemaining === 0) {
    return false;
  }

  const memoKey = encodeState(state, pliesRemaining);
  const cached = memo.get(memoKey);
  if (cached !== undefined) {
    return cached;
  }

  const legalMoves = getAllLegalMoves(state.board, state.turn);
  if (legalMoves.length === 0) {
    const result = isThemeSatisfied(puzzle, state);
    memo.set(memoKey, result);
    return result;
  }

  const result = state.turn === solverColor
    ? legalMoves.some(move => {
      const nextState = makeMove(state, move.from, move.to);
      return nextState ? canForceTheme(nextState, puzzle, solverColor, pliesRemaining - 1, memo) : false;
    })
    : legalMoves.every(move => {
      const nextState = makeMove(state, move.from, move.to);
      return nextState ? canForceTheme(nextState, puzzle, solverColor, pliesRemaining - 1, memo) : false;
    });

  memo.set(memoKey, result);
  return result;
}

export function getForcingMoves(state: GameState, puzzle: Puzzle): Move[] {
  const pliesRemaining = getPliesRemaining(puzzle, state);
  if (pliesRemaining === 0 || isThemeSatisfied(puzzle, state)) {
    return [];
  }

  const legalMoves = getAllLegalMoves(state.board, state.turn);
  const memo = new Map<string, boolean>();

  return legalMoves.filter(move => {
    const nextState = makeMove(state, move.from, move.to);
    return nextState ? canForceTheme(nextState, puzzle, puzzle.toMove, pliesRemaining - 1, memo) : false;
  });
}
