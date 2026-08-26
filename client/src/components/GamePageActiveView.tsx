import type { RefObject } from 'react';
import { useState } from 'react';
import type { ClientGameState, Move, PieceColor, Position, TimeControl } from '@shared/types';
import { useLgUp } from '../hooks/useLgUp';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import ConnectionStatus from './ConnectionStatus';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import GameHeaderToolsMenu, { gameHeaderMenuItemClass } from './GameHeaderToolsMenu';
import CountingBoardStrip from './CountingBoardStrip';
import GameMobileActions from './GameMobileActions';
import InGameShell from './InGameShell';
import GameOverModal from './GameOverModal';
import PieceGuide from './PieceGuide';
import PostGameSharePanel from './PostGameSharePanel';
import { GamePageSidePanel } from './GamePageSidePanel';
import type { ReviewControls, ReviewEngineControls } from './GamePageSidePanel';
import type { GameOverInfo, TranslateFn } from './gamePageHelpers';
import { CLOCK_CRITICAL_MS, gameMetaChipClass, shouldOfferPieceGuideStatusHelp } from './gamePageHelpers';
import PieceGuideStatusHelp from './PieceGuideStatusHelp';

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
    liveError: string | null;
  };
  onDismissLiveError: () => void;
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

function ActiveViewHeaderMeta({
  t,
  rated,
  shareLabel,
  spectatorPath,
  gameId,
  onCopyGameLink,
}: {
  t: TranslateFn;
  rated: boolean;
  shareLabel: string;
  spectatorPath: string;
  gameId: string | undefined;
  onCopyGameLink: () => void;
}) {
  return (
    <>
      <span
        data-testid="game-rated-chip"
        className={`${gameMetaChipClass} px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em]`}
      >
        {rated ? t('game.rated') : t('game.casual')}
      </span>
      <AppearanceSettingsButton compact mode="popover" />
      <GameHeaderToolsMenu t={t}>
        <button
          type="button"
          onClick={onCopyGameLink}
          className={gameHeaderMenuItemClass}
        >
          {shareLabel}
        </button>
        <a
          href={spectatorPath}
          target="_blank"
          rel="noreferrer"
          className={gameHeaderMenuItemClass}
        >
          {t('game.open_spectator')}
        </a>
        {gameId ? (
          <div className="px-3 py-2 text-[0.7rem] uppercase tracking-[0.16em] text-text-dim">
            {t('game.game_label')}{' '}
            <span className="font-mono normal-case tracking-normal text-text-bright">{gameId}</span>
          </div>
        ) : null}
      </GameHeaderToolsMenu>
    </>
  );
}

