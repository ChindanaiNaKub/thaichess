import { useState } from 'react';
import type { BotPersona } from '@shared/botPersonas';
import type { Move, PieceColor, Position, GameState } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import type { BotChatMessage } from '../lib/botDialogue';
import BotAvatar from './BotAvatar';
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
import {
  BOT_GAME_TIME_CONTROL,
  type BotTranslationFields,
  type TranslateFn,
} from './botGameHelpers';
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

type BotGameSidePanelProps = {
  t: TranslateFn;
  selectedBot: BotPersona;
  selectedBotTranslation: BotTranslationFields;
  gameState: GameState;
  playerColor: PieceColor;
  playerDisplayName: string;
  botName: string;
  levelLabel: string;
  difficultyLabel: string;
  estimatedEloLabel: string;
  counting: {
    label: string | null;
    start: (() => void) | null;
    stop: (() => void) | null;
  };
  currentGameId: string | null;
  gameOverInfo: { reason: string; winner: PieceColor | null } | null;
  botChat: BotChatMessage | null;
  botChatFading: boolean;
  review: ReviewControls;
  reviewEngine: ReviewEngineControls;
  viewMoveIndex: number | null;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: (() => void) | undefined;
  onMoveClick: (index: number) => void;
  onResign: () => void;
  onHome: () => void;
  onShowGuide: () => void;
  /** Resign in this panel (desktop). Mobile uses GameMobileActions under the board. */
  showHighStakesActions?: boolean;
  /** When the peak-end modal is open, suppress duplicate endgame chrome in the rail. */
  endgamePeakOpen?: boolean;
  /** Mirror CountingBoardStrip: auto-expand leave exits when the clock is critical. */
  leaveUrgent?: boolean;
};

