import type { BotPersona } from '@shared/botPersonas';
import type { Move, PieceColor, Position, GameState } from '@shared/types';
import type { BotChatMessage } from '../lib/botDialogue';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import GameOverModal from './GameOverModal';
import InGameShell from './InGameShell';
import { BotGameSidePanel } from './BotGameSidePanel';
import type { ReviewControls, ReviewEngineControls } from './BotGameSidePanel';
import type { BotTranslationFields, TranslateFn } from './botGameHelpers';

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
}: BotGameActiveViewProps) {
  const reviewActive = gameState.gameOver;
  const reviewMode = review.mode;

  return (
    <>
      <InGameShell
        onHome={onHome}
        headerMeta={
          <>
            <AppearanceSettingsButton compact />
            <span className="hidden md:inline">{t('bot.vs_bot')}</span>
            <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] bg-surface text-text-dim border border-surface-hover">
              {levelLabel}
            </span>
            <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] bg-surface text-text-dim border border-surface-hover">
              {difficultyLabel}
            </span>
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
            showTimer={false}
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
            showTimer={false}
          />
        }
        statusText={statusText}
        moveCount={moveCount}
        isViewingHistory={viewingHistory}
        showCheckBadge={reviewActive ? review.currentState.isCheck : gameState.isCheck}
        toolbar={
          <>
            {!reviewActive && viewingHistory && (
              <button type="button"
                onClick={onReturnToLive}
                className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary-light normal-case tracking-normal transition-colors hover:bg-primary/15"
              >
                {t('game.return_to_live')}
              </button>
            )}
            {premove ? (
            <>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary-light normal-case tracking-normal">
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
            statusText={statusText}
            counting={counting}
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
          onClose={onCloseGameOverModal}
        />
      )}
    </>
  );
}
