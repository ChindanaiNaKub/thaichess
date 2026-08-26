import { createInitialGameState } from '../../shared/engine';
import {
  getBotMoveForLevel,
  scoreBotMoveCandidate,
  type BotSearchOptions,
} from '../../shared/botEngine';
import type { AnalysisPositionSnapshot } from '../../shared/engineAdapter';
import type { Move, Position } from '../../shared/types';

export interface LocalBotSearchRequest {
  op: 'move' | 'score';
  snapshot: AnalysisPositionSnapshot;
  level: number;
  search?: BotSearchOptions;
  candidate?: { from: Position; to: Position } | null;
}

export function createSearchableState(snapshot: AnalysisPositionSnapshot) {
  const state = createInitialGameState(0, 0);
  return {
    ...state,
    board: snapshot.board.map(row => row.map(cell => (cell ? { ...cell } : null))),
    turn: snapshot.turn,
    counting: snapshot.counting ? { ...snapshot.counting } : null,
  };
}

/**
 * Runs a local JS bot search request. Executed inside a worker thread by
 * botSearchWorker.ts, or inline as the synchronous fallback.
 */
export function runLocalBotSearchRequest(request: LocalBotSearchRequest): Move | null | number {
  const state = createSearchableState(request.snapshot);

  if (request.op === 'move') {
    return getBotMoveForLevel(state, request.level, request.search);
  }

  if (!request.candidate) return 0;
  return scoreBotMoveCandidate(state, request.level, request.candidate, request.search);
}
