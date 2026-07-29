import type { PieceColor, GameState } from '@shared/types';
import { hasAnyLegalMoves, isInCheck } from '@shared/engine';

/** Map bot IDs to i18n translation keys. */
const BOT_ID_TO_I18N_KEY: Record<string, string> = {
  'saman-noi': 'saman_noi',
  'mae-mali': 'mae_mali',
  'krailert': 'krailert',
  'phra-suman': 'panya_suman',
  'mae-saeng': 'mekhala_saeng',
  'khun-intharat': 'kiet_intharat',
  'muen-rattanak': 'marut_rattanak',
  'luang-prasert': 'laksit_prasert',
  'chao-surasi': 'chanin_surasi',
  'lady-busaba': 'lalin_busaba',
  'kiet-archive': 'kiet_intharat',
  'ajarn-krailert': 'ajarn_krailert',
};

export type SideChoice = PieceColor | 'random';

export type BotTranslationFields = {
  backstory: string;
  hook: string;
  opening: string;
  signature: string;
  tactical: string;
  weakness: string;
  chatStyle: string;
};

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function getSafeBotTranslationValue(
  t: (key: string) => string,
  i18nKey: string,
  field: string
): string {
  const translationKey = `bot.${i18nKey}.${field}`;
  const translatedValue = t(translationKey);
  return translatedValue === translationKey ? '' : translatedValue;
}

/** Translated bot content for the selected persona. */
export function useBotTranslation(t: (key: string) => string, botId: string): BotTranslationFields {
  const i18nKey = BOT_ID_TO_I18N_KEY[botId] || botId;

  return {
    backstory: getSafeBotTranslationValue(t, i18nKey, 'backstory'),
    hook: getSafeBotTranslationValue(t, i18nKey, 'hook'),
    opening: getSafeBotTranslationValue(t, i18nKey, 'opening'),
    signature: getSafeBotTranslationValue(t, i18nKey, 'signature'),
    tactical: getSafeBotTranslationValue(t, i18nKey, 'tactical'),
    weakness: getSafeBotTranslationValue(t, i18nKey, 'weakness'),
    chatStyle: getSafeBotTranslationValue(t, i18nKey, 'chat_style'),
  };
}

/** Single translated bot field (for roster loops). */
export function getBotTranslation(t: (key: string) => string, botId: string, field: string): string {
  const i18nKey = BOT_ID_TO_I18N_KEY[botId] || botId;
  return getSafeBotTranslationValue(t, i18nKey, field);
}

export const DEFAULT_PLAY_TIME_MS = 10 * 60 * 1000;
const HIGH_LEVEL_LOCAL_FALLBACK_DELAY_MS = 700;

export const BOT_GAME_TIME_CONTROL = {
  initial: DEFAULT_PLAY_TIME_MS / 1000,
  increment: 0,
};

export function createBotGameId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `bot_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getHighLevelLocalFallbackDelayMs(level: number): number | null {
  if (level < 8) return null;
  if (level >= 12) return HIGH_LEVEL_LOCAL_FALLBACK_DELAY_MS;
  if (level >= 11) return 650;
  if (level >= 10) return 600;
  if (level >= 9) return 550;
  return 500;
}

export function buildNoMoveGameOverState(state: GameState): GameState | null {
  if (state.gameOver || hasAnyLegalMoves(state.board, state.turn)) {
    return null;
  }

  const inCheck = isInCheck(state.board, state.turn);
  const winner: PieceColor | null = inCheck
    ? (state.turn === 'white' ? 'black' : 'white')
    : null;

  return {
    ...state,
    isCheck: inCheck,
    isCheckmate: inCheck,
    isStalemate: !inCheck,
    isDraw: !inCheck,
    gameOver: true,
    winner,
    resultReason: inCheck ? 'checkmate' : 'stalemate',
    counting: null,
  };
}

/** Counting status copy for the bot side panel. */
export function getBotCountingLabel(
  t: TranslateFn,
  counting: NonNullable<GameState['counting']>,
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
