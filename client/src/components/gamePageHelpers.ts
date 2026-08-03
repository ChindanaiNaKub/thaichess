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

/**
 * Status-lane Piece Guide only on check — side pin (`piece-guide-side`) owns mid-play discovery.
 * Early-move dual surface was quieter-out: status help + side twin competed in the first plies.
 */
export function shouldOfferPieceGuideStatusHelp(
  _moveCount: number,
  isCheck: boolean,
  gameOver: boolean,
): boolean {
  if (gameOver) return false;
  return isCheck;
}

/** Shared live/bot/local policy: nav hint only when reviewing or after the game ends. */
export function shouldShowMoveNavHint(moveCount: number, gameOver: boolean, viewingHistory: boolean): boolean {
  return moveCount > 0 && (gameOver || viewingHistory);
}

/** Shared with CountingBoardStrip leave urgency — under 10s expands Draw/Resign. */
export const CLOCK_CRITICAL_MS = 10_000;

/** Quiet secondary rail action (piece guide) — shared live/bot Operate grammar. */
export const sidePanelHelpActionClass =
  'w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright text-sm rounded-xl border border-surface-hover transition-colors';

/** Softer leave/escape under history — not a twin of Piece Guide. */
export const sidePanelLeaveActionClass =
  'w-full px-3 py-2 text-left text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline';

/**
 * Mid-play meta chips (rated, premove, view-as, return-to-live).
 * Cloth only — State Gold stays on turn / check / counting.
 */
export const gameMetaChipClass =
  'rounded-full border border-surface-hover/80 bg-surface-alt/90 px-2.5 py-1 text-text-dim normal-case tracking-normal';

export const gameMetaChipInteractiveClass =
  `${gameMetaChipClass} transition-colors hover:bg-surface-hover hover:text-text-bright`;

export const gameMetaChipSelectedClass =
  'rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs font-semibold text-text-bright';

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
