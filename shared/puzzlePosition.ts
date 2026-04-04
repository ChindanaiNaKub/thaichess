import { posToAlgebraic } from './engine';
import type { Board, Piece, PieceColor, PieceType, Position } from './types';

export interface PuzzlePiecePlacement {
  square: string;
  type: PieceType;
  color: PieceColor;
}

export function algebraicToPosition(square: string): Position {
  if (!/^[a-h][1-8]$/.test(square)) {
    throw new Error(`Invalid puzzle square: ${square}`);
  }

  return {
    col: square.charCodeAt(0) - 97,
    row: parseInt(square[1], 10) - 1,
  };
}

export function createEmptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function clonePiece(piece: Piece): Piece {
  return { ...piece };
}

export function pieceListToBoard(pieceList: PuzzlePiecePlacement[]): Board {
  const board = createEmptyBoard();

  for (const piece of pieceList) {
    const { row, col } = algebraicToPosition(piece.square);

    if (board[row][col]) {
      throw new Error(`Duplicate puzzle piece placement on ${piece.square}.`);
    }

    board[row][col] = clonePiece({
      type: piece.type,
      color: piece.color,
    });
  }

  return board;
}

export function boardToPieceList(board: Board): PuzzlePiecePlacement[] {
  const pieceList: PuzzlePiecePlacement[] = [];

  for (let row = 7; row >= 0; row -= 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row]?.[col];
      if (!piece) continue;

      pieceList.push({
        square: posToAlgebraic({ row, col }),
        type: piece.type,
        color: piece.color,
      });
    }
  }

  return pieceList;
}

export function boardMatchesPieceList(board: Board, pieceList: PuzzlePiecePlacement[]): boolean {
  try {
    const rebuilt = pieceListToBoard(pieceList);

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const left = board[row]?.[col];
        const right = rebuilt[row]?.[col];

        if (!left && !right) continue;
        if (!left || !right) return false;
        if (left.type !== right.type || left.color !== right.color) return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
