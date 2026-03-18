import PieceSVG from './PieceSVG';
import { useTranslation } from '../lib/i18n';
import type { PieceType } from '@shared/types';

interface PieceGuideProps {
  show: boolean;
  onClose: () => void;
}

const PIECES: { type: PieceType; nameKey: string; thai: string; moveKey: string }[] = [
  { type: 'K', nameKey: 'guide.king', thai: 'ขุน', moveKey: 'guide.king_move' },
  { type: 'M', nameKey: 'guide.queen', thai: 'เม็ด', moveKey: 'guide.queen_move' },
  { type: 'S', nameKey: 'guide.bishop', thai: 'โคน', moveKey: 'guide.bishop_move' },
  { type: 'R', nameKey: 'guide.rook', thai: 'เรือ', moveKey: 'guide.rook_move' },
  { type: 'N', nameKey: 'guide.knight', thai: 'ม้า', moveKey: 'guide.knight_move' },
  { type: 'P', nameKey: 'guide.pawn', thai: 'เบี้ย', moveKey: 'guide.pawn_move' },
  { type: 'PM', nameKey: 'guide.promoted', thai: 'เบี้ยหงาย', moveKey: 'guide.promoted_move' },
];

export default function PieceGuide({ show, onClose }: PieceGuideProps) {
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn p-4" onClick={onClose}>
      <div
        className="bg-surface-alt border border-surface-hover rounded-xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-bright">{t('guide.title')}</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text-bright text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          {PIECES.map(({ type, nameKey, thai, moveKey }) => (
            <div key={type} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors">
              <div className="flex gap-1 flex-shrink-0">
                <PieceSVG type={type} color="white" size={36} />
                <PieceSVG type={type} color="black" size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-bright font-semibold text-sm">{t(nameKey)}</span>
                  <span className="text-text-dim text-xs">{thai}</span>
                </div>
                <p className="text-text-dim text-xs mt-0.5">{t(moveKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
