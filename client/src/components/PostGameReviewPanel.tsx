import type { Move } from '@shared/types';
import { posToAlgebraic } from '@shared/engine';
import { formatEval } from '@shared/analysis';
import type { PositionAnalysisResult } from '@shared/engineAdapter';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';

type ReviewMode = 'mainLine' | 'analysis';

interface PostGameReviewPanelProps {
  mode: ReviewMode;
  selectedMainLineMoveIndex: number;
  analysisRootMoveIndex: number | null;
  analysisLine: Move[];
  canEnterAnalysis: boolean;
  canResetAnalysis: boolean;
  canStepBackward: boolean;
  canStepForward: boolean;
  onEnterAnalysis: () => void;
  onReturnToMainLine: () => void;
  onResetAnalysis: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  engineAnalysis: PositionAnalysisResult | null;
  engineAnalyzing: boolean;
  engineError: string | null;
}

function formatMove(move: Move): string {
  const from = posToAlgebraic(move.from);
  const to = posToAlgebraic(move.to);
  const promotion = move.promoted ? '=M' : '';
  return `${from}${move.captured ? 'x' : '-'}${to}${promotion}`;
}

function formatBranchAnchor(moveIndex: number | null, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (moveIndex === null || moveIndex < 0) {
    return t('review.from_start');
  }

  return t('review.from_move', { move: moveIndex + 1 });
}

export default function PostGameReviewPanel({
  mode,
  selectedMainLineMoveIndex,
  analysisRootMoveIndex,
  analysisLine,
  canEnterAnalysis,
  canResetAnalysis,
  canStepBackward,
  canStepForward,
  onEnterAnalysis,
  onReturnToMainLine,
  onResetAnalysis,
  onStepBackward,
  onStepForward,
  onJumpToStart,
  onJumpToEnd,
  engineAnalysis,
  engineAnalyzing,
  engineError,
}: PostGameReviewPanelProps) {
  const { t } = useTranslation();
  const reviewT = useReviewCopy();
  const branchAnchor = formatBranchAnchor(analysisRootMoveIndex, reviewT);
  const bestMoveText = engineAnalysis?.bestMove
    ? `${posToAlgebraic(engineAnalysis.bestMove.from)}-${posToAlgebraic(engineAnalysis.bestMove.to)}`
    : reviewT('review.no_best_move');

  return (
    <div className="rounded-xl border border-surface-hover bg-surface-alt/90 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            {reviewT('review.title')}
          </div>
          <div className="mt-1 text-sm font-semibold text-text-bright">
            {mode === 'analysis' ? reviewT('review.analysis_branch') : reviewT('review.main_line')}
          </div>
          <div className="mt-1 text-xs text-text-dim">
            {mode === 'analysis'
              ? branchAnchor
              : selectedMainLineMoveIndex < 0
                ? reviewT('review.official_start')
                : reviewT('review.official_move', { move: selectedMainLineMoveIndex + 1 })}
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
          mode === 'analysis'
            ? 'bg-primary/15 text-primary-light'
            : 'bg-surface text-text-dim border border-surface-hover'
        }`}>
          {mode === 'analysis' ? reviewT('review.analysis_branch') : reviewT('review.main_line')}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {mode === 'analysis' ? (
          <>
            <button
              onClick={onReturnToMainLine}
              className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
            >
              {reviewT('review.return_to_game')}
            </button>
            <button
              onClick={onResetAnalysis}
              disabled={!canResetAnalysis}
              className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/15 disabled:opacity-50"
            >
              {reviewT('review.reset_variation')}
            </button>
          </>
        ) : (
          <button
            onClick={onEnterAnalysis}
            disabled={!canEnterAnalysis}
            className="sm:col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            {reviewT('review.enter_analysis')}
          </button>
        )}
      </div>

      {mode === 'analysis' && (
        <>
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            {reviewT('review.branch_navigation')}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1">
            <button
              onClick={onJumpToStart}
              className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors"
              title={reviewT('review.branch_root')}
            >
              ⏮
            </button>
            <button
              onClick={onStepBackward}
              disabled={!canStepBackward}
              className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors disabled:opacity-50"
              title={reviewT('review.branch_prev')}
            >
              ◀
            </button>
            <button
              onClick={onStepForward}
              disabled={!canStepForward}
              className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors disabled:opacity-50"
              title={reviewT('review.branch_next')}
            >
              ▶
            </button>
            <button
              onClick={onJumpToEnd}
              className="px-2.5 py-1 text-xs rounded bg-surface hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors"
              title={reviewT('review.branch_leaf')}
            >
              ⏭
            </button>
          </div>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            {reviewT('review.current_variation')}
          </div>
          <div className="mt-2 rounded-lg border border-surface-hover bg-surface px-3 py-2 text-xs text-text">
            {analysisLine.length > 0 ? analysisLine.map(formatMove).join(' ') : reviewT('review.variation_empty')}
          </div>
        </>
      )}

      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
        {reviewT('review.engine')}
      </div>
      <div className="mt-2 rounded-lg border border-surface-hover bg-surface px-3 py-3">
        {engineAnalyzing ? (
          <div className="text-sm text-text-dim">{reviewT('review.engine_loading')}</div>
        ) : engineError ? (
          <div className="text-sm text-danger">{reviewT('review.engine_error')}</div>
        ) : engineAnalysis ? (
          <div className="space-y-2 text-sm text-text">
            <div className="flex items-center justify-between gap-3">
              <span>{t('analysis.editor.eval')}</span>
              <span className="font-mono text-text-bright">{formatEval(engineAnalysis.evaluation, engineAnalysis.mate)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t('analysis.editor.best_move')}</span>
              <span className="font-mono text-text-bright">{bestMoveText}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t('analysis.editor.source')}</span>
              <span className="text-text-bright">{engineAnalysis.stats.source}</span>
            </div>
            {engineAnalysis.stats.depth && (
              <div className="flex items-center justify-between gap-3">
                <span>{t('analysis.editor.depth')}</span>
                <span className="font-mono text-text-bright">{engineAnalysis.stats.depth}</span>
              </div>
            )}
            {engineAnalysis.principalVariation.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                  {t('analysis.editor.pv')}
                </div>
                <div className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 font-mono text-xs text-text">
                  {engineAnalysis.principalVariation.join(' ')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-text-dim">{reviewT('review.engine_idle')}</div>
        )}
      </div>
    </div>
  );
}
