import type { GameMode, PieceColor, ResultReason } from '@shared/types';
import { translate } from './i18n';

export type TranslationFn = typeof translate;

export function formatTimeControl(initial: number, increment: number): string {
  const minutes = initial / 60;
  const base = Number.isInteger(minutes) ? minutes.toString() : (Math.round(minutes * 10) / 10).toString();
  return `${base}+${increment}`;
}

export function getResultScore(winner: PieceColor | null): string {
  if (!winner) return '1/2-1/2';
  return winner === 'white' ? '1-0' : '0-1';
}

export function getPlayerOutcome(winner: PieceColor | null, playerColor: PieceColor): 'win' | 'loss' | 'draw' {
  if (!winner) return 'draw';
  return winner === playerColor ? 'win' : 'loss';
}

export function getPlayerOutcomeLabel(
  winner: PieceColor | null,
  playerColor: PieceColor,
  t: TranslationFn,
): string {
  const outcome = getPlayerOutcome(winner, playerColor);

  switch (outcome) {
    case 'win':
      return t('sharecard.result_win');
    case 'loss':
      return t('sharecard.result_loss');
    default:
      return t('sharecard.result_draw');
  }
}

export function getResultReasonLabel(reason: ResultReason | string | null, t: TranslationFn): string | null {
  switch (reason) {
    case 'checkmate':
      return t('gameover.by_checkmate');
    case 'resignation':
      return t('gameover.by_resign');
    case 'timeout':
      return t('gameover.by_timeout');
    case 'stalemate':
      return t('gameover.by_stalemate');
    case 'draw_agreement':
      return t('gameover.by_agreement');
    case 'insufficient_material':
      return t('gameover.by_material');
    case 'counting_rule':
      return t('gameover.by_counting');
    default:
      return null;
  }
}

export function getGameModeLabel(gameMode: GameMode, rated: boolean, t: TranslationFn): string {
  switch (gameMode) {
    case 'bot':
      return t('bot.vs_bot');
    case 'local':
      return t('local.title');
    case 'private':
      return t('home.play_with_friend');
    case 'quick_play':
    default:
      return rated ? `${t('quick.title')} - ${t('game.rated')}` : t('quick.title');
  }
}

export function getSideLabel(color: PieceColor, t: TranslationFn): string {
  return `${t('sharecard.played_as')} ${t(color === 'white' ? 'common.white' : 'common.black')}`;
}
