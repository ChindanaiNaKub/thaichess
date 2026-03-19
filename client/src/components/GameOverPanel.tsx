import type { PieceColor } from '@shared/types';
import { useTranslation } from '../lib/i18n';

interface GameOverPanelProps {
  winner: PieceColor | null;
  reason: string;
  playerColor: PieceColor | null;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze?: () => void;
}

export default function GameOverPanel({ winner, reason, playerColor, onRematch, onNewGame, onAnalyze }: GameOverPanelProps) {
  const { t } = useTranslation();
  const isDraw = !winner;
  const isWinner = winner === playerColor;

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
      default: return reason;
    }
  };

  const getResultLabel = () => {
    if (isDraw) return t('gameover.draw');
    if (winner === 'white') return `${t('common.white')} ${t('gameover.is_victorious')}`;
    return `${t('common.black')} ${t('gameover.is_victorious')}`;
  };

  return (
    <div className="bg-surface-alt rounded-lg border border-surface-hover overflow-hidden">
      {/* Result header */}
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
      </div>

      {/* Action buttons */}
      <div className="p-3 flex flex-col gap-2">
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            className="w-full py-2.5 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold text-sm rounded-lg border border-blue-600/30 transition-colors"
          >
            🔍 {t('analysis.analyze')}
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={onRematch}
            className="flex-1 py-2.5 px-3 bg-primary hover:bg-primary-light text-white font-semibold text-sm rounded-lg transition-colors"
          >
            {t('gameover.rematch')}
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 py-2.5 px-3 bg-surface-hover hover:bg-surface-hover/80 text-text-bright font-semibold text-sm rounded-lg transition-colors"
          >
            {t('common.new_game')}
          </button>
        </div>
      </div>
    </div>
  );
}
