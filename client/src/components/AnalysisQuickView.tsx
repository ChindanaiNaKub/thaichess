import type { PieceColor } from '@shared/types';
import { formatEval } from '@shared/analysis';
import type { PositionAnalysisResult } from '@shared/engineAdapter';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Header from './Header';
import { EvalBar } from './analysis/EvalBar';
import { CompactEnginePanel } from './analysis/CompactEnginePanel';
import { VariationLine } from './analysis/VariationLine';
import type { TranslateFn } from './analysisPageHelpers';
import type { usePostGameReview } from '../hooks/usePostGameReview';

type ReviewControls = ReturnType<typeof usePostGameReview>;

type AnalysisQuickViewProps = {
  t: TranslateFn;
  reviewT: TranslateFn;
  review: ReviewControls;
  viewAs: PieceColor;
  currentEval: number;
  currentMate: number | null;
  currentWinningChances: { white: number; black: number };
  currentBestMoveText: string;
  currentBestMoveArrow: Arrow[];
  arrows: Arrow[];
  currentPositionAnalysis: PositionAnalysisResult | null;
  currentPositionAnalyzing: boolean;
  currentEngineError: string | null;
  analysisElapsedSeconds: number;
  onViewAsChange: (color: PieceColor) => void;
  onArrowsChange: (arrows: Arrow[]) => void;
  onNavigateToStart: () => void;
  onNavigateBackward: () => void;
  onNavigateForward: () => void;
  onNavigateToEnd: () => void;
  onResetQuickAnalysis: () => void;
  onOpenEditor: () => void;
};

export function AnalysisQuickView({
  t,
  reviewT,
  review,
  viewAs,
  currentEval,
  currentMate,
  currentWinningChances,
  currentBestMoveText,
  currentBestMoveArrow,
  arrows,
  currentPositionAnalysis,
  currentPositionAnalyzing,
  currentEngineError,
  analysisElapsedSeconds,
  onViewAsChange,
  onArrowsChange,
  onNavigateToStart,
  onNavigateBackward,
  onNavigateForward,
  onNavigateToEnd,
  onResetQuickAnalysis,
  onOpenEditor,
}: AnalysisQuickViewProps) {
  const quickSelectedPlyIndex = review.mode === 'analysis' ? review.selectedAnalysisMoveIndex : review.selectedMainLineMoveIndex;
  const quickMoveCount = review.analysisLine.length;
  const quickVariationLine = review.analysisLine.length > 0 ? (
    <VariationLine
      rootMoveIndex={null}
      analysisLine={review.analysisLine}
      selectedMoveIndex={review.selectedAnalysisMoveIndex}
      onSelectMove={review.jumpToAnalysisMove}
      t={reviewT}
    />
  ) : null;

  return (
    <div data-testid="analysis-quick-view" className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <Header subtitle={t('analysis.quick.title')} />

      <main id="main-content" className="flex-1 flex items-start justify-center px-4 py-4 overflow-y-auto">
        <div className="grid w-full max-w-[1240px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start">
          <div className="flex gap-2 w-full max-w-[760px] lg:max-w-[calc(100vh-6rem)] lg:sticky lg:top-4 lg:self-start">
            <EvalBar eval={currentEval} mate={currentMate} />

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm w-full justify-between rounded-lg border border-surface-hover bg-surface-alt/80 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-text-dim text-xs">{t('local.view_as')}</span>
                  <button type="button"
                    onClick={() => onViewAsChange('white')}
                    className={`px-3 py-1 rounded text-xs ${viewAs === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('common.white')}
                  </button>
                  <button type="button"
                    onClick={() => onViewAsChange('black')}
                    className={`px-3 py-1 rounded text-xs ${viewAs === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('common.black')}
                  </button>
                </div>
                <div className="text-text-dim text-xs">
                  {formatEval(currentEval, currentMate)}
                </div>
              </div>

              <BoardErrorBoundary onRetry={() => window.location.reload()}>
                <Board
                  board={review.currentState.board}
                  playerColor={viewAs}
                  draggableColor={review.currentState.turn}
                  isMyTurn={review.mode === 'analysis'}
                  legalMoves={review.mode === 'analysis' ? review.legalMoves : []}
                  selectedSquare={review.mode === 'analysis' ? review.selectedSquare : null}
                  lastMove={review.currentLastMove}
                  isCheck={review.currentState.isCheck}
                  checkSquare={review.currentCheckSquare}
                  onSquareClick={review.handleSquareClick}
                  onPieceDrop={review.handlePieceDrop}
                  disabled={review.mode !== 'analysis'}
                  arrows={[...currentBestMoveArrow, ...arrows]}
                  onArrowsChange={onArrowsChange}
                />
              </BoardErrorBoundary>

              <div className="flex items-center justify-center gap-1 rounded-lg border border-surface-hover bg-surface-alt/80 px-2 py-1.5">
                <button type="button"
                  onClick={onNavigateToStart}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                  aria-label={t('analysis.quick.to_start')}
                >
                  ⏮
                </button>
                <button type="button"
                  onClick={onNavigateBackward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                  aria-label={t('analysis.quick.back')}
                >
                  ◀
                </button>
                <button type="button"
                  onClick={onNavigateForward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                  aria-label={t('analysis.quick.forward')}
                >
                  ▶
                </button>
                <button type="button"
                  onClick={onNavigateToEnd}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                  aria-label={t('analysis.quick.to_end')}
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 w-full max-w-[760px] lg:self-start lg:sticky lg:top-4">
            <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-bright">{t('analysis.quick.title')}</h2>
                  <p className="mt-1 text-sm text-text-dim">{t('analysis.quick.desc')}</p>
                </div>
                <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                  {reviewT('review.analysis_branch')}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => onViewAsChange(viewAs === 'white' ? 'black' : 'white')}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text transition-colors hover:bg-surface-hover"
                >
                  {t('analysis.quick.flip_board')}
                </button>
                <button type="button"
                  onClick={onResetQuickAnalysis}
                  disabled={!review.canResetAnalysis && review.analysisLine.length === 0}
                  className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/15 disabled:opacity-50"
                >
                  {t('analysis.quick.reset')}
                </button>
                <button type="button"
                  onClick={onOpenEditor}
                  className="col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                >
                  {t('analysis.quick.open_editor')}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-text-bright">{t('analysis.quick.variation')}</h3>
                <span className="text-xs text-text-dim">
                  {t('analysis.quick.moves', { count: quickMoveCount })}
                </span>
              </div>
              <div className="mt-3 min-h-20 rounded-lg border border-surface-hover bg-surface-alt/70 px-2 py-3">
                {quickVariationLine ?? (
                  <p className="px-2 text-sm text-text-dim">{t('analysis.quick.empty_variation')}</p>
                )}
              </div>
            </div>

            <CompactEnginePanel
              currentPlyIndex={quickSelectedPlyIndex}
              moveCount={quickMoveCount}
              currentEval={currentEval}
              currentMate={currentMate}
              winningChances={currentWinningChances}
              turn={review.currentState.turn}
              bestMoveText={currentBestMoveText}
              principalVariation={currentPositionAnalysis?.principalVariation ?? []}
              analyzing={currentPositionAnalyzing}
              error={currentEngineError}
              reviewMode={review.mode}
              currentAnalyzedMove={null}
              reviewIsProvisional={false}
              analyzingGame={false}
              progress={null}
              analysisElapsedSeconds={analysisElapsedSeconds}
              t={t}
              reviewT={reviewT}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
