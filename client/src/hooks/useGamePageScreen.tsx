import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Position, PieceColor, ClientGameState, Move, PlayerPresence, RatingChangeSummary, TimeControl } from '@shared/types';
import { getLastMoveForView, getLegalMoves } from '@shared/engine';
import { socket, connectSocket } from '../lib/socket';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound, playGameStartSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';
import { useAuth } from '../lib/auth';
import { liveGameRoute, routes, savedGameAnalysisRoute, spectatorGameRoute } from '../lib/routes';
import {
  getCheckSquareForView,
  getDisplayBoardForView,
  getVisibleMovesForView,
  includesPosition,
  isViewingHistoryIndex,
} from '../lib/boardSession';
import { getCapturedSummary } from '../lib/capturedSummary';
import { useBoardNavKeyboard } from './useBoardNavKeyboard';
import { useGameInteraction } from './useGameInteraction';
import { usePostGameReview } from './usePostGameReview';
import { useReviewEngineAnalysis } from './useReviewEngineAnalysis';
import { useReportFairPlayMutation } from '../queries/fairPlay';
import { gameQueryOptions } from '../queries/analysis';
import { useToast } from '../lib/toast';
import type { Arrow } from '../components/Board';
import { GamePageActiveView } from '../components/GamePageActiveView';
import { GamePageWaitingView } from '../components/GamePageWaitingView';
import { GamePageErrorView, GamePageLoadingView } from '../components/GamePageStatusViews';
import {
  DEFAULT_PRESENCE,
  EMPTY_MOVE_HISTORY,
  HEARTBEAT_BURST_GUARD_MS,
  HEARTBEAT_INTERVAL_MS,
  handleOfferDraw,
  handleStartCounting,
  handleStopCounting,
  getGameCountingLabel,
  resolveHeartbeatClientStatus,
  updateOpponentPresenceStatus,
  type GameOverInfo,
  type LocalConnectionState,
} from '../components/gamePageHelpers';

