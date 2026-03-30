import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import {
  getLegalMoves, makeMove, createInitialGameState, createInitialBoard, getBoardAtMove,
  startCounting, stopCounting, hasAnyLegalMoves, isInCheck,
} from '@shared/engine';
import { buildInlineAnalysisRoute, requestBotMove } from '../lib/analysis';
import { requestLocalBotMove } from '../lib/localBot';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useAuth } from '../lib/auth';
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
const BOT_REQUEST_TIMEOUT_MS = 2500;
const BOT_GAME_TIME_CONTROL = {
  initial: DEFAULT_PLAY_TIME_MS / 1000,
  increment: 0,
};
const BOT_LEVELS = Array.from({ length: 10 }, (_, index) => {
  const level = index + 1;

  return {
    level,
    title: `Level ${level}`,
    description: level <= 3
      ? 'Beginner'
      : level <= 6
        ? 'Intermediate'
        : level <= 8
          ? 'Advanced'
          : 'Expert',
  };
});

type SideChoice = PieceColor | 'random';

function buildBotName(level: number) {
  return `Makruk Bot Lv.${level}`;
}

function createBotGameId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `bot_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildNoMoveGameOverState(state: GameState): GameState | null {
  if (state.gameOver || hasAnyLegalMoves(state.board, state.turn)) {
    return null;
  }

  const inCheck = isInCheck(state.board, state.turn);
  const winner: PieceColor | null = inCheck
    ? (state.turn === 'white' ? 'black' : 'white')
    : null;

  return {
    ...state,
    isCheck: inCheck,
    isCheckmate: inCheck,
    isStalemate: !inCheck,
    isDraw: !inCheck,
    gameOver: true,
    winner,
    resultReason: inCheck ? 'checkmate' : 'stalemate',
    counting: null,
  };
}

export default function BotGame() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(5);
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [sideChoice, setSideChoice] = useState<SideChoice>('white');
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRequestAbortRef = useRef<AbortController | null>(null);
  const botRequestIdRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const moveCountRef = useRef(gameState.moveHistory.length);
  const persistedGameIdRef = useRef<string | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);

  // Pre-move state for bot games
  const [premove, setPremove] = useState<{ from: Position; to: Position } | null>(null);

  const botColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const isPlayerTurn = gameState.turn === playerColor;
  const playerDisplayName = user?.username?.trim()
    || user?.email.split('@')[0]?.trim()
    || 'Anonymous';
  const botName = buildBotName(level);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const clearPendingBotRequest = useCallback(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }

    if (botRequestTimeoutRef.current) {
      clearTimeout(botRequestTimeoutRef.current);
      botRequestTimeoutRef.current = null;
    }

    botRequestAbortRef.current?.abort();
    botRequestAbortRef.current = null;
    botRequestIdRef.current += 1;
  }, []);

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

    botTimeoutRef.current = setTimeout(async () => {
      const requestId = botRequestIdRef.current + 1;
      botRequestIdRef.current = requestId;

      const requestedState = gameStateRef.current;
      const requestMoveCount = requestedState.moveHistory.length;
      const requestTurn = requestedState.turn;
      let botMove = null;
      const controller = new AbortController();

      botRequestAbortRef.current = controller;
      botRequestTimeoutRef.current = setTimeout(() => {
        controller.abort();
      }, BOT_REQUEST_TIMEOUT_MS);

      try {
        const result = await requestBotMove(requestedState, level, {
          signal: controller.signal,
        });
        botMove = result.move;
      } catch {
        botMove = await requestLocalBotMove(requestedState, level);
      } finally {
        if (botRequestTimeoutRef.current) {
          clearTimeout(botRequestTimeoutRef.current);
          botRequestTimeoutRef.current = null;
        }
        if (botRequestAbortRef.current === controller) {
          botRequestAbortRef.current = null;
        }
      }

      if (botRequestIdRef.current !== requestId) return;

      const currentState = gameStateRef.current;
      const stateStillMatches = !currentState.gameOver
        && currentState.turn === requestTurn
        && currentState.moveHistory.length === requestMoveCount;

      if (!stateStillMatches) {
        setBotThinking(false);
        return;
      }

      let newState = botMove ? makeMove(currentState, botMove.from, botMove.to) : null;

      if (!newState) {
        const fallbackMove = await requestLocalBotMove(currentState, level);
        if (fallbackMove) {
          botMove = fallbackMove;
          newState = makeMove(currentState, fallbackMove.from, fallbackMove.to);
        }
      }

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
      } else {
        const terminalState = buildNoMoveGameOverState(currentState);
        if (terminalState) {
          setGameState(terminalState);
          setGameOverInfo({
            reason: terminalState.resultReason ?? 'draw',
            winner: terminalState.winner,
          });
          setPremove(null);
          playGameOverSound();
        }
      }

      setBotThinking(false);
    }, 0);

    return () => {
      clearPendingBotRequest();
    };
  }, [
    clearPendingBotRequest,
    botColor,
    gameStarted,
    gameState.board,
    gameState.counting,
    gameState.gameOver,
    gameState.moveHistory.length,
    gameState.turn,
    isPlayerTurn,
    level,
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

  useEffect(() => {
    if (!gameStarted || !gameOverInfo || !currentGameId) return;
    if (persistedGameIdRef.current === currentGameId) return;

    persistedGameIdRef.current = currentGameId;

    void fetch('/api/games/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentGameId,
        playerColor,
        playerName: playerDisplayName,
        level,
        result: gameState.winner || 'draw',
        resultReason: gameOverInfo.reason,
        timeControl: BOT_GAME_TIME_CONTROL,
        moves: gameState.moveHistory,
        finalBoard: gameState.board,
        moveCount: gameState.moveCount,
      }),
    }).catch(() => undefined);
  }, [
    currentGameId,
    gameOverInfo,
    gameStarted,
    gameState.board,
    gameState.moveCount,
    gameState.moveHistory,
    gameState.winner,
    level,
    playerColor,
    playerDisplayName,
  ]);

  useEffect(() => {
    const previousMoveCount = moveCountRef.current;
    const currentMoveCount = gameState.moveHistory.length;

    if (!gameState.gameOver && currentMoveCount !== previousMoveCount && viewMoveIndex !== null) {
      setViewMoveIndex(null);
    }

    moveCountRef.current = currentMoveCount;
  }, [gameState.gameOver, gameState.moveHistory.length, viewMoveIndex]);

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
        const next = Math.min(moveCount - 1, current + 1);
        setViewMoveIndex(next >= moveCount - 1 ? null : next);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setViewMoveIndex(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setViewMoveIndex(null);
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
    clearPendingBotRequest();
    const resolvedColor: PieceColor = sideChoice === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : sideChoice;

    setPlayerColor(resolvedColor);
    setGameState(createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setShowGameOverModal(false);
    setBotThinking(false);
    setGameStarted(true);
    setCurrentGameId(createBotGameId());
    persistedGameIdRef.current = null;
    setArrows([]);
    setViewMoveIndex(null);
    setPremove(null);
  };

  const handleReset = () => {
    clearPendingBotRequest();
    setGameStarted(false);
    setGameState(createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setShowGameOverModal(false);
    setBotThinking(false);
    setCurrentGameId(null);
    persistedGameIdRef.current = null;
    setArrows([]);
    setViewMoveIndex(null);
    setPremove(null);
  };

  const handleResign = () => {
    if (window.confirm(t('bot.resign_confirm'))) {
      clearPendingBotRequest();
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
    const latestIndex = gameState.moveHistory.length - 1;
    if (index === latestIndex) {
      setViewMoveIndex(null);
      return;
    }
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
  const sideChoiceLabel = sideChoice === 'random'
    ? t('bot.random')
    : t(sideChoice === 'white' ? 'common.white' : 'common.black');
  const levelMeta = BOT_LEVELS.find(entry => entry.level === level) ?? BOT_LEVELS[4];

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header subtitle={t('bot.title')} />

        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl animate-slideUp">
            <div className="overflow-hidden rounded-[1.75rem] border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(96,160,24,0.08),transparent_38%),linear-gradient(180deg,rgba(33,25,20,0.96),rgba(24,18,15,0.98))] shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
              <div className="border-b border-surface-hover/70 px-5 py-5 sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/85">
                      {t('home.play_bot')}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-bright">{t('bot.setup_title')}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-text-dim">
                      {t('bot.setup_desc')}
                    </p>
                  </div>
                  <div className="grid min-w-[14rem] grid-cols-2 gap-2 self-start rounded-2xl border border-surface-hover/80 bg-surface/55 p-2">
                    <div className="rounded-xl bg-surface-alt px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.difficulty')}</div>
                      <div className="mt-1 text-sm font-semibold text-text-bright">{levelMeta.title}</div>
                      <div className="text-xs text-text-dim">{levelMeta.description}</div>
                    </div>
                    <div className="rounded-xl bg-surface-alt px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.play_as')}</div>
                      <div className="mt-1 text-sm font-semibold text-text-bright">{sideChoiceLabel}</div>
                      <div className="text-xs text-text-dim">
                        {sideChoice === 'random' ? t('bot.random_assigned') : t('bot.side_locked')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-5 py-5 sm:px-7 sm:py-6">
                <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 p-4 sm:p-5">
                  <label className="mb-3 block text-sm font-medium text-text-dim">{t('bot.difficulty')}</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {BOT_LEVELS.map((entry) => {
                      return (
                        <button
                          key={entry.level}
                          onClick={() => setLevel(entry.level)}
                          className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                            level === entry.level
                              ? 'border-primary/40 bg-primary text-white shadow-[0_10px_24px_rgba(92,160,26,0.28)]'
                              : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                          }`}
                        >
                          <div className="font-bold">{entry.title}</div>
                          <div className="mt-1 text-xs opacity-70">{entry.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 p-4 sm:p-5">
                  <label className="mb-3 block text-sm font-medium text-text-dim">{t('bot.play_as')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSideChoice('white')}
                      className={`rounded-xl border px-3 py-4 font-medium transition-all flex flex-col items-center gap-1.5 ${
                        sideChoice === 'white'
                          ? 'border-primary/40 bg-primary text-white shadow-[0_10px_24px_rgba(92,160,26,0.28)]'
                          : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                      }`}
                    >
                      <PieceSVG type="K" color="white" size={32} />
                      <span className="text-sm">{t('common.white')}</span>
                    </button>
                    <button
                      onClick={() => setSideChoice('random')}
                      className={`rounded-xl border px-3 py-4 font-medium transition-all flex flex-col items-center gap-1.5 ${
                        sideChoice === 'random'
                          ? 'border-primary/40 bg-primary text-white shadow-[0_10px_24px_rgba(92,160,26,0.28)]'
                          : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                      }`}
                    >
                      <span className="text-2xl">🎲</span>
                      <span className="text-sm">{t('bot.random')}</span>
                      <span className="text-[11px] opacity-70">{t('bot.random_assigned')}</span>
                    </button>
                    <button
                      onClick={() => setSideChoice('black')}
                      className={`rounded-xl border px-3 py-4 font-medium transition-all flex flex-col items-center gap-1.5 ${
                        sideChoice === 'black'
                          ? 'border-primary/40 bg-primary text-white shadow-[0_10px_24px_rgba(92,160,26,0.28)]'
                          : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                      }`}
                    >
                      <PieceSVG type="K" color="black" size={32} />
                      <span className="text-sm">{t('common.black')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-surface-hover/70 pt-1">
                  <button
                    onClick={handleStartGame}
                    className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    {t('bot.start')}
                  </button>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full rounded-xl border border-surface-hover bg-surface-alt/85 px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-surface-hover"
                  >
                    {t('common.back_home')}
                  </button>
                </div>
              </div>
            </div>
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
              Level {level}
            </span>
          </>
        }
        topPanel={
          <Clock
            time={botColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === botColor && !gameState.gameOver}
            color={botColor}
            playerName={botName}
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
          <>
            {isViewingHistory && (
              <button
                onClick={() => setViewMoveIndex(null)}
                className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary-light normal-case tracking-normal transition-colors hover:bg-primary/15"
              >
                {t('game.return_to_live')}
              </button>
            )}
            {premove ? (
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
            ) : null}
          </>
        }
        sidePanel={
          <>
            <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="font-semibold text-text-bright">{statusText}</div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                  <span>{t('bot.vs_bot')}</span>
                  <span className="rounded-full px-2 py-1 bg-surface text-text-dim border border-surface-hover">
                    Level {level}
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
                      navigate(buildInlineAnalysisRoute({
                        source: 'bot',
                        moves: gameState.moveHistory,
                        result: gameState.winner || 'draw',
                        reason: gameOverInfo.reason,
                      }));
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
                navigate(buildInlineAnalysisRoute({
                  source: 'bot',
                  moves: gameState.moveHistory,
                  result: gameState.winner || 'draw',
                  reason: gameOverInfo.reason,
                }));
              }
            : undefined
          }
          onClose={() => setShowGameOverModal(false)}
        />
      )}
    </>
  );
}
