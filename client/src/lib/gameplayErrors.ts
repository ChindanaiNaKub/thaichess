export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/** Server string that triggers spectator redirect before any UI mapping. */
export const GAME_FULL_SPECTATOR_MESSAGE = 'Game is full. Redirecting to spectator mode.';

const STATIC_GAMEPLAY_ERRORS: Record<string, string> = {
  'Too many requests. Please slow down.': 'game.error_rate_limited',
  'Leave your current game or queue before creating another game.': 'game.error_leave_current',
  'Invalid game ID.': 'game.error_invalid_game',
  'Leave your current game before joining another one.': 'game.error_leave_before_join',
  [GAME_FULL_SPECTATOR_MESSAGE]: 'game.error_game_full',
  'Game not found': 'game.error_not_found',
  'Unable to spectate game. Game may not exist.': 'game.error_spectate_unavailable',
  'Leave your current game before spectating another one.': 'game.error_leave_before_spectate',
  'You are not in a game': 'game.error_not_in_game',
  'Invalid move': 'game.error_invalid_move',
  'Your opponent already left the finished game.': 'game.error_opponent_left',
  'Leave your current game before entering matchmaking.': 'game.error_leave_before_queue',
  'You are already in the matchmaking queue.': 'game.error_already_queued',
  'Unable to join game. Please try again.': 'game.error_join_failed',
};

function extractRawMessage(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (raw instanceof Error) return raw.message.trim();
  if (raw && typeof raw === 'object' && 'message' in raw) {
    const message = (raw as { message: unknown }).message;
    if (typeof message === 'string') return message.trim();
  }
  return '';
}

/**
 * Map server / fetch error payloads to bilingual product copy.
 * Unknown or exception-like strings fall back — never surface raw diagnostics.
 */
export function mapGameplayErrorMessage(
  raw: unknown,
  t: TranslateFn,
  fallbackKey: string,
): string {
  const message = extractRawMessage(raw);
  if (!message) return t(fallbackKey);

  const mappedKey = STATIC_GAMEPLAY_ERRORS[message];
  if (mappedKey) return t(mappedKey);

  if (message.startsWith('Invalid fields:')) {
    return t('game.error_invalid_request');
  }

  return t(fallbackKey);
}
