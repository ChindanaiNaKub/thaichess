import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_BOT_PERSONA_ID, getBotPersonaById } from '@shared/botPersonas';
import { getBotPublicStrengthLabel } from '@shared/botEngine';
import { formatBotEstimatedEloRange } from '@shared/botEstimatedElo';
import { getBotDialoguePack } from '@shared/botDialogueCatalog';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import {
  getLegalMoves, makeMove, createInitialGameState, getLastMoveForView,
  startCounting, stopCounting,
} from '@shared/engine';
import { buildInlineAnalysisRoute, requestBotMove } from '../lib/analysis';
import {
  emptyBoardSelection,
  getCheckSquareForView,
  getDisplayBoardForView,
  getVisibleMovesForView,
  includesPosition,
  isViewingHistoryIndex,
  samePosition,
  scrubViewMoveIndex,
  selectBoardSquare,
  viewMoveIndexFromHistoryClick,
} from '../lib/boardSession';
import { requestBrowserEngineBotMove } from '../lib/browserEngineBot';
import { useBoardNavKeyboard } from '../hooks/useBoardNavKeyboard';
import { usePostGameReview } from '../hooks/usePostGameReview';
import { useReviewEngineAnalysis } from '../hooks/useReviewEngineAnalysis';
import { useBotChatDialogue } from './useBotChatDialogue';
import { useBotClock } from './useBotClock';
import { getBotRequestTimeoutMs } from '../lib/botRequestTimeout';
import { requestLocalBotMove } from '../lib/localBot';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';
import { useToast } from '../lib/toast';
import { getCapturedSummary } from '../lib/capturedSummary';
import { useSaveBotGameMutation } from '../queries/botGames';
import type { Arrow } from '../components/Board';
import { BotGameActiveView } from '../components/BotGameActiveView';
import { BotGameSetupView } from '../components/BotGameSetupView';
import {
  BOT_GAME_TIME_CONTROL,
  DEFAULT_PLAY_TIME_MS,
  buildNoMoveGameOverState,
  createBotGameId,
  getBotCountingLabel,
  getHighLevelLocalFallbackDelayMs,
  useBotTranslation,
  type SideChoice,
} from '../components/botGameHelpers';

