import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Position, PieceColor, ClientGameState, Move } from '@shared/types';
import { getLegalMoves, createInitialBoard } from '@shared/engine';
import { socket, connectSocket } from '../lib/socket';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound, playGameStartSound } from '../lib/sounds';
import Board from './Board';
import Clock from './Clock';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import PieceGuide from './PieceGuide';
import ConnectionStatus from './ConnectionStatus';
import PieceSVG from './PieceSVG';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
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
      setSelectedSquare(null);
      setLegalMoves([]);
      if (gs.isCheck) {
        playCheckSound();
      } else if (move.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }
    };

    const handleGameOver = ({ reason, winner, gameState: gs }: { reason: string; winner: PieceColor | null; gameState: ClientGameState }) => {
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
      // Rematch - navigate to new game
      joinedRef.current = false;
      setGameState(null);
      setGameOverInfo(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      setDrawOffered(false);
      navigate(`/game/${newGameId}`);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

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

  const isMyTurn = gameState?.turn === playerColor && gameState?.status === 'playing';

  const handleSquareClick = useCallback((pos: Position) => {
    if (!gameState || !playerColor || gameState.status !== 'playing') return;

    const piece = gameState.board[pos.row][pos.col];

    if (selectedSquare) {
      const isLegal = legalMoves.some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        socket.emit('make_move', { from: selectedSquare, to: pos });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    if (piece && piece.color === playerColor && isMyTurn) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(gameState.board, pos));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameState, playerColor, selectedSquare, legalMoves, isMyTurn]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    if (!gameState || !playerColor || !isMyTurn) return;
    const legal = getLegalMoves(gameState.board, from);
    if (legal.some(m => m.row === to.row && m.col === to.col)) {
      socket.emit('make_move', { from, to });
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameState, playerColor, isMyTurn]);

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resign');
    }
  };

  const handleOfferDraw = () => {
    socket.emit('offer_draw');
  };

  const handleRespondDraw = (accept: boolean) => {
    socket.emit('respond_draw', { accept });
    setDrawOffered(false);
  };

  const handleRematch = () => {
    socket.emit('request_rematch');
  };

  const handleNewGame = () => {
    navigate('/');
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
    return gameState.moveHistory[gameState.moveHistory.length - 1];
  };

  const getCheckSquare = (): Position | null => {
    if (!gameState?.isCheck) return null;
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

  // Waiting room
  if (gameState && gameState.status === 'waiting') {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header className="bg-surface-alt border-b border-surface-hover">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <PieceSVG type="K" color="white" size={36} />
              <h1 className="text-xl font-bold text-text-bright tracking-tight">Makruk</h1>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-8 max-w-md w-full text-center animate-slideUp">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-text-bright mb-2">Waiting for opponent</h2>
            <p className="text-text-dim mb-6">Share this link with a friend to start playing</p>

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
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-text-dim text-xs">
              You are playing as <span className="font-bold text-text-bright">{playerColor}</span>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !gameState) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header className="bg-surface-alt border-b border-surface-hover">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <PieceSVG type="K" color="white" size={36} />
              <h1 className="text-xl font-bold text-text-bright tracking-tight">Makruk</h1>
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-danger mb-2">Error</h2>
            <p className="text-text-dim mb-4">{error}</p>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">
              Back to Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-dim">Connecting to game...</p>
        </div>
      </div>
    );
  }

  const opponentColor: PieceColor = playerColor === 'white' ? 'black' : 'white';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <ConnectionStatus />

      {/* Header */}
      <header className="bg-surface-alt border-b border-surface-hover">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PieceSVG type="K" color="white" size={32} />
            <h1 className="text-lg font-bold text-text-bright tracking-tight">Makruk</h1>
          </button>
          <div className="flex items-center gap-2 text-sm text-text-dim">
            <span>Game: <span className="font-mono text-text">{gameId}</span></span>
            <button
              onClick={copyGameLink}
              className="px-2 py-1 rounded bg-surface-hover hover:bg-primary/20 text-text text-xs transition-colors"
            >
              {copied ? '✓' : 'Share'}
            </button>
          </div>
        </div>
      </header>

      {/* Disconnect banner */}
      {opponentDisconnected && (
        <div className="bg-accent/20 border-b border-accent/30 text-center py-2 text-sm text-accent">
          Opponent disconnected. Waiting for reconnection...
        </div>
      )}

      {/* Draw offer banner */}
      {drawOffered && (
        <div className="bg-primary/20 border-b border-primary/30 text-center py-3 text-sm flex items-center justify-center gap-3">
          <span className="text-text-bright">Your opponent offers a draw</span>
          <button
            onClick={() => handleRespondDraw(true)}
            className="px-4 py-1 bg-primary text-white rounded font-semibold text-sm"
          >
            Accept
          </button>
          <button
            onClick={() => handleRespondDraw(false)}
            className="px-4 py-1 bg-surface-hover text-text-bright rounded font-semibold text-sm"
          >
            Decline
          </button>
        </div>
      )}

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full max-w-[1100px]">
          {/* Board Column */}
          <div className="flex flex-col items-center gap-2 w-full lg:flex-1 lg:max-w-[calc(100vh-180px)] max-w-[720px]">
            {/* Opponent Clock */}
            <Clock
              time={playerColor === 'white' ? gameState.blackTime : gameState.whiteTime}
              isActive={gameState.turn === opponentColor && gameState.status === 'playing'}
              color={opponentColor}
              playerName={opponentColor === 'white' ? 'White' : 'Black'}
            />

            {/* Board */}
            <Board
              board={gameState.board}
              playerColor={playerColor}
              isMyTurn={isMyTurn}
              legalMoves={legalMoves}
              selectedSquare={selectedSquare}
              lastMove={getLastMove()}
              isCheck={gameState.isCheck}
              checkSquare={getCheckSquare()}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              disabled={!isMyTurn || gameState.gameOver}
            />

            {/* Player Clock */}
            <Clock
              time={playerColor === 'white' ? gameState.whiteTime : gameState.blackTime}
              isActive={gameState.turn === playerColor && gameState.status === 'playing'}
              color={playerColor || 'white'}
              playerName={playerColor === 'white' ? 'White' : 'Black'}
            />
          </div>

          {/* Side Panel */}
          <div className="flex flex-col gap-3 lg:w-72 w-full max-w-[720px]">
            {/* Turn Indicator */}
            <div className={`
              rounded-lg px-4 py-3 text-center font-semibold text-sm
              ${isMyTurn
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'bg-surface-alt text-text-dim border border-surface-hover'
              }
            `}>
              {gameState.gameOver
                ? gameState.winner
                  ? `${gameState.winner === playerColor ? 'You won!' : 'You lost'}`
                  : 'Draw'
                : isMyTurn ? 'Your turn' : "Opponent's turn"
              }
            </div>

            {/* Move History */}
            <MoveHistory moves={gameState.moveHistory} initialBoard={createInitialBoard()} />

            {/* Game Controls */}
            {!gameState.gameOver && gameState.status === 'playing' && (
              <div className="flex gap-2">
                <button
                  onClick={handleOfferDraw}
                  className="flex-1 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                  title="Offer Draw"
                >
                  ½ Draw
                </button>
                <button
                  onClick={handleResign}
                  className="flex-1 py-2 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-lg border border-surface-hover transition-colors"
                  title="Resign"
                >
                  ⚐ Resign
                </button>
              </div>
            )}

            {/* Piece Guide Button */}
            <button
              onClick={() => setShowGuide(true)}
              className="w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright text-sm rounded-lg border border-surface-hover transition-colors"
            >
              📖 Piece Guide
            </button>
          </div>
        </div>
      </main>

      {/* Game Over Modal */}
      {gameOverInfo && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          onRematch={handleRematch}
          onNewGame={handleNewGame}
        />
      )}

      {/* Piece Guide Modal */}
      <PieceGuide show={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
