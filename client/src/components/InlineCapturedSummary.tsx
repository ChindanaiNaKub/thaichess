import type { PieceColor, PieceType } from '@shared/types';
import PieceSVG from './PieceSVG';

interface CapturedPieceSummary {
  type: PieceType;
  count: number;
  capturedColor: PieceColor;
}

interface InlineCapturedSummaryProps {
  capturedPieces: CapturedPieceSummary[];
  materialDelta?: number | null;
}

function formatMaterial(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getCapturedPawnEntry(capturedPieces: CapturedPieceSummary[]) {
  return capturedPieces.find((piece) => piece.type === 'P') ?? null;
}

export default function InlineCapturedSummary({
  capturedPieces,
  materialDelta = null,
}: InlineCapturedSummaryProps) {
  const pawnEntry = getCapturedPawnEntry(capturedPieces);

  if (!materialDelta && !pawnEntry) return null;

  return (
    <span
      className="inline-flex max-w-full shrink items-center gap-1 overflow-hidden rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary-light lg:px-1.5"
      data-testid="inline-captured-summary"
    >
      {pawnEntry && (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-primary-light/90">
          <PieceSVG
            type="P"
            color={pawnEntry.capturedColor}
            size={10}
            className="h-[10px] w-[10px]"
          />
          <span>x{pawnEntry.count}</span>
        </span>
      )}
      {materialDelta && (
        <span className="shrink-0 whitespace-nowrap" data-testid="inline-material-delta">
          +{formatMaterial(materialDelta)}
        </span>
      )}
    </span>
  );
}
