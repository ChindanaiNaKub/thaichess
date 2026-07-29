import { describe, expect, it } from 'vitest';
import { createInitialBoard, createInitialGameState, makeMove } from '@shared/engine';
import {
  applyBoardNavAction,
  emptyBoardSelection,
  findKingInCheckSquare,
  getCheckSquareForView,
  getDisplayBoardForView,
  getVisibleMovesForView,
  includesPosition,
  isEditableKeyboardTarget,
  isLiveViewIndex,
  isViewingHistoryIndex,
  matchBoardNavKey,
  scrubViewMoveIndex,
  selectBoardSquare,
  viewMoveIndexFromHistoryClick,
} from '../lib/boardSession';

describe('boardSession helpers', () => {
  it('matches board navigation keys', () => {
    expect(matchBoardNavKey('ArrowLeft')).toBe('back');
    expect(matchBoardNavKey('ArrowUp')).toBe('back');
    expect(matchBoardNavKey('ArrowRight')).toBe('forward');
    expect(matchBoardNavKey('ArrowDown')).toBe('forward');
    expect(matchBoardNavKey('Home')).toBe('start');
    expect(matchBoardNavKey('End')).toBe('end');
    expect(matchBoardNavKey('a')).toBeNull();
  });

  it('scrubs view indexes with liveNull semantics', () => {
    expect(scrubViewMoveIndex(null, 4, 'back')).toBe(2);
    expect(scrubViewMoveIndex(2, 4, 'forward')).toBe(null);
    expect(scrubViewMoveIndex(1, 4, 'forward')).toBe(2);
    expect(scrubViewMoveIndex(2, 4, 'start')).toBe(-1);
    expect(scrubViewMoveIndex(2, 4, 'end')).toBe(null);
  });

  it('scrubs view indexes with explicitIndex semantics', () => {
    expect(scrubViewMoveIndex(null, 4, 'forward', 'explicitIndex')).toBe(3);
    expect(scrubViewMoveIndex(2, 4, 'end', 'explicitIndex')).toBe(3);
  });

  it('resolves history clicks back to live on the latest ply', () => {
    expect(viewMoveIndexFromHistoryClick(3, 4)).toBeNull();
    expect(viewMoveIndexFromHistoryClick(1, 4)).toBe(1);
  });

  it('derives display board and visible moves from view index', () => {
    let state = createInitialGameState(10 * 60 * 1000, 10 * 60 * 1000);
    const first = makeMove(state, { row: 2, col: 0 }, { row: 3, col: 0 });
    expect(first).not.toBeNull();
    state = first!;

    expect(getDisplayBoardForView(state, null)).toBe(state.board);
    expect(getDisplayBoardForView(state, -1)).toEqual(createInitialBoard());
    expect(getVisibleMovesForView(state.moveHistory, -1)).toEqual([]);
    expect(getVisibleMovesForView(state.moveHistory, 0)).toHaveLength(1);
    expect(getVisibleMovesForView(state.moveHistory, null)).toHaveLength(1);
  });

  it('only reports check square on the live tip', () => {
    const board = createInitialBoard().map((row) => row.map(() => null));
    board[4][4] = { type: 'K', color: 'white' };
    const state = {
      board,
      turn: 'white' as const,
      isCheck: true,
      moveHistory: [
        { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } },
        { from: { row: 7, col: 0 }, to: { row: 6, col: 0 } },
      ],
    };

    expect(getCheckSquareForView(state, null)).toEqual({ row: 4, col: 4 });
    expect(getCheckSquareForView(state, 0)).toBeNull();
    expect(findKingInCheckSquare({ board: state.board, turn: 'white', isCheck: false })).toBeNull();
  });

  it('tracks live vs history view indexes', () => {
    expect(isLiveViewIndex(null, 5)).toBe(true);
    expect(isLiveViewIndex(4, 5)).toBe(true);
    expect(isViewingHistoryIndex(2, 5)).toBe(true);
  });

  it('builds board selection helpers', () => {
    const board = createInitialBoard();
    const selection = selectBoardSquare(board, { row: 2, col: 0 });
    expect(selection.selectedSquare).toEqual({ row: 2, col: 0 });
    expect(selection.legalMoves.length).toBeGreaterThan(0);
    expect(includesPosition(selection.legalMoves, selection.legalMoves[0])).toBe(true);
    expect(emptyBoardSelection()).toEqual({ selectedSquare: null, legalMoves: [] });
  });

  it('applies board nav actions and detects editable targets', () => {
    const calls: string[] = [];
    applyBoardNavAction('back', {
      onBack: () => calls.push('back'),
      onForward: () => calls.push('forward'),
      onStart: () => calls.push('start'),
      onEnd: () => calls.push('end'),
    });
    expect(calls).toEqual(['back']);

    const input = document.createElement('input');
    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(document.createElement('div'))).toBe(false);
  });
});
