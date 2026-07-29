import type { Ref } from 'react';
import type { PieceColor } from '@shared/types';
import {
  GameAnalysis, AnalyzedMove, AnalysisProgress,
  formatEval,
} from '@shared/analysis';
import type { PositionAnalysisResult } from '@shared/engineAdapter';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow, SquareHighlight, SquareAnnotation } from './Board';
import Header from './Header';
import { EvalBar } from './analysis/EvalBar';
import { buildMovePairs, type TranslateFn } from './analysisPageHelpers';
import type { usePostGameReview } from '../hooks/usePostGameReview';
import type { GameAnalysisData } from '../queries/analysis';
import { AnalysisGameSidePanel } from './AnalysisGameSidePanel';

type ReviewControls = ReturnType<typeof usePostGameReview>;

type AnalysisGameViewProps = {
  t: TranslateFn;
  reviewT: TranslateFn;
  review: ReviewControls;
  gameData: GameAnalysisData;
  analysis: GameAnalysis | null;
  analyzing: boolean;
  gameAnalysisError: string | null;
  progress: AnalysisProgress | null;
  viewAs: PieceColor;
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
  analysisArrows: Arrow[];
  analysisHighlights: SquareHighlight[];
  analysisAnnotations: SquareAnnotation[];
  arrows: Arrow[];
  scrollRef: Ref<HTMLDivElement>;
  setActiveMoveElement: (node: HTMLElement | null) => void;
  onViewAsChange: (color: PieceColor) => void;
  onShowBestMoveChange: (show: boolean) => void;
  onArrowsChange: (arrows: Arrow[]) => void;
  onMoveClick: (index: number) => void;
  onNavigateToStart: () => void;
  onNavigateBackward: () => void;
  onNavigateForward: () => void;
  onNavigateToEnd: () => void;
};

export function AnalysisGameView({
  t,
  reviewT,
  review,
  gameData,
  analysis,
  analyzing,
  gameAnalysisError,
  progress,
  viewAs,
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
  analysisArrows,
  analysisHighlights,
  analysisAnnotations,
  arrows,
  scrollRef,
  setActiveMoveElement,
  onViewAsChange,
  onShowBestMoveChange,
  onArrowsChange,
  onMoveClick,
  onNavigateToStart,
  onNavigateBackward,
  onNavigateForward,
  onNavigateToEnd,
}: AnalysisGameViewProps) {
  const movePairs = buildMovePairs(gameData.moves, analysis);

  return (
    <div data-testid="analysis-game-view" className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <Header subtitle={t('analysis.title')} />

      <main id="main-content" className="flex-1 flex items-start justify-center px-4 py-4 overflow-y-auto">
        <div className="grid w-full max-w-[1400px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,36rem)] xl:grid-cols-[minmax(0,1fr)_38rem] lg:items-start">
          {/* Board + Eval Bar (sticky on desktop) */}
          <div className="flex gap-2 w-full max-w-[760px] lg:max-w-[calc(100vh-6rem)] lg:sticky lg:top-4 lg:self-start">
            {/* Eval Bar */}
            <EvalBar eval={currentEval} mate={currentMate} />

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {/* View controls */}
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

              {/* Board */}
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
                  arrows={[...analysisArrows, ...arrows]}
                  onArrowsChange={onArrowsChange}
                  squareHighlights={analysisHighlights}
                  squareAnnotations={analysisAnnotations}
                />
              </BoardErrorBoundary>

              {/* Nav buttons */}
              <div className="flex items-center justify-center gap-1 rounded-lg border border-surface-hover bg-surface-alt/80 px-2 py-1.5">
                <button type="button"
                  onClick={onNavigateToStart}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ⏮
                </button>
                <button type="button"
                  onClick={onNavigateBackward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ◀
                </button>
                <button type="button"
                  onClick={onNavigateForward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ▶
                </button>
                <button type="button"
                  onClick={onNavigateToEnd}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>

          <AnalysisGameSidePanel
            t={t}
            reviewT={reviewT}
            review={review}
            gameData={gameData}
            analysis={analysis}
            analyzing={analyzing}
            gameAnalysisError={gameAnalysisError}
            progress={progress}
            showBestMove={showBestMove}
            currentPlyIndex={currentPlyIndex}
            highlightedMainLineMoveIndex={highlightedMainLineMoveIndex}
            currentEval={currentEval}
            currentMate={currentMate}
            currentWinningChances={currentWinningChances}
            currentBestMoveText={currentBestMoveText}
            currentPositionAnalysis={currentPositionAnalysis}
            currentPositionAnalyzing={currentPositionAnalyzing}
            currentEngineError={currentEngineError}
            currentAnalyzedMove={currentAnalyzedMove}
            reviewIsProvisional={reviewIsProvisional}
            analysisElapsedSeconds={analysisElapsedSeconds}
            movePairs={movePairs}
            scrollRef={scrollRef}
            setActiveMoveElement={setActiveMoveElement}
            onShowBestMoveChange={onShowBestMoveChange}
            onMoveClick={onMoveClick}
            onNavigateToStart={onNavigateToStart}
            onNavigateBackward={onNavigateBackward}
            onNavigateForward={onNavigateForward}
            onNavigateToEnd={onNavigateToEnd}
          />
        </div>
      </main>
    </div>
  );
}
