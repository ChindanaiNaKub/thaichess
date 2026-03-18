import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Position, PieceColor, ClientGameState, Move } from '@shared/types';
import { getLegalMoves, createInitialBoard, getBoardAtMove } from '@shared/engine';
import { socket, connectSocket } from '../lib/socket';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound, playGameStartSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import Board from './Board';
import type { Arrow } from './Board';
import Clock from './Clock';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import PieceGuide from './PieceGuide';
import ConnectionStatus from './ConnectionStatus';
import PieceSVG from './PieceSVG';
import Header from './Header';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  // Pre-move state
  const [premove, setPremove] = useState<{ from: Position; to: Position } | null>(null);

  // Arrow state
  const [arrows, setArrows] = useState<Arrow[]>([]);

  // Keyboard navigation state
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setArrows([]);
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
      setPremove(null);
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
      setSelectedSquare(null);
      setLegalMoves([]);
      setDrawOffered(false);
      setPremove(null);
      setArrows([]);
      setViewMoveIndex(null);
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
    setPremove(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [isMyTurn, premove, gameState, playerColor]);

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

  const handleSquareClick = useCallback((pos: Position) => {
    if (!gameState || !playerColor || gameState.status !== 'playing') return;

    const piece = gameState.board[pos.row][pos.col];

    // Pre-move logic: when it's not our turn, allow setting a premove
    if (!isMyTurn && !gameState.gameOver) {
      if (selectedSquare) {
        if (pos.row !== selectedSquare.row || pos.col !== selectedSquare.col) {
          const fromPiece = gameState.board[selectedSquare.row][selectedSquare.col];
          if (fromPiece && fromPiece.color === playerColor) {
            setPremove({ from: selectedSquare, to: pos });
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }
        }
      }

      if (piece && piece.color === playerColor) {
        setSelectedSquare(pos);
        setLegalMoves(getLegalMoves(gameState.board, pos));
        setPremove(null);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
      return;
    }

    if (selectedSquare) {
      const isLegal = legalMoves.some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        socket.emit('make_move', { from: selectedSquare, to: pos });
        setSelectedSquare(null);
        setLegalMoves([]);
        setArrows([]);
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
    if (!gameState || !playerColor) return;

    // Pre-move via drag
    if (!isMyTurn && gameState.status === 'playing' && !gameState.gameOver) {
      const piece = gameState.board[from.row][from.col];
      if (piece && piece.color === playerColor) {
        setPremove({ from, to });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    if (!isMyTurn) return;
    const legal = getLegalMoves(gameState.board, from);
    if (legal.some(m => m.row === to.row && m.col === to.col)) {
      socket.emit('make_move', { from, to });
      setSelectedSquare(null);
      setLegalMoves([]);
      setArrows([]);
    }
  }, [gameState, playerColor, isMyTurn]);

  const handleResign = () => {
    if (window.confirm(t('game.resign_confirm'))) {
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

  // Waiting room
  if (gameState && gameState.status === 'waiting') {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center animate-slideUp">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-text-bright mb-2">{t('game.waiting_title')}</h2>
            <p className="text-text-dim mb-6 text-sm sm:text-base">{t('game.waiting_desc')}</p>

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

            <p className="text-text-dim text-xs sm:text-sm">
              {t('game.playing_as', { color: playerColor ? t(`common.${playerColor}`) : '' })}
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
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg sm:text-xl font-bold text-danger mb-2">{t('game.error')}</h2>
            <p className="text-text-dim mb-4 text-sm sm:text-base">{error}</p>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold text-sm sm:text-base">
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

  return (
    <div ref={containerRef} className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <ConnectionStatus />

      {/* Compact Header for playing state */}
      <header className="bg-surface-alt border-b border-surface-hover">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PieceSVG type="K" color="white" size={32} />
            <h1 className="text-lg font-bold text-text-bright tracking-tight">{t('app.name')}</h1>
          </button>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-dim">
            <span>{t('game.game_label')} <span className="font-mono text-text">{gameId}</span></span>
            <button
              onClick={copyGameLink}
              className="px-2 py-1 rounded bg-surface-hover hover:bg-primary/20 text-text text-xs transition-colors"
            >
              {copied ? t('game.copied') : t('game.share')}
            </button>
          </div>
        </div>
      </header>

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

      {/* Premove indicator */}
      {premove && (
        <div className="bg-blue-900/30 border-b border-blue-500/30 text-center py-1.5 text-xs text-blue-300 flex items-center justify-center gap-2">
          <span>Pre-move set</span>
          <button
            onClick={() => { setPremove(null); setSelectedSquare(null); setLegalMoves([]); }}
            className="px-2 py-0.5 bg-surface-hover rounded text-xs hover:bg-danger/20 hover:text-danger transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 w-full max-w-[1100px]">
          {/* Board Column */}
          <div className="flex flex-col items-center gap-2 w-full lg:flex-1 lg:max-w-[calc(100vh-180px)] max-w-[720px]">
            {/* Opponent Clock */}
            <Clock
              time={playerColor === 'white' ? gameState.blackTime : gameState.whiteTime}
              isActive={gameState.turn === opponentColor && gameState.status === 'playing'}
              color={opponentColor}
              playerName={opponentColor === 'white' ? t('common.white') : t('common.black')}
            />

            {/* Board */}
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

            {/* Player Clock */}
            <Clock
              time={playerColor === 'white' ? gameState.whiteTime : gameState.blackTime}
              isActive={gameState.turn === playerColor && gameState.status === 'playing'}
              color={playerColor || 'white'}
              playerName={playerColor === 'white' ? t('common.white') : t('common.black')}
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
                  ? (gameState.winner === playerColor ? t('game.you_won') : t('game.you_lost'))
                  : t('common.draw')
                : isMyTurn ? t('game.your_turn') : t('game.opponent_turn')
              }
            </div>

            {/* Move History */}
            <MoveHistory
              moves={gameState.moveHistory}
              initialBoard={createInitialBoard()}
              currentMoveIndex={viewMoveIndex ?? undefined}
              onMoveClick={gameState.gameOver ? handleMoveClick : undefined}
            />

            {/* Keyboard nav hint */}
            {gameState.gameOver && gameState.moveHistory.length > 0 && (
              <div className="text-center text-xs text-text-dim">
                Use arrow keys to navigate moves
              </div>
            )}

            {/* Analyze button (shown after game over) */}
            {gameState.gameOver && gameState.moveHistory.length > 0 && (
              <button
                onClick={() => navigate(`/analysis/${gameId}`)}
                className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm rounded-lg border border-blue-600/30 transition-colors"
              >
                🔍 {t('analysis.analyze')}
              </button>
            )}

            {/* Game Controls */}
            {!gameState.gameOver && gameState.status === 'playing' && (
              <div className="flex gap-2">
                <button
                  onClick={handleOfferDraw}
                  className="flex-1 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                  title={t('game.offer_draw')}
                >
                  {t('game.offer_draw')}
                </button>
                <button
                  onClick={handleResign}
                  className="flex-1 py-2 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-lg border border-surface-hover transition-colors"
                  title={t('game.resign')}
                >
                  {t('game.resign')}
                </button>
              </div>
            )}

            {/* Piece Guide Button */}
            <button
              onClick={() => setShowGuide(true)}
              className="w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright text-sm rounded-lg border border-surface-hover transition-colors"
            >
              {t('game.piece_guide')}
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
          onAnalyze={gameState && gameState.moveHistory.length > 0
            ? () => navigate(`/analysis/${gameId}`)
            : undefined
          }
        />
      )}

      {/* Piece Guide Modal */}
      <PieceGuide show={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
