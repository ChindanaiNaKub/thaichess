import type { RefObject } from 'react';
import type { ClientGameState, Move, PieceColor, Position, TimeControl } from '@shared/types';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import ConnectionStatus from './ConnectionStatus';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import InGameShell from './InGameShell';
import GameOverModal from './GameOverModal';
import PieceGuide from './PieceGuide';
import { GamePageSidePanel } from './GamePageSidePanel';
import type { ReviewControls, ReviewEngineControls } from './GamePageSidePanel';
import type { GameOverInfo, TranslateFn } from './gamePageHelpers';

type CaptureSummary = {
  pieces: ReturnType<typeof import('../lib/capturedSummary').getCapturedSummary>['pieces'];
  material: number | null;
};

type ClockPresenceStatus = 'online' | 'offline' | 'active' | 'idle' | 'away' | 'disconnected' | 'reconnecting';

export type GamePageActiveViewProps = {
  t: TranslateFn;
  gameId: string | undefined;
  gameState: ClientGameState;
  playerColor: PieceColor | null;
  opponentColor: PieceColor;
  isMyTurn: boolean;
  isViewingHistory: boolean;
  reviewActive: boolean;
  reviewMode: 'mainLine' | 'analysis';
  review: ReviewControls;
  reviewEngine: ReviewEngineControls;
  spectatorPath: string;
  copied: boolean;
  drawOffered: boolean;
  opponentDisconnected: boolean;
  showGuide: boolean;
  showGameOverModal: boolean;
  gameOverInfo: GameOverInfo | null;
  canReportOpponent: boolean;
  rematchLabel: string;
  rematchNotice: string | null;
  rematchDisabled: boolean;
  reportLabel: string;
  reportDisabled: boolean;
  modalReportLabel: string;
  timeControl: TimeControl | null;
  statusText: string;
  moveCount: number;
  countingLabel: string | null;
  canStartCounting: boolean;
  canStopCounting: boolean;
  myDisplayName: string;
  opponentDisplayName: string;
  playerSubtitle: string;
  opponentSubtitle: string;
  playerRating: number | null;
  opponentRating: number | null;
  playerStatus: ClockPresenceStatus;
  opponentStatus: ClockPresenceStatus;
  playerLatency: number | null;
  opponentLatency: number | null;
  playerCaptureSummary: CaptureSummary;
  opponentCaptureSummary: CaptureSummary;
  whitePlayerName: string;
  blackPlayerName: string;
  legalMoves: Position[];
  selectedSquare: Position | null;
  premove: { from: Position; to: Position } | null;
  arrows: Arrow[];
  viewMoveIndex: number | null;
  displayBoard: ClientGameState['board'];
  lastMove: Move | null;
  checkSquare: Position | null;
  containerRef: RefObject<HTMLDivElement | null>;
  onHome: () => void;
  onCopyGameLink: () => void;
  onRespondDraw: (accept: boolean) => void;
  onSquareClick: (pos: Position) => void;
  onPieceDrop: (from: Position, to: Position) => void;
  onArrowsChange: (arrows: Arrow[]) => void;
  onCancelPremove: () => void;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: (() => void) | undefined;
  onReport: (() => void) | undefined;
  onCloseGameOverModal: () => void;
  onMoveClick: (index: number) => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onStartCounting: () => void;
  onStopCounting: () => void;
  onShowGuide: () => void;
  onCloseGuide: () => void;
};

