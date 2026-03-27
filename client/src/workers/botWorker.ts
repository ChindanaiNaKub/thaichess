import type { Move } from '@shared/types';
import { findBestMoveWithFairyStockfish } from './fairyEngineRuntime';

interface BestMoveRequest {
  type: 'bestmove';
  requestId: number;
  moves: Move[];
  depth: number;
}

interface BestMoveResponse {
  type: 'result';
  requestId: number;
  move: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
}

interface ErrorResponse {
  type: 'error';
  requestId: number;
  message: string;
}

self.onmessage = async (event: MessageEvent<BestMoveRequest>) => {
  if (event.data.type !== 'bestmove') return;

  try {
    const move = await findBestMoveWithFairyStockfish(event.data.moves, event.data.depth);
    const message: BestMoveResponse = { type: 'result', requestId: event.data.requestId, move };
    self.postMessage(message);
  } catch (error) {
    const message: ErrorResponse = {
      type: 'error',
      requestId: event.data.requestId,
      message: error instanceof Error ? error.message : 'Bot engine failed',
    };
    self.postMessage(message);
  }
};

export type { BestMoveResponse, ErrorResponse };
