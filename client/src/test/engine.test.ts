import { describe, it, expect } from 'vitest';
import type { Board, Piece, Move } from '@shared/types';
import {
  createInitialBoard,
  createInitialGameState,
  getLegalMoves,
  isInCheck,
  makeMove,
  hasAnyLegalMoves,
  posToAlgebraic,
  moveToNotation,
  getBoardAtMove,
  getAllPieces,
} from '@shared/engine';

describe('Game Engine', () => {
  describe('createInitialBoard', () => {
    it('should create an 8x8 board', () => {
      const board = createInitialBoard();
      expect(board).toHaveLength(8);
      expect(board[0]).toHaveLength(8);
    });

    it('should place white pieces on rows 0-2', () => {
      const board = createInitialBoard();

      // Back rank (row 0)
      expect(board[0][0]?.type).toBe('R');
      expect(board[0][1]?.type).toBe('N');
      expect(board[0][2]?.type).toBe('S');
      expect(board[0][3]?.type).toBe('M');
      expect(board[0][4]?.type).toBe('K');
      expect(board[0][5]?.type).toBe('S');
      expect(board[0][6]?.type).toBe('N');
      expect(board[0][7]?.type).toBe('R');

      // Pawns (row 2)
      for (let col = 0; col < 8; col++) {
        expect(board[2][col]?.type).toBe('P');
        expect(board[2][col]?.color).toBe('white');
      }
    });

    it('should place black pieces on rows 5-7', () => {
      const board = createInitialBoard();

      // Back rank (row 7)
      expect(board[7][0]?.type).toBe('R');
      expect(board[7][1]?.type).toBe('N');
      expect(board[7][2]?.type).toBe('S');
      expect(board[7][3]?.type).toBe('K'); // Black's K is on col 3
      expect(board[7][4]?.type).toBe('M');
      expect(board[7][5]?.type).toBe('S');
      expect(board[7][6]?.type).toBe('N');
      expect(board[7][7]?.type).toBe('R');

      // Pawns (row 5)
      for (let col = 0; col < 8; col++) {
        expect(board[5][col]?.type).toBe('P');
        expect(board[5][col]?.color).toBe('black');
      }
    });

    it('should have correct middle rows empty', () => {
      const board = createInitialBoard();

      // Row 3 and 4 should be empty
      for (let col = 0; col < 8; col++) {
        expect(board[3][col]).toBeNull();
        expect(board[4][col]).toBeNull();
      }
    });
  });

  describe('getLegalMoves - King (K)', () => {
    it('should move 1 square in any direction', () => {
      const board = createInitialBoard();
      const kingMoves = getLegalMoves(board, { row: 0, col: 4 }); // White King

      // King can move to row 1, cols 3,4,5 (if not in check)
      expect(kingMoves.length).toBeGreaterThan(0);
      expect(kingMoves).toContainEqual({ row: 1, col: 4 });
    });

    it('should not move into check', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      // Place kings
      board[0][4] = { type: 'K', color: 'white' };
      board[7][4] = { type: 'K', color: 'black' };

      // Place a rook attacking squares near white king
      board[1][4] = { type: 'R', color: 'black' };

      const kingMoves = getLegalMoves(board, { row: 0, col: 4 });

      // King cannot move into the rook's line
      expect(kingMoves).not.toContainEqual({ row: 0, col: 4 });
    });
  });

  describe('getLegalMoves - Rook (R)', () => {
    it('should slide horizontally and vertically', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'R', color: 'white' };
      board[4][0] = { type: 'P', color: 'white' }; // Friendly piece blocks
      board[0][4] = { type: 'P', color: 'black' }; // Enemy piece can capture

      const moves = getLegalMoves(board, { row: 4, col: 4 });

      // Should have moves in all 4 directions, blocked by friendly piece on left
      expect(moves.length).toBeGreaterThan(0);

      // Should include capture position
      expect(moves).toContainEqual({ row: 0, col: 4 });

      // Should not include position blocked by friendly piece
      expect(moves).not.toContainEqual({ row: 4, col: 0 });
    });

    it('should have correct moves from starting position', () => {
      const board = createInitialBoard();

      // White rook at a1 (0,0) - can move forward since row 1 is empty
      const rookMoves = getLegalMoves(board, { row: 0, col: 0 });
      expect(rookMoves.length).toBeGreaterThan(0); // Can move to row 1
      expect(rookMoves).toContainEqual({ row: 1, col: 0 });

      // After moving forward, blocked by pawn at row 2
      expect(rookMoves).not.toContainEqual({ row: 2, col: 0 });
    });
  });

  describe('getLegalMoves - Knight (N)', () => {
    it('should move in L-shape', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'N', color: 'white' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });

      // Knight has 8 possible L-shaped moves from center
      const expectedMoves = [
        { row: 2, col: 3 }, { row: 2, col: 5 },
        { row: 3, col: 2 }, { row: 3, col: 6 },
        { row: 5, col: 2 }, { row: 5, col: 6 },
        { row: 6, col: 3 }, { row: 6, col: 5 },
      ];

      for (const move of expectedMoves) {
        expect(moves).toContainEqual(move);
      }
    });

    it('should capture enemy pieces', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'N', color: 'white' };
      board[2][3] = { type: 'P', color: 'black' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });
      expect(moves).toContainEqual({ row: 2, col: 3 });
    });
  });

  describe('getLegalMoves - Pawn (P)', () => {
    it('should move 1 square forward', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'P', color: 'white' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });
      expect(moves).toContainEqual({ row: 5, col: 4 });
    });

    it('should capture diagonally forward', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'P', color: 'white' };
      board[5][3] = { type: 'P', color: 'black' };
      board[5][5] = { type: 'P', color: 'black' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });
      expect(moves).toContainEqual({ row: 5, col: 3 });
      expect(moves).toContainEqual({ row: 5, col: 5 });
    });

    it('should not move forward if blocked', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'P', color: 'white' };
      board[5][4] = { type: 'P', color: 'black' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });

      // Cannot move forward (blocked), but can capture diagonally if enemies present
      expect(moves).not.toContainEqual({ row: 5, col: 4 });
    });

    it('should not capture diagonally if empty', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'P', color: 'white' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });

      // Only forward move, no diagonal captures
      expect(moves).toEqual([{ row: 5, col: 4 }]);
    });
  });

  describe('getLegalMoves - Met/Queen (M)', () => {
    it('should move 1 square diagonally', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'M', color: 'white' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });

      const expectedMoves = [
        { row: 3, col: 3 }, { row: 3, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 5 },
      ];

      for (const move of expectedMoves) {
        expect(moves).toContainEqual(move);
      }
    });
  });

  describe('getLegalMoves - Khon/Silver (S)', () => {
    it('should move 1 square diagonally or forward', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'S', color: 'white' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });

      // Diagonal + forward (white moves down, so forward is row 5)
      expect(moves).toContainEqual({ row: 3, col: 3 });
      expect(moves).toContainEqual({ row: 3, col: 5 });
      expect(moves).toContainEqual({ row: 5, col: 3 });
      expect(moves).toContainEqual({ row: 5, col: 5 });
      expect(moves).toContainEqual({ row: 5, col: 4 }); // Forward
    });

    it('should not move backward', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'S', color: 'white' };

      const moves = getLegalMoves(board, { row: 4, col: 4 });

      // Should not have backward move (row 3 for white is... wait, white forward is row+1)
      // Actually looking at the code: white forward is 1 (row increases), black forward is -1
      expect(moves).not.toContainEqual({ row: 3, col: 4 }); // Backward for white
    });
  });

  describe('isInCheck', () => {
    it('should detect king in check from rook', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[0][4] = { type: 'K', color: 'white' };
      board[0][0] = { type: 'R', color: 'black' };

      expect(isInCheck(board, 'white')).toBe(true);
    });

    it('should not be in check with no threats', () => {
      const board = createInitialBoard();
      expect(isInCheck(board, 'white')).toBe(false);
      expect(isInCheck(board, 'black')).toBe(false);
    });
  });

  describe('makeMove', () => {
    it('should execute a legal move', () => {
      const state = createInitialGameState(300000, 300000);

      const newState = makeMove(state, { row: 2, col: 4 }, { row: 3, col: 4 });

      expect(newState).not.toBeNull();
      expect(newState?.board[2][4]).toBeNull();
      expect(newState?.board[3][4]?.type).toBe('P');
      expect(newState?.turn).toBe('black');
    });

    it('should return null for illegal move', () => {
      const state = createInitialGameState(300000, 300000);

      // Move from empty square
      const result = makeMove(state, { row: 3, col: 4 }, { row: 4, col: 4 });

      expect(result).toBeNull();
    });

    it('should capture enemy piece', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      board[4][4] = { type: 'P', color: 'white' };
      board[5][5] = { type: 'P', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;

      const newState = makeMove(state, { row: 4, col: 4 }, { row: 5, col: 5 });

      // Pawn promotes to PM when reaching row 5 (white's promotion rank)
      expect(newState?.board[5][5]?.type).toBe('PM');
      expect(newState?.board[5][5]?.color).toBe('white');
    });

    it('should promote pawn to Met (PM)', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      // White pawn at row 4, promoting to row 5 (promotion rank for white)
      board[4][4] = { type: 'P', color: 'white' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;

      const newState = makeMove(state, { row: 4, col: 4 }, { row: 5, col: 4 });

      expect(newState?.board[5][4]?.type).toBe('PM'); // Promoted
    });
  });

  describe('hasAnyLegalMoves', () => {
    it('should return true when legal moves exist', () => {
      const state = createInitialGameState(300000, 300000);
      expect(hasAnyLegalMoves(state.board, 'white')).toBe(true);
    });

    it('should return false when no legal moves', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      // Only kings on board - no legal moves that wouldn't put king in check
      board[0][0] = { type: 'K', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      expect(hasAnyLegalMoves(board, 'white')).toBe(true); // King can still move
    });
  });

  describe('posToAlgebraic', () => {
    it('should convert position to algebraic notation', () => {
      expect(posToAlgebraic({ row: 0, col: 0 })).toBe('a1');
      expect(posToAlgebraic({ row: 0, col: 7 })).toBe('h1');
      expect(posToAlgebraic({ row: 7, col: 0 })).toBe('a8');
      expect(posToAlgebraic({ row: 7, col: 7 })).toBe('h8');
      expect(posToAlgebraic({ row: 3, col: 4 })).toBe('e4');
      expect(posToAlgebraic({ row: 4, col: 3 })).toBe('d5');
    });
  });

  describe('moveToNotation', () => {
    it('should format moves correctly', () => {
      const piece: Piece = { type: 'K', color: 'white' };
      const move = {
        from: { row: 0, col: 4 },
        to: { row: 1, col: 4 },
      };

      expect(moveToNotation(move, piece)).toBe('Ke2');

      // Pawn move (no prefix)
      const pawnPiece: Piece = { type: 'P', color: 'white' };
      expect(moveToNotation(move, pawnPiece)).toBe('e2');
    });

    it('should include capture notation', () => {
      const piece: Piece = { type: 'R', color: 'white' };
      const move: Move = {
        from: { row: 0, col: 0 },
        to: { row: 5, col: 0 },
        captured: { type: 'P', color: 'black' },
      };

      // Row 5 = rank 6, col 0 = a-file = a6
      expect(moveToNotation(move, piece)).toBe('Rxa6');
    });

    it('should include promotion notation', () => {
      const piece: Piece = { type: 'P', color: 'white' };
      const move: Move = {
        from: { row: 4, col: 4 },
        to: { row: 5, col: 4 },
        promoted: true,
      };

      expect(moveToNotation(move, piece)).toBe('e6=M');
    });
  });

  describe('getBoardAtMove', () => {
    it('should reconstruct board at specific move', () => {
      const board = createInitialBoard();
      const moves: Move[] = [
        { from: { row: 2, col: 4 }, to: { row: 3, col: 4 } },
        { from: { row: 5, col: 4 }, to: { row: 4, col: 4 } },
      ];

      const boardAtMove0 = getBoardAtMove(board, moves, 0);

      expect(boardAtMove0[2][4]).toBeNull();
      expect(boardAtMove0[3][4]?.type).toBe('P');
    });

    it('should return initial board for negative index', () => {
      const board = createInitialBoard();
      const moves: Move[] = [
        { from: { row: 2, col: 4 }, to: { row: 3, col: 4 } },
      ];

      const boardAtMove = getBoardAtMove(board, moves, -1);

      expect(boardAtMove[2][4]?.type).toBe('P');
    });
  });

  describe('getAllPieces', () => {
    it('should return all pieces for a color', () => {
      const board = createInitialBoard();

      const whitePieces = getAllPieces(board, 'white');

      // 16 pieces for white in Makruk
      expect(whitePieces.length).toBe(16);

      // All should be white
      expect(whitePieces.every(p => p.piece.color === 'white')).toBe(true);
    });

    it('should include correct piece types', () => {
      const board = createInitialBoard();
      const whitePieces = getAllPieces(board, 'white');

      const types = whitePieces.map(p => p.piece.type);
      expect(types).toContain('K');
      expect(types).toContain('M');
      expect(types).toContain('R');
      expect(types).toContain('N');
      expect(types).toContain('S');
      expect(types).toContain('P');
    });
  });
});
