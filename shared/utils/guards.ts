import type { Piece, Position, Board, PieceColor } from '../types';

/**
 * Type guard to check if a square contains a piece.
 *
 * @example
 * if (hasPiece(square)) {
 *   console.log(square.type); // TypeScript knows this is Piece
 * }
 */
export function hasPiece(piece: Piece | null | undefined): piece is Piece {
  return piece !== null && piece !== undefined;
}

/**
 * Type guard to check if a piece is of a specific type.
 */
export function isPieceType(piece: Piece, type: Piece['type']): boolean {
  return piece.type === type;
}

/**
 * Type guard to check if a piece is of a specific color.
 */
export function isPieceColor(piece: Piece, color: PieceColor): piece is Piece & { color: PieceColor } {
  return piece.color === color;
}

/**
 * Type guard to check if a position is within board bounds.
 */
export function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

/**
 * Type guard to check if two positions are equal.
 */
export function isSamePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Type guard to check if a move is a capture.
 */
export function isCapture(move: { captured?: Piece | null }): move is { captured: Piece } {
  return move.captured !== null && move.captured !== undefined;
}

/**
 * Type guard to check if a move is a promotion.
 */
export function isPromotion(move: { promoted?: boolean }): move is { promoted: true } {
  return move.promoted === true;
}

/**
 * Get piece at position with null safety.
 */
export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (!isInBounds(pos)) return null;
  return board[pos.row][pos.col] ?? null;
}

/**
 * Find king position with null safety.
 */
export function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (hasPiece(piece) && piece.type === 'K' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Count pieces of a type and color on the board.
 */
export function countPieces(board: Board, color: PieceColor, type?: Piece['type']): number {
  let count = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (hasPiece(piece) && piece.color === color) {
        if (type === undefined || piece.type === type) {
          count++;
        }
      }
    }
  }
  return count;
}

/**
 * Check if board position is empty.
 */
export function isEmptySquare(board: Board, pos: Position): boolean {
  return getPieceAt(board, pos) === null;
}

/**
 * Check if board position has a piece of a specific color.
 */
export function hasPieceOfColor(board: Board, pos: Position, color: PieceColor): boolean {
  const piece = getPieceAt(board, pos);
  return hasPiece(piece) && piece.color === color;
}
