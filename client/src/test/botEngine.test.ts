import { describe, expect, it } from 'vitest';

import type { Board, GameState, PieceColor, PieceType } from '@shared/types';
import { getLegalMoves, createInitialGameState } from '@shared/engine';
import { getBotLevelConfig, getBotMoveForLevel, shouldUseExternalEngineForBot } from '@shared/botEngine';

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function square(name: string) {
  return {
    col: name.charCodeAt(0) - 97,
    row: Number.parseInt(name[1], 10) - 1,
  };
}

function buildState(
  turn: PieceColor,
  placements: [square: string, type: PieceType, color: PieceColor][],
): GameState {
  const state = createInitialGameState(0, 0);
  const board = emptyBoard();

  for (const [name, type, color] of placements) {
    const { row, col } = square(name);
    board[row][col] = { type, color };
  }

  return {
    ...state,
    board,
    turn,
    counting: null,
  };
}

describe('botEngine', () => {
  it('returns a legal move for every live bot level from the initial position', () => {
    const state = createInitialGameState(0, 0);

    for (let level = 1; level <= 10; level += 1) {
      const move = getBotMoveForLevel(state, level);
      expect(move).not.toBeNull();

      const legalMoves = getLegalMoves(state.board, move!.from);
      expect(legalMoves).toContainEqual(move!.to);
    }
  });

  it('scales search configuration by level while keeping all levels bounded', () => {
    const beginner = getBotLevelConfig(1);
    const expert = getBotLevelConfig(10);

    expect(beginner.maxDepth).toBeLessThanOrEqual(expert.maxDepth);
    expect(beginner.maxNodes).toBeLessThan(expert.maxNodes);
    expect(beginner.maxMs).toBeLessThan(expert.maxMs);
    expect(expert.maxMs).toBeLessThanOrEqual(180);
  });

  it('keeps the external engine reserved for Level 10', () => {
    expect(shouldUseExternalEngineForBot(9)).toBe(false);
    expect(shouldUseExternalEngineForBot(10)).toBe(true);
  });

  it('still returns a legal move when forced into an extremely small local search budget', () => {
    const state = createInitialGameState(0, 0);
    const move = getBotMoveForLevel(state, 10, {
      maxDepth: 3,
      maxNodes: 1,
      maxMs: 1,
    });

    expect(move).not.toBeNull();

    const legalMoves = getLegalMoves(state.board, move!.from);
    expect(legalMoves).toContainEqual(move!.to);
  });

  it('finds the forced rook interposition when Level 10 must defend mate', () => {
    const state = buildState('black', [
      ['a8', 'K', 'black'],
      ['d4', 'R', 'black'],
      ['b6', 'K', 'white'],
      ['c7', 'S', 'white'],
      ['h8', 'R', 'white'],
    ]);

    const move = getBotMoveForLevel(state, 10);

    expect(move).toEqual({
      from: square('d4'),
      to: square('d8'),
    });
  });

  it('takes an immediate draw by capturing the checking rook in a lost endgame', () => {
    const state = buildState('black', [
      ['a8', 'K', 'black'],
      ['c6', 'K', 'white'],
      ['a7', 'R', 'white'],
    ]);

    const move = getBotMoveForLevel(state, 10);

    expect(move).toEqual({
      from: square('a8'),
      to: square('a7'),
    });
  });
});
