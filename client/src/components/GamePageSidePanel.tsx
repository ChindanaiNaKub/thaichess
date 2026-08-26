import { useState } from 'react';
import type { ClientGameState, GameState, Move, PieceColor, Position, TimeControl } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import CountingHelpDisclosure from './CountingHelpDisclosure';
import CountingLeaveDisclosure from './CountingLeaveDisclosure';
import CountingStartConsequence from './CountingStartConsequence';
import {
  countingLabelClass,
  countingPanelClass,
  countingStartButtonClass,
  countingStopButtonClass,
  countingTitleClass,
} from './countingChrome';
import GameOverPanel from './GameOverPanel';
import MoveHistory from './MoveHistory';
import PostGameReviewPanel from './PostGameReviewPanel';
import PostGameSharePanel from './PostGameSharePanel';
import ResignConfirmControls from './ResignConfirmControls';
import type { GameOverInfo, TranslateFn } from './gamePageHelpers';
import { shouldShowMoveNavHint, sidePanelHelpActionClass } from './gamePageHelpers';

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
  countingLabel: string | null;
  /** Which counting action is available right now, if any. */
  countingAction: 'start' | 'stop' | null;
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
  /** Draw/resign in this panel (desktop). Mobile uses GameMobileActions under the board. */
  showHighStakesActions?: boolean;
  /** When the peak-end modal is open, suppress duplicate endgame chrome in the rail. */
  endgamePeakOpen?: boolean;
  /** Mirror CountingBoardStrip: auto-expand leave exits when the clock is critical. */
  leaveUrgent?: boolean;
};

export function GamePageSidePanel({
  t,
  gameId,
  gameState,
  playerColor,
  countingLabel,
  countingAction,
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
  showHighStakesActions = true,
  endgamePeakOpen = false,
  leaveUrgent = false,
}: GamePageSidePanelProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const showEndgameChrome = Boolean(gameOverInfo) && !endgamePeakOpen;

  return (
    <>
      {!gameState.gameOver && countingLabel && (
        <div className={`${countingPanelClass} px-4 py-3`}>
          <div className={`mb-1 ${countingTitleClass}`}>
            {t('game.counting_title')}
          </div>
          <div className={countingLabelClass}>{countingLabel}</div>
          {countingAction === 'start' && <CountingStartConsequence t={t} />}
          {countingAction === 'start' && (
            <button type="button"
              onClick={onStartCounting}
              className={`mt-3 w-full ${countingStartButtonClass}`}
            >
              {t('game.counting_start')}
            </button>
          )}
          {countingAction === 'stop' && (
            <button type="button"
              onClick={onStopCounting}
              className={`mt-3 w-full ${countingStopButtonClass}`}
            >
              {t('game.counting_stop')}
            </button>
          )}
          {countingAction !== 'start' ? <CountingHelpDisclosure t={t} /> : null}
        </div>
      )}

      {showEndgameChrome && gameOverInfo && (
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
          moreExtrasOnly={shareOpen || reviewOpen}
          moreExtras={
            <>
              {shareOpen && playerColor ? (
                <div className="space-y-2" data-testid="post-game-share-path">
                  <button
                    type="button"
                    onClick={() => setShareOpen(false)}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
                  >
                    {t('game.hide_share')}
                  </button>
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
                </div>
              ) : null}
              {reviewOpen ? (
                <div className="space-y-2" data-testid="post-game-review-path">
                  <button
                    type="button"
                    onClick={() => setReviewOpen(false)}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
                  >
                    {t('game.hide_review')}
                  </button>
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
                </div>
              ) : null}
              {!shareOpen && !reviewOpen ? (
                <>
                  {playerColor ? (
                    <button
                      type="button"
                      data-testid="post-game-share-expand"
                      onClick={() => {
                        setReviewOpen(false);
                        setShareOpen(true);
                      }}
                      className="ui-btn-secondary w-full px-3 py-2 text-xs font-semibold"
                    >
                      {t('game.show_share')}
                    </button>
                  ) : null}
                  {reviewActive ? (
                    <button
                      type="button"
                      data-testid="post-game-review-expand"
                      onClick={() => {
                        setShareOpen(false);
                        setReviewOpen(true);
                      }}
                      className="ui-btn-secondary w-full px-3 py-2 text-xs font-semibold"
                    >
                      {t('game.show_review')}
                    </button>
                  ) : null}
                </>
              ) : null}
            </>
          }
        />
      )}

      {/* Pin high-stakes above history so long games don't bury draw/resign.
          During counting, demote exits behind leave (same contract as the board strip). */}
      {!gameState.gameOver && gameState.status === 'playing' && showHighStakesActions && (
        <div data-testid="side-panel-high-stakes">
          {countingLabel ? (
            <CountingLeaveDisclosure
              t={t}
              leaveUrgent={leaveUrgent}
              className=""
              exitsClassName="mt-2 space-y-2"
              toggleTestId="side-panel-counting-leave-toggle"
              exitsTestId="side-panel-counting-leave-exits"
            >
              <ResignConfirmControls
                onConfirm={onOfferDraw}
                resignLabelKey="game.offer_draw"
                confirmMessageKey="game.offer_draw_confirm"
                confirmActionKey="game.offer_draw_confirm_action"
                tone="neutral"
                fullWidth
                className="w-full py-2.5 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-xl border border-surface-hover transition-colors"
              />
              <ResignConfirmControls
                onConfirm={onResign}
                resignLabelKey="game.resign"
                confirmMessageKey="game.resign_confirm"
                fullWidth
                className="w-full py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors"
              />
            </CountingLeaveDisclosure>
          ) : (
            <div className="space-y-2">
              <ResignConfirmControls
                onConfirm={onOfferDraw}
                resignLabelKey="game.offer_draw"
                confirmMessageKey="game.offer_draw_confirm"
                confirmActionKey="game.offer_draw_confirm_action"
                tone="neutral"
                fullWidth
                className="w-full py-2.5 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-xl border border-surface-hover transition-colors"
              />
              <ResignConfirmControls
                onConfirm={onResign}
                resignLabelKey="game.resign"
                confirmMessageKey="game.resign_confirm"
                fullWidth
                className="w-full py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors"
              />
            </div>
          )}
        </div>
      )}

      {/* Pin help above history so long games don't bury Piece Guide. */}
      <button
        type="button"
        data-testid="piece-guide-side"
        onClick={onShowGuide}
        className={sidePanelHelpActionClass}
      >
        {t('game.piece_guide')}
      </button>

      <MoveHistory
        moves={gameState.moveHistory}
        initialBoard={createInitialBoard()}
        currentMoveIndex={gameState.gameOver ? review.selectedMainLineMoveIndex : viewMoveIndex ?? undefined}
        onMoveClick={gameState.gameOver ? review.jumpToMainLine : onMoveClick}
      />

      {shouldShowMoveNavHint(
        gameState.moveHistory.length,
        gameState.gameOver,
        viewMoveIndex != null,
      ) && (
        <div className="text-center text-[11px] text-text-dim">
          {t('game.nav_hint')}
        </div>
      )}
    </>
  );
}