function SidePanelEndgameExtras({
  t,
  reviewActive,
  shareOpen,
  onShareClose,
  onShareOpen,
  reviewOpen,
  onReviewClose,
  onReviewOpen,
  gameOverInfo,
  gameState,
  playerColor,
  playerDisplayName,
  botName,
  currentGameId,
  review,
  reviewEngine,
}: {
  t: TranslateFn;
  reviewActive: boolean;
  shareOpen: boolean;
  onShareClose: () => void;
  onShareOpen: () => void;
  reviewOpen: boolean;
  onReviewClose: () => void;
  onReviewOpen: () => void;
  gameOverInfo: { reason: string; winner: PieceColor | null };
  gameState: GameState;
  playerColor: PieceColor;
  playerDisplayName: string;
  botName: string;
  currentGameId: string | null;
  review: ReviewControls;
  reviewEngine: ReviewEngineControls;
}) {
  return (
    <>
      {shareOpen ? (
        <div className="space-y-2" data-testid="post-game-share-path">
          <button
            type="button"
            onClick={onShareClose}
            className="w-full px-3 py-2 text-left text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
          >
            {t('game.hide_share')}
          </button>
          <PostGameSharePanel
            analysisId={currentGameId}
            board={gameState.board}
            lastMove={gameState.moveHistory[gameState.moveHistory.length - 1] ?? null}
            moves={gameState.moveHistory}
            moveCount={gameState.moveCount}
            playerColor={playerColor}
            whitePlayerName={playerColor === 'white' ? playerDisplayName : botName}
            blackPlayerName={playerColor === 'black' ? playerDisplayName : botName}
            winner={gameOverInfo.winner}
            resultReason={gameOverInfo.reason}
            gameMode="bot"
            timeControl={BOT_GAME_TIME_CONTROL}
          />
        </div>
      ) : null}
      {reviewOpen ? (
        <div className="space-y-2" data-testid="post-game-review-path">
          <button
            type="button"
            onClick={onReviewClose}
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
          <button
            type="button"
            data-testid="post-game-share-expand"
            onClick={onShareOpen}
            className="ui-btn-secondary w-full px-3 py-2 text-xs font-semibold"
          >
            {t('game.show_share')}
          </button>
          {reviewActive ? (
            <button
              type="button"
              data-testid="post-game-review-expand"
              onClick={onReviewOpen}
              className="ui-btn-secondary w-full px-3 py-2 text-xs font-semibold"
            >
              {t('game.show_review')}
            </button>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function BotGameSidePanel({
  t,
  selectedBot,
  selectedBotTranslation,
  gameState,
  playerColor,
  playerDisplayName,
  botName,
  levelLabel,
  difficultyLabel,
  estimatedEloLabel,
  counting,
  currentGameId,
  gameOverInfo,
  botChat,
  botChatFading,
  review,
  reviewEngine,
  viewMoveIndex,
  onRematch,
  onNewGame,
  onAnalyze,
  onMoveClick,
  onResign,
  onHome,
  onShowGuide,
  showHighStakesActions = true,
  endgamePeakOpen = false,
  leaveUrgent = false,
}: BotGameSidePanelProps) {
  const reviewActive = gameState.gameOver;
  const [showLore, setShowLore] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const playing = !gameState.gameOver;
  const hook = selectedBotTranslation.hook || selectedBot.personalityHook;
  const showEndgameChrome = Boolean(gameOverInfo) && !endgamePeakOpen;
  // Mid-play: only long-think status — banter waits until the game ends (same spirit as lore gating).
  const showBotChat =
    Boolean(botChat) && (!playing || botChat?.category === 'thinking');
  const quietThinkingChat = playing && botChat?.category === 'thinking';

  return (
    <>
      <div className={`rounded-2xl border border-surface-hover/80 bg-surface-alt/90 ${playing ? 'px-3 py-2.5' : 'p-4'}`}>
        <div className={`flex gap-3 ${playing ? 'items-center' : 'items-start'}`}>
          <BotAvatar avatar={selectedBot.avatar} size={playing ? 40 : 56} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className={`font-semibold text-text-bright ${playing ? 'truncate text-sm' : 'text-lg'}`}>
              {selectedBot.name}
            </div>
            <div className="truncate text-xs text-text-dim sm:text-sm">{selectedBot.title}</div>
            {!playing && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">
                <span className="rounded-full border border-surface-hover bg-surface px-2 py-1">{levelLabel}</span>
                <span className="rounded-full border border-surface-hover bg-surface px-2 py-1">{difficultyLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mid-play stays Level-on-header quiet — lore only after the game ends. */}
        {!playing ? (
          <>
            <p className="mt-3 text-sm font-medium italic text-text">
              "{hook}"
            </p>

            <button
              type="button"
              onClick={() => setShowLore((current) => !current)}
              className="mt-2 text-xs font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
              aria-expanded={showLore}
            >
              {showLore ? t('bot.hide_details') : t('bot.learn_more')} {selectedBot.name}
            </button>

            {showLore ? (
              <div className="mt-3 border-t border-surface-hover/60 pt-3">
                <div className="text-xs leading-6 text-text-dim">{selectedBotTranslation.backstory || selectedBot.shortBackstory}</div>
                <div className="mt-2 text-xs text-text-dim">{estimatedEloLabel}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedBot.personalityTraits.map((trait) => (
                    <span key={trait} className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-xs text-text-dim">
                      {t(`bot.trait.${trait}`) || trait}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {showBotChat && botChat ? (
          <div
            data-testid="bot-chat-toast"
            data-quiet={quietThinkingChat ? 'true' : undefined}
            className={
              quietThinkingChat
                ? `mt-1.5 text-xs leading-4 text-text-dim transition-opacity duration-300 ${botChatFading ? 'opacity-0' : 'opacity-100'}`
                : `mt-2 rounded-xl border border-surface-hover/70 bg-surface/70 px-3 py-2 text-sm leading-5 text-text transition-opacity duration-300 ${botChatFading ? 'opacity-0' : 'opacity-100'}`
            }
          >
            {quietThinkingChat ? (
              <>
                <span className="sr-only">{t('bot.chat_thinking')}</span>
                {botChat.text}
              </>
            ) : (
              <>
                <div className="mb-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-text-dim">
                  {botChat.category === 'thinking' ? t('bot.chat_thinking') : selectedBot.name}
                </div>
                <div className="text-text-bright">{botChat.text}</div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {!gameState.gameOver && counting.label && (
        <div className={`${countingPanelClass} px-4 py-3`}>
          <div className={`mb-1 ${countingTitleClass}`}>{t('game.counting_title')}</div>
          <div className={countingLabelClass}>{counting.label}</div>
          {counting.start ? <CountingStartConsequence t={t} /> : null}
          {counting.start && (
            <button type="button" onClick={counting.start} className={`mt-3 w-full ${countingStartButtonClass}`}>
              {t('game.counting_start')}
            </button>
          )}
          {counting.stop && (
            <button type="button" onClick={counting.stop} className={`mt-3 w-full ${countingStopButtonClass}`}>
              {t('game.counting_stop')}
            </button>
          )}
          {!counting.start ? <CountingHelpDisclosure t={t} /> : null}
        </div>
      )}

      {showEndgameChrome && gameOverInfo && (
        <GameOverPanel
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          onRematch={onRematch}
          onNewGame={onNewGame}
          onAnalyze={onAnalyze}
          moreExtrasOnly={shareOpen || reviewOpen}
          moreExtras={
            <SidePanelEndgameExtras
              t={t}
              reviewActive={reviewActive}
              shareOpen={shareOpen}
              onShareClose={() => setShareOpen(false)}
              onShareOpen={() => {
                setReviewOpen(false);
                setShareOpen(true);
              }}
              reviewOpen={reviewOpen}
              onReviewClose={() => setReviewOpen(false)}
              onReviewOpen={() => {
                setShareOpen(false);
                setReviewOpen(true);
              }}
              gameOverInfo={gameOverInfo}
              gameState={gameState}
              playerColor={playerColor}
              playerDisplayName={playerDisplayName}
              botName={botName}
              currentGameId={currentGameId}
              review={review}
              reviewEngine={reviewEngine}
            />
          }
        />
      )}

      {/* Pin resign above history so long games don't bury the exit.
          During counting, demote behind leave (same contract as the board strip). */}
      {!gameState.gameOver && showHighStakesActions && (
        <div data-testid="side-panel-high-stakes">
          {counting.label ? (
            <CountingLeaveDisclosure
              t={t}
              leaveUrgent={leaveUrgent}
              className=""
              exitsClassName="mt-2 space-y-2"
              toggleTestId="side-panel-counting-leave-toggle"
              exitsTestId="side-panel-counting-leave-exits"
            >
              <ResignConfirmControls
                onConfirm={onResign}
                resignLabelKey="bot.resign"
                confirmMessageKey="bot.resign_confirm"
                fullWidth
                className="w-full py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors"
              />
            </CountingLeaveDisclosure>
          ) : (
            <ResignConfirmControls
              onConfirm={onResign}
              resignLabelKey="bot.resign"
              confirmMessageKey="bot.resign_confirm"
              fullWidth
              className="w-full py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors"
            />
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
        currentMoveIndex={reviewActive ? review.selectedMainLineMoveIndex : viewMoveIndex ?? undefined}
        onMoveClick={reviewActive ? review.jumpToMainLine : onMoveClick}
      />

      {shouldShowMoveNavHint(
        gameState.moveHistory.length,
        gameState.gameOver,
        viewMoveIndex != null,
      ) && (
        <div className="text-center text-[11px] text-text-dim">{t('game.nav_hint')}</div>
      )}

      {/* Mid-play: escape lives in the header only — don't undercut resign confirm. */}
      {!playing ? (
        <button
          type="button"
          onClick={onHome}
          data-testid="bot-side-panel-home"
          className="w-full py-2.5 px-4 rounded-xl border border-surface-hover bg-surface-alt/85 text-text text-sm font-semibold transition-colors hover:bg-surface-hover"
        >
          {t('common.back_home')}
        </button>
      ) : null}
    </>
  );
}
