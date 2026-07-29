import { forwardRef } from 'react';
import type { Move } from '@shared/types';
import { posToAlgebraic } from '@shared/engine';

interface VariationToken {
  label: string;
  moveText: string;
  moveIndex: number;
  isSelected: boolean;
}

function formatReviewMove(move: Move): string {
  const from = posToAlgebraic(move.from);
  const dest = posToAlgebraic(move.to);
  const promo = move.promoted ? '=M' : '';
  return `${from}${move.captured ? 'x' : '-'}${dest}${promo}`;
}

function buildVariationTokens(rootMoveIndex: number | null, analysisLine: Move[], selectedMoveIndex: number): VariationToken[] {
  if (rootMoveIndex === null) return [];

  let ply = rootMoveIndex + 1;

  return analysisLine.map((move, index) => {
    const moveNumber = Math.floor(ply / 2) + 1;
    const label = ply % 2 === 0 ? `${moveNumber}.` : `${moveNumber}...`;
    ply += 1;

    return {
      label,
      moveText: formatReviewMove(move),
      moveIndex: index,
      isSelected: index === selectedMoveIndex,
    };
  });
}

export const VariationLine = forwardRef<HTMLDivElement, {
  rootMoveIndex: number | null;
  analysisLine: Move[];
  selectedMoveIndex: number;
  onSelectMove: (moveIndex: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}>(({ rootMoveIndex, analysisLine, selectedMoveIndex, onSelectMove, t }, ref) => {
  const tokens = buildVariationTokens(rootMoveIndex, analysisLine, selectedMoveIndex);

  return (
    <div
      ref={ref}
      data-testid="analysis-variation-line"
      data-root-move-index={rootMoveIndex ?? ''}
      className="ml-6 border-l border-primary/25 pl-3 py-1 text-[12px] text-text"
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-light">
          {t('review.analysis_branch')}
        </span>
        {tokens.map((token) => (
          <span key={`${token.label}-${token.moveText}`} className="contents">
            <span className="text-text-dim">{token.label}</span>
            <button
              type="button"
              onClick={() => onSelectMove(token.moveIndex)}
              data-testid={token.isSelected ? 'analysis-active-variation-move' : undefined}
              aria-current={token.isSelected ? 'step' : undefined}
              className={`rounded px-1.5 py-0.5 text-left transition-colors ${
                token.isSelected
                  ? 'bg-primary/25 text-text-bright ring-1 ring-primary/30'
                  : 'text-text hover:bg-surface-hover/70'
              }`}
            >
              {token.moveText}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
});

VariationLine.displayName = 'VariationLine';
