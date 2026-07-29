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
  turnState: {
    isMyTurn: boolean;
    isViewingHistory: boolean;
  };
  reviewSession: {
    active: boolean;
    mode: 'mainLine' | 'analysis';
    controls: ReviewControls;
    engine: ReviewEngineControls;
  };
  spectatorPath: string;
  shareLabel: string;
  notices: {
    drawOffered: boolean;
    opponentDisconnected: boolean;
  };
  overlays: {
    showGuide: boolean;
    showGameOverModal: boolean;
  };
  gameOverInfo: GameOverInfo | null;
  rematch: {
    label: string;
    notice: string | null;
    disabled: boolean;
  };
  reporting: {
    allowed: boolean;
    label: string;
    modalLabel: string;
    disabled: boolean;
  };
  timeControl: TimeControl | null;
  statusText: string;
  moveCount: number;
  counting: {
    label: string | null;
    canStart: boolean;
    canStop: boolean;
  };
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
  turnState,
  reviewSession,
  spectatorPath,
  shareLabel,
  notices,
  overlays,
  gameOverInfo,
  rematch,
  reporting,
  timeControl,
  statusText,
  moveCount,
  counting,
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
              {shareLabel}
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
            {notices.opponentDisconnected && (
              <div className="bg-accent/20 border-b border-accent/30 text-center py-2 text-xs sm:text-sm text-accent">
                {t('game.opponent_dc')}
              </div>
            )}
            {notices.drawOffered && (
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
              board={reviewSession.active ? reviewSession.controls.currentState.board : displayBoard}
              playerColor={playerColor}
              draggableColor={reviewSession.active && reviewSession.mode === 'analysis' ? reviewSession.controls.currentState.turn : undefined}
              isMyTurn={reviewSession.active ? reviewSession.mode === 'analysis' : turnState.isMyTurn}
              legalMoves={reviewSession.active ? reviewSession.controls.legalMoves : turnState.isViewingHistory ? [] : legalMoves}
              selectedSquare={reviewSession.active ? reviewSession.controls.selectedSquare : turnState.isViewingHistory ? null : selectedSquare}
              lastMove={reviewSession.active ? reviewSession.controls.currentLastMove : lastMove}
              isCheck={reviewSession.active ? reviewSession.controls.currentState.isCheck : turnState.isViewingHistory ? false : gameState.isCheck}
              checkSquare={reviewSession.active ? reviewSession.controls.currentCheckSquare : checkSquare}
              onSquareClick={reviewSession.active ? reviewSession.controls.handleSquareClick : onSquareClick}
              onPieceDrop={reviewSession.active ? reviewSession.controls.handlePieceDrop : onPieceDrop}
              disabled={reviewSession.active ? reviewSession.mode !== 'analysis' : turnState.isViewingHistory || (gameState.gameOver && !turnState.isViewingHistory)}
              premove={reviewSession.active ? null : premove}
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
        isViewingHistory={turnState.isViewingHistory}
        showCheckBadge={reviewSession.active ? reviewSession.controls.currentState.isCheck : gameState.isCheck}
        toolbar={
          !reviewSession.active && premove ? (
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
            countingLabel={counting.label}
            canStartCounting={counting.canStart}
            canStopCounting={counting.canStop}
            gameOverInfo={gameOverInfo}
            rematchLabel={rematch.label}
            rematchNotice={rematch.notice}
            rematchDisabled={rematch.disabled}
            reportLabel={reporting.label}
            reportDisabled={reporting.disabled}
            canReportOpponent={reporting.allowed}
            timeControl={timeControl}
            whitePlayerName={whitePlayerName}
            blackPlayerName={blackPlayerName}
            review={reviewSession.controls}
            reviewEngine={reviewSession.engine}
            reviewActive={reviewSession.active}
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

      {gameOverInfo && overlays.showGameOverModal && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          rated={gameState.rated}
          ratingChange={gameOverInfo.ratingChange}
          onRematch={onRematch}
          onNewGame={onNewGame}
          rematchLabel={rematch.label}
          rematchDisabled={rematch.disabled}
          rematchNotice={rematch.notice}
          onAnalyze={onAnalyze}
          onReport={reporting.allowed ? onReport : undefined}
          reportLabel={reporting.modalLabel}
          reportDisabled={reporting.disabled}
          onClose={onCloseGameOverModal}
        />
      )}

      <PieceGuide show={overlays.showGuide} onClose={onCloseGuide} />
    </div>
  );
}
