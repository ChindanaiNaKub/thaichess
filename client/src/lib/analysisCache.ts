import type { GameAnalysis } from '@shared/analysis';
import type { Move } from '@shared/types';

export const ANALYSIS_CACHE_VERSION = 9;
export const DEFAULT_GAME_ANALYSIS_MOVETIME_MS = 250;

function serializeMove(move: Move): string {
  return [
    move.from.row,
    move.from.col,
    move.to.row,
    move.to.col,
    move.promotion ?? '',
    move.promoted ? '1' : '0',
  ].join('');
}

function hashText(text: string): string {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function buildFallbackAnalysisId(moves: Move[]): string {
  return `moves-${moves.length}-${hashText(moves.map(serializeMove).join('|'))}`;
}

export function getGameAnalysisCacheKey(params: {
  analysisId?: string | null;
  moves: Move[];
  movetimeMs: number;
}): string {
  const normalizedId = params.analysisId?.trim() || buildFallbackAnalysisId(params.moves);
  return `analysis-cache:${ANALYSIS_CACHE_VERSION}:${normalizedId}:${params.movetimeMs}:${params.moves.length}`;
}

export function readCachedGameAnalysis(cacheKey: string): GameAnalysis | null {
  try {
    const raw = window.sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw) as GameAnalysis;
  } catch {
    return null;
  }
}

export function writeCachedGameAnalysis(cacheKey: string, analysis: GameAnalysis): void {
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(analysis));
  } catch {
    // Ignore cache failures; analysis still works without storage.
  }
}