export function GamePageActiveView({
  t,
  gameId,
  gameState,
  playerColor,
  opponentColor,
  isMyTurn,
  isViewingHistory,
  reviewActive,
  reviewMode,
  review,
  reviewEngine,
  spectatorPath,
  copied,
  drawOffered,
  opponentDisconnected,
  showGuide,
  showGameOverModal,
  gameOverInfo,
  canReportOpponent,
  rematchLabel,
  rematchNotice,
  rematchDisabled,
  reportLabel,
  reportDisabled,
  modalReportLabel,
  timeControl,
  statusText,
  moveCount,
  countingLabel,
  canStartCounting,
  canStopCounting,
  myDisplayName,
  opponentDisplayName,
  playerSubtitle,
  opponentSubtitle,
  playerRating,
  opponentRating,
  playerStatus,
  opponentStatus,
  playerLatency,
  opponentLatency,
  playerCaptureSummary,
  opponentCaptureSummary,
  whitePlayerName,
  blackPlayerName,
  legalMoves,
  selectedSquare,
  premove,
  arrows,
  viewMoveIndex,
  displayBoard,
  lastMove,
  checkSquare,
  containerRef,
  onHome,
  onCopyGameLink,
  onRespondDraw,
  onSquareClick,
  onPieceDrop,
  onArrowsChange,
  onCancelPremove,
  onRematch,
  onNewGame,
  onAnalyze,
  onReport,
  onCloseGameOverModal,
  onMoveClick,
  onOfferDraw,
  onResign,
  onStartCounting,
  onStopCounting,
  onShowGuide,
  onCloseGuide,
}: GamePageActiveViewProps) {
  return (
    <div ref={containerRef}>
      <ConnectionStatus />

      <InGameShell
        onHome={onHome}
        headerMeta={
          <>
            <AppearanceSettingsButton compact />
            <span className="hidden md:inline">{t('game.game_label')} <span className="font-mono text-text">{gameId}</span></span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              gameState.rated ? 'bg-primary/15 text-primary-light' : 'bg-surface text-text-dim'
            }`}>
              {gameState.rated ? t('game.rated') : t('game.casual')}
            </span>
            <button type="button"
              onClick={onCopyGameLink}
              className="px-2 py-1 rounded bg-surface-hover hover:bg-primary/20 text-text text-xs transition-colors"
            >
              {copied ? t('game.copied') : t('game.share')}
            </button>
            <a
              href={spectatorPath}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded bg-surface-hover hover:bg-primary/20 text-text text-xs transition-colors"
            >
              {t('game.open_spectator')}
            </a>
          </>
        }
        banners={
          <>
            {opponentDisconnected && (
              <div className="bg-accent/20 border-b border-accent/30 text-center py-2 text-xs sm:text-sm text-accent">
                {t('game.opponent_dc')}
              </div>
            )}
            {drawOffered && (
              <div className="bg-primary/20 border-b border-primary/30 text-center py-3 text-xs sm:text-sm flex items-center justify-center gap-3 flex-wrap px-2">
                <span className="text-text-bright">{t('game.draw_offer_received')}</span>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => onRespondDraw(true)}
                    className="px-4 py-1 bg-primary text-white rounded font-semibold text-sm"
                  >
                    {t('game.accept')}
                  </button>
                  <button type="button"
                    onClick={() => onRespondDraw(false)}
                    className="px-4 py-1 bg-surface-hover text-text-bright rounded font-semibold text-sm"
                  >
                    {t('game.decline')}
                  </button>
                </div>
              </div>
            )}
          </>
        }
        topPanel={
          <Clock
            time={playerColor === 'white' ? gameState.blackTime : gameState.whiteTime}
            isActive={gameState.turn === opponentColor && gameState.status === 'playing'}
            color={opponentColor}
            playerName={opponentDisplayName}
            rating={opponentRating}
            status={opponentStatus}
            latencyMs={opponentLatency}
            subtitle={opponentSubtitle}
            capturedPieces={opponentCaptureSummary.pieces}
            materialDelta={opponentCaptureSummary.material}
          />
        }
        board={
          <BoardErrorBoundary onRetry={() => window.location.reload()}>
            <Board
              board={reviewActive ? review.currentState.board : displayBoard}
              playerColor={playerColor}
              draggableColor={reviewActive && reviewMode === 'analysis' ? review.currentState.turn : undefined}
              isMyTurn={reviewActive ? reviewMode === 'analysis' : isMyTurn}
              legalMoves={reviewActive ? review.legalMoves : isViewingHistory ? [] : legalMoves}
              selectedSquare={reviewActive ? review.selectedSquare : isViewingHistory ? null : selectedSquare}
              lastMove={reviewActive ? review.currentLastMove : lastMove}
              isCheck={reviewActive ? review.currentState.isCheck : isViewingHistory ? false : gameState.isCheck}
              checkSquare={reviewActive ? review.currentCheckSquare : checkSquare}
              onSquareClick={reviewActive ? review.handleSquareClick : onSquareClick}
              onPieceDrop={reviewActive ? review.handlePieceDrop : onPieceDrop}
              disabled={reviewActive ? reviewMode !== 'analysis' : isViewingHistory || (gameState.gameOver && !isViewingHistory)}
              premove={reviewActive ? null : premove}
              arrows={arrows}
              onArrowsChange={onArrowsChange}
            />
          </BoardErrorBoundary>
        }
        bottomPanel={
          <Clock
            time={playerColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === playerColor && gameState.status === 'playing'}
            color={playerColor || 'white'}
            playerName={myDisplayName}
            rating={playerRating}
            status={playerStatus}
            latencyMs={playerLatency}
            subtitle={playerSubtitle}
            capturedPieces={playerCaptureSummary.pieces}
            materialDelta={playerCaptureSummary.material}
          />
        }
        statusText={statusText}
        moveCount={moveCount}
        isViewingHistory={isViewingHistory}
        showCheckBadge={reviewActive ? review.currentState.isCheck : gameState.isCheck}
        toolbar={
          !reviewActive && premove ? (
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
          ) : null
        }
        sidePanel={
          <GamePageSidePanel
            t={t}
            gameId={gameId}
            gameState={gameState}
            playerColor={playerColor}
            playerSubtitle={playerSubtitle}
            statusText={statusText}
            countingLabel={countingLabel}
            canStartCounting={canStartCounting}
            canStopCounting={canStopCounting}
            gameOverInfo={gameOverInfo}
            rematchLabel={rematchLabel}
            rematchNotice={rematchNotice}
            rematchDisabled={rematchDisabled}
            reportLabel={reportLabel}
            reportDisabled={reportDisabled}
            canReportOpponent={canReportOpponent}
            timeControl={timeControl}
            whitePlayerName={whitePlayerName}
            blackPlayerName={blackPlayerName}
            review={review}
            reviewEngine={reviewEngine}
            reviewActive={reviewActive}
            viewMoveIndex={viewMoveIndex}
            onRematch={onRematch}
            onNewGame={onNewGame}
            onAnalyze={onAnalyze}
            onReport={onReport}
            onMoveClick={onMoveClick}
            onOfferDraw={onOfferDraw}
            onResign={onResign}
            onStartCounting={onStartCounting}
            onStopCounting={onStopCounting}
            onShowGuide={onShowGuide}
          />
        }
      />

      {gameOverInfo && showGameOverModal && (
        <GameOverModal
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
          reportLabel={modalReportLabel}
          reportDisabled={reportDisabled}
          onClose={onCloseGameOverModal}
        />
      )}

      <PieceGuide show={showGuide} onClose={onCloseGuide} />
    </div>
  );
}
