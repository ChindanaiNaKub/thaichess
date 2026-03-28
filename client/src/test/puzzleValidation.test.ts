import { describe, expect, it } from 'vitest';

import { ALL_PUZZLES, PUZZLES, QUARANTINED_PUZZLES, isPuzzleReadyToShip, type Puzzle } from '@shared/puzzles';
import { IMPORTED_PUZZLE_CANDIDATES, createImportedPuzzleCandidate } from '@shared/puzzleImportQueue';
import { validatePuzzle, validatePuzzles } from '@shared/puzzleValidation';
import { createGameStateFromPuzzle, getForcingMoves } from '@shared/puzzleSolver';
import type { Board, Piece, PieceColor, PieceType, Position } from '@shared/types';

function p(type: PieceType, color: PieceColor): Piece {
  return { type, color };
}

function emptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

function square(name: string): Position {
  return {
    col: name.charCodeAt(0) - 97,
    row: parseInt(name[1], 10) - 1,
  };
}

function boardFromPlacements(...placements: Array<[string, PieceType, PieceColor]>): Board {
  const board = emptyBoard();

  for (const [name, type, color] of placements) {
    const { row, col } = square(name);
    board[row][col] = p(type, color);
  }

  return board;
}

function line(...steps: string[]): { from: Position; to: Position }[] {
  return steps.map(step => {
    const [from, to] = step.split('-');
    return {
      from: square(from),
      to: square(to),
    };
  });
}

