import { describe, expect, it } from 'vitest';
import { createInitialGameState, makeMove } from '@shared/engine';

import {
  classifyMaterialTheme,
  createDefaultGenerationSource,
  generatePuzzleCandidateDraftsFromMoveSequence,
} from '@shared/puzzleGeneration';
import {
  createConstructedPuzzleSource,
  parsePgnLikePuzzleSources,
} from '@shared/puzzleSourceImport';
import type { Board, Piece, PieceColor, PieceType, Position } from '@shared/types';

function p(type: PieceType, color: PieceColor): Piece {
  return { type, color };
}

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function square(name: string): Position {
  return {
    col: name.charCodeAt(0) - 97,
    row: parseInt(name[1], 10) - 1,
  };
}

describe('puzzleGeneration', () => {
  it('rejects arbitrary custom start boards without a replay-backed setup', () => {
    const generated = generatePuzzleCandidateDraftsFromMoveSequence({
      id: 'fixture-arbitrary-board',
      source: 'fixture import',
      moves: [
        { from: square('a2'), to: square('a8') },
      ],
      initialBoard: emptyBoard(),
      startingTurn: 'white',
    }, {
      startingId: 9000,
      minPlies: 1,
      maxPlies: 1,
      maxCandidates: 1,
      minSourceMoves: 1,
    });

    expect(generated).toHaveLength(0);
  });

  it('derives constructed source positions from legal setup moves', () => {
    const source = createConstructedPuzzleSource({
      id: 'constructed-shell',
      source: 'Constructed shell',
      setupMoves: [
        { from: square('a3'), to: square('a4') },
        { from: square('a6'), to: square('a5') },
      ],
      moves: [
        { from: square('b1'), to: square('c3') },
        { from: square('b8'), to: square('c6') },
        { from: square('c3'), to: square('b5') },
      ],
    });

    expect(source.positionSourceType).toBe('constructed');
    expect(source.startingTurn).toBe('white');
    expect(source.initialBoard?.[3]?.[0]).toMatchObject({ type: 'P', color: 'white' });
    expect(source.initialBoard?.[4]?.[0]).toMatchObject({ type: 'P', color: 'black' });
  });

  it('rejects replay-backed setup boards that flip a promoted pawn to the wrong side', () => {
    const setupMoves = [
      { from: square('g3'), to: square('g4') },
      { from: square('h6'), to: square('h5') },
      { from: square('g4'), to: square('h5') },
      { from: square('a6'), to: square('a5') },
      { from: square('h5'), to: square('h6') },
    ];

    let state = createInitialGameState(0, 0);
    for (const move of setupMoves) {
      const nextState = makeMove(state, move.from, move.to);
      expect(nextState).not.toBeNull();
      state = nextState!;
    }

    const mismatchedBoard = state.board.map(row => row.map(cell => (cell ? { ...cell } : null)));
    mismatchedBoard[5][7] = { type: 'PM', color: 'black' };

    expect(() => createConstructedPuzzleSource({
      id: 'bad-promotion-owner',
      source: 'Constructed promotion mismatch',
      setupMoves,
      initialBoard: mismatchedBoard,
      moves: [],
    })).toThrow(/legal replayable setup/i);
  });

  it('respects the minimum source move cutoff', () => {
    const source = createDefaultGenerationSource(
      'too-short',
      'fixture import',
      [
        { from: square('a3'), to: square('a4') },
        { from: square('h6'), to: square('h5') },
      ],
    );

    const generated = generatePuzzleCandidateDraftsFromMoveSequence(source, {
      minSourceMoves: 3,
      minPlies: 3,
      maxPlies: 3,
    });

    expect(generated).toHaveLength(0);
  });

  it('classifies Makruk forks when a knight attacks the king and material together', () => {
    const board = emptyBoard();
    board[square('a1').row][square('a1').col] = p('K', 'white');
    board[square('e4').row][square('e4').col] = p('N', 'white');
    board[square('e8').row][square('e8').col] = p('K', 'black');
    board[square('h5').row][square('h5').col] = p('R', 'black');

    const theme = classifyMaterialTheme(board, 'white', [
      { from: square('e4'), to: square('f6') },
    ]);

    expect(theme).toBe('Fork');
  });

  it('classifies Makruk pins when a rook freezes a piece against the king', () => {
    const board = emptyBoard();
    board[square('a1').row][square('a1').col] = p('K', 'white');
    board[square('a2').row][square('a2').col] = p('R', 'white');
    board[square('e7').row][square('e7').col] = p('N', 'black');
    board[square('e8').row][square('e8').col] = p('K', 'black');

    const theme = classifyMaterialTheme(board, 'white', [
      { from: square('a2'), to: square('e2') },
    ]);

    expect(theme).toBe('Pin');
  });

  it('classifies rook overloads as DoubleAttack when a non-knight attacks king and material together', () => {
    const board = emptyBoard();
    board[square('a1').row][square('a1').col] = p('K', 'white');
    board[square('a2').row][square('a2').col] = p('R', 'white');
    board[square('e8').row][square('e8').col] = p('K', 'black');
    board[square('h2').row][square('h2').col] = p('R', 'black');

    const theme = classifyMaterialTheme(board, 'white', [
      { from: square('a2'), to: square('e2') },
      { from: square('e8'), to: square('f8') },
      { from: square('e2'), to: square('h2') },
    ]);

    expect(theme).toBe('DoubleAttack');
  });

  it('parses PGN-like coordinate imports into puzzle sources', () => {
    const sources = parsePgnLikePuzzleSources(`
[Game "seed-miniature"]
[Source "Seed game corpus: import-smoke"]
[Result "1-0"]
[ResultReason "checkmate"]
[MoveCount "24"]
[StartingPly "9"]

1. a2-a3 h7-h6 2. a3-a4 h6-h5
    `);

    expect(sources).toHaveLength(1);
    expect(sources[0]?.id).toBe('seed-miniature');
    expect(sources[0]?.source).toBe('Seed game corpus: import-smoke');
    expect(sources[0]?.startingPlyNumber).toBe(9);
    expect(sources[0]?.moves).toHaveLength(4);
  });
});
