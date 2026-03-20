import type { Move, PieceColor, PieceType } from '@shared/types';
import PieceSVG from './PieceSVG';

type CapturedPiecesPanelProps = {
  moves: Move[];
  topColor: PieceColor;
  topLabel: string;
  bottomColor: PieceColor;
  bottomLabel: string;
};

const DISPLAY_ORDER: PieceType[] = ['R', 'N', 'S', 'M', 'PM', 'P'];

function getLostPieces(moves: Move[], color: PieceColor): PieceType[] {
  return moves
    .filter((move) => move.captured?.color === color)
    .map((move) => move.captured!.type);
}

function getCounts(pieces: PieceType[]): Array<{ type: PieceType; count: number }> {
  return DISPLAY_ORDER
    .map((type) => ({
      type,
      count: pieces.filter((piece) => piece === type).length,
    }))
    .filter((entry) => entry.count > 0);
}

function CapturedRow({
  color,
  label,
  moves,
}: {
  color: PieceColor;
  label: string;
  moves: Move[];
}) {
  const counts = getCounts(getLostPieces(moves, color));
  const total = counts.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-text-dim">
        <span>{label}</span>
        <span>{total}</span>
      </div>
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        {counts.map(({ type, count }) => (
          <div
            key={`${color}-${type}`}
            className="flex items-center gap-1 rounded-md border border-surface-hover/70 bg-surface px-2 py-1"
          >
            <PieceSVG type={type} color={color} size={18} />
            <span className="text-xs font-semibold text-text-bright">x{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CapturedPiecesPanel({
  moves,
  topColor,
  topLabel,
  bottomColor,
  bottomLabel,
}: CapturedPiecesPanelProps) {
  return (
    <section className="rounded-xl border border-surface-hover bg-surface/70 p-3">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-text-dim">
        Captures
      </div>
      <div className="space-y-2.5">
        <CapturedRow color={topColor} label={topLabel} moves={moves} />
        <CapturedRow color={bottomColor} label={bottomLabel} moves={moves} />
      </div>
    </section>
  );
}
