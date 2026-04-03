import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Position, PieceColor, ClientGameState, Move } from '@shared/types';
import { createInitialBoard, getBoardAtMove } from '@shared/engine';
import { socket, connectSocket } from '../lib/socket';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';
import { getCapturedSummary } from '../lib/capturedSummary';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import MoveHistory from './MoveHistory';
import ConnectionStatus from './ConnectionStatus';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import Header from './Header';
import InGameShell from './InGameShell';

function SpectatorResultCard({
  gameState,
  orientation,
}: {
  gameState: ClientGameState;
  orientation: PieceColor;
}) {
  const { t } = useTranslation();
  const resultText = gameState.winner
    ? `${t(gameState.winner === 'white' ? 'common.white' : 'common.black')}  ${t('gameover.is_victorious')}`
    : t('gameover.draw');
  const score = gameState.winner === 'white' ? '1-0' : gameState.winner === 'black' ? '0-1' : '1/2-1/2';
  const reason = gameState.resultReason
    ? t(`gameover.by_${gameState.resultReason === 'resignation'
      ? 'resign'
      : gameState.resultReason === 'timeout'
        ? 'timeout'
        : gameState.resultReason === 'stalemate'
          ? 'stalemate'
          : gameState.resultReason === 'draw_agreement'
            ? 'agreement'
            : gameState.resultReason === 'insufficient_material'
              ? 'material'
              : gameState.resultReason === 'counting_rule'
                ? 'counting'
                : 'unknown'}`)
    : '';

  return (
    <div className="rounded-xl border border-surface-hover bg-surface-alt/95 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            {t('game.final_position')}
          </div>
          <div className="mt-1 text-lg font-bold text-text-bright">{score}</div>
          <div className="text-sm text-text-dim">
            {resultText}{reason ? ` · ${reason}` : ''}
          </div>
        </div>
        <div className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
          {orientation === 'white' ? t('game.white_perspective') : t('game.black_perspective')}
        </div>
      </div>
    </div>
  );
}

export default function SpectatorPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<PieceColor>('white');
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const joinedRef = useRef(false);
  const latestGameStateRef = useRef<ClientGameState | null>(null);

  useEffect(() => {
    latestGameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!gameId) return;

    connectSocket();

    const handleConnect = () => {
      if (!joinedRef.current) {
        socket.emit('spectate_game', { gameId });
        joinedRef.current = true;
      }
    };

    const handleDisconnect = () => {
      joinedRef.current = false;
    };

    const handleJoined = ({ gameState: gs }: { color: PieceColor | null; gameState: ClientGameState }) => {
      setGameState(gs);
      setError(null);
    };

    const handleGameState = (gs: ClientGameState) => {
      setGameState(gs);
    };

    const handleMoveMade = ({ move, gameState: gs }: { move: Move; gameState: ClientGameState }) => {
      setGameState(gs);
      setArrows([]);
      if (gs.isCheck) {
        playCheckSound();
      } else if (move.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
    };

    const handleGameOver = ({ gameState: gs }: {
      reason: string;
      winner: PieceColor | null;
      gameState: ClientGameState;
    }) => {
      setGameState(gs);
      playGameOverSound();
    };

    const handleClockUpdate = ({ whiteTime, blackTime }: { whiteTime: number; blackTime: number }) => {
      setGameState(prev => prev ? { ...prev, whiteTime, blackTime } : null);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message || t('game.load_failed'));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('game_joined', handleJoined);
    socket.on('game_state', handleGameState);
    socket.on('move_made', handleMoveMade);
    socket.on('game_over', handleGameOver);
    socket.on('clock_update', handleClockUpdate);
    socket.on('error', handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('game_joined', handleJoined);
      socket.off('game_state', handleGameState);
      socket.off('move_made', handleMoveMade);
      socket.off('game_over', handleGameOver);
      socket.off('clock_update', handleClockUpdate);
      socket.off('error', handleError);
    };
  }, [gameId, t]);

  useEffect(() => {
    return () => {
      const latestGameState = latestGameStateRef.current;
      if (latestGameState && socket.connected) {
        socket.emit('leave_game', { gameId: latestGameState.gameId });
      }
    };
  }, []);

  useEffect(() => {
    if (!gameState || gameState.moveHistory.length === 0 || !gameState.gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const moveCount = gameState.moveHistory.length;
      const current = viewMoveIndex ?? moveCount - 1;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setViewMoveIndex(Math.max(-1, current - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setViewMoveIndex(Math.min(moveCount - 1, current + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setViewMoveIndex(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setViewMoveIndex(moveCount - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, viewMoveIndex]);

  const copySpectatorLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleMoveClick = useCallback((index: number) => {
    if (!gameState?.gameOver) return;
    setViewMoveIndex(index);
  }, [gameState]);

  const getLastMove = (): Move | null => {
    if (!gameState || gameState.moveHistory.length === 0) return null;
    const idx = viewMoveIndex ?? gameState.moveHistory.length - 1;
    if (idx < 0) return null;
    return gameState.moveHistory[idx];
  };

  const getCheckSquare = (): Position | null => {
    if (!gameState?.isCheck) return null;
    if (viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1) return null;
    const board = gameState.board;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'K' && piece.color === gameState.turn) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const getDisplayBoard = () => {
    if (!gameState) return createInitialBoard();
    if (!gameState.gameOver || viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.board;
    }
    if (viewMoveIndex === -1) return createInitialBoard();
    return getBoardAtMove(createInitialBoard(), gameState.moveHistory, viewMoveIndex);
  };

  const getVisibleMoves = () => {
    if (!gameState) return [];
    if (!gameState.gameOver || viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.moveHistory;
    }
    if (viewMoveIndex < 0) return [];
    return gameState.moveHistory.slice(0, viewMoveIndex + 1);
  };

  if (error && !gameState) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg sm:text-xl font-bold text-danger mb-2">{t('game.error')}</h2>
            <p className="text-text-dim mb-4 text-sm sm:text-base">{error}</p>
            <button onClick={() => navigate(routes.home)} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold text-sm sm:text-base">
              {t('common.back_home')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-dim text-sm sm:text-base">{t('game.connecting')}</p>
          </div>
        </div>
      </div>
    );
  }

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
        onHome={() => navigate(routes.home)}
        headerMeta={
          <>
            <AppearanceSettingsButton compact />
            <span className="hidden md:inline">{t('game.game_label')} <span className="font-mono text-text">{gameId}</span></span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
              {t('game.spectator_mode')}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              gameState.status === 'playing'
                ? 'border border-danger/25 bg-danger/10 text-danger'
                : 'border border-surface-hover bg-surface text-text-dim'
            }`}>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${gameState.status === 'playing' ? 'bg-danger animate-pulse' : 'bg-text-dim/50'}`} />
                {gameState.status === 'playing' ? t('game.live_now') : t('game.final_position')}
              </span>
            </span>
            <button
              onClick={copySpectatorLink}
              className="px-2 py-1 rounded bg-surface-hover hover:bg-primary/20 text-text text-xs transition-colors"
            >
              {copied ? t('game.copied') : t('game.share')}
            </button>
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
            <button
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
