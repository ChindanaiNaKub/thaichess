import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Position, PieceColor, ClientGameState, Move, RatingChangeSummary } from '@shared/types';
import { createInitialBoard, getBoardAtMove, getLegalMoves } from '@shared/engine';
import { socket, connectSocket } from '../lib/socket';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound, playGameStartSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { usePieceStyle } from '../lib/pieceStyle';
import { liveGameRoute, routes, savedGameAnalysisRoute } from '../lib/routes';
import { getCapturedSummary } from '../lib/capturedSummary';
import { useGameInteraction } from '../hooks/useGameInteraction';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import GameOverPanel from './GameOverPanel';
import PieceGuide from './PieceGuide';
import ConnectionStatus from './ConnectionStatus';
import Header from './Header';
import GameHeaderBar from './GameHeaderBar';
import GameScreenLayout from './GameScreenLayout';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pieceStyle, setPieceStyle } = usePieceStyle();

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null; ratingChange: RatingChangeSummary | null } | null>(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [rematchState, setRematchState] = useState<'idle' | 'sent' | 'received'>('idle');
  const joinedRef = useRef(false);
  const latestGameStateRef = useRef<ClientGameState | null>(null);

  // Arrow state
  const [arrows, setArrows] = useState<Arrow[]>([]);

  // Keyboard navigation state
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMyTurn = gameState?.turn === playerColor && gameState?.status === 'playing';

  useEffect(() => {
    latestGameStateRef.current = gameState;
  }, [gameState]);

  // Use the game interaction hook for move handling
  const {
    selectedSquare,
    legalMoves,
    premove,
    handleSquareClick,
    handlePieceDrop,
    cancelPremove,
    clearSelection,
  } = useGameInteraction({
    gameState,
    playerColor,
    isMyTurn,
  });

  useEffect(() => {
    if (!gameId) return;

    connectSocket();

    const handleConnect = () => {
      if (!joinedRef.current) {
        socket.emit('join_game', { gameId });
        joinedRef.current = true;
      }
    };

    const handleDisconnect = () => {
      joinedRef.current = false;
    };

    const handleJoined = ({ color, gameState: gs }: { color: PieceColor; gameState: ClientGameState }) => {
      setPlayerColor(color);
      setGameState(gs);
      setError(null);
      if (gs.status === 'playing') playGameStartSound();
    };

    const handleGameState = (gs: ClientGameState) => {
      setGameState(prev => {
        if (prev?.status === 'waiting' && gs.status === 'playing') {
          playGameStartSound();
        }
        return gs;
      });
    };

    const handleMoveMade = ({ move, gameState: gs }: { move: Move; gameState: ClientGameState }) => {
      setGameState(gs);
      clearSelection();
      setArrows([]);
      if (gs.isCheck) {
        playCheckSound();
      } else if (move.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
    };

    const handleGameOver = ({ reason, winner, gameState: gs, ratingChange }: {
      reason: string;
      winner: PieceColor | null;
      gameState: ClientGameState;
      ratingChange: RatingChangeSummary | null;
    }) => {
      setGameState(gs);
      setGameOverInfo({ reason, winner, ratingChange });
      setShowGameOverModal(true);
      setRematchState('idle');
      cancelPremove();
      playGameOverSound();
    };

    const handleClockUpdate = ({ whiteTime, blackTime }: { whiteTime: number; blackTime: number }) => {
      setGameState(prev => prev ? { ...prev, whiteTime, blackTime } : null);
    };

    const handleDrawOffered = () => {
      setDrawOffered(true);
    };

    const handleDrawDeclined = () => {
      setDrawOffered(false);
    };

    const handleOpponentDisconnected = () => {
      setOpponentDisconnected(true);
    };

    const handleOpponentReconnected = () => {
      setOpponentDisconnected(false);
    };

    const handleRematchOffered = () => {
      setRematchState((current) => (current === 'sent' ? current : 'received'));
      setShowGameOverModal(true);
    };

    const handleGameCreated = ({ gameId: newGameId }: { gameId: string }) => {
      joinedRef.current = false;
      setGameState(null);
      setGameOverInfo(null);
      setShowGameOverModal(false);
      setRematchState('idle');
      clearSelection();
      setDrawOffered(false);
      cancelPremove();
      setArrows([]);
      setViewMoveIndex(null);
      navigate(liveGameRoute(newGameId));
    };

    const handleError = ({ message }: { message: string }) => {
      setRematchState('idle');
      setError(message);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('game_joined', handleJoined);
    socket.on('game_state', handleGameState);
    socket.on('move_made', handleMoveMade);
    socket.on('game_over', handleGameOver);
    socket.on('clock_update', handleClockUpdate);
    socket.on('draw_offered', handleDrawOffered);
    socket.on('draw_declined', handleDrawDeclined);
    socket.on('rematch_offered', handleRematchOffered);
    socket.on('opponent_disconnected', handleOpponentDisconnected);
    socket.on('opponent_reconnected', handleOpponentReconnected);
    socket.on('game_created', handleGameCreated);
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
      socket.off('draw_offered', handleDrawOffered);
      socket.off('draw_declined', handleDrawDeclined);
      socket.off('rematch_offered', handleRematchOffered);
      socket.off('opponent_disconnected', handleOpponentDisconnected);
      socket.off('opponent_reconnected', handleOpponentReconnected);
      socket.off('game_created', handleGameCreated);
      socket.off('error', handleError);
    };
  }, [gameId, navigate, clearSelection, cancelPremove]);

  useEffect(() => {
    return () => {
      const latestGameState = latestGameStateRef.current;
      if (latestGameState && latestGameState.status !== 'playing' && socket.connected) {
        socket.emit('leave_game', { gameId: latestGameState.gameId });
      }
    };
  }, []);

  // Auto-execute premove when it becomes our turn
  useEffect(() => {
    if (!premove || !gameState || !playerColor || !isMyTurn) return;

    const piece = gameState.board[premove.from.row][premove.from.col];
    if (piece && piece.color === playerColor) {
      const legal = getLegalMoves(gameState.board, premove.from);
      if (legal.some(m => m.row === premove.to.row && m.col === premove.to.col)) {
        socket.emit('make_move', { from: premove.from, to: premove.to });
      }
    }
    cancelPremove();
    clearSelection();
  }, [isMyTurn, premove, gameState, playerColor, cancelPremove, clearSelection]);

  // Keyboard navigation for move history
  useEffect(() => {
    if (!gameState || gameState.moveHistory.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.gameOver) return;

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

  const handleResign = () => {
    if (window.confirm(t('game.resign_confirm'))) {
      socket.emit('resign');
    }
  };

  const handleOfferDraw = () => {
    socket.emit('offer_draw');
  };

  const handleStartCounting = () => {
    socket.emit('start_counting');
  };

  const handleStopCounting = () => {
    socket.emit('stop_counting');
  };

  const handleRespondDraw = (accept: boolean) => {
    socket.emit('respond_draw', { accept });
    setDrawOffered(false);
  };

  const handleRematch = () => {
    if (rematchState === 'sent') return;
    setRematchState('sent');
    socket.emit('request_rematch');
  };

  const handleNewGame = () => {
    if (gameState?.status === 'waiting') {
      socket.emit('leave_game', { gameId: gameState.gameId });
    }
    navigate(routes.home);
  };

  const copyGameLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
    if (viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.board;
    }
    if (viewMoveIndex === -1) return createInitialBoard();
    return getBoardAtMove(createInitialBoard(), gameState.moveHistory, viewMoveIndex);
  };

  const handleMoveClick = useCallback((index: number) => {
    if (!gameState) return;
    if (index === gameState.moveHistory.length - 1 && viewMoveIndex === null) return;
    setViewMoveIndex(index);
  }, [gameState, viewMoveIndex]);

  const getVisibleMoves = () => {
    if (!gameState) return [];
    if (viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.moveHistory;
    }
    if (viewMoveIndex < 0) return [];
    return gameState.moveHistory.slice(0, viewMoveIndex + 1);
  };

  // Waiting room
  if (gameState && gameState.status === 'waiting') {
    const waitingPlayerName = playerColor === 'white'
      ? gameState.whitePlayerName?.trim() || user?.username?.trim() || (user?.email ? user.email.split('@')[0] : '') || t('common.you')
      : gameState.blackPlayerName?.trim() || user?.username?.trim() || (user?.email ? user.email.split('@')[0] : '') || t('common.you');
    const waitingPlayerRating = playerColor === 'white'
      ? gameState.whiteRating
      : playerColor === 'black'
        ? gameState.blackRating
        : null;
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />

        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center animate-slideUp">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-text-bright mb-2">{t('game.waiting_title')}</h2>
            <p className="text-text-dim mb-6 text-sm sm:text-base">{t('game.waiting_desc')}</p>

            <div className="mb-4 rounded-xl border border-surface-hover bg-surface px-4 py-3 text-left">
              <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('game.playing_as_label')}</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-text-bright">{waitingPlayerName}</div>
                  <div className="text-xs text-text-dim">{playerColor ? t(`common.${playerColor}`) : t('common.you')}</div>
                </div>
                {typeof waitingPlayerRating === 'number' && (
                  <span className="rounded-full border border-surface-hover bg-surface-alt px-3 py-1 text-xs font-semibold text-text-bright">
                    {t('leaderboard.col_rating')} {waitingPlayerRating}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface rounded-lg p-2 mb-4">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent text-text-bright text-sm px-2 focus:outline-none font-mono"
              />
              <button
                onClick={copyGameLink}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  copied
                    ? 'bg-primary text-white'
                    : 'bg-surface-hover hover:bg-primary/20 text-text-bright'
                }`}
              >
                {copied ? t('game.copied') : t('game.copy')}
              </button>
            </div>

            <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              gameState.rated ? 'bg-primary/15 text-primary-light' : 'bg-surface text-text-dim border border-surface-hover'
            }`}>
              {gameState.rated ? t('game.rated') : t('game.casual')}
            </div>
            <button
              onClick={handleNewGame}
              className="mt-4 px-5 py-2 rounded-lg bg-surface hover:bg-surface-hover text-text-bright border border-surface-hover font-semibold transition-colors"
            >
              {t('common.back_home')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Error state
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

  // Loading state
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

  const opponentColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const isViewingHistory = viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1;
  const whitePlayerName = gameState.whitePlayerName?.trim() || '';
  const blackPlayerName = gameState.blackPlayerName?.trim() || '';
  const whiteRating = gameState.whiteRating
    ?? (gameOverInfo?.ratingChange ? gameOverInfo.ratingChange.whiteBefore : null);
  const blackRating = gameState.blackRating
    ?? (gameOverInfo?.ratingChange ? gameOverInfo.ratingChange.blackBefore : null);
  const myDisplayName = playerColor === 'white'
    ? whitePlayerName || user?.username?.trim() || (user?.email ? user.email.split('@')[0] : '') || t('common.you')
    : blackPlayerName || user?.username?.trim() || (user?.email ? user.email.split('@')[0] : '') || t('common.you');
  const opponentDisplayName = opponentColor === 'white'
    ? whitePlayerName || t('game.opponent')
    : blackPlayerName || t('game.opponent');
  const playerRating = playerColor === 'white'
    ? whiteRating
    : playerColor === 'black'
      ? blackRating
      : null;
  const opponentRating = opponentColor === 'white' ? whiteRating : blackRating;
  const playerSubtitle = t(playerColor === 'white' ? 'common.white' : 'common.black');
  const opponentSubtitle = t(opponentColor === 'white' ? 'common.white' : 'common.black');
  const playerStatus = gameState.status === 'playing' && gameState.turn === playerColor ? 'active' : 'online';
  const opponentStatus = opponentDisconnected
    ? 'offline'
    : gameState.status === 'playing' && gameState.turn === opponentColor
      ? 'active'
      : 'online';
  const countingLabel = gameState.counting
    ? !gameState.counting.active
      ? t('game.counting_available', {
        type: t(gameState.counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
        color: t(gameState.counting.countingColor === 'white' ? 'common.white' : 'common.black'),
      })
      : gameState.counting.finalAttackPending
      ? t('game.counting_final', {
        type: t(gameState.counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
      })
      : t('game.counting_status', {
        type: t(gameState.counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
        color: t(gameState.counting.countingColor === 'white' ? 'common.white' : 'common.black'),
        current: gameState.counting.currentCount,
        limit: gameState.counting.limit,
      })
    : null;
  const canStartCounting = Boolean(
    gameState.counting &&
    !gameState.gameOver &&
    !gameState.counting.active &&
    playerColor === gameState.counting.countingColor &&
    gameState.turn === playerColor,
  );
  const canStopCounting = Boolean(
    gameState.counting &&
    !gameState.gameOver &&
    gameState.counting.active &&
    playerColor === gameState.counting.countingColor &&
    gameState.turn === playerColor,
  );
  const moveCount = gameState.moveHistory.length;
  const visibleMoves = getVisibleMoves();
  const playerCaptureSummary = getCapturedSummary(visibleMoves, playerColor || 'white');
  const opponentCaptureSummary = getCapturedSummary(visibleMoves, opponentColor);
  const statusText = gameState.gameOver
    ? t('game.reviewing_position')
    : isMyTurn
      ? t('game.your_turn')
      : t('game.opponent_turn');
  const rematchLabel = rematchState === 'received'
    ? t('gameover.rematch_accept')
    : rematchState === 'sent'
      ? t('gameover.rematch_sent')
      : t('gameover.rematch');
  const rematchNotice = rematchState === 'received'
    ? t('gameover.rematch_incoming')
    : rematchState === 'sent'
      ? t('gameover.rematch_waiting')
      : null;

  return (
    <div ref={containerRef} className="bg-surface flex min-h-screen flex-col lg:h-dvh lg:overflow-hidden" tabIndex={-1}>
      <ConnectionStatus />

      <GameHeaderBar
        onHome={() => navigate(routes.home)}
        meta={
          <>
            <label className="flex items-center gap-2">
              <span className="hidden uppercase tracking-[0.2em] text-[10px] text-text-dim lg:inline">{t('game.piece_style')}</span>
              <select
                value={pieceStyle}
                onChange={(e) => setPieceStyle(e.target.value as 'classic' | 'western')}
                className="h-7 min-w-0 rounded-md border border-surface-hover/60 bg-surface px-2 text-xs font-semibold text-text-bright outline-none transition-colors hover:bg-surface-hover max-w-[5.5rem] sm:max-w-none"
                title={t('game.select_piece_style')}
                aria-label={t('game.select_piece_style')}
              >
                <option value="classic">{t('game.piece_style_makruk')}</option>
                <option value="western">{t('game.piece_style_western')}</option>
              </select>
            </label>
            <span className="hidden md:inline">{t('game.game_label')} <span className="font-mono text-text">{gameId}</span></span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              gameState.rated ? 'bg-primary/15 text-primary-light' : 'bg-surface text-text-dim'
            }`}>
              {gameState.rated ? t('game.rated') : t('game.casual')}
            </span>
            <button
              onClick={copyGameLink}
              className="px-2 py-1 rounded bg-surface-hover hover:bg-primary/20 text-text text-xs transition-colors"
            >
              {copied ? t('game.copied') : t('game.share')}
            </button>
          </>
        }
      />

      {/* Disconnect banner */}
      {opponentDisconnected && (
        <div className="bg-accent/20 border-b border-accent/30 text-center py-2 text-xs sm:text-sm text-accent">
          {t('game.opponent_dc')}
        </div>
      )}

      {/* Draw offer banner */}
      {drawOffered && (
        <div className="bg-primary/20 border-b border-primary/30 text-center py-3 text-xs sm:text-sm flex items-center justify-center gap-3 flex-wrap px-2">
          <span className="text-text-bright">{t('game.draw_offer_received')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleRespondDraw(true)}
              className="px-4 py-1 bg-primary text-white rounded font-semibold text-sm"
            >
              {t('game.accept')}
            </button>
            <button
              onClick={() => handleRespondDraw(false)}
              className="px-4 py-1 bg-surface-hover text-text-bright rounded font-semibold text-sm"
            >
              {t('game.decline')}
            </button>
          </div>
        </div>
      )}

      <GameScreenLayout
        topPanel={
          <Clock
            time={playerColor === 'white' ? gameState.blackTime : gameState.whiteTime}
            isActive={gameState.turn === opponentColor && gameState.status === 'playing'}
            color={opponentColor}
            playerName={opponentDisplayName}
            rating={opponentRating}
            status={opponentStatus}
            subtitle={opponentSubtitle}
            capturedPieces={opponentCaptureSummary.pieces}
            materialDelta={opponentCaptureSummary.material}
          />
        }
        board={
          <BoardErrorBoundary onRetry={() => window.location.reload()}>
            <Board
              board={getDisplayBoard()}
              playerColor={playerColor}
              isMyTurn={isMyTurn}
              legalMoves={isViewingHistory ? [] : legalMoves}
              selectedSquare={isViewingHistory ? null : selectedSquare}
              lastMove={getLastMove()}
              isCheck={isViewingHistory ? false : gameState.isCheck}
              checkSquare={getCheckSquare()}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              disabled={isViewingHistory || (gameState.gameOver && !isViewingHistory)}
              premove={premove}
              arrows={arrows}
              onArrowsChange={setArrows}
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
            subtitle={playerSubtitle}
            capturedPieces={playerCaptureSummary.pieces}
            materialDelta={playerCaptureSummary.material}
          />
        }
        statusText={statusText}
        moveCount={moveCount}
        isViewingHistory={isViewingHistory}
        showCheckBadge={gameState.isCheck}
        toolbar={
          premove ? (
            <>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary-light normal-case tracking-normal">
                {t('game.premove_set')}
              </span>
              <button
                onClick={() => { cancelPremove(); clearSelection(); }}
                className="rounded-full border border-surface-hover bg-surface-alt px-2.5 py-1 text-text-dim normal-case tracking-normal transition-colors hover:text-text-bright"
              >
                {t('common.cancel')}
              </button>
            </>
          ) : null
        }
        sidePanel={
          <>
            <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
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
              <div className="rounded-xl px-4 py-3 bg-accent/10 text-accent border border-accent/30">
                <div className="text-xs uppercase tracking-wide font-semibold mb-1">
                  {t('game.counting_title')}
                </div>
                <div className="text-sm">{countingLabel}</div>
                {canStartCounting && (
                  <button
                    onClick={handleStartCounting}
                    className="mt-3 w-full py-2 px-3 bg-accent/20 hover:bg-accent/30 text-accent text-sm rounded-lg border border-accent/30 transition-colors"
                  >
                    {t('game.counting_start')}
                  </button>
                )}
                {canStopCounting && (
                  <button
                    onClick={handleStopCounting}
                    className="mt-3 w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
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
                onRematch={handleRematch}
                onNewGame={handleNewGame}
                rematchLabel={rematchLabel}
                rematchDisabled={rematchState === 'sent'}
                rematchNotice={rematchNotice}
                onAnalyze={gameId && gameState.moveHistory.length > 0
                  ? () => navigate(savedGameAnalysisRoute(gameId))
                  : undefined
                }
              />
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

            {!gameState.gameOver && gameState.status === 'playing' && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={handleOfferDraw}
                  className="py-2.5 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-xl border border-surface-hover transition-colors"
                  title={t('game.offer_draw')}
                >
                  {t('game.offer_draw')}
                </button>
                <button
                  onClick={handleResign}
                  className="py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors"
                  title={t('game.resign')}
                >
                  {t('game.resign')}
                </button>
              </div>
            )}

            <button
              onClick={() => setShowGuide(true)}
              className="w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright text-sm rounded-xl border border-surface-hover transition-colors"
            >
              {t('game.piece_guide')}
            </button>
          </>
        }
      />

      {/* Game Over Modal (dismissible) */}
      {gameOverInfo && showGameOverModal && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          rated={gameState.rated}
          ratingChange={gameOverInfo.ratingChange}
          onRematch={handleRematch}
          onNewGame={handleNewGame}
          rematchLabel={rematchLabel}
          rematchDisabled={rematchState === 'sent'}
          rematchNotice={rematchNotice}
          onAnalyze={gameId && gameState && gameState.moveHistory.length > 0
            ? () => navigate(savedGameAnalysisRoute(gameId))
            : undefined
          }
          onClose={() => setShowGameOverModal(false)}
        />
      )}

      {/* Piece Guide Modal */}
      <PieceGuide show={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
