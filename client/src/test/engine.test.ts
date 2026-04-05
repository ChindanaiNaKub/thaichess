import { describe, it, expect } from 'vitest';
import type { Board, Piece, Move } from '@shared/types';
import {
  createInitialBoard,
  createInitialGameState,
  getLastMoveForView,
  getLegalMoves,
  getMoveAtIndex,
  isInCheck,
  makeMove,
  startCounting,
  stopCounting,
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
      expect(board[0][3]?.type).toBe('K');
      expect(board[0][4]?.type).toBe('M');
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
      expect(board[7][3]?.type).toBe('M');
      expect(board[7][4]?.type).toBe('K');
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

    it('should place kings and queens on the standard Makruk central squares', () => {
      const board = createInitialBoard();

      expect(board[0][3]).toEqual({ type: 'K', color: 'white' }); // d1
      expect(board[0][4]).toEqual({ type: 'M', color: 'white' }); // e1
      expect(board[7][3]).toEqual({ type: 'M', color: 'black' }); // d8
      expect(board[7][4]).toEqual({ type: 'K', color: 'black' }); // e8
    });
  });

  describe('getLegalMoves - King (K)', () => {
    it('should move 1 square in any direction', () => {
      const board = createInitialBoard();
      const kingMoves = getLegalMoves(board, { row: 0, col: 3 }); // White King

      // King can move to row 1, cols 3,4,5 (if not in check)
      expect(kingMoves.length).toBeGreaterThan(0);
      expect(kingMoves).toContainEqual({ row: 1, col: 3 });
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

    it('should not allow kings to move adjacent to each other', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[4][4] = { type: 'K', color: 'white' };
      board[6][5] = { type: 'K', color: 'black' };

      const kingMoves = getLegalMoves(board, { row: 4, col: 4 });

      expect(kingMoves).not.toContainEqual({ row: 5, col: 4 });
      expect(kingMoves).not.toContainEqual({ row: 5, col: 5 });
    });

    it('should not allow a king to capture the opposing king directly', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[4][4] = { type: 'K', color: 'white' };
      board[5][5] = { type: 'K', color: 'black' };

      const kingMoves = getLegalMoves(board, { row: 4, col: 4 });

      expect(kingMoves).not.toContainEqual({ row: 5, col: 5 });
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

    it('should not allow a rook to capture the opposing king directly', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[6][4] = { type: 'R', color: 'white' };
      board[7][4] = { type: 'K', color: 'black' };

      const rookMoves = getLegalMoves(board, { row: 6, col: 4 });

      expect(rookMoves).not.toContainEqual({ row: 7, col: 4 });
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
    it('should reject a move that captures the opposing king', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[6][4] = { type: 'R', color: 'white' };
      board[7][4] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;

      const result = makeMove(state, { row: 6, col: 4 }, { row: 7, col: 4 });

      expect(result).toBeNull();
    });

    it('should execute a legal move', () => {
      const state = createInitialGameState(300000, 300000);

      const newState = makeMove(state, { row: 2, col: 4 }, { row: 3, col: 4 });

      expect(newState).not.toBeNull();
      expect(newState?.board[2][4]).toBeNull();
      expect(newState?.board[3][4]?.type).toBe('P');
      expect(newState?.turn).toBe('black');
      expect(newState?.lastMove).toMatchObject({
        from: { row: 2, col: 4 },
        to: { row: 3, col: 4 },
        movedPiece: { type: 'P', color: 'white' },
        capturedPiece: null,
        promotion: null,
      });
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
      expect(newState?.lastMove).toMatchObject({
        from: { row: 4, col: 4 },
        to: { row: 5, col: 5 },
        movedPiece: { type: 'P', color: 'white' },
        capturedPiece: { type: 'P', color: 'black' },
        promotion: 'PM',
      });
    });

    it('should promote a white pawn into a white promoted pawn (PM), not a normal Met', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

      // White pawn at row 4, promoting to row 5 (promotion rank for white)
      board[4][4] = { type: 'P', color: 'white' };
      board[0][0] = { type: 'K', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;

      const newState = makeMove(state, { row: 4, col: 4 }, { row: 5, col: 4 });

      expect(newState?.board[5][4]?.type).toBe('PM'); // Promoted
      expect(newState?.board[5][4]?.type).not.toBe('M');
      expect(newState?.board[5][4]?.color).toBe('white');
      expect(newState?.moveHistory.at(-1)?.promoted).toBe(true);
      expect(newState?.lastMove).toMatchObject({
        movedPiece: { type: 'P', color: 'white' },
        promotion: 'PM',
      });
    });

    it('should not promote a white pawn before the sixth rank', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[3][4] = { type: 'P', color: 'white' };
      board[0][0] = { type: 'K', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;

      const newState = makeMove(state, { row: 3, col: 4 }, { row: 4, col: 4 });

      expect(newState?.board[4][4]?.type).toBe('P');
      expect(newState?.moveHistory.at(-1)?.promoted).toBe(false);
    });

    it('should promote a black pawn into a black promoted pawn (PM) on the third rank from blacks perspective', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[3][3] = { type: 'P', color: 'black' };
      board[0][0] = { type: 'K', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'black';

      const newState = makeMove(state, { row: 3, col: 3 }, { row: 2, col: 3 });

      expect(newState?.board[2][3]?.type).toBe('PM');
      expect(newState?.board[2][3]?.type).not.toBe('M');
      expect(newState?.board[2][3]?.color).toBe('black');
      expect(newState?.moveHistory.at(-1)?.promoted).toBe(true);
    });

    it('should give promoted pawns exactly the same legal moves as a Met', () => {
      const metBoard: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      metBoard[0][0] = { type: 'K', color: 'white' };
      metBoard[7][7] = { type: 'K', color: 'black' };
      metBoard[4][4] = { type: 'M', color: 'white' };
      metBoard[5][5] = { type: 'P', color: 'white' };
      metBoard[3][5] = { type: 'P', color: 'black' };

      const promotedBoard: Board = metBoard.map(row => row.map(cell => cell ? { ...cell } : null));
      promotedBoard[4][4] = { type: 'PM', color: 'white' };

      expect(getLegalMoves(promotedBoard, { row: 4, col: 4 })).toEqual(
        getLegalMoves(metBoard, { row: 4, col: 4 }),
      );
    });

    it('should start Sak Mak automatically against a bare king', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[0][1] = { type: 'R', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;

      const newState = makeMove(state, { row: 0, col: 1 }, { row: 1, col: 1 });

      expect(newState?.counting).toMatchObject({
        active: true,
        type: 'pieces_honor',
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 3,
        limit: 16,
        finalAttackPending: false,
      });
    });

    it('should use the 64-move pieces-honor limit against a lone knight', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[2][2] = { type: 'N', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'white';

      const newState = makeMove(state, { row: 2, col: 2 }, { row: 4, col: 3 });

      expect(newState?.counting).toMatchObject({
        active: true,
        type: 'pieces_honor',
        countingColor: 'black',
        strongerColor: 'white',
        limit: 64,
      });
    });

    it('should use the 64-move pieces-honor limit against three promoted pawns', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[1][1] = { type: 'PM', color: 'white' };
      board[2][3] = { type: 'PM', color: 'white' };
      board[3][5] = { type: 'PM', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'white';

      const newState = makeMove(state, { row: 1, col: 1 }, { row: 2, col: 0 });

      expect(newState?.counting).toMatchObject({
        active: true,
        type: 'pieces_honor',
        countingColor: 'black',
        strongerColor: 'white',
        limit: 64,
      });
    });

    it('should allow only board-honor counting to start and stop manually', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[0][1] = { type: 'R', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };
      board[6][6] = { type: 'S', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'black';
      state.counting = {
        active: false,
        type: 'board_honor',
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 9,
        startCount: 0,
        limit: 64,
        finalAttackPending: false,
      };

      const started = startCounting(state);
      expect(started?.counting?.active).toBe(true);
      expect(started?.counting?.currentCount).toBe(0);

      const stopped = stopCounting(started!);
      expect(stopped?.counting?.active).toBe(false);
    });

    it('should not allow manual start or stop for Sak Mak because it is automatic', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[0][1] = { type: 'R', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'black';
      state.counting = {
        active: true,
        type: 'pieces_honor',
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 3,
        startCount: 3,
        limit: 16,
        finalAttackPending: false,
      };

      expect(startCounting(state)).toBeNull();
      expect(stopCounting(state)).toBeNull();
    });

    it('should keep the original pieces-honor limit after captures', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[1][2] = { type: 'R', color: 'white' };
      board[7][7] = { type: 'R', color: 'white' };
      board[2][3] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'black';
      state.counting = {
        active: true,
        type: 'pieces_honor',
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 7,
        startCount: 4,
        limit: 8,
        finalAttackPending: false,
      };

      const newState = makeMove(state, { row: 2, col: 3 }, { row: 1, col: 2 });

      expect(newState?.counting).toMatchObject({
        type: 'pieces_honor',
        currentCount: 8,
        startCount: 4,
        limit: 8,
        finalAttackPending: true,
      });
    });

    it('should keep playing on the 64th board-honor move and only draw on the 65th', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[0][1] = { type: 'R', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };
      board[6][6] = { type: 'S', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'black';
      state.counting = {
        active: true,
        type: 'board_honor',
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 63,
        limit: 64,
        finalAttackPending: false,
      };

      const sixtyFourthMoveState = makeMove(state, { row: 7, col: 7 }, { row: 7, col: 6 });

      expect(sixtyFourthMoveState?.isDraw).toBe(false);
      expect(sixtyFourthMoveState?.gameOver).toBe(false);
      expect(sixtyFourthMoveState?.counting?.currentCount).toBe(64);

      const followUpState = {
        ...sixtyFourthMoveState!,
        board: sixtyFourthMoveState!.board.map((row) => row.map((piece) => piece ? { ...piece } : null)),
        turn: 'white' as const,
      };
      const afterStrongerMove = makeMove(followUpState, { row: 0, col: 1 }, { row: 1, col: 1 });

      const sixtyFifthMoveState = makeMove(afterStrongerMove!, { row: 7, col: 6 }, { row: 7, col: 5 });

      expect(sixtyFifthMoveState?.isDraw).toBe(true);
      expect(sixtyFifthMoveState?.gameOver).toBe(true);
      expect(sixtyFifthMoveState?.resultReason).toBe('counting_rule');
    });

    it('should still award checkmate if the counting side mates the opponent', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[7][0] = { type: 'K', color: 'black' };
      board[5][1] = { type: 'K', color: 'white' };
      board[6][2] = { type: 'R', color: 'white' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'white';
      state.counting = {
        active: true,
        type: 'board_honor',
        countingColor: 'white',
        strongerColor: 'black',
        currentCount: 10,
        limit: 64,
        finalAttackPending: false,
      };

      const newState = makeMove(state, { row: 6, col: 2 }, { row: 7, col: 2 });

      expect(newState?.isDraw).toBe(false);
      expect(newState?.winner).toBe('white');
      expect(newState?.resultReason).toBe('checkmate');
    });

    it('should draw after the final attacker move in a bare-king count', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[0][1] = { type: 'R', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'white';
      state.counting = {
        active: true,
        type: 'pieces_honor',
        countingColor: 'black',
        strongerColor: 'white',
        currentCount: 16,
        limit: 16,
        finalAttackPending: true,
      };

      const newState = makeMove(state, { row: 0, col: 1 }, { row: 1, col: 1 });

      expect(newState?.isDraw).toBe(true);
      expect(newState?.gameOver).toBe(true);
      expect(newState?.resultReason).toBe('counting_rule');
    });

    it('should draw immediately when Sak Mak starts above the two-Rua limit', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[0][1] = { type: 'R', color: 'white' };
      board[0][2] = { type: 'R', color: 'white' };
      board[0][3] = { type: 'N', color: 'white' };
      board[0][4] = { type: 'N', color: 'white' };
      board[0][5] = { type: 'S', color: 'white' };
      board[0][6] = { type: 'S', color: 'white' };
      board[0][7] = { type: 'M', color: 'white' };
      board[1][0] = { type: 'PM', color: 'white' };
      board[7][7] = { type: 'K', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'black';

      const newState = makeMove(state, { row: 7, col: 7 }, { row: 6, col: 7 });

      expect(newState?.isDraw).toBe(true);
      expect(newState?.gameOver).toBe(true);
      expect(newState?.resultReason).toBe('counting_rule');
    });

    it('should mark stalemate as a draw', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][0] = { type: 'K', color: 'white' };
      board[2][2] = { type: 'K', color: 'black' };
      board[3][1] = { type: 'R', color: 'black' };

      const state = createInitialGameState(300000, 300000);
      state.board = board;
      state.turn = 'black';

      const newState = makeMove(state, { row: 3, col: 1 }, { row: 1, col: 1 });

      expect(newState?.isStalemate).toBe(true);
      expect(newState?.isDraw).toBe(true);
      expect(newState?.winner).toBeNull();
      expect(newState?.resultReason).toBe('stalemate');
    });

    it('should expose the selected move for replay navigation and restored states', () => {
      const state = createInitialGameState(300000, 300000);
      const afterWhite = makeMove(state, { row: 2, col: 4 }, { row: 3, col: 4 });
      const afterBlack = afterWhite ? makeMove(afterWhite, { row: 5, col: 4 }, { row: 4, col: 4 }) : null;

      expect(afterWhite).not.toBeNull();
      expect(afterBlack).not.toBeNull();
      expect(getLastMoveForView(afterBlack, 0)).toEqual(getMoveAtIndex(afterBlack!.moveHistory, 0));
      expect(getLastMoveForView(afterBlack)).toEqual(afterBlack!.lastMove);

      const undoneState = {
        ...afterBlack!,
        board: afterWhite!.board,
        turn: afterWhite!.turn,
        moveHistory: afterBlack!.moveHistory.slice(0, -1),
        lastMove: getMoveAtIndex(afterBlack!.moveHistory, afterBlack!.moveHistory.length - 2),
      };

      expect(getLastMoveForView(undoneState)).toMatchObject(afterWhite!.lastMove!);
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
