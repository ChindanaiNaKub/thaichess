import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import {
  getLegalMoves, makeMove, createInitialGameState, createInitialBoard, getBoardAtMove,
  startCounting, stopCounting,
} from '@shared/engine';
import { getBotMove, BotDifficulty } from '@shared/botEngine';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { getCapturedSummary } from '../lib/capturedSummary';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import GameOverPanel from './GameOverPanel';
import Header from './Header';
import PieceSVG from './PieceSVG';
import Clock from './Clock';
import InGameShell from './InGameShell';

const DEFAULT_PLAY_TIME_MS = 10 * 60 * 1000;
const LOCAL_CLOCK_TICK_MS = 500;

export default function BotGame() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStateRef = useRef(gameState);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);

  // Pre-move state for bot games
  const [premove, setPremove] = useState<{ from: Position; to: Position } | null>(null);

  const botColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const isPlayerTurn = gameState.turn === playerColor;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const difficultyConfig: Record<BotDifficulty, { labelKey: string; descKey: string; emoji: string }> = {
    easy: { labelKey: 'bot.easy', descKey: 'bot.easy_desc', emoji: '🟢' },
    medium: { labelKey: 'bot.medium', descKey: 'bot.medium_desc', emoji: '🟡' },
    hard: { labelKey: 'bot.hard', descKey: 'bot.hard_desc', emoji: '🔴' },
  };

  useEffect(() => {
    if (!gameStarted || gameState.gameOver || isPlayerTurn) return;

    if (gameState.counting && !gameState.counting.active && gameState.counting.countingColor === botColor) {
      const countedState = startCounting(gameState);
      if (countedState) {
        setGameState(countedState);
        return;
      }
    }

    setBotThinking(true);
    const delay = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 600 : 800;

    botTimeoutRef.current = setTimeout(() => {
      const currentState = gameStateRef.current;
      const botMoveResult = getBotMove(currentState, difficulty);
      if (botMoveResult) {
        const newState = makeMove(currentState, botMoveResult.from, botMoveResult.to);
        if (newState) {
          setGameState(newState);
          setArrows([]);
          const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
          if (newState.isCheck) playCheckSound();
          else if (lastMove.captured) playCaptureSound();
          else playMoveSound();

          if (newState.gameOver) {
            const reason = newState.resultReason ?? 'draw';
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
  }, [
    botColor,
    difficulty,
    gameStarted,
    gameState.board,
    gameState.counting,
    gameState.gameOver,
    gameState.moveHistory.length,
    gameState.turn,
    isPlayerTurn,
  ]);

  useEffect(() => {
    if (!gameStarted || gameState.gameOver) return;

    const interval = setInterval(() => {
      let timeoutWinner: PieceColor | null = null;

      setGameState((prev) => {
        if (prev.gameOver) return prev;

        const now = Date.now();
        const elapsed = now - prev.lastMoveTime;
        if (elapsed <= 0) return prev;

        if (prev.turn === 'white') {
          const whiteTime = Math.max(0, prev.whiteTime - elapsed);
          if (whiteTime === 0) {
            timeoutWinner = 'black';
            return { ...prev, whiteTime: 0, lastMoveTime: now, gameOver: true, winner: 'black', resultReason: 'timeout', counting: null };
          }
          return { ...prev, whiteTime, lastMoveTime: now };
        }

        const blackTime = Math.max(0, prev.blackTime - elapsed);
        if (blackTime === 0) {
          timeoutWinner = 'white';
          return { ...prev, blackTime: 0, lastMoveTime: now, gameOver: true, winner: 'white', resultReason: 'timeout', counting: null };
        }
        return { ...prev, blackTime, lastMoveTime: now };
      });

      if (timeoutWinner) {
        if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
        setBotThinking(false);
        setPremove(null);
        setGameOverInfo({ reason: 'timeout', winner: timeoutWinner });
        playGameOverSound();
      }
    }, LOCAL_CLOCK_TICK_MS);

    return () => clearInterval(interval);
  }, [gameStarted, gameState.gameOver]);

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
            const reason = newState.resultReason ?? 'draw';
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
    if (gameState.moveHistory.length === 0) return;

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
            const reason = newState.resultReason ?? 'draw';
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
          const reason = newState.resultReason ?? 'draw';
          setGameOverInfo({ reason, winner: newState.winner });
          playGameOverSound();
        }
      }
    }
  }, [gameState, isPlayerTurn, botThinking, playerColor]);

  const handleStartGame = () => {
    setGameState(createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
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
    setGameState(createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
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
      newState.resultReason = 'resignation';
      newState.counting = null;
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

  const getVisibleMoves = () => {
    if (viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.moveHistory;
    }
    if (viewMoveIndex < 0) return [];
    return gameState.moveHistory.slice(0, viewMoveIndex + 1);
  };

  const isViewingHistory = viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1;

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header subtitle={t('bot.title')} />

        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
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
  const canStartBotCounting = Boolean(gameState.counting && !gameState.gameOver && !gameState.counting.active && isPlayerTurn && playerColor === gameState.counting.countingColor);
  const canStopBotCounting = Boolean(gameState.counting && !gameState.gameOver && gameState.counting.active && isPlayerTurn && playerColor === gameState.counting.countingColor);
  const moveCount = gameState.moveHistory.length;
  const visibleMoves = getVisibleMoves();
  const playerCaptureSummary = getCapturedSummary(visibleMoves, playerColor);
  const botCaptureSummary = getCapturedSummary(visibleMoves, botColor);
  const statusText = gameState.gameOver
    ? t('game.reviewing_position')
    : isPlayerTurn
      ? t('bot.your_turn')
      : t('bot.bot_thinking');

  const handleStartCounting = () => {
    const newState = startCounting(gameState);
    if (newState) setGameState(newState);
  };

  const handleStopCounting = () => {
    const newState = stopCounting(gameState);
    if (newState) setGameState(newState);
  };

  return (
    <>
      <InGameShell
        onHome={() => navigate('/')}
        headerMeta={
          <>
            <AppearanceSettingsButton compact />
            <span className="hidden md:inline">{t('bot.vs_bot')}</span>
            <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] bg-surface text-text-dim border border-surface-hover">
              {t(difficultyConfig[difficulty].labelKey)}
            </span>
          </>
        }
        topPanel={
          <Clock
            time={botColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === botColor && !gameState.gameOver}
            color={botColor}
            playerName={`Bot (${t(difficultyConfig[difficulty].labelKey)})`}
            subtitle={t(botColor === 'white' ? 'common.white' : 'common.black')}
            capturedPieces={botCaptureSummary.pieces}
            materialDelta={botCaptureSummary.material}
          />
        }
        board={
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
        }
        bottomPanel={
          <Clock
            time={playerColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={isPlayerTurn && !botThinking && !gameState.gameOver}
            color={playerColor}
            playerName={`${t('common.you')} (${t(playerColor === 'white' ? 'common.white' : 'common.black')})`}
            subtitle={t(playerColor === 'white' ? 'common.white' : 'common.black')}
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
                onClick={() => { setPremove(null); setSelectedSquare(null); setLegalMoves([]); }}
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
                  <span>{t('bot.vs_bot')}</span>
                  <span className="rounded-full px-2 py-1 bg-surface text-text-dim border border-surface-hover">
                    {t(difficultyConfig[difficulty].labelKey)}
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
                {canStartBotCounting && (
                  <button
                    onClick={handleStartCounting}
                    className="mt-3 w-full py-2 px-3 bg-accent/20 hover:bg-accent/30 text-accent text-sm rounded-lg border border-accent/30 transition-colors"
                  >
                    {t('game.counting_start')}
                  </button>
                )}
                {canStopBotCounting && (
                  <button
                    onClick={handleStopCounting}
                    className="mt-3 w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                  >
                    {t('game.counting_stop')}
                  </button>
                )}
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
              onMoveClick={handleMoveClick}
            />

            {gameState.moveHistory.length > 0 && (
              <div className="text-center text-[11px] text-text-dim">
                {t('game.nav_hint')}
              </div>
            )}

            {!gameState.gameOver && (
              <button
                onClick={handleResign}
                className="w-full py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors"
              >
                ⚐ {t('bot.resign')}
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white text-sm rounded-xl transition-colors"
            >
              {t('common.back_home')}
            </button>
          </>
        }
      />

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
    </>
  );
}
