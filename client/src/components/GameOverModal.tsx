import type { PieceColor, RatingChangeSummary } from '@shared/types';
import { useTranslation } from '../lib/i18n';

interface GameOverModalProps {
  winner: PieceColor | null;
  reason: string;
  playerColor: PieceColor | null;
  rated?: boolean;
  ratingChange?: RatingChangeSummary | null;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze?: () => void;
  onReport?: () => void;
  reportLabel?: string;
  reportDisabled?: boolean;
  reportStatusMessage?: string | null;
  onClose?: () => void;
  rematchLabel?: string;
  rematchDisabled?: boolean;
  rematchNotice?: string | null;
}

export default function GameOverModal({
  winner,
  reason,
  playerColor,
  rated = false,
  ratingChange = null,
  onRematch,
  onNewGame,
  onAnalyze,
  onReport,
  reportLabel,
  reportDisabled = false,
  reportStatusMessage = null,
  onClose,
  rematchLabel,
  rematchDisabled = false,
  rematchNotice = null,
}: GameOverModalProps) {
  const { t } = useTranslation();
  const isDraw = !winner;
  const isWinner = winner === playerColor;
  const playerRatingDelta = playerColor === 'white'
    ? ratingChange ? ratingChange.whiteAfter - ratingChange.whiteBefore : null
    : playerColor === 'black'
      ? ratingChange ? ratingChange.blackAfter - ratingChange.blackBefore : null
      : null;

  const getTitle = () => {
    if (isDraw) return t('gameover.draw');
    if (isWinner) return t('gameover.you_win');
    return t('gameover.you_lost');
  };

  const getReasonText = () => {
    switch (reason) {
      case 'checkmate': return isDraw ? '' : t('gameover.by_checkmate');
      case 'resignation': return t('gameover.by_resign');
      case 'timeout': return t('gameover.by_timeout');
      case 'stalemate': return t('gameover.by_stalemate');
      case 'draw_agreement': return t('gameover.by_agreement');
      case 'insufficient_material': return t('gameover.by_material');
      case 'counting_rule': return t('gameover.by_counting');
      default: return t('gameover.by_unknown');
    }
  };

  const getMark = () => {
    if (isDraw) return '½';
    if (isWinner) return '1';
    return '0';
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-sm w-full animate-slideUp shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {onClose && (
          <button type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-text-bright hover:bg-surface-hover transition-colors text-lg"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        )}

        <div className="text-center">
          <div
            aria-hidden="true"
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border text-2xl font-bold tracking-tight ${
              isDraw
                ? 'border-accent/35 bg-accent/10 text-accent'
                : isWinner
                  ? 'border-accent/35 bg-accent/10 text-accent'
                  : 'border-danger/35 bg-danger/10 text-danger'
            }`}
          >
            {getMark()}
          </div>
          <h2 className={`text-2xl font-bold mb-1 ${
            isDraw ? 'text-accent' : isWinner ? 'text-text-bright' : 'text-danger'
          }`}>
            {getTitle()}
          </h2>
          <p className="text-text-dim text-sm mb-6">{getReasonText()}</p>
          <div className="mb-6 flex flex-col items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              rated ? 'bg-accent/15 text-accent' : 'bg-surface text-text-dim'
            }`}>
              {rated ? t('game.rated') : t('game.casual')}
            </span>
            {rated && playerRatingDelta !== null && (
              <p className={`text-sm font-semibold ${playerRatingDelta >= 0 ? 'text-accent' : 'text-danger'}`}>
                {t('game.rating_change')} {playerRatingDelta >= 0 ? '+' : ''}{playerRatingDelta}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {rematchNotice && (
              <div className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-center text-sm font-medium text-accent">
                {rematchNotice}
              </div>
            )}
            <button type="button"
              onClick={onRematch}
              disabled={rematchDisabled}
              className="button-accent-contrast w-full rounded-lg px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rematchLabel ?? t('gameover.rematch')}
            </button>
            <button type="button"
              onClick={onNewGame}
              className="ui-btn-secondary w-full px-6 py-3 font-semibold"
            >
              {t('common.new_game')}
            </button>
            {onAnalyze && (
              <button type="button"
                onClick={onAnalyze}
                data-testid="analyze-game-button"
                className="ui-btn-secondary w-full px-6 py-3 font-semibold"
              >
                {t('analysis.analyze')}
              </button>
            )}
            {onReport && (
              <button type="button"
                onClick={onReport}
                disabled={reportDisabled}
                className="ui-btn-secondary w-full px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reportLabel ?? t('fair_play.report_action')}
              </button>
            )}
            {reportStatusMessage && (
              <div className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-center text-sm text-text-dim">
                {reportStatusMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
