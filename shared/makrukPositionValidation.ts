import {
  createInitialBoard,
  createInitialGameState,
  getPromotionRank,
  isInCheck,
  makeMove,
  shouldPromotePawn,
} from './engine';
import type { Board, GameState, Move, PieceColor, PieceType, Position } from './types';

const MAX_BASE_COUNTS: Record<Exclude<PieceType, 'PM'>, number> = {
  K: 1,
  M: 1,
  S: 2,
  N: 2,
  R: 2,
  P: 8,
};

function isBoardShapeValid(board: Board): boolean {
  return board.length === 8 && board.every(row => row.length === 8);
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function boardsEqual(left: Board, right: Board): boolean {
  if (!isBoardShapeValid(left) || !isBoardShapeValid(right)) {
    return false;
  }

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const a = left[row][col];
      const b = right[row][col];

      if (!a && !b) continue;
      if (!a || !b) return false;
      if (a.color !== b.color || a.type !== b.type) return false;
    }
  }

  return true;
}

function getOpponent(color: PieceColor): PieceColor {
  return color === 'white' ? 'black' : 'white';
}

function createState(board: Board, turn: PieceColor): GameState {
  return {
    board: cloneBoard(board),
    turn,
    moveHistory: [],
    lastMove: null,
    isCheck: isInCheck(board, turn),
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

function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece?.type === 'K' && piece.color === color) {
        return { row, col };
      }
    }
  }

  return null;
}

function countPieces(board: Board, color: PieceColor): Record<PieceType, number> {
  const counts: Record<PieceType, number> = {
    K: 0,
    M: 0,
    S: 0,
    N: 0,
    R: 0,
    P: 0,
    PM: 0,
  };

  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.color !== color) continue;
      counts[piece.type] += 1;
    }
  }

  return counts;
}

function totalPieces(counts: Record<PieceType, number>): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

function getLegalTurnAssignments(board: Board): PieceColor[] {
  const legalTurns: PieceColor[] = [];

  for (const turn of ['white', 'black'] as const) {
    const defender = getOpponent(turn);
    if (!isInCheck(board, defender)) {
      legalTurns.push(turn);
    }
  }

  return legalTurns;
}

function getReplayPromotionErrors(
  stateBeforeMove: GameState,
  move: Move,
  stateAfterMove: GameState,
  moveIndex: number,
): string[] {
  const errors: string[] = [];
  const movingPiece = stateBeforeMove.board[move.from.row]?.[move.from.col];
  const recordedMove = stateAfterMove.moveHistory[stateAfterMove.moveHistory.length - 1];
  const landedPiece = stateAfterMove.board[move.to.row]?.[move.to.col];
  const shouldPromote = Boolean(movingPiece && shouldPromotePawn(movingPiece, move.to));
  const promotionLabel = `Replay move ${moveIndex + 1}`;

  if (!movingPiece) {
    return errors;
  }

  if (shouldPromote) {
    if (!recordedMove?.promoted) {
      errors.push(`${promotionLabel} reached the promotion rank but was not recorded as a promotion.`);
    }

    if (!landedPiece || landedPiece.type !== 'PM') {
      errors.push(`${promotionLabel} did not leave a promoted bia on the destination square.`);
      return errors;
    }

    if (landedPiece.color !== movingPiece.color) {
      errors.push(`${promotionLabel} changed color during promotion.`);
    }

    return errors;
  }

  if (recordedMove?.promoted) {
    errors.push(`${promotionLabel} was recorded as a promotion without a bia reaching its promotion rank.`);
  }

  return errors;
}

