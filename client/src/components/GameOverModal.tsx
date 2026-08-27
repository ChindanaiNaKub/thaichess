import { useState, type ReactNode } from 'react';
import type { PieceColor, RatingChangeSummary } from '@shared/types';
import { useTranslation } from '../lib/i18n';
import { GameOverOutcomeMark } from './GameOverOutcomeMark';
import {
  getGameOverResultLabel,
  isGameOverCelebratory,
  resolveGameOverOutcome,
} from './gameOverClimax';

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
  /** Quiet Share expand — visible beside Study (not buried under More). */
  moreExtras?: ReactNode;
  /** When Share is expanded, show that path alone (hide Study row). */
  moreExtrasOnly?: boolean;
  /** One-time guest win conversion card, rendered inside the modal on a personal win. */
  conversionCard?: ReactNode;
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
  moreExtras = null,
  moreExtrasOnly = false,
  conversionCard = null,
}: GameOverModalProps) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const isDraw = !winner;
  const celebratory = isGameOverCelebratory(winner, playerColor);
  const playerRatingDelta = playerColor === 'white'
    ? ratingChange ? ratingChange.whiteAfter - ratingChange.whiteBefore : null
    : playerColor === 'black'
      ? ratingChange ? ratingChange.blackAfter - ratingChange.blackBefore : null
      : null;
  /* Study CTA is Analyze — no nested Study → Analyze toggle. */
  const hasPeakSecondary = !moreExtrasOnly && Boolean(onAnalyze || moreExtras);
  const hasReportTools = Boolean(onReport || reportStatusMessage);

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

  const outcome = resolveGameOverOutcome(winner, playerColor);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.12_0.02_65_/_0.72)] p-4 animate-fadeIn"
      onClick={onClose}
      data-testid="game-over-modal-scrim"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-surface-hover/80 bg-surface-alt p-6 sm:p-8 animate-slideUp shadow-[0_10px_24px_oklch(0.10_0.02_65_/_0.14)]"
        onClick={e => e.stopPropagation()}
        data-testid="game-over-modal"
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
          <div className="mb-4">
            <GameOverOutcomeMark outcome={outcome} />
          </div>
          <h2 className={`font-display text-2xl font-bold tracking-tight mb-1 ${
            celebratory ? 'text-gold' : 'text-danger'
          }`}>
            {getGameOverResultLabel(t, winner, playerColor)}
          </h2>
          <p className="text-text-dim text-sm mb-6">{getReasonText()}</p>
          <div className="mb-6 flex flex-col items-center gap-2">
            <span
              data-testid="game-over-rated-chip"
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                rated
                  ? 'border border-primary/25 bg-primary/10 text-primary-light'
                  : 'bg-surface text-text-dim'
              }`}
            >
              {rated ? t('game.rated') : t('game.casual')}
            </span>
            {rated && playerRatingDelta !== null && (
              <p
                data-testid="game-over-rating-delta"
                className={`text-sm font-semibold ${playerRatingDelta >= 0 ? 'text-primary-light' : 'text-danger'}`}
              >
                {t('game.rating_change')} {playerRatingDelta >= 0 ? '+' : ''}{playerRatingDelta}
              </p>
            )}
          </div>

          {conversionCard}

          <div className="flex flex-col gap-3">
            {rematchNotice && (
              <div className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-center text-sm font-medium text-accent">
                {rematchNotice}
              </div>
            )}
            {/* Peak-end: Rematch owns the climax — tools match GameOverPanel More pattern. */}
            <button
              type="button"
              data-testid="game-over-modal-rematch"
              onClick={onRematch}
              disabled={rematchDisabled}
              className="button-accent-contrast w-full rounded-lg px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rematchLabel ?? t('gameover.rematch')}
            </button>
            <button
              type="button"
              data-testid="game-over-modal-new-game"
              onClick={onNewGame}
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-text-dim transition-colors hover:bg-surface-hover/60 hover:text-text-bright"
            >
              {t('common.new_game')}
            </button>
            {moreExtrasOnly ? (
              <div className="flex flex-col gap-2 border-t border-surface-hover/60 pt-3 text-left" data-testid="game-over-modal-peak-path">
                {moreExtras}
              </div>
            ) : null}
            {hasPeakSecondary ? (
              <div
                className="flex flex-col gap-2 border-t border-surface-hover/60 pt-3 text-left"
                data-testid="game-over-modal-peak-secondary"
              >
                {onAnalyze ? (
                  <button
                    type="button"
                    onClick={onAnalyze}
                    data-testid="analyze-game-button"
                    className="ui-btn-secondary w-full px-3 py-2 text-sm font-semibold"
                  >
                    {t('game.endgame_study')}
                  </button>
                ) : null}
                {moreExtras}
              </div>
            ) : null}
            {hasReportTools ? (
              <div className="border-t border-surface-hover/60 pt-3 text-left">
                <button
                  type="button"
                  data-testid="game-over-modal-more-toggle"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((open) => !open)}
                  className="w-full text-left text-sm font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
                >
                  {moreOpen ? t('game.endgame_hide_tools') : t('game.endgame_more_tools')}
                </button>
                {moreOpen ? (
                  <div className="mt-2 flex flex-col gap-2" data-testid="game-over-modal-more-tools">
                    {onReport && (
                      <button
                        type="button"
                        onClick={onReport}
                        disabled={reportDisabled}
                        className="w-full text-left text-sm font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline disabled:cursor-not-allowed disabled:opacity-60"
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
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
