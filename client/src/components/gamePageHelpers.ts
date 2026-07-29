import type { ClientGameState, Move, PlayerPresence } from '@shared/types';
import { socket } from '../lib/socket';

export const HEARTBEAT_INTERVAL_MS = 4_000;
export const IDLE_THRESHOLD_MS = 12_000;
export const HEARTBEAT_BURST_GUARD_MS = 1_000;
export const EMPTY_MOVE_HISTORY: Move[] = [];
export const DEFAULT_PRESENCE: PlayerPresence = {
  status: 'disconnected',
  latencyMs: null,
  lastSeenAt: null,
};

export type LocalConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type GameOverInfo = {
  reason: string;
  winner: import('@shared/types').PieceColor | null;
  ratingChange: import('@shared/types').RatingChangeSummary | null;
};

export function handleOfferDraw() {
  socket.emit('offer_draw');
}

export function handleStartCounting() {
  socket.emit('start_counting');
}

export function handleStopCounting() {
  socket.emit('stop_counting');
}

export function updateOpponentPresenceStatus(
  gameState: ClientGameState | null,
  status: PlayerPresence['status'],
): ClientGameState | null {
  if (!gameState || !gameState.playerColor) return gameState;

  if (gameState.playerColor === 'white') {
    return {
      ...gameState,
      blackPresence: {
        ...gameState.blackPresence,
        status,
        lastSeenAt: Date.now(),
      },
    };
  }

  return {
    ...gameState,
    whitePresence: {
      ...gameState.whitePresence,
      status,
      lastSeenAt: Date.now(),
    },
  };
}

/** Counting status copy for the online game side panel. */
export function getGameCountingLabel(
  t: TranslateFn,
  counting: NonNullable<ClientGameState['counting']>,
): string {
  if (!counting.active) {
    return t('game.counting_available', {
      type: t(counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
      color: t(counting.countingColor === 'white' ? 'common.white' : 'common.black'),
    });
  }
  if (counting.finalAttackPending) {
    return t('game.counting_final', {
      type: t(counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
    });
  }
  return t('game.counting_status', {
    type: t(counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
    color: t(counting.countingColor === 'white' ? 'common.white' : 'common.black'),
    current: counting.currentCount,
    limit: counting.limit,
  });
}

export function resolveHeartbeatClientStatus(
  isVisible: boolean,
  idleMs: number,
): 'away' | 'idle' | 'active' {
  if (!isVisible) return 'away';
  if (idleMs >= IDLE_THRESHOLD_MS) return 'idle';
  return 'active';
}
