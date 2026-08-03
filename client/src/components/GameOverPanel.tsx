import { useState, type ReactNode } from 'react';
import type { PieceColor, RatingChangeSummary } from '@shared/types';
import { useTranslation } from '../lib/i18n';
import { GameOverOutcomeMark } from './GameOverOutcomeMark';
import {
  getGameOverResultLabel,
  isGameOverCelebratory,
  resolveGameOverOutcome,
} from './gameOverClimax';

interface GameOverPanelProps {
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
  rematchLabel?: string;
  rematchDisabled?: boolean;
  rematchNotice?: string | null;
  /** Share / review peers under More (not inside the Study door). */
  moreExtras?: ReactNode;
  /** When Share/Review owns More, hide Study/Report siblings. */
  moreExtrasOnly?: boolean;
}

export default function GameOverPanel({
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
  rematchLabel,
  rematchDisabled = false,
  rematchNotice = null,
  moreExtras = null,
  moreExtrasOnly = false,
}: GameOverPanelProps) {
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
  const hasStudyContent = Boolean(onAnalyze);
  const hasMoreTools = Boolean(hasStudyContent || moreExtras || onReport || reportStatusMessage);

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
      data-testid="game-over-panel"
      className="bg-surface-alt rounded-lg border border-surface-hover overflow-hidden"
    >
      <div className={`px-4 py-3 text-center border-b border-surface-hover ${
        celebratory ? 'bg-gold/10' : 'bg-danger/10'
      }`}>
        <div className="mb-2">
          <GameOverOutcomeMark outcome={outcome} size={44} />
        </div>
        <div
          data-testid="game-over-panel-title"
          className={`font-display text-lg font-bold tracking-tight mb-0.5 ${
            celebratory ? 'text-gold' : 'text-danger'
          }`}
        >
          {getGameOverResultLabel(t, winner, playerColor)}
        </div>
        <div className="text-xs text-text-dim">
          {getReasonText()}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em]">
          <span
            data-testid="game-over-rated-chip"
            className={`rounded-full px-2 py-1 ${
              rated
                ? 'border border-primary/25 bg-primary/10 text-primary-light'
                : 'bg-surface text-text-dim'
            }`}
          >
            {rated ? t('game.rated') : t('game.casual')}
          </span>
          {rated && playerRatingDelta !== null && (
            <span
              data-testid="game-over-rating-delta"
              className={playerRatingDelta >= 0 ? 'text-primary-light' : 'text-danger'}
            >
              {t('game.rating_change')} {playerRatingDelta >= 0 ? '+' : ''}{playerRatingDelta}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-2 p-2.5">
        {rematchNotice && (
          <div className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-center text-[11px] font-medium text-accent">
            {rematchNotice}
          </div>
        )}
        {/* Post-dismiss rail: one Rematch heartbeat — New Game stays secondary. */}
        <button
          type="button"
          data-testid="game-over-panel-rematch"
          onClick={onRematch}
          disabled={rematchDisabled}
          className="button-accent-contrast w-full rounded-lg px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {rematchLabel ?? t('gameover.rematch')}
        </button>
        <button
          type="button"
          data-testid="game-over-panel-new-game"
          onClick={onNewGame}
          className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-text-dim transition-colors hover:bg-surface-hover/60 hover:text-text-bright"
        >
          {t('common.new_game')}
        </button>
        {hasMoreTools ? (
          <div className="border-t border-surface-hover/60 pt-2">
            <button
              type="button"
              data-testid="game-over-panel-more-toggle"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((open) => !open)}
              className="w-full text-left text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
            >
              {moreOpen ? t('game.endgame_hide_tools') : t('game.endgame_more_tools')}
            </button>
            {moreOpen ? (
              <div className="mt-2 grid gap-2" data-testid="game-over-panel-more-tools">
                {moreExtrasOnly ? (
                  moreExtras
                ) : (
                  <>
                    {onAnalyze ? (
                      <button
                        type="button"
                        onClick={onAnalyze}
                        data-testid="analyze-game-button"
                        className="ui-btn-secondary w-full px-3 py-2 text-xs font-semibold"
                      >
                        {t('game.endgame_study')}
                      </button>
                    ) : null}
                    {moreExtras}
                    {onReport && (
                      <button
                        type="button"
                        onClick={onReport}
                        disabled={reportDisabled}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reportLabel ?? t('fair_play.report_action')}
                      </button>
                    )}
                    {reportStatusMessage && (
                      <div className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-center text-[11px] text-text-dim">
                        {reportStatusMessage}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
