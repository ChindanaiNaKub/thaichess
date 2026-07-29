import type { Move } from '@shared/types';
import { posToAlgebraic } from '@shared/engine';
import type { GameAnalysis, MoveClassification } from '@shared/analysis';
import { DEFAULT_GAME_ANALYSIS_MOVETIME_MS, getGameAnalysisCacheKey, readCachedGameAnalysis, writeCachedGameAnalysis } from '../lib/analysisCache';
import type { GameAnalysisData } from '../queries/analysis';
import type { EditorTool } from './AnalysisEditorLogic';

export type AnalysisMode = 'game' | 'editor' | 'quick';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const DEFAULT_EDITOR_TOOL: EditorTool = 'move';
export const REVIEW_MOVETIME_MS = DEFAULT_GAME_ANALYSIS_MOVETIME_MS;
export const QUICK_ANALYSIS_MAIN_LINE: Move[] = [];

export function getAnalysisCacheKey(gameData: GameAnalysisData, movetimeMs: number): string {
  return getGameAnalysisCacheKey({
    analysisId: gameData.id,
    moves: gameData.moves,
    movetimeMs,
  });
}

export function readCachedAnalysis(cacheKey: string): GameAnalysis | null {
  return readCachedGameAnalysis(cacheKey);
}

export function writeCachedAnalysis(cacheKey: string, analysis: GameAnalysis): void {
  writeCachedGameAnalysis(cacheKey, analysis);
}

export interface MovePair {
  num: number;
  white: string;
  black?: string;
  whiteIdx: number;
  blackIdx: number;
  whiteClass?: MoveClassification;
  blackClass?: MoveClassification;
}

export function buildMovePairs(moves: Move[], analysis: GameAnalysis | null): MovePair[] {
  const pairs: MovePair[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];

    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: formatReviewMove(whiteMove),
      black: blackMove ? formatReviewMove(blackMove) : undefined,
      whiteIdx: i,
      blackIdx: i + 1,
      whiteClass: analysis?.moves[i]?.classification,
      blackClass: analysis?.moves[i + 1]?.classification,
    });
  }

  return pairs;
}

export function formatReviewMove(move: Move): string {
  const from = posToAlgebraic(move.from);
  const dest = posToAlgebraic(move.to);
  const promo = move.promoted ? '=M' : '';
  return `${from}${move.captured ? 'x' : '-'}${dest}${promo}`;
}
