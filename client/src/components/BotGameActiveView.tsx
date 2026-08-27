import type { BotPersona } from '@shared/botPersonas';
import type { Move, PieceColor, Position, GameState } from '@shared/types';
import { useState } from 'react';
import type { BotChatMessage } from '../lib/botDialogue';
import { useLgUp } from '../hooks/useLgUp';
import { useAuth } from '../lib/auth';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import CountingBoardStrip from './CountingBoardStrip';
import GameMobileActions from './GameMobileActions';
import GameOverModal from './GameOverModal';
import GuestWinConversion, { shouldOfferGuestWinConversion } from './GuestWinConversion';
import InGameShell from './InGameShell';
import PieceGuide from './PieceGuide';
import PostGameSharePanel from './PostGameSharePanel';
import { BotGameSidePanel } from './BotGameSidePanel';
import type { ReviewControls, ReviewEngineControls } from './BotGameSidePanel';
import { BOT_GAME_TIME_CONTROL, type BotTranslationFields, type TranslateFn } from './botGameHelpers';
import { CLOCK_CRITICAL_MS, gameMetaChipClass, gameMetaChipInteractiveClass, shouldOfferPieceGuideStatusHelp } from './gamePageHelpers';
import { MoveAnnouncer } from './MoveAnnouncer';
import PieceGuideStatusHelp from './PieceGuideStatusHelp';

type CaptureSummary = {
  pieces: ReturnType<typeof import('../lib/capturedSummary').getCapturedSummary>['pieces'];
  material: number | null;
};

export type BotGameActiveViewProps = {
  t: TranslateFn;
  selectedBot: BotPersona;
  selectedBotTranslation: BotTranslationFields;
  gameState: GameState;
  playerColor: PieceColor;
  botColor: PieceColor;
  playerDisplayName: string;
  botName: string;
  turnStatus: {
    playerToMove: boolean;
    botThinking: boolean;
  };
  viewingHistory: boolean;
  levelLabel: string;
  difficultyLabel: string;
  estimatedEloLabel: string;
  botClockSubtitle: string;
  statusText: string;
  moveCount: number;
  counting: {
    label: string | null;
    start: (() => void) | null;
    stop: (() => void) | null;
  };
  playerCaptureSummary: CaptureSummary;
  botCaptureSummary: CaptureSummary;
  legalMoves: Position[];
  selectedSquare: Position | null;
  premove: { from: Position; to: Position } | null;
  arrows: Arrow[];
  viewMoveIndex: number | null;
  currentGameId: string | null;
  gameOverInfo: { reason: string; winner: PieceColor | null } | null;
  modalGameOverInfo: { reason: string; winner: PieceColor | null } | null;
  botChat: BotChatMessage | null;
  botChatFading: boolean;
  review: ReviewControls;
  reviewEngine: ReviewEngineControls;
  displayBoard: GameState['board'];
  lastMove: Move | null;
  checkSquare: Position | null;
  onHome: () => void;
  onSquareClick: (pos: Position) => void;
  onPieceDrop: (from: Position, to: Position) => void;
  onArrowsChange: (arrows: Arrow[]) => void;
  onReturnToLive: () => void;
  onCancelPremove: () => void;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: (() => void) | undefined;
  onCloseGameOverModal: () => void;
  onMoveClick: (index: number) => void;
  onResign: () => void;
  showGuide: boolean;
  onShowGuide: () => void;
  onCloseGuide: () => void;
};