function ActiveViewBanners({
  t,
  notices,
  onDismissLiveError,
  onRespondDraw,
}: {
  t: TranslateFn;
  notices: {
    drawOffered: boolean;
    opponentDisconnected: boolean;
    liveError: string | null;
  };
  onDismissLiveError: () => void;
  onRespondDraw: (accept: boolean) => void;
}) {
  return (
    <>
      {notices.liveError && (
        <div
          role="alert"
          className="flex items-center justify-center gap-3 border-b border-danger/30 bg-danger/15 px-3 py-2.5 text-center text-xs sm:text-sm text-danger"
        >
          <span className="min-w-0 flex-1 font-medium">{notices.liveError}</span>
          <button
            type="button"
            onClick={onDismissLiveError}
            className="shrink-0 rounded-lg border border-danger/30 px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
            aria-label={t('common.close')}
          >
            {t('common.close')}
          </button>
        </div>
      )}
      {notices.opponentDisconnected && (
        <div className="border-b border-surface-hover bg-surface-alt/80 text-center py-2 text-xs sm:text-sm text-text-dim">
          {t('game.opponent_dc')}
        </div>
      )}
      {notices.drawOffered && (
        <div
          data-testid="draw-offer-banner"
          className="flex flex-wrap items-center justify-center gap-3 border-b border-surface-hover/80 bg-surface-alt/95 px-2 py-3 text-center text-xs sm:text-sm"
        >
          <span className="font-medium text-text-bright">{t('game.draw_offer_received')}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRespondDraw(true)}
              className="ui-btn-primary px-4 py-2 text-sm"
            >
              {t('game.accept')}
            </button>
            <button
              type="button"
              onClick={() => onRespondDraw(false)}
              className="rounded-lg border border-surface-hover bg-transparent px-4 py-2 text-sm font-semibold text-text-dim transition-colors hover:bg-surface-hover hover:text-text-bright"
            >
              {t('game.decline')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function PeakEndModal({
  t,
  gameState,
  playerColor,
  gameOverInfo,
  rematch,
  reporting,
  gameId,
  timeControl,
  whitePlayerName,
  blackPlayerName,
  shareOpen,
  onShareOpen,
  canShare,
  onRematch,
  onNewGame,
  onAnalyze,
  onReport,
  onCloseGameOverModal,
}: {
  t: TranslateFn;
  gameState: ClientGameState;
  playerColor: PieceColor | null;
  gameOverInfo: GameOverInfo;
  rematch: { label: string; notice: string | null; disabled: boolean };
  reporting: { allowed: boolean; label: string; modalLabel: string; disabled: boolean };
  gameId: string | undefined;
  timeControl: TimeControl | null;
  whitePlayerName: string;
  blackPlayerName: string;
  shareOpen: boolean;
  onShareOpen: (open: boolean) => void;
  canShare: boolean;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: (() => void) | undefined;
  onReport: (() => void) | undefined;
  onCloseGameOverModal: () => void;
}) {
  return (
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
      onClose={() => {
        onShareOpen(false);
        onCloseGameOverModal();
      }}
      moreExtrasOnly={shareOpen}
      moreExtras={
        canShare && playerColor ? (
          shareOpen ? (
            <div className="space-y-2 text-left" data-testid="post-game-share-path">
              <button
                type="button"
                onClick={() => onShareOpen(false)}
                className="w-full text-left text-sm font-semibold text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
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
          ) : (
            <button
              type="button"
              data-testid="post-game-share-expand"
              onClick={() => onShareOpen(true)}
              className="ui-btn-secondary w-full rounded-lg px-3 py-2 text-sm font-semibold"
            >
              {t('game.show_share')}
            </button>
          )
        ) : null
      }
    />
  );
}

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
  onDismissLiveError,
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
  const lgUp = useLgUp();
  const [peakShareOpen, setPeakShareOpen] = useState(false);
  const myClockMs = playerColor === 'white'
    ? gameState.whiteTime
    : playerColor === 'black'
      ? gameState.blackTime
      : null;
  const countingLeaveUrgent = typeof myClockMs === 'number' && myClockMs < CLOCK_CRITICAL_MS;
  const showCounting = Boolean(!gameState.gameOver && counting.label);
  const canPeakShare = Boolean(gameOverInfo && playerColor);

  return (
    <div ref={containerRef}>
      <ConnectionStatus />

      <InGameShell
        onHome={onHome}
        headerMeta={
          <ActiveViewHeaderMeta
            t={t}
            rated={gameState.rated}
            shareLabel={shareLabel}
            spectatorPath={spectatorPath}
            gameId={gameId}
            onCopyGameLink={onCopyGameLink}
          />
        }
        banners={
          <ActiveViewBanners
            t={t}
            notices={notices}
            onDismissLiveError={onDismissLiveError}
            onRespondDraw={onRespondDraw}
          />
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
        statusHelp={
          !reviewSession.active
          && shouldOfferPieceGuideStatusHelp(
            moveCount,
            gameState.isCheck,
            gameState.gameOver,
          )
            ? <PieceGuideStatusHelp t={t} onShowGuide={onShowGuide} />
            : null
        }
        boardNotice={
          showCounting && !lgUp && counting.label ? (
            <CountingBoardStrip
              t={t}
              label={counting.label}
              canStart={counting.canStart}
              canStop={counting.canStop}
              onStart={onStartCounting}
              onStop={onStopCounting}
              onOfferDraw={onOfferDraw}
              onResign={onResign}
              leaveUrgent={countingLeaveUrgent}
            />
          ) : null
        }
        boardActions={
          /* Counting strip owns Start/Stop + compact exits; demote the separate thumb row to avoid stacking. */
          !lgUp && !showCounting && !gameState.gameOver && gameState.status === 'playing' ? (
            <GameMobileActions t={t} onOfferDraw={onOfferDraw} onResign={onResign} />
          ) : null
        }
        toolbar={
          !reviewSession.active && premove ? (
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
          ) : null
        }
        sidePanel={
          <GamePageSidePanel
            t={t}
            gameId={gameId}
            gameState={gameState}
            playerColor={playerColor}
            countingLabel={showCounting && lgUp ? counting.label : null}
            countingAction={counting.canStart ? 'start' : counting.canStop ? 'stop' : null}
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
            showHighStakesActions={lgUp}
            endgamePeakOpen={overlays.showGameOverModal}
            leaveUrgent={countingLeaveUrgent}
          />
        }
      />

      {gameOverInfo && overlays.showGameOverModal && (
        <PeakEndModal
          t={t}
          gameState={gameState}
          playerColor={playerColor}
          gameOverInfo={gameOverInfo}
          rematch={rematch}
          reporting={reporting}
          gameId={gameId}
          timeControl={timeControl}
          whitePlayerName={whitePlayerName}
          blackPlayerName={blackPlayerName}
          shareOpen={peakShareOpen}
          onShareOpen={setPeakShareOpen}
          canShare={canPeakShare}
          onRematch={onRematch}
          onNewGame={onNewGame}
          onAnalyze={onAnalyze}
          onReport={onReport}
          onCloseGameOverModal={onCloseGameOverModal}
        />
      )}

      <PieceGuide show={overlays.showGuide} onClose={onCloseGuide} />
    </div>
  );
}
