import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Position, PieceColor, ClientGameState, Move } from '@shared/types';
import { getLastMoveForView } from '@shared/engine';
import { socket, connectSocket } from '../lib/socket';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import {
  getCheckSquareForView,
  getDisplayBoardForView,
  getVisibleMovesForView,
  scrubViewMoveIndex,
} from '../lib/boardSession';
import { routes } from '../lib/routes';
import { useBoardNavKeyboard } from '../hooks/useBoardNavKeyboard';
import type { Arrow } from './Board';
import Header from './Header';
import { SpectatorActiveView } from './SpectatorActiveView';

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
  const latestTRef = useRef(t);

  useEffect(() => {
    latestGameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    latestTRef.current = t;
  }, [t]);

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
      setError(message || latestTRef.current('game.load_failed'));
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
  }, [gameId]);

  useEffect(() => {
    return () => {
      const latestGameState = latestGameStateRef.current;
      if (latestGameState && socket.connected) {
        socket.emit('leave_game', { gameId: latestGameState.gameId });
      }
    };
  }, []);

  const boardNavHandlers = useMemo(() => ({
    onBack: () => {
      if (!gameState) return;
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'back', 'explicitIndex'));
    },
    onForward: () => {
      if (!gameState) return;
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'forward', 'explicitIndex'));
    },
    onStart: () => {
      if (!gameState) return;
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'start', 'explicitIndex'));
    },
    onEnd: () => {
      if (!gameState) return;
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'end', 'explicitIndex'));
    },
  }), [gameState, viewMoveIndex]);

  useBoardNavKeyboard({
    enabled: !!gameState && gameState.moveHistory.length > 0 && gameState.gameOver,
    handlers: boardNavHandlers,
  });

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
    return getLastMoveForView(gameState, viewMoveIndex);
  };

  const getCheckSquare = (): Position | null => getCheckSquareForView(gameState, viewMoveIndex);

  const getDisplayBoard = () => getDisplayBoardForView(gameState, viewMoveIndex, {
    forceLive: !gameState?.gameOver,
  });

  const getVisibleMoves = () => getVisibleMovesForView(gameState?.moveHistory, viewMoveIndex, {
    forceLive: !gameState?.gameOver,
  });

  if (error && !gameState) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg sm:text-xl font-bold text-danger mb-2">{t('game.error')}</h2>
            <p className="text-text-dim mb-4 text-sm sm:text-base">{error}</p>
            <button type="button" onClick={() => navigate(routes.home)} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold text-sm sm:text-base">
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


  return (
    <SpectatorActiveView
      gameId={gameId}
      gameState={gameState}
      boardOrientation={boardOrientation}
      setBoardOrientation={setBoardOrientation}
      viewMoveIndex={viewMoveIndex}
      arrows={arrows}
      setArrows={setArrows}
      copied={copied}
      copySpectatorLink={copySpectatorLink}
      handleMoveClick={handleMoveClick}
      getLastMove={getLastMove}
      getCheckSquare={getCheckSquare}
      getDisplayBoard={getDisplayBoard}
      getVisibleMoves={getVisibleMoves}
      onHome={() => navigate(routes.home)}
    />
  );
}
