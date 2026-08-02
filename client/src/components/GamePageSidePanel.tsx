import type { ClientGameState, GameState, Move, PieceColor, Position, TimeControl } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import GameOverPanel from './GameOverPanel';
import MoveHistory from './MoveHistory';
import PostGameReviewPanel from './PostGameReviewPanel';
import PostGameSharePanel from './PostGameSharePanel';
import ResignConfirmControls from './ResignConfirmControls';
import type { GameOverInfo, TranslateFn } from './gamePageHelpers';

export type ReviewControls = {
  mode: 'mainLine' | 'analysis';
  currentState: GameState;
  currentMoveHistory: Move[];
  currentLastMove: Move | import('@shared/types').LastMove | null;
  currentCheckSquare: Position | null;
  selectedMainLineMoveIndex: number;
  analysisRootMoveIndex: number | null;
  analysisLine: Move[];
  legalMoves: Position[];
  selectedSquare: Position | null;
  canEnterAnalysis: boolean;
  canResetAnalysis: boolean;
  canStepBackward: boolean;
  canStepForward: boolean;
  enterAnalysis: () => void;
  returnToMainLine: () => void;
  resetAnalysis: () => void;
  stepBackward: () => void;
  stepForward: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  jumpToMainLine: (moveIndex: number) => void;
  handleSquareClick: (pos: Position) => void;
  handlePieceDrop: (from: Position, to: Position) => void;
};

export type ReviewEngineControls = {
  analysis: import('@shared/engineAdapter').PositionAnalysisResult | null;
  analyzing: boolean;
  error: string | null;
};

type GamePageSidePanelProps = {
  t: TranslateFn;
  gameId: string | undefined;
  gameState: ClientGameState;
  playerColor: PieceColor | null;
  playerSubtitle: string;
  statusText: string;
  countingLabel: string | null;
  canStartCounting: boolean;
  canStopCounting: boolean;
  gameOverInfo: GameOverInfo | null;
  rematchLabel: string;
  rematchNotice: string | null;
  rematchDisabled: boolean;
  reportLabel: string;
  reportDisabled: boolean;
  canReportOpponent: boolean;
  timeControl: TimeControl | null;
  whitePlayerName: string;
  blackPlayerName: string;
  review: ReviewControls;
  reviewEngine: ReviewEngineControls;
  reviewActive: boolean;
  viewMoveIndex: number | null;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: (() => void) | undefined;
  onReport: (() => void) | undefined;
  onMoveClick: (index: number) => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onStartCounting: () => void;
  onStopCounting: () => void;
  onShowGuide: () => void;
};

