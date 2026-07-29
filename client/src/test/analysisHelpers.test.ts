import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialBoard } from '@shared/engine';
import {
  analysisPositionHash,
  deserializeAnalysisPosition,
  serializeAnalysisPosition,
  uciToMove,
} from '@shared/engineAdapter';
import type { CountingState } from '@shared/types';
import { buildEditorAnalysisRoute, buildInlineAnalysisRoute, readInlineAnalysisPayload } from '../lib/analysis';

const sampleCounting = (currentCount: number): CountingState => ({
  active: true,
  type: 'board_honor',
  countingColor: 'white',
  strongerColor: 'white',
  currentCount,
  limit: 64,
  finalAttackPending: false,
});


describe('analysis helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('round-trips the serialized editor position', () => {
    const serialized = serializeAnalysisPosition({
      board: createInitialBoard(),
      turn: 'black',
      counting: null,
    });

    const parsed = deserializeAnalysisPosition(serialized.position, serialized.counting);

    expect(parsed?.turn).toBe('black');
    expect(parsed?.board[0][0]?.type).toBe('R');
    expect(parsed?.board[7][4]?.type).toBe('K');
  });

  it('builds inline analysis routes with a short payload key instead of embedding moves', () => {
    const route = buildInlineAnalysisRoute({
      source: 'bot',
      moves: [
        { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } },
      ],
      result: 'draw',
      reason: 'stalemate',
    });
    const params = new URLSearchParams(route.split('?')[1]);
    const payloadKey = params.get('payload');

    expect(route).toContain('/analysis/bot?');
    expect(route).toContain('source=bot');
    expect(route).not.toContain('moves=');
    expect(route).toContain('result=draw');
    expect(payloadKey).toBeTruthy();
    expect(readInlineAnalysisPayload(payloadKey!)).toMatchObject({
      source: 'bot',
      result: 'draw',
      reason: 'stalemate',
      moves: [
        { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } },
      ],
    });
  });

  it('builds editor routes with a serialized position', () => {
    const route = buildEditorAnalysisRoute({
      board: createInitialBoard(),
      turn: 'white',
      counting: null,
    });

    expect(route).toContain('/analysis?mode=editor');
    expect(route).toContain('position=');
  });

  it('preserves promoted pawn ownership through position serialization', () => {
    const board = createInitialBoard();
    board[5][7] = { type: 'PM', color: 'white' };
    board[2][7] = { type: 'PM', color: 'black' };
    board[2][6] = null;
    board[5][6] = null;

    const serialized = serializeAnalysisPosition({
      board,
      turn: 'white',
      counting: null,
    });

    const parsed = deserializeAnalysisPosition(serialized.position, serialized.counting);

    expect(parsed?.board[5][7]).toEqual({ type: 'PM', color: 'white' });
    expect(parsed?.board[2][7]).toEqual({ type: 'PM', color: 'black' });
  });

  it('parses uci coordinates into board positions', () => {
    expect(uciToMove('a1a3')).toEqual({
      from: { row: 0, col: 0 },
      to: { row: 2, col: 0 },
    });
  });

  it('uses board+turn alone for position hash when counting is null', () => {
    const snapshot = {
      board: createInitialBoard(),
      turn: 'white' as const,
      counting: null,
    };
    const serialized = serializeAnalysisPosition(snapshot);
    expect(analysisPositionHash(snapshot)).toBe(serialized.position);
    expect(analysisPositionHash(snapshot)).not.toContain('#');
  });

  it('includes counting in position hash so different clocks do not collide', () => {
    const board = createInitialBoard();
    const base = { board, turn: 'white' as const };
    const withoutCounting = analysisPositionHash({ ...base, counting: null });
    const countA = analysisPositionHash({ ...base, counting: sampleCounting(10) });
    const countB = analysisPositionHash({ ...base, counting: sampleCounting(11) });

    expect(countA).not.toBe(withoutCounting);
    expect(countB).not.toBe(countA);
    expect(countA).toContain('#');
    expect(countA).toContain('"currentCount":10');
  });
});
