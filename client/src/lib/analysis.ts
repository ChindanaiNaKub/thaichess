import type { GameAnalysis } from '@shared/analysis';
import type { GameState, Move } from '@shared/types';
import {
  serializeAnalysisPosition,
  type AnalysisPositionSnapshot,
  type AnalysisSource,
  type BotMoveResult,
  type PositionAnalysisResult,
} from '@shared/engineAdapter';

interface AnalyzeGameRequest {
  moves: Move[];
  depth?: number;
  movetimeMs?: number;
}

export interface InlineAnalysisPayload {
  source: AnalysisSource;
  moves: Move[];
  result?: string;
  reason?: string;
}

export async function requestGameAnalysis({ moves, depth, movetimeMs }: AnalyzeGameRequest): Promise<GameAnalysis> {
  const response = await fetch('/api/analysis/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moves, depth, movetimeMs }),
  });

  if (!response.ok) {
    throw new Error('Analysis request failed');
  }

  const data = await response.json() as { analysis: GameAnalysis };
  return data.analysis;
}

export async function requestPositionAnalysis(
  snapshot: AnalysisPositionSnapshot,
  options?: { depth?: number; movetimeMs?: number; nodes?: number; multipv?: number },
): Promise<PositionAnalysisResult> {
  const serialized = serializeAnalysisPosition(snapshot);
  const response = await fetch('/api/analysis/position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      position: serialized.position,
      counting: serialized.counting,
      ...options,
    }),
  });

  if (!response.ok) {
    throw new Error('Position analysis request failed');
  }

  return await response.json() as PositionAnalysisResult;
}

export async function requestBotMove(
  state: Pick<GameState, 'board' | 'turn' | 'counting'>,
  level: number,
  options?: { signal?: AbortSignal; botId?: string },
): Promise<BotMoveResult> {
  const serialized = serializeAnalysisPosition({
    board: state.board,
    turn: state.turn,
    counting: state.counting,
  });

  const response = await fetch('/api/bot/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options?.signal,
    body: JSON.stringify({
      position: serialized.position,
      counting: serialized.counting,
      level,
      botId: options?.botId,
    }),
  });

  if (!response.ok) {
    throw new Error('Bot move request failed');
  }

  return await response.json() as BotMoveResult;
}

export function buildInlineAnalysisRoute(payload: InlineAnalysisPayload): string {
  const params = new URLSearchParams();
  params.set('source', payload.source);
  params.set('moves', JSON.stringify(payload.moves));
  if (payload.result) params.set('result', payload.result);
  if (payload.reason) params.set('reason', payload.reason);
  return `/analysis/${payload.source}?${params.toString()}`;
}

export function buildEditorAnalysisRoute(snapshot?: AnalysisPositionSnapshot): string {
  const params = new URLSearchParams();
  params.set('mode', 'editor');

  if (snapshot) {
    const serialized = serializeAnalysisPosition(snapshot);
    params.set('position', serialized.position);
    if (serialized.counting) params.set('counting', serialized.counting);
  }

  return `/analysis?${params.toString()}`;
}
