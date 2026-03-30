import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../../shared/engine';
import { getEngineSearchTimeoutMs, normalizeEngineFen } from '../fairyStockfishBinary';
import { getReviewMovetime, resolveBotMoveCandidate } from '../engineGateway';

describe('normalizeEngineFen', () => {
  it('expands compact board-and-turn positions into full engine fen', () => {
    expect(normalizeEngineFen('rnsmksnr/8/pppppppp/8/8/PPPPPPPP/RNSKMSNR w'))
      .toBe('rnsmksnr/8/pppppppp/8/8/PPPPPPPP/RNSKMSNR w - - 0 1');
  });

  it('keeps full fen strings unchanged', () => {
    expect(normalizeEngineFen('8/8/8/8/8/8/8/8 b - - 0 1'))
      .toBe('8/8/8/8/8/8/8/8 b - - 0 1');
  });

  it('uses a much tighter timeout budget for bot movetime searches', () => {
    expect(getEngineSearchTimeoutMs({
      variant: 'makruk',
      position: '8/8/8/8/8/8/8/8 w',
      search: { movetimeMs: 400 },
    }, 'bot')).toBe(2000);

    expect(getEngineSearchTimeoutMs({
      variant: 'makruk',
      position: '8/8/8/8/8/8/8/8 w',
      search: { movetimeMs: 1200 },
    }, 'analysis')).toBe(6200);
  });

  it('scales review movetime down for long games while preserving short-game quality', () => {
    expect(getReviewMovetime(10, 250)).toBe(250);
    expect(getReviewMovetime(77, 250)).toBe(102);
    expect(getReviewMovetime(200, 250)).toBe(80);
  });

  it('falls back to the local bot when an engine move is missing or illegal', () => {
    const state = createInitialGameState(0, 0);
    const snapshot = {
      board: state.board,
      turn: state.turn,
      counting: state.counting,
    };

    const illegal = resolveBotMoveCandidate(snapshot, 9, {
      from: { row: 0, col: 0 },
      to: { row: 7, col: 0 },
    });

    expect(illegal.source).toBe('local');
    expect(illegal.move).not.toBeNull();

    const localMove = illegal.move!;
    const legal = resolveBotMoveCandidate(snapshot, 9, localMove);
    expect(legal.source).toBe('engine');
    expect(legal.move).toEqual(localMove);
  });
});
