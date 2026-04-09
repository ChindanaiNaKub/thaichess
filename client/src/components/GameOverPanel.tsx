import type { PieceColor, RatingChangeSummary } from '@shared/types';
import { useTranslation } from '../lib/i18n';

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
}: GameOverPanelProps) {
  const { t } = useTranslation();
  const isDraw = !winner;
  const isWinner = winner === playerColor;
  const playerRatingDelta = playerColor === 'white'
    ? ratingChange ? ratingChange.whiteAfter - ratingChange.whiteBefore : null
    : playerColor === 'black'
      ? ratingChange ? ratingChange.blackAfter - ratingChange.blackBefore : null
      : null;

  const getScore = () => {
    if (isDraw) return '½-½';
    if (winner === 'white') return '1-0';
    return '0-1';
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

  const getResultLabel = () => {
    if (isDraw) return t('gameover.draw');
    if (winner === 'white') return `${t('common.white')} ${t('gameover.is_victorious')}`;
    return `${t('common.black')} ${t('gameover.is_victorious')}`;
  };

  return (
    <div className="bg-surface-alt rounded-lg border border-surface-hover overflow-hidden">
      <div className={`px-4 py-3 text-center border-b border-surface-hover ${
        isDraw
          ? 'bg-accent/10'
          : isWinner
            ? 'bg-primary/10'
            : 'bg-danger/10'
      }`}>
        <div className={`text-2xl font-bold mb-0.5 ${
          isDraw ? 'text-accent' : 'text-text-bright'
        }`}>
          {getScore()}
        </div>
        <div className="text-xs text-text-dim">
          {getResultLabel()} · {getReasonText()}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em]">
          <span className={`rounded-full px-2 py-1 ${
            rated ? 'bg-primary/15 text-primary-light' : 'bg-surface text-text-dim'
          }`}>
            {rated ? t('game.rated') : t('game.casual')}
          </span>
          {rated && playerRatingDelta !== null && (
            <span className={playerRatingDelta >= 0 ? 'text-primary-light' : 'text-danger'}>
              {t('game.rating_change')} {playerRatingDelta >= 0 ? '+' : ''}{playerRatingDelta}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-2 p-2.5">
        <div className="grid gap-2">
          {rematchNotice && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-center text-[11px] font-medium text-primary-light">
              {rematchNotice}
            </div>
          )}
          {onAnalyze && (
            <button
              onClick={onAnalyze}
              data-testid="analyze-game-button"
              className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold text-xs rounded-lg border border-blue-600/30 transition-colors"
            >
              {t('analysis.analyze')}
            </button>
          )}
          {onReport && (
            <button
              onClick={onReport}
              disabled={reportDisabled}
              className="w-full py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-amber-200 font-semibold text-xs rounded-lg border border-amber-500/30 transition-colors"
            >
              {reportLabel ?? t('fair_play.report_action')}
            </button>
          )}
          {reportStatusMessage && (
            <div className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-center text-[11px] text-text-dim">
              {reportStatusMessage}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onRematch}
              disabled={rematchDisabled}
              className="w-full py-2 px-2 bg-primary hover:bg-primary-light disabled:bg-primary/60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors"
            >
              {rematchLabel ?? t('gameover.rematch')}
            </button>
            <button
              onClick={onNewGame}
              className="w-full py-2 px-2 bg-surface-hover hover:bg-surface-hover/80 text-text-bright font-semibold text-xs rounded-lg transition-colors"
            >
              {t('common.new_game')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
