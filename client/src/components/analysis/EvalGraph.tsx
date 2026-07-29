import { useRef } from 'react';
import type { AnalyzedMove } from '@shared/analysis';
import { getClassificationColor } from '@shared/analysis';

const EVAL_GRAPH_PADDING = { top: 4, bottom: 4, left: 2, right: 2 };

export function EvalGraph({
  evaluations, moves, currentIndex, onClickIndex,
}: {
  evaluations: number[];
  moves: AnalyzedMove[];
  currentIndex: number;
  onClickIndex: (index: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 320;
  const height = 80;
  const padding = EVAL_GRAPH_PADDING;
  const graphW = width - padding.left - padding.right;
  const graphH = height - padding.top - padding.bottom;

  const maxAbs = Math.max(500, ...evaluations.map(e => Math.abs(e)));
  const clamp = (v: number) => Math.max(-maxAbs, Math.min(maxAbs, v));

  const points = evaluations.map((e, i) => {
    const x = padding.left + (i / Math.max(1, evaluations.length - 1)) * graphW;
    const y = padding.top + ((maxAbs - clamp(e)) / (2 * maxAbs)) * graphH;
    return { x, y };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const fillPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + graphH} L ${padding.left} ${padding.top + graphH} Z`;

  const zeroY = padding.top + graphH / 2;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - padding.left) / graphW;
    const moveIdx = Math.round(ratio * (evaluations.length - 1)) - 1;
    onClickIndex(Math.max(-1, Math.min(moves.length - 1, moveIdx)));
  };

  const currentX = currentIndex >= 0
    ? padding.left + ((currentIndex + 1) / Math.max(1, evaluations.length - 1)) * graphW
    : padding.left;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full cursor-pointer rounded-lg"
      onClick={handleClick}
      aria-hidden="true"
      focusable="false"
    >
      <rect x={padding.left} y={padding.top} width={graphW} height={graphH} rx="8" fill="rgba(255,255,255,0.03)" />
      <rect x={padding.left} y={padding.top} width={graphW} height={graphH / 2} rx="8" fill="rgba(255,255,255,0.05)" />
      <rect x={padding.left} y={zeroY} width={graphW} height={graphH / 2} fill="rgba(0,0,0,0.14)" />

      <line x1={padding.left} y1={zeroY} x2={padding.left + graphW} y2={zeroY} stroke="rgba(255,255,255,0.22)" strokeWidth="0.75" />

      <path d={fillPath} fill="rgba(255,255,255,0.12)" />

      {moves.map((m, i) => {
        const pt = points[i + 1];
        if (!pt) return null;
        const cls = m.classification;
        if (cls === 'brilliant' || cls === 'best' || cls === 'excellent' || cls === 'good') return null;
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={cls === 'blunder' ? 3 : 2}
            fill={getClassificationColor(cls)}
            opacity={0.95}
          />
        );
      })}

      <path d={pathData} fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="1.75" />

      <line x1={currentX} y1={padding.top} x2={currentX} y2={padding.top + graphH} stroke="var(--color-primary-light)" strokeWidth="1.5" opacity="0.95" />
    </svg>
  );
}