describe('puzzleValidation', () => {
  it('accepts the built-in puzzle set', () => {
    const results = validatePuzzles(PUZZLES);

    expect(results.filter(result => result.errors.length > 0)).toEqual([]);
  });

  it('ships only the curated subset and keeps queued imports quarantined', () => {
    expect(PUZZLES.map(puzzle => puzzle.id)).toEqual([1, 6, 8, 10, 12, 13, 5001]);
    expect(IMPORTED_PUZZLE_CANDIDATES.map(puzzle => puzzle.id)).toEqual([1001, 1002, 1003, 1004, 1005, 5001]);
    expect(QUARANTINED_PUZZLES.map(puzzle => puzzle.id)).toEqual([
      2, 3, 4, 5, 7, 9, 11, 14, 15, 16, 17, 18, 19, 1001, 1002, 1003, 1004, 1005,
    ]);
    expect(PUZZLES).toHaveLength(7);
    expect(QUARANTINED_PUZZLES).toHaveLength(18);
    expect(ALL_PUZZLES).toHaveLength(25);
    expect(IMPORTED_PUZZLE_CANDIDATES).toHaveLength(6);
    expect(PUZZLES.every(puzzle => puzzle.reviewStatus === 'ship')).toBe(true);
    expect(PUZZLES.every(isPuzzleReadyToShip)).toBe(true);
    expect(QUARANTINED_PUZZLES.every(puzzle => puzzle.reviewStatus === 'quarantine')).toBe(true);
    expect(IMPORTED_PUZZLE_CANDIDATES.filter(puzzle => puzzle.reviewStatus === 'quarantine').every(puzzle => puzzle.reviewChecklist.themeClarity === 'unreviewed')).toBe(true);
    expect(IMPORTED_PUZZLE_CANDIDATES.filter(puzzle => puzzle.reviewStatus === 'ship').map(puzzle => puzzle.id)).toEqual([5001]);
    expect(ALL_PUZZLES.every(puzzle => puzzle.motif.trim().length > 0)).toBe(true);
  });

  it('defaults imported puzzle candidates to quarantine', () => {
    const basePuzzle = ALL_PUZZLES.find(candidate => candidate.id === 15);
    expect(basePuzzle).toBeDefined();

    const { reviewStatus: _reviewStatus, reviewChecklist: _reviewChecklist, ...draft } = {
      ...basePuzzle!,
      id: 9999,
      source: 'Generated candidate import',
    };

    const candidate = createImportedPuzzleCandidate(draft);

    expect(candidate.reviewStatus).toBe('quarantine');
    expect(candidate.reviewChecklist).toEqual({
      themeClarity: 'unreviewed',
      teachingValue: 'unreviewed',
      duplicateRisk: 'unreviewed',
      reviewNotes: '',
    });
    expect(isPuzzleReadyToShip(candidate)).toBe(false);
    expect(candidate.id).toBe(9999);
  });

  it('allows reviewed imported candidates to become ship-ready', () => {
    const basePuzzle = ALL_PUZZLES.find(candidate => candidate.id === 15);
    expect(basePuzzle).toBeDefined();

    const { reviewStatus: _reviewStatus, reviewChecklist: _reviewChecklist, ...draft } = {
      ...basePuzzle!,
      id: 10000,
      source: 'Generated candidate import',
    };

    const candidate = {
      ...createImportedPuzzleCandidate(draft),
      reviewStatus: 'ship' as const,
      reviewChecklist: {
        themeClarity: 'pass' as const,
        teachingValue: 'pass' as const,
        duplicateRisk: 'clear' as const,
        reviewNotes: 'Reviewed and approved for shipping.',
      },
    };

    expect(isPuzzleReadyToShip(candidate)).toBe(true);
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
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
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
    const puzzle = ALL_PUZZLES.find(candidate => candidate.id === 15);
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
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
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
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
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

  it('rejects tactical imports whose recorded target can escape on another defender reply', () => {
    const puzzle: Puzzle = {
      id: 5000,
      title: 'Real-Game Fork (8eb070e4 @ ply 14)',
      description: 'Win material in 2. Start with the fork that attacks the king and the rook.',
      explanation: 'The first move creates a double attack, and the follow-up wins the rook cleanly.',
      source: 'Exported rated game 8eb070e4 (ply 14)',
      theme: 'Fork',
      motif: 'Real-game fork candidate: wins rook',
      difficulty: 'intermediate',
      reviewStatus: 'quarantine',
      reviewChecklist: {
        themeClarity: 'unreviewed',
        teachingValue: 'unreviewed',
        duplicateRisk: 'unreviewed',
        reviewNotes: '',
      },
      toMove: 'black',
      board: boardFromPlacements(
        ['a1', 'R', 'white'],
        ['d1', 'K', 'white'],
        ['e1', 'M', 'white'],
        ['f1', 'S', 'white'],
        ['g1', 'N', 'white'],
        ['h1', 'R', 'white'],
        ['d2', 'S', 'white'],
        ['a3', 'P', 'white'],
        ['c3', 'N', 'white'],
        ['f3', 'P', 'white'],
        ['g3', 'P', 'white'],
        ['h3', 'P', 'white'],
        ['c4', 'P', 'white'],
        ['d4', 'N', 'black'],
        ['a6', 'P', 'black'],
        ['d6', 'P', 'black'],
        ['e6', 'P', 'black'],
        ['f6', 'P', 'black'],
        ['g6', 'P', 'black'],
        ['h6', 'P', 'black'],
        ['e7', 'N', 'black'],
        ['a8', 'R', 'black'],
        ['c8', 'S', 'black'],
        ['d8', 'M', 'black'],
        ['e8', 'K', 'black'],
        ['f8', 'S', 'black'],
        ['h8', 'R', 'black'],
      ),
      solution: line('d4-b3', 'd2-c1', 'b3-a1'),
    };

    const result = validatePuzzle(puzzle);

    expect(result.errors).toContain(
      'Tactical puzzle target is not consistently forced after defender reply a1-a2.',
    );
  });

  it('accepts trapped-piece imports when the same piece stays lost across defender replies', () => {
    const puzzle = IMPORTED_PUZZLE_CANDIDATES.find(candidate => candidate.id === 5001);
    expect(puzzle).toBeDefined();

    const result = validatePuzzle(puzzle!);

    expect(result.errors).toEqual([]);
  });

  it('rejects checkmate puzzles whose description says the wrong mate length', () => {
    const basePuzzle = ALL_PUZZLES.find(candidate => candidate.id === 15);
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
