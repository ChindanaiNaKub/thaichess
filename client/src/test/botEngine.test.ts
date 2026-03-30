import { describe, expect, it } from 'vitest';

import { getLegalMoves, createInitialGameState } from '@shared/engine';
import { getBotLevelConfig, getBotMoveForLevel } from '@shared/botEngine';

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
});
