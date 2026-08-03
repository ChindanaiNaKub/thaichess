import type { Dispatch, SetStateAction } from 'react';
import type { Position, PieceColor, ClientGameState, Move } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import { useTranslation } from '../lib/i18n';
import { getCapturedSummary } from '../lib/capturedSummary';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import MoveHistory from './MoveHistory';
import ConnectionStatus from './ConnectionStatus';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import GameHeaderToolsMenu, { gameHeaderMenuItemClass } from './GameHeaderToolsMenu';
import InGameShell from './InGameShell';
import { SpectatorResultCard } from './SpectatorResultCard';

export interface SpectatorActiveViewProps {
  gameId: string | undefined;
  gameState: ClientGameState;
  boardOrientation: PieceColor;
  setBoardOrientation: Dispatch<SetStateAction<PieceColor>>;
  viewMoveIndex: number | null;
  arrows: Arrow[];
  setArrows: Dispatch<SetStateAction<Arrow[]>>;
  copied: boolean;
  copySpectatorLink: () => void;
  handleMoveClick: (index: number) => void;
  getLastMove: () => Move | null;
  getCheckSquare: () => Position | null;
  getDisplayBoard: () => ClientGameState['board'];
  getVisibleMoves: () => Move[];
  onHome: () => void;
}

export function SpectatorActiveView({
  gameId,
  gameState,
  boardOrientation,
  setBoardOrientation,
  viewMoveIndex,
  arrows,
  setArrows,
  copied,
  copySpectatorLink,
  handleMoveClick,
  getLastMove,
  getCheckSquare,
  getDisplayBoard,
  getVisibleMoves,
  onHome,
}: SpectatorActiveViewProps) {
  const { t } = useTranslation();
  const isViewingHistory = gameState.gameOver && viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1;
  const visibleMoves = getVisibleMoves();
  const topColor: PieceColor = boardOrientation === 'white' ? 'black' : 'white';
  const bottomColor: PieceColor = boardOrientation;
  const topName = topColor === 'white'
    ? gameState.whitePlayerName?.trim() || t('common.white')
    : gameState.blackPlayerName?.trim() || t('common.black');
  const bottomName = bottomColor === 'white'
    ? gameState.whitePlayerName?.trim() || t('common.white')
    : gameState.blackPlayerName?.trim() || t('common.black');
  const topRating = topColor === 'white' ? gameState.whiteRating : gameState.blackRating;
  const bottomRating = bottomColor === 'white' ? gameState.whiteRating : gameState.blackRating;
  const topStatus = gameState.status === 'playing' && gameState.turn === topColor ? 'active' : 'online';
  const bottomStatus = gameState.status === 'playing' && gameState.turn === bottomColor ? 'active' : 'online';
  const topCaptureSummary = getCapturedSummary(visibleMoves, topColor);
  const bottomCaptureSummary = getCapturedSummary(visibleMoves, bottomColor);
  const statusText = gameState.status === 'waiting'
    ? t('game.waiting_title')
    : gameState.gameOver
      ? t('game.reviewing_position')
      : t('game.spectator_turn', { color: t(gameState.turn === 'white' ? 'common.white' : 'common.black') });

  return (
    <div>
      <ConnectionStatus />

      <InGameShell
        onHome={onHome}
        headerMeta={
          <>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-light">
              {t('game.spectator_mode')}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
              gameState.status === 'playing'
                ? 'border border-danger/25 bg-danger/10 text-danger'
                : 'border border-surface-hover bg-surface text-text-dim'
            }`}>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${gameState.status === 'playing' ? 'bg-danger animate-pulse' : 'bg-text-dim/50'}`} />
                {gameState.status === 'playing' ? t('game.live_now') : t('game.final_position')}
              </span>
            </span>
            <AppearanceSettingsButton compact mode="popover" />
            <GameHeaderToolsMenu t={t}>
              <button
                type="button"
                onClick={copySpectatorLink}
                className={gameHeaderMenuItemClass}
              >
                {copied ? t('game.copied') : t('game.share')}
              </button>
              {gameId ? (
                <div className="px-3 py-2 text-[0.7rem] uppercase tracking-[0.16em] text-text-dim">
                  {t('game.game_label')}{' '}
                  <span className="font-mono normal-case tracking-normal text-text-bright">{gameId}</span>
                </div>
              ) : null}
            </GameHeaderToolsMenu>
          </>
        }
        topPanel={
          <Clock
            time={topColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === topColor && gameState.status === 'playing'}
            color={topColor}
            playerName={topName}
            rating={topRating}
            status={topStatus}
            subtitle={t(topColor === 'white' ? 'common.white' : 'common.black')}
            capturedPieces={topCaptureSummary.pieces}
            materialDelta={topCaptureSummary.material}
          />
        }
        board={
          <BoardErrorBoundary onRetry={() => window.location.reload()}>
            <Board
              board={getDisplayBoard()}
              playerColor={boardOrientation}
              draggableColor={null}
              isMyTurn={false}
              legalMoves={[]}
              selectedSquare={null}
              lastMove={getLastMove()}
              isCheck={isViewingHistory ? false : gameState.isCheck}
              checkSquare={getCheckSquare()}
              onSquareClick={() => {}}
              onPieceDrop={() => {}}
              disabled
              arrows={arrows}
              onArrowsChange={setArrows}
            />
          </BoardErrorBoundary>
        }
        bottomPanel={
          <Clock
            time={bottomColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === bottomColor && gameState.status === 'playing'}
            color={bottomColor}
            playerName={bottomName}
            rating={bottomRating}
            status={bottomStatus}
            subtitle={t(bottomColor === 'white' ? 'common.white' : 'common.black')}
            capturedPieces={bottomCaptureSummary.pieces}
            materialDelta={bottomCaptureSummary.material}
          />
        }
        statusText={statusText}
        moveCount={gameState.moveHistory.length}
        isViewingHistory={isViewingHistory}
        showCheckBadge={gameState.isCheck}
        toolbar={
          <>
            <span className="rounded-full border border-surface-hover bg-surface-alt px-2.5 py-1 text-text-dim normal-case tracking-normal">
              {t('game.read_only')}
            </span>
            <button type="button"
              onClick={() => setBoardOrientation((current) => current === 'white' ? 'black' : 'white')}
              className="rounded-full border border-surface-hover bg-surface-alt px-2.5 py-1 text-text-dim normal-case tracking-normal transition-colors hover:text-text-bright"
            >
              {t('game.flip_board')}
            </button>
          </>
        }
        sidePanel={
          <>
            <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                    {t('game.spectator_mode')}
                  </div>
                  <div className="mt-1 text-lg font-bold text-text-bright">{t('game.watching_live_game')}</div>
                  <p className="mt-1 text-sm text-text-dim">{t('game.spectator_desc')}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  gameState.status === 'playing'
                    ? 'border border-danger/25 bg-danger/10 text-danger'
                    : 'border border-surface-hover bg-surface text-text-dim'
                }`}>
                  {gameState.status === 'playing' ? t('game.live_now') : t('game.final_position')}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-text-dim">
                <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1">
                  {gameState.rated ? t('game.rated') : t('game.casual')}
                </span>
                <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1">
                  {boardOrientation === 'white' ? t('game.white_perspective') : t('game.black_perspective')}
                </span>
              </div>
            </div>

            {!gameState.gameOver && (
              <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-4 py-3 text-sm text-text-dim">
                <div className="font-semibold text-text-bright">{t('game.spectator_controls_hidden')}</div>
                <div className="mt-1">{t('game.live_position_locked')}</div>
              </div>
            )}

            {gameState.gameOver && (
              <SpectatorResultCard gameState={gameState} orientation={boardOrientation} />
            )}

            <MoveHistory
              moves={gameState.moveHistory}
              initialBoard={createInitialBoard()}
              currentMoveIndex={viewMoveIndex ?? undefined}
              onMoveClick={gameState.gameOver ? handleMoveClick : undefined}
            />

            {gameState.gameOver && gameState.moveHistory.length > 0 && (
              <div className="text-center text-[11px] text-text-dim">
                {t('game.nav_hint')}
              </div>
            )}
          </>
        }
      />
    </div>
  );
}
