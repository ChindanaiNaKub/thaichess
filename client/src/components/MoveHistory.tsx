import type { Move, Board } from '@shared/types';
import { posToAlgebraic } from '@shared/engine';
import { useTranslation } from '../lib/i18n';

interface MoveHistoryProps {
  moves: Move[];
  initialBoard: Board;
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const { t } = useTranslation();
  const movePairs: { num: number; white: string; black?: string }[] = [];

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
    });
  }

  return (
    <div className="bg-surface-alt rounded-lg border border-surface-hover overflow-hidden">
      <div className="px-3 py-2 border-b border-surface-hover">
        <h3 className="text-sm font-semibold text-text-bright">{t('moves.title')}</h3>
      </div>
      <div className="max-h-[300px] overflow-y-auto p-1">
        {movePairs.length === 0 ? (
          <div className="text-text-dim text-sm text-center py-4">{t('moves.empty')}</div>
        ) : (
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 text-sm">
            {movePairs.map(({ num, white, black }) => (
              <div key={num} className="contents">
                <span className="text-text-dim px-2 py-0.5 text-right">{num}.</span>
                <span className="text-text-bright px-2 py-0.5 rounded hover:bg-surface-hover cursor-default font-mono">
                  {white}
                </span>
                <span className="text-text-bright px-2 py-0.5 rounded hover:bg-surface-hover cursor-default font-mono">
                  {black || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
