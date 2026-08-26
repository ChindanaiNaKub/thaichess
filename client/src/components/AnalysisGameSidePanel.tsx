import type { Ref } from 'react';
import {
  GameAnalysis, AnalyzedMove, AnalysisProgress,
  getClassificationColor, getClassificationSymbol,
} from '@shared/analysis';
import type { PositionAnalysisResult } from '@shared/engineAdapter';
import { EvalGraph } from './analysis/EvalGraph';
import { CompactEnginePanel } from './analysis/CompactEnginePanel';
import { VariationLine } from './analysis/VariationLine';
import { type MovePair, type TranslateFn } from './analysisPageHelpers';
import type { usePostGameReview } from '../hooks/usePostGameReview';
import type { GameAnalysisData } from '../queries/analysis';

type ReviewControls = ReturnType<typeof usePostGameReview>;

type AnalysisGameSidePanelProps = {
  t: TranslateFn;
  reviewT: TranslateFn;
  review: ReviewControls;
  gameData: GameAnalysisData;
  analysis: GameAnalysis | null;
  analyzing: boolean;
  gameAnalysisError: string | null;
  progress: AnalysisProgress | null;
  showBestMove: boolean;
  currentPlyIndex: number;
  highlightedMainLineMoveIndex: number;
  currentEval: number;
  currentMate: number | null;
  currentWinningChances: { white: number; black: number };
  currentBestMoveText: string;
  currentPositionAnalysis: PositionAnalysisResult | null;
  currentPositionAnalyzing: boolean;
  currentEngineError: string | null;
  currentAnalyzedMove: AnalyzedMove | null;
  reviewIsProvisional: boolean;
  analysisElapsedSeconds: number;
  movePairs: MovePair[];
  scrollRef: Ref<HTMLDivElement>;
  setActiveMoveElement: (node: HTMLElement | null) => void;
  onShowBestMoveChange: (show: boolean) => void;
  onMoveClick: (index: number) => void;
  onNavigateToStart: () => void;
  onNavigateBackward: () => void;
  onNavigateForward: () => void;
  onNavigateToEnd: () => void;
};

