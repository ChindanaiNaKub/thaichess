import { describe, expect, it } from 'vitest';
import { createInitialBoard } from '@shared/engine';
import { deserializeAnalysisPosition, serializeAnalysisPosition, uciToMove } from '@shared/engineAdapter';
import { buildEditorAnalysisRoute, buildInlineAnalysisRoute } from '../lib/analysis';

describe('analysis helpers', () => {
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

  it('builds inline analysis routes with source and moves', () => {
    const route = buildInlineAnalysisRoute({
      source: 'bot',
      moves: [],
      result: 'draw',
      reason: 'stalemate',
    });

    expect(route).toContain('/analysis/bot?');
    expect(route).toContain('source=bot');
    expect(route).toContain('result=draw');
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
});