export function GamePageSidePanel({
  t,
  gameId,
  gameState,
  playerColor,
  playerSubtitle,
  statusText,
  countingLabel,
  canStartCounting,
  canStopCounting,
  gameOverInfo,
  rematchLabel,
  rematchNotice,
  rematchDisabled,
  reportLabel,
  reportDisabled,
  canReportOpponent,
  timeControl,
  whitePlayerName,
  blackPlayerName,
  review,
  reviewEngine,
  reviewActive,
  viewMoveIndex,
  onRematch,
  onNewGame,
  onAnalyze,
  onReport,
  onMoveClick,
  onOfferDraw,
  onResign,
  onStartCounting,
  onStopCounting,
  onShowGuide,
}: GamePageSidePanelProps) {
  return (
    <>
      <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="font-semibold text-text-bright">{statusText}</div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            <span>{playerSubtitle}</span>
            <span className={`rounded-full px-2 py-1 ${gameState.rated ? 'bg-primary/15 text-primary-light' : 'bg-surface text-text-dim border border-surface-hover'}`}>
              {gameState.rated ? t('game.rated') : t('game.casual')}
            </span>
          </div>
        </div>
      </div>

      {!gameState.gameOver && countingLabel && (
        <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-primary-light">
          <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
            {t('game.counting_title')}
          </div>
          <div className="text-sm text-text-bright">{countingLabel}</div>
          {canStartCounting && (
            <button type="button"
              onClick={onStartCounting}
              className="mt-3 w-full rounded-lg border border-primary/30 bg-primary/15 px-3 py-2 text-sm text-primary-light transition-colors hover:bg-primary/25"
            >
              {t('game.counting_start')}
            </button>
          )}
          {canStopCounting && (
            <button type="button"
              onClick={onStopCounting}
              className="mt-3 w-full rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text transition-colors hover:bg-surface-hover"
            >
              {t('game.counting_stop')}
            </button>
          )}
        </div>
      )}

      {gameOverInfo && (
        <GameOverPanel
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          rated={gameState.rated}
          ratingChange={gameOverInfo.ratingChange}
          onRematch={onRematch}
          onNewGame={onNewGame}
          rematchLabel={rematchLabel}
          rematchDisabled={rematchDisabled}
          rematchNotice={rematchNotice}
          onAnalyze={onAnalyze}
          onReport={canReportOpponent ? onReport : undefined}
          reportLabel={reportLabel}
          reportDisabled={reportDisabled}
        />
      )}

      {gameOverInfo && gameState.gameOver && playerColor && (
        <PostGameSharePanel
          analysisId={gameId}
          board={gameState.board}
          lastMove={gameState.moveHistory[gameState.moveHistory.length - 1] ?? null}
          moves={gameState.moveHistory}
          moveCount={gameState.moveCount}
          playerColor={playerColor}
          whitePlayerName={whitePlayerName || t('common.white')}
          blackPlayerName={blackPlayerName || t('common.black')}
          winner={gameOverInfo.winner}
          resultReason={gameOverInfo.reason}
          gameMode={gameState.gameMode}
          rated={gameState.rated}
          timeControl={timeControl}
          ratingChange={gameOverInfo.ratingChange}
        />
      )}

      {reviewActive && (
        <PostGameReviewPanel
          mode={review.mode}
          selectedMainLineMoveIndex={review.selectedMainLineMoveIndex}
          analysisRootMoveIndex={review.analysisRootMoveIndex}
          analysisLine={review.analysisLine}
          controls={{
            enterAnalysis: review.canEnterAnalysis,
            resetAnalysis: review.canResetAnalysis,
            stepBackward: review.canStepBackward,
            stepForward: review.canStepForward,
          }}
          onEnterAnalysis={review.enterAnalysis}
          onReturnToMainLine={review.returnToMainLine}
          onResetAnalysis={review.resetAnalysis}
          onStepBackward={review.stepBackward}
          onStepForward={review.stepForward}
          onJumpToStart={review.jumpToStart}
          onJumpToEnd={review.jumpToEnd}
          engineAnalysis={reviewEngine.analysis}
          engineAnalyzing={reviewEngine.analyzing}
          engineError={reviewEngine.error}
        />
      )}

      <MoveHistory
        moves={gameState.moveHistory}
        initialBoard={createInitialBoard()}
        currentMoveIndex={gameState.gameOver ? review.selectedMainLineMoveIndex : viewMoveIndex ?? undefined}
        onMoveClick={gameState.gameOver ? review.jumpToMainLine : onMoveClick}
      />

      {gameState.gameOver && gameState.moveHistory.length > 0 && (
        <div className="text-center text-[11px] text-text-dim">
          {t('game.nav_hint')}
        </div>
      )}

      {!gameState.gameOver && gameState.status === 'playing' && (
        <div className="space-y-2">
          <button type="button"
            onClick={onOfferDraw}
            className="w-full py-2.5 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-xl border border-surface-hover transition-colors"
            title={t('game.offer_draw')}
          >
            {t('game.offer_draw')}
          </button>
          <ResignConfirmControls
            onConfirm={onResign}
            resignLabelKey="game.resign"
            confirmMessageKey="game.resign_confirm"
            fullWidth
            className="w-full py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors"
          />
        </div>
      )}

      <button type="button"
        onClick={onShowGuide}
        className="w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright text-sm rounded-xl border border-surface-hover transition-colors"
      >
        {t('game.piece_guide')}
      </button>
    </>
  );
}
