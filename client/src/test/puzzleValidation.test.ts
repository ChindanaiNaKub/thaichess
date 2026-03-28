import { describe, expect, it } from 'vitest';

import { ALL_PUZZLES, PUZZLES, QUARANTINED_PUZZLES, type Puzzle } from '@shared/puzzles';
import { IMPORTED_PUZZLE_CANDIDATES, createImportedPuzzleCandidate } from '@shared/puzzleImportQueue';
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

    expect(results.filter(result => result.errors.length > 0)).toEqual([]);
  });

  it('ships only the curated subset and keeps the rest quarantined', () => {
    expect(PUZZLES.map(puzzle => puzzle.id)).toEqual([1, 6, 8, 10, 12, 13, 15, 17, 19]);
    expect(QUARANTINED_PUZZLES.map(puzzle => puzzle.id)).toEqual([2, 3, 4, 5, 7, 9, 11, 14, 16, 18]);
    expect(PUZZLES).toHaveLength(9);
    expect(QUARANTINED_PUZZLES).toHaveLength(10);
    expect(ALL_PUZZLES).toHaveLength(19);
    expect(IMPORTED_PUZZLE_CANDIDATES).toHaveLength(0);
    expect(PUZZLES.every(puzzle => puzzle.reviewStatus === 'ship')).toBe(true);
    expect(QUARANTINED_PUZZLES.every(puzzle => puzzle.reviewStatus === 'quarantine')).toBe(true);
    expect(ALL_PUZZLES.every(puzzle => puzzle.motif.trim().length > 0)).toBe(true);
  });

  it('defaults imported puzzle candidates to quarantine', () => {
    const basePuzzle = PUZZLES.find(candidate => candidate.id === 15);
    expect(basePuzzle).toBeDefined();

    const { reviewStatus: _reviewStatus, ...draft } = {
      ...basePuzzle!,
      id: 9999,
      source: 'Generated candidate import',
    };

    const candidate = createImportedPuzzleCandidate(draft);

    expect(candidate.reviewStatus).toBe('quarantine');
    expect(candidate.id).toBe(9999);
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
      motif: 'Ambiguous rook mate',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
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
    const puzzle = PUZZLES.find(candidate => candidate.id === 15);
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
      motif: 'Illegal king capture',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      toMove: 'white',
      board,
      solution: [{ from: { row: 6, col: 4 }, to: { row: 7, col: 4 } }],
    };

    const result = validatePuzzle(puzzle);
    const forcingMoves = getForcingMoves(createGameStateFromPuzzle(puzzle), puzzle);

    expect(result.errors).toContain('Starting position is illegal: the non-moving side is already in check.');
    expect(forcingMoves).toHaveLength(0);
  });

  it('rejects positions where the non-moving side is already in check', () => {
    const board = emptyBoard();
    board[0][3] = p('K', 'black');
    board[2][3] = p('K', 'white');
    board[1][2] = p('M', 'white');
    board[2][4] = p('M', 'white');

    const puzzle: Puzzle = {
      id: 1001,
      title: 'Broken Double Met Mate',
      description: 'This should be rejected because Black is already in check before White moves.',
      explanation: 'A legal puzzle cannot start with the non-moving side already in check.',
      source: 'test fixture',
      theme: 'Checkmate',
      motif: 'Illegal start in check',
      difficulty: 'beginner',
      reviewStatus: 'quarantine',
      toMove: 'white',
      board,
      solution: [{ from: { row: 2, col: 4 }, to: { row: 1, col: 3 } }],
    };

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Starting position is illegal: the non-moving side is already in check.');
  });

  it('accepts tactical puzzles that win material cleanly', () => {
    const puzzle = PUZZLES.find(candidate => candidate.id === 12);
    expect(puzzle).toBeDefined();

    const result = validatePuzzle(puzzle!);
    const forcingMoves = getForcingMoves(createGameStateFromPuzzle(puzzle!), puzzle!);

    expect(result.errors).toEqual([]);
    expect(forcingMoves).toHaveLength(1);
    expect(forcingMoves[0]).toMatchObject(puzzle!.solution[0]);
  });

  it('rejects checkmate puzzles whose description says the wrong mate length', () => {
    const basePuzzle = PUZZLES.find(candidate => candidate.id === 15);
    expect(basePuzzle).toBeDefined();

    const puzzle: Puzzle = {
      ...basePuzzle!,
      description: 'Mate in 1. Pivot the rook first, then drop to the back rank.',
    };

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Checkmate puzzle description must say "Mate in 2".');
  });

  it('rejects promotion puzzles whose copy never mentions promotion', () => {
    const basePuzzle = ALL_PUZZLES.find(candidate => candidate.id === 7);
    expect(basePuzzle).toBeDefined();

    const puzzle: Puzzle = {
      ...basePuzzle!,
      title: 'Supported Advance',
      description: 'Push the pawn safely with king support.',
      explanation: 'A single quiet step is enough because the king controls the key squares.',
    };

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Promotion puzzle copy must mention promotion.');
  });

  it('rejects tactical puzzles whose copy does not explain the material win', () => {
    const basePuzzle = PUZZLES.find(candidate => candidate.id === 10);
    expect(basePuzzle).toBeDefined();

    const puzzle: Puzzle = {
      ...basePuzzle!,
      title: 'Open Lane',
      description: 'Use the file efficiently.',
      explanation: 'The line is clean and the move is the important idea here.',
    };

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain('Tactical puzzle copy must say that the line wins or captures something.');
    expect(result.errors).toContain('Tactical puzzle copy must name the material target or mention material gain.');
  });
});
