import { formatEval } from '@shared/analysis';

export function EvalBar({ eval: rawEval, mate }: { eval: number; mate?: number | null }) {
  const clamped = Math.max(-2000, Math.min(2000, rawEval));
  const whitePercent = 50 + (clamped / 2000) * 50;
  const isWhiteAdvantage = rawEval >= 0;

  return (
    <div className="eval-bar w-6 sm:w-7 rounded-lg overflow-hidden flex flex-col relative shadow-[0_10px_20px_rgba(0,0,0,0.18)]" style={{ minHeight: '100%' }}>
      <div
        className="transition-[height] duration-500 ease-out"
        style={{ backgroundColor: 'oklch(0.23 0.015 65)', height: `${100 - whitePercent}%` }}
      />
      <div
        className="transition-[height] duration-500 ease-out"
        style={{ backgroundColor: 'oklch(0.93 0.01 65)', height: `${whitePercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[9px] font-bold tracking-[0.08em]"
          style={{
            color: isWhiteAdvantage ? 'oklch(0.16 0.015 65)' : 'oklch(0.92 0.01 65)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
          }}
        >
          {formatEval(rawEval, mate)}
        </span>
      </div>
    </div>
  );
}