export function AnalysisGameSidePanel({
  t,
  reviewT,
  review,
  gameData,
  analysis,
  analyzing,
  gameAnalysisError,
  progress,
  showBestMove,
  currentPlyIndex,
  highlightedMainLineMoveIndex,
  currentEval,
  currentMate,
  currentWinningChances,
  currentBestMoveText,
  currentPositionAnalysis,
  currentPositionAnalyzing,
  currentEngineError,
  currentAnalyzedMove,
  reviewIsProvisional,
  analysisElapsedSeconds,
  movePairs,
  scrollRef,
  setActiveMoveElement,
  onShowBestMoveChange,
  onMoveClick,
  onNavigateToStart,
  onNavigateBackward,
  onNavigateForward,
  onNavigateToEnd,
}: AnalysisGameSidePanelProps) {
  const analysisVariationsByRoot = new Map(
    review.analysisVariations.map((variation) => [variation.rootMoveIndex, variation.line]),
  );

  const renderVariationLine = (rootMoveIndex: number) => {
    const analysisLine = analysisVariationsByRoot.get(rootMoveIndex);
    if (!analysisLine) return null;

    const isActiveVariation = review.mode === 'analysis' && review.analysisRootMoveIndex === rootMoveIndex;

    return (
      <div key={`variation-${rootMoveIndex}`} className="col-span-3 pb-1">
        <VariationLine
          ref={isActiveVariation && review.selectedAnalysisMoveIndex >= 0 ? setActiveMoveElement : undefined}
          rootMoveIndex={rootMoveIndex}
          analysisLine={analysisLine}
          selectedMoveIndex={isActiveVariation ? review.selectedAnalysisMoveIndex : -1}
          onSelectMove={(moveIndex) => review.jumpToAnalysisVariationMove(rootMoveIndex, moveIndex)}
          t={reviewT}
        />
      </div>
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-2 w-full max-w-[760px] lg:h-[calc(100dvh-6rem)] lg:self-start lg:sticky lg:top-4 lg:overflow-hidden">
      <div className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-surface overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.16)] lg:flex-1">
        <div className="shrink-0 px-3 py-2 border-b border-surface-hover flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-text-bright">{t('moves.title')}</h3>
              {review.mode === 'analysis' && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                  {reviewT('review.analysis_branch')}
                </span>
              )}
          </div>
          <div className="flex items-center gap-1.5">
            {analysis && (
              <label className="flex items-center gap-1.5 text-[11px] text-text cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showBestMove}
                  onChange={e => onShowBestMoveChange(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-primary"
                />
                {t('analysis.show_best')}
              </label>
            )}
            <div className="hidden sm:flex items-center gap-1">
              <button type="button"
                onClick={onNavigateToStart}
                className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
              
                aria-label={t('moves.first_position')}
              >
                ⏮
              </button>
              <button type="button"
                onClick={onNavigateBackward}
                className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
              
                aria-label={t('moves.previous_move')}
              >
                ◀
              </button>
              <button type="button"
                onClick={onNavigateForward}
                className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
              
                aria-label={t('moves.next_move')}
              >
                ▶
              </button>
              <button type="button"
                onClick={onNavigateToEnd}
                className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
              
                aria-label={t('moves.last_move')}
              >
                ⏭
              </button>
            </div>
          </div>
        </div>
        <div ref={scrollRef} data-testid="analysis-move-list" className="max-h-[460px] min-h-[12rem] overflow-y-auto p-1.5 lg:min-h-0 lg:max-h-none lg:flex-1">
          {movePairs.length === 0 ? (
            <div className="text-text-dim text-sm text-center py-4">{t('moves.empty')}</div>
          ) : (
            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 text-[15px] leading-6">
              {renderVariationLine(-1)}
              {movePairs.map(({ num, white, black, whiteIdx, blackIdx, whiteClass, blackClass }, pairIndex) => (
                <div key={num} className="contents">
                  <span className="text-text px-2 py-1 text-right">{num}.</span>
                  <button
                    type="button"
                    ref={highlightedMainLineMoveIndex === whiteIdx ? setActiveMoveElement : undefined}
                    data-testid={`analysis-main-move-${whiteIdx}`}
                    className={`bg-transparent border-0 text-left px-2 py-1 font-mono rounded cursor-pointer transition-colors ${
                      highlightedMainLineMoveIndex === whiteIdx ? 'move-active shadow-[inset_0_0_0_1px_rgba(134,204,99,0.2)]' : 'move-clickable'
                    }`}
                    onClick={() => onMoveClick(whiteIdx)}
                  >
                    <span className="text-text-bright">{white}</span>
                    {whiteClass && (
                      <span className="ml-0.5 text-xs font-bold" style={{ color: getClassificationColor(whiteClass) }}>
                        {getClassificationSymbol(whiteClass)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    ref={highlightedMainLineMoveIndex === blackIdx ? setActiveMoveElement : undefined}
                    data-testid={black ? `analysis-main-move-${blackIdx}` : undefined}
                    className={`bg-transparent border-0 text-left px-2 py-1 font-mono rounded ${
                      black
                        ? highlightedMainLineMoveIndex === blackIdx ? 'move-active cursor-pointer shadow-[inset_0_0_0_1px_rgba(134,204,99,0.2)]' : 'move-clickable cursor-pointer'
                        : ''
                    }`}
                    onClick={() => black && onMoveClick(blackIdx)}
                    disabled={!black}
                  >
                    {black && (
                      <>
                        <span className="text-text-bright">{black}</span>
                        {blackClass && (
                          <span className="ml-0.5 text-xs font-bold" style={{ color: getClassificationColor(blackClass) }}>
                            {getClassificationSymbol(blackClass)}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  {review.analysisVariations.flatMap((variation) => (
                      variation.rootMoveIndex >= 0 && Math.floor(variation.rootMoveIndex / 2) === pairIndex
                        ? [renderVariationLine(variation.rootMoveIndex)]
                        : []
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 border-t border-surface-hover px-2.5 py-2 flex flex-wrap items-center gap-2">
          {review.mode === 'analysis' ? (
            <>
              <button type="button"
                onClick={review.returnToMainLine}
                className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-1.5 text-xs font-semibold text-text-bright transition-colors hover:bg-surface-hover"
              >
                {reviewT('review.return_to_game')}
              </button>
              <button type="button"
                onClick={review.resetAnalysis}
                disabled={!review.canResetAnalysis}
                className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-light transition-colors hover:bg-primary/15 disabled:opacity-50"
              >
                {reviewT('review.reset_variation')}
              </button>
            </>
          ) : (
            <button type="button"
              onClick={review.enterAnalysis}
              disabled={!review.canEnterAnalysis}
              data-testid="analysis-enter-analysis"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
            >
              {reviewT('review.enter_analysis')}
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <CompactEnginePanel
          currentPlyIndex={currentPlyIndex}
          moveCount={gameData.moves.length}
          currentEval={currentEval}
          currentMate={currentMate}
          winningChances={currentWinningChances}
          turn={review.currentState.turn}
          bestMoveText={currentBestMoveText}
          principalVariation={currentPositionAnalysis?.principalVariation ?? []}
          analyzing={currentPositionAnalyzing}
          error={currentEngineError || gameAnalysisError}
          reviewMode={review.mode}
          currentAnalyzedMove={currentAnalyzedMove}
          reviewIsProvisional={reviewIsProvisional}
          analyzingGame={analyzing}
          progress={progress}
          analysisElapsedSeconds={analysisElapsedSeconds}
          t={t}
          reviewT={reviewT}
        />
      </div>

      {analysis && analysis.evaluations.length > 1 && (
        <div className="shrink-0 rounded-xl border border-white/10 bg-surface p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
          <EvalGraph
            evaluations={analysis.evaluations}
            moves={analysis.moves}
            currentIndex={currentPlyIndex}
            onClickIndex={onMoveClick}
          />
        </div>
      )}
    </div>
  );
}
