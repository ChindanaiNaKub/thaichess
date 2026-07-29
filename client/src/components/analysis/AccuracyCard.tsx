import type { PieceColor } from '@shared/types';
import type { MoveClassification } from '@shared/analysis';
import { getClassificationColor } from '@shared/analysis';
import PieceSVG from '../PieceSVG';

const CLASSIFICATIONS: MoveClassification[] = [
  'brilliant', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder',
];

export function AccuracyCard({
  color, accuracy, summary, t,
}: {
  color: PieceColor;
  accuracy: number;
  summary: Record<MoveClassification, number>;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-surface-hover/70 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <PieceSVG type="K" color={color} size={18} />
        <span className="text-xs font-medium text-text">{t(color === 'white' ? 'common.white' : 'common.black')}</span>
      </div>
      <div className="text-2xl font-bold text-text-bright mb-2">{accuracy}%</div>
      <div className="space-y-1">
        {CLASSIFICATIONS.map(cls => {
          const count = summary[cls];
          if (count === 0 && (cls === 'excellent')) return null;
          return (
            <div key={cls} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block ring-1 ring-black/15" style={{ backgroundColor: getClassificationColor(cls) }} />
                <span className="text-text">{t(`analysis.${cls}`)}</span>
              </span>
              <span className="text-text-bright font-mono">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
