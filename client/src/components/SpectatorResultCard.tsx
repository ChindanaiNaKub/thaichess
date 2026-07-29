import type { PieceColor, ClientGameState } from '@shared/types';
import { useTranslation } from '../lib/i18n';

export function SpectatorResultCard({
  gameState,
  orientation,
}: {
  gameState: ClientGameState;
  orientation: PieceColor;
}) {
  const { t } = useTranslation();
  const resultText = gameState.winner
    ? `${t(gameState.winner === 'white' ? 'common.white' : 'common.black')}  ${t('gameover.is_victorious')}`
    : t('gameover.draw');
  const score = gameState.winner === 'white' ? '1-0' : gameState.winner === 'black' ? '0-1' : '1/2-1/2';
  const reason = gameState.resultReason
    ? t(`gameover.by_${gameState.resultReason === 'resignation'
      ? 'resign'
      : gameState.resultReason === 'timeout'
        ? 'timeout'
        : gameState.resultReason === 'checkmate'
          ? 'checkmate'
        : gameState.resultReason === 'stalemate'
          ? 'stalemate'
          : gameState.resultReason === 'draw_agreement'
            ? 'agreement'
            : gameState.resultReason === 'insufficient_material'
              ? 'material'
              : gameState.resultReason === 'counting_rule'
                ? 'counting'
                : 'unknown'}`)
    : '';

  return (
    <div className="rounded-xl border border-surface-hover bg-surface-alt/95 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            {t('game.final_position')}
          </div>
          <div className="mt-1 text-lg font-bold text-text-bright">{score}</div>
          <div className="text-sm text-text-dim">
            {resultText}{reason ? ` · ${reason}` : ''}
          </div>
        </div>
        <div className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
          {orientation === 'white' ? t('game.white_perspective') : t('game.black_perspective')}
        </div>
      </div>
    </div>
  );
}
