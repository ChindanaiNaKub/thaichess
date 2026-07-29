import { useState } from 'react';
import type { PieceColor } from '@shared/types';
import { posToAlgebraic } from '@shared/engine';
import {
  type AnalyzedMove,
  type AnalysisProgress,
  formatEval,
  getClassificationColor,
  getClassificationIcon,
  getClassificationSymbol,
} from '@shared/analysis';
import { EvalBar } from './EvalBar';

export function CompactEnginePanel({
  currentPlyIndex,
  moveCount,
  currentEval,
  currentMate,
  winningChances,
  turn,
  bestMoveText,
  principalVariation,
  analyzing,
  error,
  reviewMode,
  currentAnalyzedMove,
  reviewIsProvisional,
  analyzingGame,
  progress,
  analysisElapsedSeconds,
  t,
  reviewT,
}: {
  currentPlyIndex: number;
  moveCount: number;
  currentEval: number;
  currentMate: number | null;
  winningChances: { white: number; black: number };
  turn: PieceColor;
  bestMoveText: string;
  principalVariation: string[];
  analyzing: boolean;
  error: string | null;
  reviewMode: 'mainLine' | 'analysis';
  currentAnalyzedMove: AnalyzedMove | null;
  reviewIsProvisional: boolean;
  analyzingGame: boolean;
  progress: AnalysisProgress | null;
  analysisElapsedSeconds: number;
  t: (key: string, params?: Record<string, string | number>) => string;
  reviewT: (key: 'analysis.current_position' | 'analysis.position_before_start' | 'analysis.position_after_move' | 'analysis.turn_to_move' | 'analysis.win_chances' | 'analysis.best_continuation' | 'analysis.eval_swing' | 'analysis.expected_score' | 'review.engine_loading' | 'review.engine_error' | 'review.engine' | 'review.analysis_branch', params?: Record<string, string | number>) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const classification = currentAnalyzedMove?.classification ?? null;
  const classificationColor = classification ? getClassificationColor(classification) : null;
  const swing = currentAnalyzedMove ? currentAnalyzedMove.evalAfter - currentAnalyzedMove.evalBefore : null;
  const swingLabel = swing === null ? null : `${swing >= 0 ? '+' : ''}${formatEval(swing)}`;
  const currentMoveText = currentAnalyzedMove
    ? `${posToAlgebraic(currentAnalyzedMove.move.from)}${currentAnalyzedMove.move.captured ? 'x' : '-'}${posToAlgebraic(currentAnalyzedMove.move.to)}`
    : null;
  const pvText = principalVariation.join(' ');
  const pvPreview = principalVariation.slice(0, 5).join(' ');
  const positionLabel = currentPlyIndex < 0
    ? reviewT('analysis.position_before_start')
    : reviewT('analysis.position_after_move', { move: currentPlyIndex + 1, total: moveCount });

  return (
    <div className="rounded-xl border border-white/10 bg-surface p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h3 className="text-sm font-semibold text-text-bright">{reviewT('review.engine')}</h3>
          {reviewMode === 'analysis' && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
              {reviewT('review.analysis_branch')}
            </span>
          )}
          {reviewIsProvisional && (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
              Local
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 text-[11px] font-semibold text-text whitespace-nowrap">
            {positionLabel}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg border border-surface-hover bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-text transition-colors hover:bg-surface-hover"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="text-[11px] text-text-dim">{t('analysis.editor.eval')}</div>
          <div className="font-mono text-lg font-semibold text-text-bright">{formatEval(currentEval, currentMate)}</div>
        </div>
        <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="text-[11px] text-text-dim">{t('analysis.editor.best_move')}</div>
          <div className="font-mono font-semibold text-text-bright truncate">
            {analyzing ? reviewT('review.engine_loading') : error || bestMoveText}
          </div>
        </div>
      </div>

      {currentAnalyzedMove && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 font-mono text-text-bright">
            {currentMoveText}
          </span>
          {classification && classificationColor && (
            <span
              className="rounded-full px-2 py-1 font-semibold"
              style={{ backgroundColor: `${classificationColor}22`, color: classificationColor }}
            >
              {t(`analysis.${classification}`)}
            </span>
          )}
          {swingLabel && (
            <span className={`rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 font-mono ${swing !== null && swing >= 0 ? 'text-primary-light' : 'text-danger'}`}>
              {reviewT('analysis.eval_swing')} {swingLabel}
            </span>
          )}
          <span className="rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 font-semibold text-text">
            {reviewT('analysis.expected_score')} {Math.round(currentAnalyzedMove.winPercentBefore)}% {'->'} {Math.round(currentAnalyzedMove.winPercentAfter)}%
          </span>
        </div>
      )}

      {!expanded && pvPreview && (
        <div className="mt-2 rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            <span>PV</span>
            <span className="text-[10px] normal-case tracking-normal text-text-dim">{pvPreview}</span>
          </div>
        </div>
      )}

      {analyzingGame && (
        <div className="mt-2 rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-[11px] text-text-dim">
            <span>{t('analysis.analyzing')}</span>
            <span>{progress ? `${progress.current}/${progress.total}` : t('analysis.elapsed', { seconds: analysisElapsedSeconds })}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-surface">
            <div
              className="h-1.5 rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress ? (progress.current / progress.total) * 100 : 18}%` }}
            />
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
            <div className="text-[11px] text-text-dim">{reviewT('analysis.turn_to_move')}</div>
            <div className="font-semibold text-text-bright">{t(turn === 'white' ? 'common.white' : 'common.black')}</div>
          </div>
          <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
            <div className="text-[11px] text-text-dim">{reviewT('analysis.win_chances')}</div>
            <div className="font-semibold text-text-bright">{winningChances.white}% / {winningChances.black}%</div>
          </div>
          {pvText && (
            <div className="sm:col-span-2 rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                PV
              </div>
              <div className="font-mono text-xs leading-5 text-text-bright break-words">{pvText}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
