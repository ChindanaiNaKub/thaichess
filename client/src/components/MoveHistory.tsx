import { useRef, useEffect } from 'react';
import type { Move, Board } from '@shared/types';
import { posToAlgebraic } from '@shared/engine';
import { useTranslation } from '../lib/i18n';

interface MoveHistoryProps {
  moves: Move[];
  initialBoard: Board;
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
}

export default function MoveHistory({ moves, currentMoveIndex, onMoveClick }: MoveHistoryProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMoveRef = useRef<HTMLSpanElement>(null);

  const isNavigating = currentMoveIndex !== undefined && currentMoveIndex !== moves.length - 1;
  const activeIndex = currentMoveIndex ?? moves.length - 1;

  const movePairs: { num: number; white: string; black?: string; whiteIdx: number; blackIdx: number }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];

    const formatMove = (move: Move) => {
      const dest = posToAlgebraic(move.to);
      const from = posToAlgebraic(move.from);
      const promo = move.promoted ? '=M' : '';
      return `${from}${move.captured ? 'x' : '-'}${dest}${promo}`;
    };

    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: formatMove(whiteMove),
      black: blackMove ? formatMove(blackMove) : undefined,
      whiteIdx: i,
      blackIdx: i + 1,
    });
  }

  useEffect(() => {
    if (activeMoveRef.current && scrollRef.current) {
      activeMoveRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  return (
    <div className="bg-surface-alt rounded-lg border border-surface-hover overflow-hidden">
      <div className="px-3 py-2 border-b border-surface-hover">
        <h3 className="text-sm font-semibold text-text-bright">{t('moves.title')}</h3>
      </div>
      <div ref={scrollRef} className="max-h-[300px] overflow-y-auto p-1">
        {movePairs.length === 0 ? (
          <div className="text-text-dim text-sm text-center py-4">{t('moves.empty')}</div>
        ) : (
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 text-sm">
            {movePairs.map(({ num, white, black, whiteIdx, blackIdx }) => (
              <div key={num} className="contents">
                <span className="text-text-dim px-2 py-0.5 text-right">{num}.</span>
                <span
                  ref={activeIndex === whiteIdx ? activeMoveRef : undefined}
                  className={`text-text-bright px-2 py-0.5 font-mono ${
                    activeIndex === whiteIdx ? 'move-active' : 'move-clickable'
                  }`}
                  onClick={() => onMoveClick?.(whiteIdx)}
                >
                  {white}
                </span>
                <span
                  ref={activeIndex === blackIdx ? activeMoveRef : undefined}
                  className={`text-text-bright px-2 py-0.5 font-mono ${
                    black
                      ? activeIndex === blackIdx ? 'move-active' : 'move-clickable'
                      : ''
                  }`}
                  onClick={() => black && onMoveClick?.(blackIdx)}
                >
                  {black || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {onMoveClick && moves.length > 0 && (
        <div className="flex items-center justify-center gap-1 px-3 py-2 border-t border-surface-hover">
          <button
            onClick={() => onMoveClick(-1)}
            className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors"
            title={t('moves.first_position')}
          >
            ⏮
          </button>
          <button
            onClick={() => onMoveClick(Math.max(-1, activeIndex - 1))}
            className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors"
            title={t('moves.previous_move')}
          >
            ◀
          </button>
          <button
            onClick={() => onMoveClick(Math.min(moves.length - 1, activeIndex + 1))}
            className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors"
            title={t('moves.next_move')}
          >
            ▶
          </button>
          <button
            onClick={() => onMoveClick(moves.length - 1)}
            className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors"
            title={t('moves.last_move')}
          >
            ⏭
          </button>
        </div>
      )}
    </div>
  );
}