export function BotGameActiveView({
  t,
  selectedBot,
  selectedBotTranslation,
  gameState,
  playerColor,
  botColor,
  playerDisplayName,
  botName,
  turnStatus,
  viewingHistory,
  levelLabel,
  difficultyLabel,
  estimatedEloLabel,
  botClockSubtitle,
  statusText,
  moveCount,
  counting,
  playerCaptureSummary,
  botCaptureSummary,
  legalMoves,
  selectedSquare,
  premove,
  arrows,
  viewMoveIndex,
  currentGameId,
  gameOverInfo,
  modalGameOverInfo,
  botChat,
  botChatFading,
  review,
  reviewEngine,
  displayBoard,
  lastMove,
  checkSquare,
  onHome,
  onSquareClick,
  onPieceDrop,
  onArrowsChange,
  onReturnToLive,
  onCancelPremove,
  onRematch,
  onNewGame,
  onAnalyze,
  onCloseGameOverModal,
  onMoveClick,
  onResign,
  showGuide,
  onShowGuide,
  onCloseGuide,
}: BotGameActiveViewProps) {
  const reviewActive = gameState.gameOver;
  const reviewMode = review.mode;
  const lgUp = useLgUp();
  const { user, loading: authLoading } = useAuth();
  const [peakShareOpen, setPeakShareOpen] = useState(false);
  const isPersonalWin = Boolean(
    modalGameOverInfo && modalGameOverInfo.winner && modalGameOverInfo.winner === playerColor,
  );
  const offerGuestConversion = shouldOfferGuestWinConversion(Boolean(user), authLoading);
  const countingLeaveUrgent = (
    playerColor === 'white' ? gameState.whiteTime : gameState.blackTime
  ) < CLOCK_CRITICAL_MS;
  const showCounting = Boolean(!gameState.gameOver && counting.label);

  return (
    <>
      <MoveAnnouncer gameState={gameState} playerColor={playerColor} t={t} />
      <InGameShell
        onHome={onHome}
        headerMeta={
          <>
            <span className="rounded-full px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] bg-surface text-text-dim border border-surface-hover">
              {levelLabel}
            </span>
            <AppearanceSettingsButton compact mode="popover" />
          </>
        }
        topPanel={
          <Clock
            time={botColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === botColor && !gameState.gameOver}
            color={botColor}
            playerName={botName}
            botAvatar={selectedBot.avatar}
            subtitle={botClockSubtitle}
            capturedPieces={botCaptureSummary.pieces}
            materialDelta={botCaptureSummary.material}
          />
        }
        board={
          <BoardErrorBoundary onRetry={() => window.location.reload()}>
            <Board
              board={reviewActive ? review.currentState.board : displayBoard}
              playerColor={playerColor}
              draggableColor={reviewActive && reviewMode === 'analysis' ? review.currentState.turn : undefined}
              isMyTurn={reviewActive ? reviewMode === 'analysis' : turnStatus.playerToMove && !turnStatus.botThinking}
              legalMoves={reviewActive ? review.legalMoves : viewingHistory ? [] : legalMoves}
              selectedSquare={reviewActive ? review.selectedSquare : viewingHistory ? null : selectedSquare}
              lastMove={reviewActive ? review.currentLastMove : lastMove}
              isCheck={reviewActive ? review.currentState.isCheck : viewingHistory ? false : gameState.isCheck}
              checkSquare={reviewActive ? review.currentCheckSquare : checkSquare}
              onSquareClick={reviewActive ? review.handleSquareClick : onSquareClick}
              onPieceDrop={reviewActive ? review.handlePieceDrop : onPieceDrop}
              disabled={reviewActive ? reviewMode !== 'analysis' : viewingHistory || (gameState.gameOver && !viewingHistory)}
              premove={reviewActive ? null : premove}
              arrows={arrows}
              onArrowsChange={onArrowsChange}
            />
          </BoardErrorBoundary>
        }
        bottomPanel={
          <Clock
            time={playerColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={turnStatus.playerToMove && !turnStatus.botThinking && !gameState.gameOver}
            color={playerColor}
            playerName={`${t('common.you')} (${t(playerColor === 'white' ? 'common.white' : 'common.black')})`}
            subtitle={t(playerColor === 'white' ? 'common.white' : 'common.black')}
            capturedPieces={playerCaptureSummary.pieces}
            materialDelta={playerCaptureSummary.material}
          />
        }
        statusText={statusText}
        moveCount={moveCount}
        isViewingHistory={viewingHistory}
        showCheckBadge={reviewActive ? review.currentState.isCheck : gameState.isCheck}
        statusHelp={
          !reviewActive
          && shouldOfferPieceGuideStatusHelp(moveCount, gameState.isCheck, gameState.gameOver)
            ? <PieceGuideStatusHelp t={t} onShowGuide={onShowGuide} />
            : null
        }
        boardNotice={
          showCounting && !lgUp && counting.label ? (
            <CountingBoardStrip
              t={t}
              label={counting.label}
              canStart={Boolean(counting.start)}
              canStop={Boolean(counting.stop)}
              onStart={counting.start ?? undefined}
              onStop={counting.stop ?? undefined}
              onResign={onResign}
              resignLabelKey="bot.resign"
              confirmMessageKey="bot.resign_confirm"
              leaveUrgent={countingLeaveUrgent}
            />
          ) : null
        }
        boardActions={
          /* Counting strip owns Start/Stop + compact resign; demote the separate thumb row to avoid stacking. */
          !lgUp && !showCounting && !gameState.gameOver ? (
            <GameMobileActions
              t={t}
              onResign={onResign}
              resignLabelKey="bot.resign"
              confirmMessageKey="bot.resign_confirm"
            />
          ) : null
        }
        toolbar={
          <>
            {!reviewActive && viewingHistory && (
              <button type="button"
                onClick={onReturnToLive}
                className={gameMetaChipInteractiveClass}
              >
                {t('game.return_to_live')}
              </button>
            )}
            {premove ? (
            <>
              <span data-testid="game-premove-chip" className={gameMetaChipClass}>
                {t('game.premove_set')}
              </span>
              <button type="button"
                onClick={onCancelPremove}
                className="rounded-full border border-surface-hover bg-surface-alt px-2.5 py-1 text-text-dim normal-case tracking-normal transition-colors hover:text-text-bright"
              >
                {t('common.cancel')}
              </button>
            </>
            ) : null}
          </>
        }
        sidePanel={
          <BotGameSidePanel
            t={t}
            selectedBot={selectedBot}
            selectedBotTranslation={selectedBotTranslation}
            gameState={gameState}
            playerColor={playerColor}
            playerDisplayName={playerDisplayName}
            botName={botName}
            levelLabel={levelLabel}
            difficultyLabel={difficultyLabel}
            estimatedEloLabel={estimatedEloLabel}
            counting={showCounting && lgUp ? counting : { label: null, start: null, stop: null }}
            currentGameId={currentGameId}
            gameOverInfo={gameOverInfo}
            botChat={botChat}
            botChatFading={botChatFading}
            review={review}
            reviewEngine={reviewEngine}
            viewMoveIndex={viewMoveIndex}
            onRematch={onRematch}
            onNewGame={onNewGame}
            onAnalyze={onAnalyze}
            onMoveClick={onMoveClick}
            onResign={onResign}
            onHome={onHome}
            onShowGuide={onShowGuide}
            showHighStakesActions={lgUp}
            endgamePeakOpen={Boolean(modalGameOverInfo)}
            leaveUrgent={countingLeaveUrgent}
          />
        }
      />

      {modalGameOverInfo && (
        <GameOverModal
          winner={modalGameOverInfo.winner}
          reason={modalGameOverInfo.reason}
          playerColor={playerColor}
          onRematch={onRematch}
          onNewGame={onNewGame}
          onAnalyze={onAnalyze}
          onClose={() => {
            setPeakShareOpen(false);
            onCloseGameOverModal();
          }}
          moreExtrasOnly={peakShareOpen}
          conversionCard={
            isPersonalWin && offerGuestConversion
              ? <GuestWinConversion />
              : null
          }
          moreExtras={
            peakShareOpen ? (
              <div className="space-y-2 text-left" data-testid="post-game-share-path">
                <button
                  type="button"
                  onClick={() => setPeakShareOpen(false)}
                  className="w-full text-left text-sm font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
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
                  winner={modalGameOverInfo.winner}
                  resultReason={modalGameOverInfo.reason}
                  gameMode="bot"
                  timeControl={BOT_GAME_TIME_CONTROL}
                  promoteShare={isPersonalWin}
                />
              </div>
            ) : (
              <button
                type="button"
                data-testid="post-game-share-expand"
                onClick={() => setPeakShareOpen(true)}
                className={
                  isPersonalWin
                    ? 'button-accent-contrast w-full rounded-lg px-3 py-2 text-sm font-semibold'
                    : 'ui-btn-secondary w-full rounded-lg px-3 py-2 text-sm font-semibold'
                }
              >
                {isPersonalWin ? t('gameover.share_win') : t('game.show_share')}
              </button>
            )
          }
        />
      )}

      <PieceGuide show={showGuide} onClose={onCloseGuide} />
    </>
  );
}
