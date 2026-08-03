import type { PieceColor } from '@shared/types';
import type { GameOverOutcome } from './GameOverOutcomeMark';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/** Gold wash / title for draw, personal win, or null-seat table victory. */
export function isGameOverCelebratory(
  winner: PieceColor | null,
  playerColor: PieceColor | null,
): boolean {
  if (!winner) return true;
  if (playerColor == null) return true;
  return winner === playerColor;
}

/** Felt Table seal: null-seat decisive uses gold win mark, never personal loss. */
export function resolveGameOverOutcome(
  winner: PieceColor | null,
  playerColor: PieceColor | null,
): GameOverOutcome {
  if (!winner) return 'draw';
  if (playerColor == null) return 'win';
  return winner === playerColor ? 'win' : 'loss';
}

/** Shared Modal/Panel climax copy. */
export function getGameOverResultLabel(
  t: TranslateFn,
  winner: PieceColor | null,
  playerColor: PieceColor | null,
): string {
  if (!winner) return t('gameover.draw');
  if (playerColor) {
    return winner === playerColor ? t('gameover.you_win') : t('gameover.you_lost');
  }
  if (winner === 'white') return `${t('common.white')} ${t('gameover.is_victorious')}`;
  if (winner === 'black') return `${t('common.black')} ${t('gameover.is_victorious')}`;
  return t('gameover.draw');
}
