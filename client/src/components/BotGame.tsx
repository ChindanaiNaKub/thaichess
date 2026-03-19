import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import { getLegalMoves, makeMove, createInitialGameState, createInitialBoard, getBoardAtMove } from '@shared/engine';
import { getBotMove, BotDifficulty } from '@shared/botEngine';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import GameOverPanel from './GameOverPanel';
import Header from './Header';
import PieceSVG from './PieceSVG';

export default function BotGame() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(0, 0));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);

  // Pre-move state for bot games
  const [premove, setPremove] = useState<{ from: Position; to: Position } | null>(null);

  const botColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const isPlayerTurn = gameState.turn === playerColor;

  const difficultyConfig: Record<BotDifficulty, { labelKey: string; descKey: string; emoji: string }> = {
    easy: { labelKey: 'bot.easy', descKey: 'bot.easy_desc', emoji: '🟢' },
    medium: { labelKey: 'bot.medium', descKey: 'bot.medium_desc', emoji: '🟡' },
    hard: { labelKey: 'bot.hard', descKey: 'bot.hard_desc', emoji: '🔴' },
  };

  useEffect(() => {
    if (!gameStarted || gameState.gameOver || isPlayerTurn) return;

    setBotThinking(true);
    const delay = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 600 : 800;

    botTimeoutRef.current = setTimeout(() => {
      const botMoveResult = getBotMove(gameState, difficulty);
      if (botMoveResult) {
        const newState = makeMove(gameState, botMoveResult.from, botMoveResult.to);
        if (newState) {
          setGameState(newState);
          setArrows([]);
          const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
          if (newState.isCheck) playCheckSound();
          else if (lastMove.captured) playCaptureSound();
          else playMoveSound();

          if (newState.gameOver) {
            const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
            setGameOverInfo({ reason, winner: newState.winner });
            setPremove(null);
            playGameOverSound();
          }
        }
      }
      setBotThinking(false);
    }, delay);

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [gameState, gameStarted, isPlayerTurn, difficulty]);

  // Auto-execute premove when it becomes player's turn
  useEffect(() => {
    if (!premove || !isPlayerTurn || gameState.gameOver || botThinking) return;

    const piece = gameState.board[premove.from.row][premove.from.col];
    if (piece && piece.color === playerColor) {
      const legal = getLegalMoves(gameState.board, premove.from);
      if (legal.some(m => m.row === premove.to.row && m.col === premove.to.col)) {
        const newState = makeMove(gameState, premove.from, premove.to);
        if (newState) {
          setGameState(newState);
          setArrows([]);
          const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
          if (newState.isCheck) playCheckSound();
          else if (lastMove.captured) playCaptureSound();
          else playMoveSound();
          if (newState.gameOver) {
            const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
            setGameOverInfo({ reason, winner: newState.winner });
            playGameOverSound();
          }
        }
      }
    }
    setPremove(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [isPlayerTurn, premove, gameState, playerColor, botThinking]);

  useEffect(() => {
    if (gameOverInfo) setShowGameOverModal(true);
  }, [gameOverInfo]);

  // Keyboard navigation for move history
  useEffect(() => {
    if (!gameState.gameOver || gameState.moveHistory.length === 0) return;

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

  const handleSquareClick = useCallback((pos: Position) => {
    if (gameState.gameOver) return;
    const piece = gameState.board[pos.row][pos.col];

    // Pre-move logic when bot is thinking
    if (!isPlayerTurn || botThinking) {
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
        const newState = makeMove(gameState, selectedSquare, pos);
        if (newState) {
          setGameState(newState);
          setSelectedSquare(null);
          setLegalMoves([]);
          setArrows([]);
          const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
          if (newState.isCheck) playCheckSound();
          else if (lastMove.captured) playCaptureSound();
          else playMoveSound();
          if (newState.gameOver) {
            const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
            setGameOverInfo({ reason, winner: newState.winner });
            playGameOverSound();
          }
        }
        return;
      }
    }

    if (piece && piece.color === playerColor) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(gameState.board, pos));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameState, selectedSquare, legalMoves, isPlayerTurn, botThinking, playerColor]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    // Pre-move via drag when bot is thinking
    if ((!isPlayerTurn || botThinking) && !gameState.gameOver) {
      const piece = gameState.board[from.row][from.col];
      if (piece && piece.color === playerColor) {
        setPremove({ from, to });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    if (gameState.gameOver || !isPlayerTurn || botThinking) return;
    const piece = gameState.board[from.row][from.col];
    if (!piece || piece.color !== playerColor) return;
    const legal = getLegalMoves(gameState.board, from);
    if (legal.some(m => m.row === to.row && m.col === to.col)) {
      const newState = makeMove(gameState, from, to);
      if (newState) {
        setGameState(newState);
        setSelectedSquare(null);
        setLegalMoves([]);
        setArrows([]);
        const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
        if (newState.isCheck) playCheckSound();
        else if (lastMove.captured) playCaptureSound();
        else playMoveSound();
        if (newState.gameOver) {
          const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
          setGameOverInfo({ reason, winner: newState.winner });
          playGameOverSound();
        }
      }
    }
  }, [gameState, isPlayerTurn, botThinking, playerColor]);

  const handleStartGame = () => {
    setGameState(createInitialGameState(0, 0));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setShowGameOverModal(false);
    setBotThinking(false);
    setGameStarted(true);
    setArrows([]);
    setViewMoveIndex(null);
    setPremove(null);
  };

  const handleReset = () => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    setGameStarted(false);
    setGameState(createInitialGameState(0, 0));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setShowGameOverModal(false);
    setBotThinking(false);
    setArrows([]);
    setViewMoveIndex(null);
    setPremove(null);
  };

  const handleResign = () => {
    if (window.confirm(t('bot.resign_confirm'))) {
      const newState = { ...gameState };
      newState.gameOver = true;
      newState.winner = botColor;
      setGameState(newState);
      setGameOverInfo({ reason: 'resignation', winner: botColor });
      setPremove(null);
      playGameOverSound();
    }
  };

  const getLastMove = (): Move | null => {
    if (gameState.moveHistory.length === 0) return null;
    const idx = viewMoveIndex ?? gameState.moveHistory.length - 1;
    if (idx < 0) return null;
    return gameState.moveHistory[idx];
  };

  const getCheckSquare = (): Position | null => {
    if (!gameState.isCheck) return null;
    if (viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1) return null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.type === 'K' && piece.color === gameState.turn) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const getDisplayBoard = () => {
    if (viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.board;
    }
    if (viewMoveIndex === -1) return createInitialBoard();
    return getBoardAtMove(createInitialBoard(), gameState.moveHistory, viewMoveIndex);
  };

  const handleMoveClick = useCallback((index: number) => {
    if (index === gameState.moveHistory.length - 1 && viewMoveIndex === null) return;
    setViewMoveIndex(index);
  }, [gameState.moveHistory.length, viewMoveIndex]);

  const isViewingHistory = viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1;

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header subtitle={t('bot.title')} />

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-5 sm:p-6 w-full max-w-lg animate-slideUp">
            <h2 className="text-2xl font-bold text-text-bright mb-6 text-center">{t('bot.setup_title')}</h2>

            <div className="mb-6">
              <label className="text-sm text-text-dim mb-2 block">{t('bot.difficulty')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(difficultyConfig) as BotDifficulty[]).map((key) => {
                  const config = difficultyConfig[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className={`py-3 px-3 rounded-lg text-sm font-medium transition-all ${
                        difficulty === key
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                      }`}
                    >
                      <div className="text-lg mb-1">{config.emoji}</div>
                      <div className="font-bold">{t(config.labelKey)}</div>
                      <div className="text-xs opacity-70 mt-1">{t(config.descKey)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-text-dim mb-2 block">{t('bot.play_as')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPlayerColor('white')}
                  className={`py-3 px-3 rounded-lg font-medium transition-all flex flex-col items-center gap-1 ${
                    playerColor === 'white'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                  }`}
                >
                  <PieceSVG type="K" color="white" size={32} />
                  <span className="text-sm">{t('common.white')}</span>
                </button>
                <button
                  onClick={() => setPlayerColor(Math.random() < 0.5 ? 'white' : 'black')}
                  className="py-3 px-3 rounded-lg font-medium transition-all flex flex-col items-center gap-1 bg-surface hover:bg-surface-hover text-text border border-surface-hover"
                >
                  <span className="text-2xl">🎲</span>
                  <span className="text-sm">{t('bot.random')}</span>
                </button>
                <button
                  onClick={() => setPlayerColor('black')}
                  className={`py-3 px-3 rounded-lg font-medium transition-all flex flex-col items-center gap-1 ${
                    playerColor === 'black'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                  }`}
                >
                  <PieceSVG type="K" color="black" size={32} />
                  <span className="text-sm">{t('common.black')}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-3 px-6 bg-primary hover:bg-primary-light text-white font-bold rounded-lg text-lg transition-colors shadow-md"
            >
              {t('bot.start')}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 py-2 px-6 bg-surface hover:bg-surface-hover text-text border border-surface-hover font-medium rounded-lg transition-colors"
            >
              {t('common.back_home')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <Header
        subtitle={`${t('bot.vs_bot')} (${t(difficultyConfig[difficulty].labelKey)})`}
        right={<span>{difficultyConfig[difficulty].emoji}</span>}
      />

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

      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 w-full max-w-[1100px]">
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-full lg:flex-1 lg:max-w-[calc(100vh-140px)] max-w-[720px]">
            <div className={`rounded-lg px-4 py-2 text-center text-sm font-medium w-full max-w-xs ${
              botThinking
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-surface-alt text-text-dim border border-surface-hover'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <PieceSVG type="K" color={botColor} size={20} />
                <span>Bot ({t(difficultyConfig[difficulty].labelKey)})</span>
                {botThinking && <span className="animate-pulse">{t('bot.thinking')}</span>}
              </div>
            </div>

            <BoardErrorBoundary onRetry={() => window.location.reload()}>
              <Board
                board={getDisplayBoard()}
                playerColor={playerColor}
                isMyTurn={isPlayerTurn && !botThinking}
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

            <div className={`rounded-lg px-4 py-2 text-center text-sm font-medium w-full max-w-xs ${
              isPlayerTurn && !gameState.gameOver
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'bg-surface-alt text-text-dim border border-surface-hover'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <PieceSVG type="K" color={playerColor} size={20} />
                <span>{t('common.you')} ({t(playerColor === 'white' ? 'common.white' : 'common.black')})</span>
                {isPlayerTurn && !gameState.gameOver && <span>· {t('bot.your_turn')}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-72 w-full max-w-[720px]">
            {/* Turn indicator (only during play) */}
            {!gameState.gameOver && (
              <div className={`
                rounded-lg px-4 py-3 text-center font-semibold text-sm
                ${isPlayerTurn
                  ? 'bg-primary/20 text-primary-light border border-primary/30'
                  : 'bg-surface-alt text-text-dim border border-surface-hover'
                }
              `}>
                {isPlayerTurn ? t('bot.your_turn') : t('bot.bot_thinking')}
              </div>
            )}

            {/* Inline Game Over Panel (Lichess-style) */}
            {gameOverInfo && (
              <GameOverPanel
                winner={gameOverInfo.winner}
                reason={gameOverInfo.reason}
                playerColor={playerColor}
                onRematch={handleStartGame}
                onNewGame={handleReset}
                onAnalyze={gameState.moveHistory.length > 0
                  ? () => {
                      const movesParam = encodeURIComponent(JSON.stringify(gameState.moveHistory));
                      const result = gameState.winner || 'draw';
                      const reason = gameOverInfo.reason;
                      navigate(`/analysis/bot?moves=${movesParam}&result=${result}&reason=${reason}`);
                    }
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
              <div className="text-center text-xs text-text-dim">
                Use arrow keys to navigate moves
              </div>
            )}

            {!gameState.gameOver && (
              <button
                onClick={handleResign}
                className="w-full py-2 px-4 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-lg border border-surface-hover transition-colors"
              >
                ⚐ {t('bot.resign')}
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white text-sm rounded-lg transition-colors"
            >
              {t('common.back_home')}
            </button>
          </div>
        </div>
      </main>

      {gameOverInfo && showGameOverModal && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          onRematch={handleStartGame}
          onNewGame={handleReset}
          onAnalyze={gameState.moveHistory.length > 0
            ? () => {
                const movesParam = encodeURIComponent(JSON.stringify(gameState.moveHistory));
                const result = gameState.winner || 'draw';
                const reason = gameOverInfo.reason;
                navigate(`/analysis/bot?moves=${movesParam}&result=${result}&reason=${reason}`);
              }
            : undefined
          }
          onClose={() => setShowGameOverModal(false)}
        />
      )}
    </div>
  );
}