export function useBotGameScreen() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const reviewT = useReviewCopy();
  const { user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState(DEFAULT_BOT_PERSONA_ID);
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [sideChoice, setSideChoice] = useState<SideChoice>('white');
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRequestAbortRef = useRef<AbortController | null>(null);
  const botRequestIdRef = useRef(0);
  const failedBotMoveKeyRef = useRef<string | null>(null);
  const gameStateRef = useRef(gameState);
  const moveCountRef = useRef(gameState.moveHistory.length);
  const persistedGameIdRef = useRef<string | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);
  const review = usePostGameReview({
    enabled: gameState.gameOver,
    mainLine: gameState.moveHistory,
    finalState: gameState,
  });
  const reviewEngine = useReviewEngineAnalysis({
    enabled: gameState.gameOver,
    snapshot: gameState.gameOver
      ? {
          board: review.currentState.board,
          turn: review.currentState.turn,
          counting: review.currentState.counting,
        }
      : null,
  });

  const saveBotGameMutation = useSaveBotGameMutation();
  const { showToast } = useToast();

  // Pre-move state for bot games
  const [premove, setPremove] = useState<{ from: Position; to: Position } | null>(null);

  const selectedBot = getBotPersonaById(selectedBotId);
  const selectedBotTranslation = useBotTranslation(t, selectedBot.id);
  const botLevel = selectedBot.engine.level;
  const botColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const isPlayerTurn = gameState.turn === playerColor;
  const playerDisplayName = user?.username?.trim()
    || user?.email.split('@')[0]?.trim()
    || 'Anonymous';
  const botName = selectedBot.name;
  const setupIntroPreview = getBotDialoguePack(selectedBot, lang).intro[0] ?? selectedBot.flavorIntroLine;

  const showToastRef = useRef(showToast);
  const translateRef = useRef(t);
  const botLevelRef = useRef(botLevel);
  const selectedBotIdRef = useRef(selectedBot.id);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  useEffect(() => {
    botLevelRef.current = botLevel;
  }, [botLevel]);

  useEffect(() => {
    selectedBotIdRef.current = selectedBot.id;
  }, [selectedBot.id]);

  const {
    botChat,
    botChatFading,
    queueIntro,
    resetBotChat,
  } = useBotChatDialogue({
    gameStarted,
    gameStateRef,
    gameOver: gameState.gameOver,
    moveCount: gameState.moveHistory.length,
    botThinking,
    selectedBot,
    lang,
    botColor,
  });

  useBotClock({
    running: gameStarted,
    gameOver: gameState.gameOver,
    onTick: setGameState,
  });

  // Helper to save bot game and navigate to analysis
  const handleAnalyzeGame = useCallback(() => {
    if (!currentGameId || gameState.moveHistory.length === 0) {
      navigate('/analysis');
      return;
    }

    const gameResult: import('../queries/botGames').BotGameResult = {
      id: currentGameId,
      playerColor,
      playerName: playerDisplayName,
      level: botLevel,
      botId: selectedBotId,
      result: gameState.winner || 'draw',
      resultReason: gameOverInfo?.reason || 'unknown',
      timeControl: BOT_GAME_TIME_CONTROL,
      moves: gameState.moveHistory,
      finalBoard: gameState.board,
      moveCount: gameState.moveHistory.length,
    };

    // Save to database first, then navigate to analysis with real game ID
    saveBotGameMutation.mutate(gameResult, {
      onSuccess: () => {
        navigate(`/analysis/${currentGameId}`);
      },
      onError: () => {
        // Fallback: navigate to inline analysis if save fails
        navigate(buildInlineAnalysisRoute({
          source: 'bot',
          moves: gameState.moveHistory,
          result: gameState.winner || 'draw',
          reason: gameOverInfo?.reason || 'unknown',
        }));
      },
    });
  }, [currentGameId, gameState, playerColor, playerDisplayName, botLevel, selectedBotId, gameOverInfo, navigate, saveBotGameMutation]);

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

  // Clock ticks rewrite gameState every 500ms. Never depend on the whole
  // gameState object here — that aborted in-flight bot requests, left
  // botThinking stuck true, and made the player's turn feel like a premove.
  useEffect(() => {
    let localFallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let requestAbortTimer: ReturnType<typeof setTimeout> | undefined;

    const clearBotRequestTimers = () => {
      if (requestAbortTimer !== undefined) clearTimeout(requestAbortTimer);
      requestAbortTimer = undefined;
      botRequestTimeoutRef.current = null;
      if (localFallbackTimer !== undefined) clearTimeout(localFallbackTimer);
      localFallbackTimer = undefined;
    };

    if (!gameStarted || gameState.gameOver || isPlayerTurn) {
      setBotThinking(false);
      return;
    }

    const botMoveKey = `${gameState.turn}:${gameState.moveHistory.length}`;
    if (failedBotMoveKeyRef.current === botMoveKey) {
      setBotThinking(false);
      return;
    }

    const counting = gameState.counting;
    if (counting && !counting.active && counting.countingColor === botColor) {
      const countedState = startCounting(gameStateRef.current);
      if (countedState) {
        setGameState(countedState);
        return;
      }
    }

    setBotThinking(true);

    const botMoveTimerId = setTimeout(async () => {
      const requestId = botRequestIdRef.current + 1;
      botRequestIdRef.current = requestId;

      const requestedState = gameStateRef.current;
      const requestMoveCount = requestedState.moveHistory.length;
      const requestTurn = requestedState.turn;
      const level = botLevelRef.current;
      const botId = selectedBotIdRef.current;
      let botMove = null;
      const controller = new AbortController();

      botRequestAbortRef.current = controller;
      requestAbortTimer = setTimeout(() => {
        controller.abort();
      }, getBotRequestTimeoutMs(level));
      botRequestTimeoutRef.current = requestAbortTimer;

      try {
        botMove = await requestBrowserEngineBotMove(requestedState, level).catch(() => null);
        if (!botMove) {
          const localFallbackDelayMs = getHighLevelLocalFallbackDelayMs(level);
          const serverMovePromise = requestBotMove(requestedState, level, {
            signal: controller.signal,
            botId,
          }).then((result) => result.move);

          if (localFallbackDelayMs === null) {
            botMove = await serverMovePromise;
          } else {
            const localFallbackPromise = new Promise<{ from: Position; to: Position } | null>((resolve) => {
              localFallbackTimer = setTimeout(() => {
                requestLocalBotMove(requestedState, level, botId)
                  .then(resolve)
                  .catch(() => resolve(null));
              }, localFallbackDelayMs);
            });

            botMove = await Promise.race([
              serverMovePromise.catch(() => null),
              localFallbackPromise,
            ]);

            if (botMove) {
              controller.abort();
            }
          }
        }
      } catch {
        botMove = await requestLocalBotMove(requestedState, level, botId).catch(() => null);
      } finally {
        clearBotRequestTimers();
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
        const fallbackMove = await requestLocalBotMove(currentState, level, botId).catch(() => null);
        if (botRequestIdRef.current !== requestId) return;
        if (fallbackMove) {
          botMove = fallbackMove;
          newState = makeMove(gameStateRef.current, fallbackMove.from, fallbackMove.to);
        }
      }

      if (newState) {
        failedBotMoveKeyRef.current = null;
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
        } else {
          failedBotMoveKeyRef.current = botMoveKey;
          showToastRef.current(translateRef.current('bot.engine_unavailable'), 'error');
        }
      }

      setBotThinking(false);
    }, 0);

    botTimeoutRef.current = botMoveTimerId;

    return () => {
      clearTimeout(botMoveTimerId);
      botTimeoutRef.current = null;
      if (requestAbortTimer !== undefined) clearTimeout(requestAbortTimer);
      requestAbortTimer = undefined;
      if (localFallbackTimer !== undefined) clearTimeout(localFallbackTimer);
      localFallbackTimer = undefined;
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
  ]);

  // Auto-execute premove when it becomes player's turn.
  // Reads state through gameStateRef so the 500ms clock tick (which rewrites
  // the gameState object) does not re-run this effect every tick.
  useEffect(() => {
    if (!premove || !isPlayerTurn || botThinking) return;
    const currentState = gameStateRef.current;
    if (currentState.gameOver) return;

    const piece = currentState.board[premove.from.row][premove.from.col];
    if (piece && piece.color === playerColor) {
      const legal = getLegalMoves(currentState.board, premove.from);
      if (legal.some(m => m.row === premove.to.row && m.col === premove.to.col)) {
        const newState = makeMove(currentState, premove.from, premove.to);
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
  }, [botThinking, isPlayerTurn, playerColor, premove]);

  useEffect(() => {
    if (gameOverInfo) setShowGameOverModal(true);
  }, [gameOverInfo]);

  useEffect(() => {
    if (!gameStarted || !gameState.gameOver || gameState.resultReason !== 'timeout') return;
    if (gameOverInfo?.reason === 'timeout') return;
    setGameOverInfo({ reason: 'timeout', winner: gameState.winner });
    playGameOverSound();
  }, [gameOverInfo, gameStarted, gameState.gameOver, gameState.resultReason, gameState.winner]);

  // Save bot game result when game ends
  useEffect(() => {
    if (!gameStarted || !gameOverInfo || !currentGameId) return;
    if (persistedGameIdRef.current === currentGameId) return;

    persistedGameIdRef.current = currentGameId;

    saveBotGameMutation.mutate(
      {
        id: currentGameId,
        playerColor,
        playerName: playerDisplayName,
        level: botLevel,
        botId: selectedBot.id,
        result: gameState.winner || 'draw',
        resultReason: gameOverInfo.reason,
        timeControl: BOT_GAME_TIME_CONTROL,
        moves: gameState.moveHistory,
        finalBoard: gameState.board,
        moveCount: gameState.moveCount,
      },
      {
        onSuccess: () => {
          showToast(t('bot.save_success'), 'success');
        },
        onError: () => {
          showToast(t('bot.save_failed'), 'error');
        },
      }
    );
  }, [
    currentGameId,
    gameOverInfo,
    gameStarted,
    gameState.board,
    gameState.moveCount,
    gameState.moveHistory,
    gameState.winner,
    botLevel,
    playerColor,
    playerDisplayName,
    selectedBot.id,
    saveBotGameMutation,
    showToast,
    t,
  ]);

  // Reset history browsing when a new move arrives mid-game.
  useEffect(() => {
    const previousMoveCount = moveCountRef.current;
    const currentMoveCount = gameState.moveHistory.length;

    if (!gameState.gameOver && currentMoveCount !== previousMoveCount && viewMoveIndex !== null) {
      setViewMoveIndex(null);
    }

    moveCountRef.current = currentMoveCount;
  }, [gameState.gameOver, gameState.moveHistory.length, viewMoveIndex]);

  // Keyboard navigation for move history
  const boardNavHandlers = useMemo(() => ({
    onBack: () => {
      if (gameState.gameOver) {
        review.stepBackward();
        return;
      }
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'back'));
    },
    onForward: () => {
      if (gameState.gameOver) {
        review.stepForward();
        return;
      }
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'forward'));
    },
    onStart: () => {
      if (gameState.gameOver) {
        review.jumpToStart();
        return;
      }
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'start'));
    },
    onEnd: () => {
      if (gameState.gameOver) {
        review.jumpToEnd();
        return;
      }
      setViewMoveIndex(scrubViewMoveIndex(viewMoveIndex, gameState.moveHistory.length, 'end'));
    },
  }), [gameState.gameOver, gameState.moveHistory.length, review, viewMoveIndex]);

  useBoardNavKeyboard({
    enabled: gameState.moveHistory.length > 0,
    handlers: boardNavHandlers,
  });

  // Reads live state through gameStateRef so the clock tick's new gameState
  // object identity does not recreate these callbacks (which would defeat
  // Board memoization every 500ms).
  const handleSquareClick = useCallback((pos: Position) => {
    const currentGameState = gameStateRef.current;
    if (currentGameState.gameOver) return;
    const piece = currentGameState.board[pos.row][pos.col];

    // Pre-move logic when bot is thinking
    if (!isPlayerTurn || botThinking) {
      if (selectedSquare) {
        if (!samePosition(pos, selectedSquare)) {
          const fromPiece = currentGameState.board[selectedSquare.row][selectedSquare.col];
          if (fromPiece && fromPiece.color === playerColor) {
            setPremove({ from: selectedSquare, to: pos });
            const cleared = emptyBoardSelection();
            setSelectedSquare(cleared.selectedSquare);
            setLegalMoves(cleared.legalMoves);
            return;
          }
        }
      }

      if (piece && piece.color === playerColor) {
        const next = selectBoardSquare(currentGameState.board, pos);
        setSelectedSquare(next.selectedSquare);
        setLegalMoves(next.legalMoves);
        setPremove(null);
      } else {
        const cleared = emptyBoardSelection();
        setSelectedSquare(cleared.selectedSquare);
        setLegalMoves(cleared.legalMoves);
      }
      return;
    }

    if (selectedSquare) {
      if (includesPosition(legalMoves, pos)) {
        const newState = makeMove(currentGameState, selectedSquare, pos);
        if (newState) {
          setGameState(newState);
          const cleared = emptyBoardSelection();
          setSelectedSquare(cleared.selectedSquare);
          setLegalMoves(cleared.legalMoves);
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
      const next = selectBoardSquare(currentGameState.board, pos);
      setSelectedSquare(next.selectedSquare);
      setLegalMoves(next.legalMoves);
    } else {
      const cleared = emptyBoardSelection();
      setSelectedSquare(cleared.selectedSquare);
      setLegalMoves(cleared.legalMoves);
    }
  }, [selectedSquare, legalMoves, isPlayerTurn, botThinking, playerColor]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    const currentGameState = gameStateRef.current;

    // Pre-move via drag when bot is thinking
    if ((!isPlayerTurn || botThinking) && !currentGameState.gameOver) {
      const piece = currentGameState.board[from.row][from.col];
      if (piece && piece.color === playerColor) {
        setPremove({ from, to });
        const cleared = emptyBoardSelection();
        setSelectedSquare(cleared.selectedSquare);
        setLegalMoves(cleared.legalMoves);
        return;
      }
    }

    if (currentGameState.gameOver || !isPlayerTurn || botThinking) return;
    const piece = currentGameState.board[from.row][from.col];
    if (!piece || piece.color !== playerColor) return;
    const legal = getLegalMoves(currentGameState.board, from);
    if (includesPosition(legal, to)) {
      const newState = makeMove(currentGameState, from, to);
      if (newState) {
        setGameState(newState);
        const cleared = emptyBoardSelection();
        setSelectedSquare(cleared.selectedSquare);
        setLegalMoves(cleared.legalMoves);
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
  }, [isPlayerTurn, botThinking, playerColor]);

  const handleStartGame = () => {
    clearPendingBotRequest();
    const resolvedColor: PieceColor = sideChoice === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : sideChoice;
    const freshState = createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS);

    setPlayerColor(resolvedColor);
    setGameState(freshState);
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setShowGameOverModal(false);
    setBotThinking(false);
    setGameStarted(true);
    setCurrentGameId(createBotGameId());
    failedBotMoveKeyRef.current = null;
    persistedGameIdRef.current = null;
    setArrows([]);
    setViewMoveIndex(null);
    setPremove(null);
    resetBotChat(freshState);
    queueIntro();
  };

  const handleReset = () => {
    clearPendingBotRequest();
    resetBotChat();
    setGameStarted(false);
    setGameState(createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setShowGameOverModal(false);
    setBotThinking(false);
    setCurrentGameId(null);
    failedBotMoveKeyRef.current = null;
    persistedGameIdRef.current = null;
    setArrows([]);
    setViewMoveIndex(null);
    setPremove(null);
  };

  const handleResign = () => {
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
  };

  const getLastMove = (): Move | null => {
    return getLastMoveForView(gameState, viewMoveIndex);
  };

  const getCheckSquare = (): Position | null => getCheckSquareForView(gameState, viewMoveIndex);

  const getDisplayBoard = () => getDisplayBoardForView(gameState, viewMoveIndex);

  const handleMoveClick = useCallback((index: number) => {
    setViewMoveIndex(viewMoveIndexFromHistoryClick(index, gameState.moveHistory.length));
  }, [gameState.moveHistory.length]);

  const getVisibleMoves = () => getVisibleMovesForView(gameState.moveHistory, viewMoveIndex);

  const reviewActive = gameState.gameOver;
  const reviewMode = review.mode;
  const reviewIsViewingHistory = reviewMode === 'analysis'
    || review.selectedMainLineMoveIndex !== gameState.moveHistory.length - 1;
  const isViewingHistory = reviewActive
    ? reviewIsViewingHistory
    : isViewingHistoryIndex(viewMoveIndex, gameState.moveHistory.length);
  const difficultyLabel = getBotPublicStrengthLabel(selectedBot.engine.level);
  const levelLabel = t('bot.level_short', { level: botLevel });
  const estimatedEloLabel = t('bot.estimated_elo_range', { range: formatBotEstimatedEloRange(botLevel) });

  if (!gameStarted) {
    return (
      <BotGameSetupView
        t={t}
        selectedBot={selectedBot}
        selectedBotTranslation={selectedBotTranslation}
        sideChoice={sideChoice}
        showDetails={showDetails}
        levelLabel={levelLabel}
        difficultyLabel={difficultyLabel}
        estimatedEloLabel={estimatedEloLabel}
        setupIntroPreview={setupIntroPreview}
        onSelectBot={setSelectedBotId}
        onSideChange={setSideChoice}
        onToggleDetails={() => setShowDetails(!showDetails)}
        onStartGame={handleStartGame}
        onBackHome={() => navigate('/')}
      />
    );
  }

  const countingLabel = gameState.counting
    ? getBotCountingLabel(t, gameState.counting)
    : null;
  const canStartBotCounting = Boolean(gameState.counting && !gameState.gameOver && !gameState.counting.active && isPlayerTurn && playerColor === gameState.counting.countingColor);
  const canStopBotCounting = Boolean(gameState.counting && !gameState.gameOver && gameState.counting.active && isPlayerTurn && playerColor === gameState.counting.countingColor);
  const moveCount = reviewActive ? review.currentMoveHistory.length : gameState.moveHistory.length;
  const visibleMoves = reviewActive ? review.currentMoveHistory : getVisibleMoves();
  const playerCaptureSummary = getCapturedSummary(visibleMoves, playerColor);
  const botCaptureSummary = getCapturedSummary(visibleMoves, botColor);
  const statusText = reviewActive
    ? reviewMode === 'analysis'
      ? reviewT('review.analysis_status')
      : reviewT('review.main_status')
    : isPlayerTurn
      ? t('bot.your_turn')
      : t('bot.bot_thinking');
  const botClockSubtitle = `${selectedBot.title} | ${levelLabel} | ${estimatedEloLabel}`;

  const handleStartCounting = () => {
    const newState = startCounting(gameState);
    if (newState) setGameState(newState);
  };

  const handleStopCounting = () => {
    const newState = stopCounting(gameState);
    if (newState) setGameState(newState);
  };

  return (
    <BotGameActiveView
      t={t}
      selectedBot={selectedBot}
      selectedBotTranslation={selectedBotTranslation}
      gameState={gameState}
      playerColor={playerColor}
      botColor={botColor}
      playerDisplayName={playerDisplayName}
      botName={botName}
      turnStatus={{
        playerToMove: isPlayerTurn,
        botThinking,
      }}
      viewingHistory={isViewingHistory}
      levelLabel={levelLabel}
      difficultyLabel={difficultyLabel}
      estimatedEloLabel={estimatedEloLabel}
      botClockSubtitle={botClockSubtitle}
      statusText={statusText}
      moveCount={moveCount}
      counting={{
        label: countingLabel,
        start: canStartBotCounting ? handleStartCounting : null,
        stop: canStopBotCounting ? handleStopCounting : null,
      }}
      playerCaptureSummary={playerCaptureSummary}
      botCaptureSummary={botCaptureSummary}
      legalMoves={legalMoves}
      selectedSquare={selectedSquare}
      premove={premove}
      arrows={arrows}
      viewMoveIndex={viewMoveIndex}
      currentGameId={currentGameId}
      gameOverInfo={gameOverInfo}
      modalGameOverInfo={showGameOverModal ? gameOverInfo : null}
      botChat={botChat}
      botChatFading={botChatFading}
      review={review}
      reviewEngine={reviewEngine}
      displayBoard={getDisplayBoard()}
      lastMove={getLastMove()}
      checkSquare={getCheckSquare()}
      onHome={() => navigate('/')}
      onSquareClick={handleSquareClick}
      onPieceDrop={handlePieceDrop}
      onArrowsChange={setArrows}
      onReturnToLive={() => setViewMoveIndex(null)}
      onCancelPremove={() => { setPremove(null); setSelectedSquare(null); setLegalMoves([]); }}
      onRematch={handleStartGame}
      onNewGame={handleReset}
      onAnalyze={gameState.moveHistory.length > 0 ? handleAnalyzeGame : undefined}
      onCloseGameOverModal={() => setShowGameOverModal(false)}
      onMoveClick={handleMoveClick}
      onResign={handleResign}
      showGuide={showGuide}
      onShowGuide={() => setShowGuide(true)}
      onCloseGuide={() => setShowGuide(false)}
    />
  );
}
