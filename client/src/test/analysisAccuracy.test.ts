import { describe, expect, it } from 'vitest';
import type { Move } from '@shared/types';
import {
  analyzeGame,
  centipawnToWinPercent,
  classifyMove,
  computeAccuracy,
  formatEval,
  getMoveQualityWinPercents,
  moveAccuracyFromWinPercent,
  type AnalyzedMove,
} from '@shared/analysis';

function createMove(from: string, to: string): Move {
  return {
    from: { row: Number(from[1]) - 1, col: from.charCodeAt(0) - 97 },
    to: { row: Number(to[1]) - 1, col: to.charCodeAt(0) - 97 },
  };
}

function createAnalyzedMove(
  color: 'white' | 'black',
  moveAccuracy: number,
  winPercentBefore: number,
  winPercentAfter: number,
): AnalyzedMove {
  return {
    move: createMove('a1', 'a2'),
    moveIndex: 0,
    evalBefore: 0,
    evalAfter: 0,
    evalDelta: 0,
    winPercentBefore,
    winPercentAfter,
    moveAccuracy,
    bestMove: null,
    bestEval: 0,
    classification: classifyMove(moveAccuracy, moveAccuracy === 100),
    color,
  };
}

describe('analysis accuracy model', () => {
  it('maps equal centipawn scores to a neutral win percent', () => {
    expect(centipawnToWinPercent(0)).toBeCloseTo(50, 5);
    expect(centipawnToWinPercent(100000)).toBeGreaterThan(97);
    expect(centipawnToWinPercent(-100000)).toBeLessThan(3);
  });

  it('drops move accuracy as winning chances fall', () => {
    expect(moveAccuracyFromWinPercent(50, 50)).toBeGreaterThan(99.9);
    expect(moveAccuracyFromWinPercent(70, 60)).toBeLessThan(70);
    expect(moveAccuracyFromWinPercent(90, 20)).toBeLessThan(5);
  });

  it('scores move quality against the best continuation, not the current position', () => {
    const { best, played } = getMoveQualityWinPercents(320, -280, 'white');
    const moveAccuracy = moveAccuracyFromWinPercent(best, played);

    expect(best).toBeGreaterThan(played);
    expect(moveAccuracy).toBeLessThan(20);
  });

  it('classifies moves from accuracy bands', () => {
    expect(classifyMove(100, true)).toBe('best');
    expect(classifyMove(100, false)).toBe('excellent');
    expect(classifyMove(95, false)).toBe('good');
    expect(classifyMove(80, false)).toBe('inaccuracy');
    expect(classifyMove(60, false)).toBe('mistake');
    expect(classifyMove(10, false)).toBe('blunder');
  });

  it('formats forced mate distances with M notation', () => {
    expect(formatEval(99995, 5)).toBe('M5');
    expect(formatEval(-99997, -3)).toBe('-M3');
    expect(formatEval(100000)).toBe('M');
    expect(formatEval(-100000)).toBe('-M');
  });

  it('computes game accuracy from analyzed moves instead of forgiving labels', () => {
    const moves: AnalyzedMove[] = [
      createAnalyzedMove('white', 100, 50, 55),
      createAnalyzedMove('black', 98, 50, 49),
      createAnalyzedMove('white', 92, 55, 54),
      createAnalyzedMove('black', 18, 49, 20),
      createAnalyzedMove('white', 72, 54, 45),
    ];

    expect(computeAccuracy(moves, 'white')).toBeLessThan(90);
    expect(computeAccuracy(moves, 'white')).toBeGreaterThan(70);
    expect(computeAccuracy(moves, 'black')).toBeLessThan(60);
  });

  it('returns move win percents and move accuracy in analyzed games', () => {
    const analysis = analyzeGame([
      createMove('c3', 'c4'),
      createMove('d6', 'd5'),
      createMove('b1', 'c3'),
      createMove('g8', 'e7'),
    ], 1);

    expect(analysis.moves).toHaveLength(4);
    expect(analysis.moves[0].moveAccuracy).toBeGreaterThanOrEqual(0);
    expect(analysis.moves[0].moveAccuracy).toBeLessThanOrEqual(100);
    expect(analysis.moves[0].winPercentBefore).toBeGreaterThanOrEqual(0);
    expect(analysis.moves[0].winPercentAfter).toBeLessThanOrEqual(100);
    expect(analysis.whiteAccuracy).not.toBe(97);
    expect(analysis.engine?.confidence).toBe('provisional');
  });
});
