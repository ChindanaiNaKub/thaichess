import { describe, expect, it } from 'vitest';
import { parseBrowserEngineAnalysisLines } from '../lib/browserEngineAnalysis';

describe('browser engine analysis', () => {
  it('parses score, pv, stats, and best move from Fairy-Stockfish output', () => {
    const result = parseBrowserEngineAnalysisLines([
      'info depth 7 seldepth 9 score cp -34 nodes 12345 nps 456789 pv b1d2 d8c7 c1c2',
      'bestmove b1d2 ponder d8c7',
    ]);

    expect(result).toEqual({
      evaluation: -34,
      mate: null,
      bestMove: {
        from: { row: 0, col: 1 },
        to: { row: 1, col: 3 },
      },
      principalVariation: ['b1d2', 'd8c7', 'c1c2'],
      stats: {
        source: 'local',
        depth: 7,
        selDepth: 9,
        nodes: 12345,
        nps: 456789,
      },
    });
  });

  it('parses mate scores and omits invalid best moves', () => {
    const result = parseBrowserEngineAnalysisLines([
      'info depth 4 score mate 2 nodes 300 pv a1a2',
      'bestmove (none)',
    ]);

    expect(result.evaluation).toBe(0);
    expect(result.mate).toBe(2);
    expect(result.bestMove).toBeNull();
    expect(result.principalVariation).toEqual(['a1a2']);
    expect(result.stats).toMatchObject({
      source: 'local',
      depth: 4,
      nodes: 300,
    });
  });
});
