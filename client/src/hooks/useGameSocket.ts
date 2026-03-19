import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClientGameState, PieceColor, Move } from '@shared/types';
import { socket, connectSocket } from '../lib/socket';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound, playGameStartSound } from '../lib/sounds';

interface UseGameSocketOptions {
  gameId?: string;
}

interface UseGameSocketReturn {
  gameState: ClientGameState | null;
  playerColor: PieceColor | null;
  gameOverInfo: { reason: string; winner: PieceColor | null } | null;
  drawOffered: boolean;
  opponentDisconnected: boolean;
  error: string | null;
  joinedRef: React.MutableRefObject<boolean>;
}

/**
 * Custom hook for managing game socket connection and events.
 * Extracts socket logic from GamePage for better separation of concerns.
 */
export function useGameSocket(options: UseGameSocketOptions): UseGameSocketReturn {
  const { gameId } = options;
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!gameId) return;

    connectSocket();

    const handleConnect = () => {
      if (!joinedRef.current) {
        socket.emit('join_game', { gameId });
        joinedRef.current = true;
      }
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
      if (gs.isCheck) {
        playCheckSound();
      } else if (move.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
    };

    const handleGameOver = ({ reason, winner, gameState: gs }: {
      reason: string;
      winner: PieceColor | null;
      gameState: ClientGameState;
    }) => {
      setGameState(gs);
      setGameOverInfo({ reason, winner });
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

    const handleGameCreated = ({ gameId: newGameId }: { gameId: string }) => {
      joinedRef.current = false;
      setGameState(null);
      setGameOverInfo(null);
      setDrawOffered(false);
      navigate(`/game/${newGameId}`);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('game_joined', handleJoined);
    socket.on('game_state', handleGameState);
    socket.on('move_made', handleMoveMade);
    socket.on('game_over', handleGameOver);
    socket.on('clock_update', handleClockUpdate);
    socket.on('draw_offered', handleDrawOffered);
    socket.on('draw_declined', handleDrawDeclined);
    socket.on('opponent_disconnected', handleOpponentDisconnected);
    socket.on('opponent_reconnected', handleOpponentReconnected);
    socket.on('game_created', handleGameCreated);
    socket.on('error', handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('game_joined', handleJoined);
      socket.off('game_state', handleGameState);
      socket.off('move_made', handleMoveMade);
      socket.off('game_over', handleGameOver);
      socket.off('clock_update', handleClockUpdate);
      socket.off('draw_offered', handleDrawOffered);
      socket.off('draw_declined', handleDrawDeclined);
      socket.off('opponent_disconnected', handleOpponentDisconnected);
      socket.off('opponent_reconnected', handleOpponentReconnected);
      socket.off('game_created', handleGameCreated);
      socket.off('error', handleError);
    };
  }, [gameId, navigate]);

  return {
    gameState,
    playerColor,
    gameOverInfo,
    drawOffered,
    opponentDisconnected,
    error,
    joinedRef,
  };
}

/**
 * Hook for game actions that interact with the socket.
 */
export function useGameActions() {
  const navigate = useNavigate();

  const handleResign = useCallback(() => {
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resign');
    }
  }, []);

  const handleOfferDraw = useCallback(() => {
    socket.emit('offer_draw');
  }, []);

  const handleRespondDraw = useCallback((accept: boolean) => {
    socket.emit('respond_draw', { accept });
  }, []);

  const handleRematch = useCallback(() => {
    socket.emit('request_rematch');
  }, []);

  const handleNewGame = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    handleResign,
    handleOfferDraw,
    handleRespondDraw,
    handleRematch,
    handleNewGame,
  };
}
