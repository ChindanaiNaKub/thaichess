import { describe, expect, it } from 'vitest';

import { PUZZLES, type Puzzle } from '@shared/puzzles';
import { validatePuzzle, validatePuzzles } from '@shared/puzzleValidation';
import { createGameStateFromPuzzle, getForcingMoves } from '@shared/puzzleSolver';
import type { Board, Piece, PieceColor, PieceType } from '@shared/types';

function p(type: PieceType, color: PieceColor): Piece {
  return { type, color };
}

function emptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

describe('puzzleValidation', () => {
  it('accepts the built-in puzzle set', () => {
    const results = validatePuzzles(PUZZLES);

    expect(results.every(result => result.errors.length === 0)).toBe(true);
  });

  it('rejects puzzles with multiple winning first moves', () => {
    const board = emptyBoard();
    board[7][0] = p('K', 'black');
    board[5][1] = p('K', 'white');
    board[6][2] = p('R', 'white');
    board[6][3] = p('R', 'white');

    const puzzle: Puzzle = {
      id: 999,
      title: 'Ambiguous Double Rua',
      description: 'Two rooks can both mate, so this should not be publishable.',
      explanation: 'Either rook can climb to the back rank, which makes the first move ambiguous.',
      source: 'test fixture',
      theme: 'Checkmate',
      difficulty: 'beginner',
      toMove: 'white',
      board,
      solution: [{ from: { row: 6, col: 2 }, to: { row: 7, col: 2 } }],
    };

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Puzzle has multiple winning first moves: c7-c8, d7-d8.');

    const forcingMoves = getForcingMoves(createGameStateFromPuzzle(puzzle), puzzle);
    expect(forcingMoves).toHaveLength(2);
  });

  it('exposes the canonical puzzle start as a forcing move', () => {
    const puzzle = PUZZLES.find(candidate => candidate.id === 3);
    expect(puzzle).toBeDefined();

    const forcingMoves = getForcingMoves(createGameStateFromPuzzle(puzzle!), puzzle!);

    expect(forcingMoves).toHaveLength(1);
    expect(forcingMoves[0]).toMatchObject(puzzle!.solution[0]);
  });

  it('rejects puzzle lines that try to capture the king directly', () => {
    const board = emptyBoard();
    board[0][0] = p('K', 'white');
    board[6][4] = p('R', 'white');
    board[7][4] = p('K', 'black');

    const puzzle: Puzzle = {
      id: 1000,
      title: 'Illegal King Capture',
      description: 'This puzzle line incorrectly ends by taking the king directly.',
      explanation: 'A valid Makruk puzzle must finish with checkmate or another legal ending, never by capturing the king.',
      source: 'test fixture',
      theme: 'Checkmate',
      difficulty: 'beginner',
      toMove: 'white',
      board,
      solution: [{ from: { row: 6, col: 4 }, to: { row: 7, col: 4 } }],
    };

    const result = validatePuzzle(puzzle);
    const forcingMoves = getForcingMoves(createGameStateFromPuzzle(puzzle), puzzle);

    expect(result.errors).toContain('First solution move is illegal in the starting position.');
    expect(forcingMoves).toHaveLength(0);
  });
});
