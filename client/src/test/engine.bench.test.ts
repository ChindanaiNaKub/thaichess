import { bench, describe } from 'vitest';
import {
  createInitialBoard,
  createInitialGameState,
  getLegalMoves,
  isInCheck,
  makeMove,
  hasAnyLegalMoves,
  getAllPieces,
  moveToNotation,
} from '@shared/engine';

describe('Engine Performance Benchmarks', () => {
  const board = createInitialBoard();
  const gameState = createInitialGameState(300000, 300000);

  describe('Board Creation', () => {
    bench('createInitialBoard', () => {
      createInitialBoard();
    });

    bench('createInitialGameState', () => {
      createInitialGameState(300000, 300000);
    });
  });

  describe('Move Generation', () => {
    bench('getLegalMoves for pawn (center)', () => {
      getLegalMoves(board, { row: 2, col: 4 });
    });

    bench('getLegalMoves for rook (corner)', () => {
      getLegalMoves(board, { row: 0, col: 0 });
    });

    bench('getLegalMoves for knight (near center)', () => {
      getLegalMoves(board, { row: 0, col: 1 });
    });

    bench('getLegalMoves for king (center)', () => {
      getLegalMoves(board, { row: 0, col: 4 });
    });

    bench('getLegalMoves for Met (Queen)', () => {
      getLegalMoves(board, { row: 0, col: 3 });
    });

    bench('getLegalMoves for Khon (Silver)', () => {
      getLegalMoves(board, { row: 0, col: 2 });
    });
  });

  describe('Game State Queries', () => {
    bench('isInCheck (white)', () => {
      isInCheck(board, 'white');
    });

    bench('isInCheck (black)', () => {
      isInCheck(board, 'black');
    });

    bench('hasAnyLegalMoves (white)', () => {
      hasAnyLegalMoves(board, 'white');
    });

    bench('getAllPieces (white)', () => {
      getAllPieces(board, 'white');
    });

    bench('getAllPieces (black)', () => {
      getAllPieces(board, 'black');
    });
  });

  describe('Move Execution', () => {
    bench('makeMove (pawn push)', () => {
      makeMove(gameState, { row: 2, col: 4 }, { row: 3, col: 4 });
    });

    bench('moveToNotation', () => {
      const piece = { type: 'R' as const, color: 'white' as const };
      const move = {
        from: { row: 0, col: 0 },
        to: { row: 3, col: 0 },
        captured: { type: 'P' as const, color: 'black' as const },
      };
      moveToNotation(move, piece);
    });
  });

  describe('Bulk Operations', () => {
    bench('generate all legal moves for initial position', () => {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.color === 'white') {
            getLegalMoves(board, { row, col });
          }
        }
      }
    });

    bench('check all pieces for both colors', () => {
      getAllPieces(board, 'white');
      getAllPieces(board, 'black');
    });
  });
});
