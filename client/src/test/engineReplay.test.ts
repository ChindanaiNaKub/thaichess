import { describe, expect, it } from 'vitest';
import { createInitialGameState, getPositionAtPly, makeMove, startCounting } from '@shared/engine';
import { serializeBoardPosition } from '@shared/engineAdapter';

describe('getPositionAtPly', () => {
  it('reconstructs the exact official position and side to move for each ply', () => {
    const initial = createInitialGameState(0, 0);
    const afterWhite = makeMove(initial, { row: 2, col: 0 }, { row: 3, col: 0 });
    if (!afterWhite) throw new Error('sample white move failed');
    const afterBlack = makeMove(afterWhite, { row: 5, col: 0 }, { row: 4, col: 0 });
    if (!afterBlack) throw new Error('sample black move failed');

    expect(serializeBoardPosition(getPositionAtPly(afterBlack.moveHistory, -1).board))
      .toBe(serializeBoardPosition(initial.board));
    expect(serializeBoardPosition(getPositionAtPly(afterBlack.moveHistory, 0).board))
      .toBe(serializeBoardPosition(afterWhite.board));
    expect(serializeBoardPosition(getPositionAtPly(afterBlack.moveHistory, 1).board))
      .toBe(serializeBoardPosition(afterBlack.board));

    expect(getPositionAtPly(afterBlack.moveHistory, -1).turn).toBe('white');
    expect(getPositionAtPly(afterBlack.moveHistory, 0).turn).toBe('black');
    expect(getPositionAtPly(afterBlack.moveHistory, 1).turn).toBe('white');
  });

  it('preserves Makruk counting state when replaying official moves', () => {
    let state = createInitialGameState(0, 0);
    state.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    state.board[0][3] = { type: 'K', color: 'white' };
    state.board[7][4] = { type: 'K', color: 'black' };
    state.board[4][3] = { type: 'R', color: 'white' };
    state.turn = 'white';
    state.counting = {
      active: false,
      type: 'board_honor',
      countingColor: 'white',
      strongerColor: 'white',
      currentCount: 0,
      startCount: 0,
      limit: 64,
      finalAttackPending: false,
    };

    const countingStarted = startCounting(state);
    if (!countingStarted) throw new Error('counting should start');
    const afterMove = makeMove(countingStarted, { row: 4, col: 3 }, { row: 4, col: 4 });
    if (!afterMove) throw new Error('sample counting move failed');

    const replayed = getPositionAtPly(afterMove.moveHistory, 0, countingStarted);
    expect(replayed.turn).toBe(afterMove.turn);
    expect(replayed.counting?.active).toBe(true);
    expect(replayed.counting?.currentCount).toBe(afterMove.counting?.currentCount);
    expect(serializeBoardPosition(replayed.board)).toBe(serializeBoardPosition(afterMove.board));
  });
});