export function useGamePageScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reviewT = useReviewCopy();
  const { user } = useAuth();

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [rematchState, setRematchState] = useState<'idle' | 'sent' | 'received'>('idle');
  const [connectionState, setConnectionState] = useState<LocalConnectionState>(socket.connected ? 'connected' : 'reconnecting');
  const [localLatencyMs, setLocalLatencyMs] = useState<number | null>(null);
  const [initialInteractionAt] = useState(() => Date.now());
  const joinedRef = useRef(false);
  const latestGameStateRef = useRef<ClientGameState | null>(null);
  const latestTRef = useRef(t);
  const lastInteractionAtRef = useRef(initialInteractionAt);
  const lastHeartbeatAtRef = useRef(0);
  const lastMeasuredLatencyRef = useRef<number | null>(null);

  // TanStack Query mutation for reporting fair play
  const reportMutation = useReportFairPlayMutation();
  const { showToast } = useToast();

  // Arrow state
  const [arrows, setArrows] = useState<Arrow[]>([]);

  // Keyboard navigation state
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMyTurn = gameState?.turn === playerColor && gameState?.status === 'playing';
  const spectatorPath = gameId ? spectatorGameRoute(gameId) : routes.home;

  const { data: gameMeta } = useQuery(gameQueryOptions(gameId));
  const timeControl: TimeControl | null = gameMeta?.timeControl ?? null;

  useEffect(() => {
    latestGameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    latestTRef.current = t;
  }, [t]);

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
  const review = usePostGameReview({
    enabled: Boolean(gameState?.gameOver),
    mainLine: gameState?.moveHistory ?? EMPTY_MOVE_HISTORY,
    finalState: gameState ?? null,
  });
  const reviewEngine = useReviewEngineAnalysis({
    enabled: Boolean(gameState?.gameOver),
    snapshot: gameState?.gameOver
      ? {
          board: review.currentState.board,
          turn: review.currentState.turn,
          counting: review.currentState.counting,
        }
      : null,
  });

  useEffect(() => {
    if (!gameId) return;

    connectSocket();

    const handleConnect = () => {
      setConnectionState('connected');
      if (!joinedRef.current) {
        socket.emit('join_game', { gameId });
        joinedRef.current = true;
      }
    };

    const handleDisconnect = () => {
      joinedRef.current = false;
      setConnectionState('reconnecting');
    };

    const handleJoined = ({ color, gameState: gs }: { color: PieceColor | null; gameState: ClientGameState }) => {
      setPlayerColor(color);
      setGameState(gs);
      setConnectionState('connected');
      setError(null);
      if (gs.status === 'playing') playGameStartSound();
    };

    const handleGameState = (gs: ClientGameState) => {
      setConnectionState('connected');
      setGameState(prev => {
        if (prev?.status === 'waiting' && gs.status === 'playing') {
          playGameStartSound();
        }
        return gs;
      });
    };

    const handleMoveMade = ({ move, gameState: gs }: { move: Move; gameState: ClientGameState }) => {
      setConnectionState('connected');
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
      setGameState((prev) => updateOpponentPresenceStatus(prev, 'disconnected'));
    };

    const handleOpponentReconnected = () => {
      setGameState((prev) => updateOpponentPresenceStatus(prev, 'active'));
    };

    const handlePresenceUpdate = ({
      gameId: presenceGameId,
      whitePresence,
      blackPresence,
    }: {
      gameId: string;
      whitePresence: PlayerPresence;
      blackPresence: PlayerPresence;
    }) => {
      if (presenceGameId !== gameId) return;
      setGameState(prev => prev
        ? {
          ...prev,
          whitePresence,
          blackPresence,
        }
        : prev);
    };

    const handleHeartbeatAck = ({ sentAt }: { sentAt: number }) => {
      const latency = Math.max(0, Math.round(Date.now() - sentAt));
      lastMeasuredLatencyRef.current = latency;
      setLocalLatencyMs(latency);
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
      if (message === 'Game is full. Redirecting to spectator mode.' && gameId) {
        navigate(spectatorPath, { replace: true });
        return;
      }
      setRematchState('idle');
      setError(message || latestTRef.current('game.load_failed'));
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
    socket.on('presence_update', handlePresenceUpdate);
    socket.on('heartbeat_ack', handleHeartbeatAck);
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
      socket.off('presence_update', handlePresenceUpdate);
      socket.off('heartbeat_ack', handleHeartbeatAck);
      socket.off('game_created', handleGameCreated);
      socket.off('error', handleError);
    };
  }, [gameId, navigate, spectatorPath, clearSelection, cancelPremove]);

  useEffect(() => {
    return () => {
      const latestGameState = latestGameStateRef.current;
      if (latestGameState && latestGameState.status !== 'playing' && socket.connected) {
        socket.emit('leave_game', { gameId: latestGameState.gameId });
      }
    };
  }, []);

  useEffect(() => {
    if (!gameId || !playerColor) return;

    const emitHeartbeat = (force = false) => {
      if (!socket.connected) return;

      const now = Date.now();
      const isVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
      const clientStatus = resolveHeartbeatClientStatus(
        isVisible,
        now - lastInteractionAtRef.current,
      );

      if (!force && now - lastHeartbeatAtRef.current < HEARTBEAT_BURST_GUARD_MS) {
        return;
      }

      lastHeartbeatAtRef.current = now;
      socket.emit('presence_heartbeat', {
        gameId,
        sentAt: now,
        clientStatus,
        latencyMs: lastMeasuredLatencyRef.current,
      });
    };

    const handleInteraction = () => {
      lastInteractionAtRef.current = Date.now();
      emitHeartbeat(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastInteractionAtRef.current = Date.now();
      }
      emitHeartbeat(true);
    };

    const handleWindowFocus = () => {
      lastInteractionAtRef.current = Date.now();
      emitHeartbeat(true);
    };

    emitHeartbeat(true);

    const heartbeatId = window.setInterval(() => {
      emitHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(heartbeatId);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameId, playerColor]);

  // Auto-execute premove when it becomes our turn
  useEffect(() => {
    if (!premove || !gameState || !playerColor || !isMyTurn) return;

    const piece = gameState.board[premove.from.row][premove.from.col];
    if (piece && piece.color === playerColor) {
      const legal = getLegalMoves(gameState.board, premove.from);
      if (includesPosition(legal, premove.to)) {
        socket.emit('make_move', { from: premove.from, to: premove.to });
      }
    }
    cancelPremove();
    clearSelection();
  }, [isMyTurn, premove, gameState, playerColor, cancelPremove, clearSelection]);

  // Keyboard navigation for move history
  const boardNavHandlers = useMemo(() => ({
    onBack: () => review.stepBackward(),
    onForward: () => review.stepForward(),
    onStart: () => review.jumpToStart(),
    onEnd: () => review.jumpToEnd(),
  }), [review]);

  useBoardNavKeyboard({
    enabled: !!gameState?.gameOver && gameState.moveHistory.length > 0,
    handlers: boardNavHandlers,
  });

  const handleResign = () => {
    if (window.confirm(t('game.resign_confirm'))) {
      socket.emit('resign');
    }
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

  const handleReportOpponent = async () => {
    if (!gameId || !gameState?.rated || !user || !playerColor || reportMutation.isPending) return;

    reportMutation.mutate(gameId, {
      onSuccess: () => {
        showToast(t('fair_play.report_sent'), 'success');
      },
      onError: (err) => {
        showToast(err instanceof Error ? err.message : t('fair_play.report_failed'), 'error');
      },
    });
  };

  const copyGameLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getLastMove = (): Move | null => {
    return getLastMoveForView(gameState, viewMoveIndex);
  };

  const getCheckSquare = (): Position | null => getCheckSquareForView(gameState, viewMoveIndex);

  const getDisplayBoard = () => getDisplayBoardForView(gameState, viewMoveIndex);

  const handleMoveClick = useCallback((index: number) => {
    if (!gameState) return;
    if (index === gameState.moveHistory.length - 1 && viewMoveIndex === null) return;
    setViewMoveIndex(index);
  }, [gameState, viewMoveIndex]);

  const getVisibleMoves = () => getVisibleMovesForView(gameState?.moveHistory, viewMoveIndex);

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
      <GamePageWaitingView
        t={t}
        gameState={gameState}
        playerColor={playerColor}
        waitingPlayerName={waitingPlayerName}
        waitingPlayerRating={waitingPlayerRating}
        spectatorPath={spectatorPath}
        copied={copied}
        onCopyGameLink={copyGameLink}
        onNewGame={handleNewGame}
      />
    );
  }

  // Error state
  if (error && !gameState) {
    return (
      <GamePageErrorView
        t={t}
        error={error}
        onBackHome={() => navigate(routes.home)}
      />
    );
  }

  // Loading state
  if (!gameState) {
    return <GamePageLoadingView t={t} />;
  }

  const opponentColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const reviewActive = gameState.gameOver;
  const reviewMode = review.mode;
  const reviewIsViewingHistory = reviewMode === 'analysis'
    || review.selectedMainLineMoveIndex !== gameState.moveHistory.length - 1;
  const canReportOpponent = Boolean(user && playerColor && gameState.gameOver && gameState.rated && gameId);
  const isViewingHistory = reviewActive
    ? reviewIsViewingHistory
    : isViewingHistoryIndex(viewMoveIndex, gameState.moveHistory.length);
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
  const playerPresence = (playerColor === 'white' ? gameState.whitePresence : gameState.blackPresence) ?? DEFAULT_PRESENCE;
  const opponentPresence = (opponentColor === 'white' ? gameState.whitePresence : gameState.blackPresence) ?? DEFAULT_PRESENCE;
  const playerStatus = connectionState === 'reconnecting'
    ? 'reconnecting'
    : connectionState === 'disconnected'
      ? 'disconnected'
      : playerPresence.status;
  const opponentStatus = opponentPresence.status;
  const playerLatency = localLatencyMs ?? playerPresence.latencyMs;
  const opponentLatency = opponentPresence.latencyMs;
  const opponentDisconnected = opponentPresence.status === 'disconnected';
  const countingLabel = gameState.counting
    ? getGameCountingLabel(t, gameState.counting)
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
  const moveCount = reviewActive ? review.currentMoveHistory.length : gameState.moveHistory.length;
  const visibleMoves = reviewActive ? review.currentMoveHistory : getVisibleMoves();
  const playerCaptureSummary = getCapturedSummary(visibleMoves, playerColor || 'white');
  const opponentCaptureSummary = getCapturedSummary(visibleMoves, opponentColor);
  const statusText = reviewActive
    ? reviewMode === 'analysis'
      ? reviewT('review.analysis_status')
      : reviewT('review.main_status')
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
  const reportLabel = reportMutation.isPending
    ? t('fair_play.report_sending')
    : reportMutation.isSuccess
      ? t('fair_play.report_sent')
      : t('fair_play.report_opponent');
  const modalReportLabel = reportMutation.isPending
    ? t('common.sending')
    : reportMutation.isSuccess
      ? t('fair_play.report_sent_short')
      : t('fair_play.report_action');
  const reportDisabled = reportMutation.isPending || reportMutation.isSuccess;
  const onAnalyze = gameId && gameState.moveHistory.length > 0
    ? () => navigate(savedGameAnalysisRoute(gameId))
    : undefined;

  return (
    <GamePageActiveView
      t={t}
      gameId={gameId}
      gameState={gameState}
      playerColor={playerColor}
      opponentColor={opponentColor}
      turnState={{
        isMyTurn,
        isViewingHistory,
      }}
      reviewSession={{
        active: reviewActive,
        mode: reviewMode,
        controls: review,
        engine: reviewEngine,
      }}
      spectatorPath={spectatorPath}
      shareLabel={copied ? t('game.copied') : t('game.share')}
      notices={{
        drawOffered,
        opponentDisconnected,
      }}
      overlays={{
        showGuide,
        showGameOverModal,
      }}
      gameOverInfo={gameOverInfo}
      rematch={{
        label: rematchLabel,
        notice: rematchNotice,
        disabled: rematchState === 'sent',
      }}
      reporting={{
        allowed: canReportOpponent,
        label: reportLabel,
        modalLabel: modalReportLabel,
        disabled: reportDisabled,
      }}
      timeControl={timeControl}
      statusText={statusText}
      moveCount={moveCount}
      counting={{
        label: countingLabel,
        canStart: canStartCounting,
        canStop: canStopCounting,
      }}
      myDisplayName={myDisplayName}
      opponentDisplayName={opponentDisplayName}
      playerSubtitle={playerSubtitle}
      opponentSubtitle={opponentSubtitle}
      playerRating={playerRating}
      opponentRating={opponentRating}
      playerStatus={playerStatus}
      opponentStatus={opponentStatus}
      playerLatency={playerLatency}
      opponentLatency={opponentLatency}
      playerCaptureSummary={playerCaptureSummary}
      opponentCaptureSummary={opponentCaptureSummary}
      whitePlayerName={whitePlayerName}
      blackPlayerName={blackPlayerName}
      legalMoves={legalMoves}
      selectedSquare={selectedSquare}
      premove={premove}
      arrows={arrows}
      viewMoveIndex={viewMoveIndex}
      displayBoard={getDisplayBoard()}
      lastMove={getLastMove()}
      checkSquare={getCheckSquare()}
      containerRef={containerRef}
      onHome={() => navigate(routes.home)}
      onCopyGameLink={copyGameLink}
      onRespondDraw={handleRespondDraw}
      onSquareClick={handleSquareClick}
      onPieceDrop={handlePieceDrop}
      onArrowsChange={setArrows}
      onCancelPremove={() => { cancelPremove(); clearSelection(); }}
      onRematch={handleRematch}
      onNewGame={handleNewGame}
      onAnalyze={onAnalyze}
      onReport={canReportOpponent ? handleReportOpponent : undefined}
      onCloseGameOverModal={() => setShowGameOverModal(false)}
      onMoveClick={handleMoveClick}
      onOfferDraw={handleOfferDraw}
      onResign={handleResign}
      onStartCounting={handleStartCounting}
      onStopCounting={handleStopCounting}
      onShowGuide={() => setShowGuide(true)}
      onCloseGuide={() => setShowGuide(false)}
    />
  );
}
