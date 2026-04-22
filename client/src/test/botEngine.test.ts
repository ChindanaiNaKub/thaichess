import { describe, expect, it } from 'vitest';

import type { Board, GameState, PieceColor, PieceType, Position } from '@shared/types';
import { getLegalMoves, createInitialGameState, makeMove } from '@shared/engine';
import { getBotLevelConfig, getBotMoveForLevel, shouldUseExternalEngineForBot } from '@shared/botEngine';
import { moveToUci } from '@shared/engineAdapter';

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

function getAllLegalMoves(state: GameState): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (!piece || piece.color !== state.turn) continue;

      for (const to of getLegalMoves(state.board, { row, col })) {
        moves.push({ from: { row, col }, to });
      }
    }
  }

  return moves;
}

function leavesRookCapturable(state: GameState, move: { from: Position; to: Position }): boolean {
  const nextState = makeMove(state, move.from, move.to);
  if (!nextState) return true;

  return getAllLegalMoves(nextState).some((reply) => {
    const captured = nextState.board[reply.to.row][reply.to.col];
    return captured?.color === state.turn && captured.type === 'R';
  });
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
  }, 15_000);

  it('scales search configuration by level while keeping all levels bounded', () => {
    const beginner = getBotLevelConfig(1);
    const expert = getBotLevelConfig(10);

    expect(beginner.maxDepth).toBeLessThanOrEqual(expert.maxDepth);
    expect(beginner.maxNodes).toBeLessThan(expert.maxNodes);
    expect(beginner.maxMs).toBeLessThan(expert.maxMs);
    expect(expert.maxMs).toBeLessThanOrEqual(700);
  });

  it('reserves the external engine for advanced, expert, and master bots', () => {
    expect(shouldUseExternalEngineForBot(7)).toBe(false);
    expect(shouldUseExternalEngineForBot(8)).toBe(true);
    expect(shouldUseExternalEngineForBot(9)).toBe(true);
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

  it('keeps high-level bots from grabbing pawns while leaving a rook en prise', () => {
    const state = buildState('white', [
      ['a1', 'K', 'white'],
      ['d1', 'R', 'white'],
      ['c3', 'N', 'white'],
      ['e3', 'S', 'white'],
      ['b3', 'M', 'white'],
      ['c4', 'P', 'white'],
      ['e4', 'P', 'white'],
      ['g4', 'P', 'white'],
      ['h8', 'K', 'black'],
      ['f2', 'N', 'black'],
      ['b5', 'P', 'black'],
      ['d5', 'P', 'black'],
      ['f5', 'P', 'black'],
      ['h5', 'P', 'black'],
      ['c5', 'S', 'black'],
      ['e5', 'M', 'black'],
      ['g5', 'N', 'black'],
    ]);

    const loosePawnGrab = { from: square('c4'), to: square('d5') };
    expect(leavesRookCapturable(state, loosePawnGrab)).toBe(true);

    for (const level of [8, 9, 10]) {
      const move = getBotMoveForLevel(state, level, {
        botId: level === 8 ? 'luang-prasert' : level === 9 ? 'chao-surasi' : 'lady-busaba',
        randomFn: () => 0.99,
      });

      expect(move, `level ${level} should find a legal move`).not.toBeNull();
      expect(moveToUci(move!)).not.toBe(moveToUci(loosePawnGrab));
      expect(leavesRookCapturable(state, move!)).toBe(false);
    }
  });
});
