import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../../shared/engine';
import { moveToUci } from '../../../shared/engineAdapter';
import { getEngineSearchTimeoutMs, normalizeEngineFen } from '../fairyStockfishBinary';
import {
  createLevel10BotSearchPlan,
  getBotRequestTimeoutMs,
  getReviewMovetime,
  getReviewTotalBudgetMs,
  normalizeEngineEvaluation,
  resolveBotMoveCandidate,
  resolvePositionAnalysisResult,
} from '../engineGateway';

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
    }, 'bot')).toBe(900);

    expect(getEngineSearchTimeoutMs({
      variant: 'makruk',
      position: '8/8/8/8/8/8/8/8 w',
      search: { movetimeMs: 1200 },
    }, 'analysis')).toBe(2400);
  });

  it('allows deeper Level 10 bot depth searches enough time to finish', () => {
    expect(getEngineSearchTimeoutMs({
      variant: 'makruk',
      position: '8/8/8/8/8/8/8/8 b',
      search: { depth: 14 },
    }, 'bot')).toBe(4240);
  });

  it('keeps bot service request timeouts capped tightly by level', () => {
    expect(getBotRequestTimeoutMs(1)).toBe(900);
    expect(getBotRequestTimeoutMs(5)).toBe(1150);
    expect(getBotRequestTimeoutMs(10)).toBe(5200);
  });

  it('scales review movetime down for long games while preserving short-game quality', () => {
    expect(getReviewMovetime(10, 250)).toBe(250);
    expect(getReviewMovetime(77, 250)).toBe(153);
    expect(getReviewMovetime(200, 250)).toBe(60);
  });

  it('caps the full-game review budget for long games', () => {
    expect(getReviewTotalBudgetMs(10)).toBe(18000);
    expect(getReviewTotalBudgetMs(45)).toBe(18000);
    expect(getReviewTotalBudgetMs(82)).toBe(20760);
    expect(getReviewTotalBudgetMs(200)).toBe(40000);
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

  it('falls back to local position analysis when an engine review move is illegal', () => {
    const state = createInitialGameState(0, 0);
    const snapshot = {
      board: state.board,
      turn: state.turn,
      counting: state.counting,
    };

    const result = resolvePositionAnalysisResult(snapshot, { movetimeMs: 250 }, {
      bestMoveUci: 'a1h8',
      pvUci: ['a1h8'],
      evalCp: 1780,
      depth: 18,
    }, 'binary');

    expect(result.stats.source).toBe('local');
    expect(result.bestMove).not.toBeNull();
    expect(result.bestMove).not.toEqual({
      from: { row: 0, col: 0 },
      to: { row: 7, col: 7 },
    });
  });

  it('keeps legal engine review moves intact', () => {
    const state = createInitialGameState(0, 0);
    const snapshot = {
      board: state.board,
      turn: state.turn,
      counting: state.counting,
    };
    const legalMove = { from: { row: 0, col: 1 }, to: { row: 1, col: 3 } };

    const result = resolvePositionAnalysisResult(snapshot, { movetimeMs: 250 }, {
      bestMoveUci: moveToUci(legalMove),
      pvUci: [moveToUci(legalMove)],
      evalCp: 34,
      depth: 16,
    }, 'service');

    expect(result.stats.source).toBe('service');
    expect(result.bestMove).toEqual(legalMove);
  });

  it('normalizes engine evaluations to white perspective', () => {
    expect(normalizeEngineEvaluation(120, 'white')).toBe(120);
    expect(normalizeEngineEvaluation(120, 'black')).toBe(-120);
    expect(normalizeEngineEvaluation(-340, 'black')).toBe(340);
  });

  it('flips engine review scores when black is to move', () => {
    const state = createInitialGameState(0, 0);
    const snapshot = {
      board: state.board,
      turn: 'black' as const,
      counting: state.counting,
    };
    const legalMove = { from: { row: 5, col: 0 }, to: { row: 4, col: 0 } };

    const result = resolvePositionAnalysisResult(snapshot, { movetimeMs: 250 }, {
      bestMoveUci: moveToUci(legalMove),
      pvUci: [moveToUci(legalMove)],
      evalCp: 280,
      depth: 14,
    }, 'binary');

    expect(result.evaluation).toBe(-280);
    expect(result.bestMove).toEqual(legalMove);
  });

  it('forces deeper Level 10 search in check and endgame positions', () => {
    const inCheckState = createInitialGameState(0, 0);
    inCheckState.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    inCheckState.board[7][0] = { type: 'K', color: 'black' };
    inCheckState.board[3][3] = { type: 'R', color: 'black' };
    inCheckState.board[5][1] = { type: 'K', color: 'white' };
    inCheckState.board[6][2] = { type: 'S', color: 'white' };
    inCheckState.board[7][7] = { type: 'R', color: 'white' };
    inCheckState.turn = 'black';

    const inCheckPlan = createLevel10BotSearchPlan({
      board: inCheckState.board,
      turn: inCheckState.turn,
      counting: null,
    });

    expect(inCheckPlan.search).toEqual({ depth: 14 });
    expect(inCheckPlan.localValidation.maxDepth).toBeGreaterThanOrEqual(7);

    const endgameState = createInitialGameState(0, 0);
    endgameState.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    endgameState.board[0][0] = { type: 'K', color: 'white' };
    endgameState.board[2][2] = { type: 'R', color: 'white' };
    endgameState.board[7][7] = { type: 'K', color: 'black' };
    endgameState.turn = 'black';

    const endgamePlan = createLevel10BotSearchPlan({
      board: endgameState.board,
      turn: endgameState.turn,
      counting: null,
    });

    expect(endgamePlan.search).toEqual({ depth: 12 });
    expect(endgamePlan.localValidation.maxDepth).toBeGreaterThanOrEqual(6);
  });
});