export function getMakrukPositionValidationErrors(board: Board): string[] {
  const errors: string[] = [];

  if (!isBoardShapeValid(board)) {
    errors.push('Board must be 8x8.');
    return errors;
  }

  for (const color of ['white', 'black'] as const) {
    const counts = countPieces(board, color);

    if (counts.K !== 1) {
      errors.push(`${color} must have exactly one king.`);
    }

    for (const type of ['M', 'S', 'N', 'R'] as const) {
      if (counts[type] > MAX_BASE_COUNTS[type]) {
        errors.push(`${color} has too many ${type} pieces for a legal Makruk game.`);
      }
    }

    if (counts.P + counts.PM > MAX_BASE_COUNTS.P) {
      errors.push(`${color} has more than eight bia/promoted-bia units.`);
    }

    if (counts.PM > MAX_BASE_COUNTS.P) {
      errors.push(`${color} has too many promoted bia pieces.`);
    }

    if (counts.M + counts.PM > MAX_BASE_COUNTS.M + MAX_BASE_COUNTS.P) {
      errors.push(`${color} has more met-like pieces than a legal Makruk game can produce.`);
    }

    if (totalPieces(counts) > 16) {
      errors.push(`${color} has more than sixteen pieces on the board.`);
    }
  }

  const whiteKing = findKing(board, 'white');
  const blackKing = findKing(board, 'black');
  if (whiteKing && blackKing) {
    const rowDistance = Math.abs(whiteKing.row - blackKing.row);
    const colDistance = Math.abs(whiteKing.col - blackKing.col);
    if (rowDistance <= 1 && colDistance <= 1) {
      errors.push('Kings cannot be adjacent in a legal Makruk position.');
    }
  }

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.type !== 'P') continue;

      if (piece.color === 'white' && row < 2) {
        errors.push('White bia cannot be behind its starting rank.');
      }

      if (piece.color === 'white' && row >= getPromotionRank('white')) {
        errors.push('White bia cannot remain unpromoted on or beyond the promotion rank.');
      }

      if (piece.color === 'black' && row > 5) {
        errors.push('Black bia cannot be behind its starting rank.');
      }

      if (piece.color === 'black' && row <= getPromotionRank('black')) {
        errors.push('Black bia cannot remain unpromoted on or beyond the promotion rank.');
      }
    }
  }

  if (isInCheck(board, 'white') && isInCheck(board, 'black')) {
    errors.push('Both kings cannot be in check at the same time.');
  }

  if (getLegalTurnAssignments(board).length === 0) {
    errors.push('Board does not admit any legal side-to-move assignment.');
  }

  return errors;
}

export function validateMakrukPosition(board: Board): boolean {
  return getMakrukPositionValidationErrors(board).length === 0;
}

export function validateMakrukPuzzlePosition(board: Board): { isValid: boolean; errors: string[] } {
  const errors = getMakrukPositionValidationErrors(board);
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface MakrukReplayValidationOptions {
  moves: Move[];
  startingBoard?: Board;
  startingTurn?: PieceColor;
  expectedBoard?: Board;
  expectedTurn?: PieceColor;
}

export interface MakrukReplayValidationResult {
  valid: boolean;
  errors: string[];
  finalState: GameState | null;
}

export interface MakrukGeneratedPositionValidationOptions {
  board: Board;
  turn: PieceColor;
  startingBoard?: Board;
  startingTurn?: PieceColor;
  replayMoves?: Move[];
}

export interface MakrukGeneratedPositionValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMakrukReplay(options: MakrukReplayValidationOptions): MakrukReplayValidationResult {
  const errors: string[] = [];
  const startingBoard = cloneBoard(options.startingBoard ?? createInitialBoard());
  const startingTurn = options.startingTurn ?? 'white';

  const startingBoardErrors = getMakrukPositionValidationErrors(startingBoard);
  if (startingBoardErrors.length > 0) {
    return {
      valid: false,
      errors: startingBoardErrors.map(error => `Illegal starting board: ${error}`),
      finalState: null,
    };
  }

  let state = options.startingBoard || options.startingTurn
    ? createState(startingBoard, startingTurn)
    : createInitialGameState(0, 0);

  for (let index = 0; index < options.moves.length; index += 1) {
    const move = options.moves[index];
    const nextState = makeMove(state, move.from, move.to);

    if (!nextState) {
      errors.push(`Replay move ${index + 1} is illegal.`);
      return {
        valid: false,
        errors,
        finalState: null,
      };
    }

    errors.push(...getReplayPromotionErrors(state, move, nextState, index));
    state = nextState;
  }

  if (options.expectedBoard && !boardsEqual(state.board, options.expectedBoard)) {
    errors.push('Replay did not reach the expected board.');
  }

  if (options.expectedTurn && state.turn !== options.expectedTurn) {
    errors.push('Replay did not reach the expected side to move.');
  }

  const finalBoardErrors = getMakrukPositionValidationErrors(state.board);
  errors.push(...finalBoardErrors.map(error => `Illegal replayed board: ${error}`));

  return {
    valid: errors.length === 0,
    errors,
    finalState: errors.length === 0 ? state : null,
  };
}

export function validateMakrukGeneratedPosition(
  options: MakrukGeneratedPositionValidationOptions,
): MakrukGeneratedPositionValidationResult {
  const boardErrors = getMakrukPositionValidationErrors(options.board);
  const errors = [...boardErrors];
  const replayMoves = options.replayMoves ?? [];

  if (replayMoves.length > 0) {
    const replay = validateMakrukReplay({
      startingBoard: options.startingBoard,
      startingTurn: options.startingTurn,
      moves: replayMoves,
      expectedBoard: options.board,
      expectedTurn: options.turn,
    });
    errors.push(...replay.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
