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
const PIECE_VALUES: Record<PieceType, number> = {
  K: 0,
  R: 5,
  N: 3,
  S: 2.5,
  M: 2,
  PM: 2,
  P: 1,
};

function getMoveColor(index: number): PieceColor {
  return index % 2 === 0 ? 'white' : 'black';
}

function getCapturedPieces(moves: Move[], captorColor: PieceColor): PieceType[] {
  return moves
    .filter((move, index) => move.captured && getMoveColor(index) === captorColor)
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

function getMaterialWon(pieces: PieceType[]): number {
  return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0);
}

function formatMaterial(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function CapturedRow({
  captorColor,
  label,
  moves,
}: {
  captorColor: PieceColor;
  label: string;
  moves: Move[];
}) {
  const capturedPieces = getCapturedPieces(moves, captorColor);
  const counts = getCounts(capturedPieces);
  const total = counts.reduce((sum, entry) => sum + entry.count, 0);
  const materialWon = getMaterialWon(capturedPieces);
  const capturedColor: PieceColor = captorColor === 'white' ? 'black' : 'white';

  return (
    <div className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-text-dim">
        <span>Captured by {label}</span>
        <span>{total > 0 ? `+${formatMaterial(materialWon)}` : '0'}</span>
      </div>
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        {counts.map(({ type, count }) => (
          <div
            key={`${captorColor}-${type}`}
            className="flex items-center gap-1 rounded-md border border-surface-hover/70 bg-surface px-2 py-1"
          >
            <PieceSVG type={type} color={capturedColor} size={18} />
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
  const topCaptured = getCapturedPieces(moves, topColor);
  const bottomCaptured = getCapturedPieces(moves, bottomColor);
  const topMaterial = getMaterialWon(topCaptured);
  const bottomMaterial = getMaterialWon(bottomCaptured);
  const materialDiff = topMaterial - bottomMaterial;

  const summary = materialDiff === 0
    ? 'Material even'
    : `${materialDiff > 0 ? topLabel : bottomLabel} +${formatMaterial(Math.abs(materialDiff))}`;

  return (
    <section className="rounded-xl border border-surface-hover bg-surface/70 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-text-dim">
        Material
      </div>
      <div className="mb-3 text-sm font-semibold text-text-bright">
        {summary}
      </div>
      <div className="space-y-2.5">
        <CapturedRow captorColor={topColor} label={topLabel} moves={moves} />
        <CapturedRow captorColor={bottomColor} label={bottomLabel} moves={moves} />
      </div>
    </section>
  );
}
