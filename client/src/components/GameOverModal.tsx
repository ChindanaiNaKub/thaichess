import type { PieceColor } from '@shared/types';
import { useTranslation } from '../lib/i18n';

interface GameOverModalProps {
  winner: PieceColor | null;
  reason: string;
  playerColor: PieceColor | null;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze?: () => void;
  onClose?: () => void;
}

export default function GameOverModal({ winner, reason, playerColor, onRematch, onNewGame, onAnalyze, onClose }: GameOverModalProps) {
  const { t } = useTranslation();
  const isDraw = !winner;
  const isWinner = winner === playerColor;

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
      default: return reason;
    }
  };

  const getIcon = () => {
    if (isDraw) return '½';
    if (isWinner) return '🏆';
    return '✖';
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
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-text-bright hover:bg-surface-hover transition-colors text-lg"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        )}

        <div className="text-center">
          <div className="text-5xl mb-3">{getIcon()}</div>
          <h2 className={`text-2xl font-bold mb-1 ${
            isDraw ? 'text-accent' : isWinner ? 'text-primary-light' : 'text-danger'
          }`}>
            {getTitle()}
          </h2>
          <p className="text-text-dim text-sm mb-6">{getReasonText()}</p>

          <div className="flex flex-col gap-3">
            {onAnalyze && (
              <button
                onClick={onAnalyze}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
              >
                🔍 {t('analysis.analyze')}
              </button>
            )}
            <button
              onClick={onRematch}
              className="w-full py-3 px-6 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors"
            >
              {t('gameover.rematch')}
            </button>
            <button
              onClick={onNewGame}
              className="w-full py-3 px-6 bg-surface-hover hover:bg-surface-hover/80 text-text-bright font-semibold rounded-lg transition-colors border border-surface-hover"
            >
              {t('common.new_game')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
