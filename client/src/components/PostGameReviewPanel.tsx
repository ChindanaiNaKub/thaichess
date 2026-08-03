import type { Move } from '@shared/types';
import { posToAlgebraic } from '@shared/engine';
import { formatEval } from '@shared/analysis';
import type { PositionAnalysisResult } from '@shared/engineAdapter';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';
import { MakrukChromeIcon } from './MakrukChromeIcon';

type ReviewMode = 'mainLine' | 'analysis';

interface PostGameReviewPanelProps {
  mode: ReviewMode;
  selectedMainLineMoveIndex: number;
  analysisRootMoveIndex: number | null;
  analysisLine: Move[];
  controls: {
    enterAnalysis: boolean;
    resetAnalysis: boolean;
    stepBackward: boolean;
    stepForward: boolean;
  };
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

const navButtonClass =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-surface-hover/80 bg-surface px-2 text-text-dim transition-colors hover:bg-surface-hover hover:text-text-bright disabled:opacity-50';

function BranchNavIcon({ kind }: { kind: 'root' | 'prev' | 'next' | 'leaf' }) {
  return (
    <MakrukChromeIcon size={14} className="shrink-0">
      {kind === 'root' && (
        <>
          <path d="M22 22v36" />
          <path d="M54 24L28 40l26 16" />
        </>
      )}
      {kind === 'prev' && <path d="M50 22L26 40l24 18" />}
      {kind === 'next' && <path d="M30 22l24 18-24 18" />}
      {kind === 'leaf' && (
        <>
          <path d="M58 22v36" />
          <path d="M26 24l26 16-26 16" />
        </>
      )}
    </MakrukChromeIcon>
  );
}

export default function PostGameReviewPanel({
  mode,
  selectedMainLineMoveIndex,
  analysisRootMoveIndex,
  analysisLine,
  controls,
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
    <div className="rounded-xl border border-surface-hover/80 bg-surface-alt/90 p-3">
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
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold normal-case tracking-normal ${
          mode === 'analysis'
            ? 'border-primary/30 bg-primary/10 text-primary-light'
            : 'border-surface-hover/80 bg-surface-alt/90 text-text-dim'
        }`}>
          {mode === 'analysis' ? reviewT('review.analysis_status') : reviewT('review.main_status')}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {mode === 'analysis' ? (
          <>
            <button type="button"
              onClick={onReturnToMainLine}
              className="ui-btn-secondary px-3 py-2 text-sm"
            >
              {reviewT('review.return_to_game')}
            </button>
            <button type="button"
              onClick={onResetAnalysis}
              disabled={!controls.resetAnalysis}
              className="ui-btn-primary px-3 py-2 text-sm disabled:opacity-50"
            >
              {reviewT('review.reset_variation')}
            </button>
          </>
        ) : (
          <button type="button"
            onClick={onEnterAnalysis}
            disabled={!controls.enterAnalysis}
            className="ui-btn-primary sm:col-span-2 px-3 py-2 text-sm disabled:opacity-50"
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
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <button type="button"
              onClick={onJumpToStart}
              className={navButtonClass}
              title={reviewT('review.branch_root')}
              aria-label={reviewT('review.branch_root')}
            >
              <BranchNavIcon kind="root" />
            </button>
            <button type="button"
              onClick={onStepBackward}
              disabled={!controls.stepBackward}
              className={navButtonClass}
              title={reviewT('review.branch_prev')}
              aria-label={reviewT('review.branch_prev')}
            >
              <BranchNavIcon kind="prev" />
            </button>
            <button type="button"
              onClick={onStepForward}
              disabled={!controls.stepForward}
              className={navButtonClass}
              title={reviewT('review.branch_next')}
              aria-label={reviewT('review.branch_next')}
            >
              <BranchNavIcon kind="next" />
            </button>
            <button type="button"
              onClick={onJumpToEnd}
              className={navButtonClass}
              title={reviewT('review.branch_leaf')}
              aria-label={reviewT('review.branch_leaf')}
            >
              <BranchNavIcon kind="leaf" />
            </button>
          </div>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            {reviewT('review.current_variation')}
          </div>
          <div className="mt-2 rounded-lg border border-surface-hover/80 bg-surface px-3 py-2 text-xs text-text">
            {analysisLine.length > 0 ? analysisLine.map(formatMove).join(' ') : reviewT('review.variation_empty')}
          </div>
        </>
      )}

      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
        {reviewT('review.engine')}
      </div>
      <div className="mt-2 rounded-lg border border-surface-hover/80 bg-surface px-3 py-3">
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
                <div className="rounded-lg border border-surface-hover/80 bg-surface-alt px-3 py-2 font-mono text-xs text-text">
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
