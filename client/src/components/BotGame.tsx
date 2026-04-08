import { useState, useCallback, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { BOT_PERSONAS, DEFAULT_BOT_PERSONA_ID, getBotDialogueRules, getBotPersonaById } from '@shared/botPersonas';
import { getBotPublicStrengthLabel } from '@shared/botEngine';
import { formatBotEstimatedEloRange } from '@shared/botEstimatedElo';
import { getBotDialoguePack } from '@shared/botDialogueCatalog';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import {
  getLegalMoves, makeMove, createInitialGameState, createInitialBoard, getBoardAtMove, getLastMoveForView,
  startCounting, stopCounting, hasAnyLegalMoves, isInCheck,
} from '@shared/engine';
import { buildInlineAnalysisRoute, requestBotMove } from '../lib/analysis';
import { usePostGameReview } from '../hooks/usePostGameReview';
import { useReviewEngineAnalysis } from '../hooks/useReviewEngineAnalysis';
import {
  createBotIntroDecision,
  createBotOutcomeDecision,
  getThinkingTriggerDelayMs,
  maybeCreateMoveDialogue,
  maybeCreateThinkingDecision,
  type BotChatDecision,
  type BotChatMessage,
  type BotChatHistory,
} from '../lib/botDialogue';
import { requestLocalBotMove } from '../lib/localBot';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';
import { useToast } from '../lib/toast';
import { getCapturedSummary } from '../lib/capturedSummary';
import { useSaveBotGameMutation } from '../queries/botGames';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import BotAvatar from './BotAvatar';
import BotCard from './BotCard';
import MobileBotCarousel from './MobileBotCarousel';
import MobileBottomSheet from './MobileBottomSheet';
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
import PostGameReviewPanel from './PostGameReviewPanel';

// Map bot IDs to i18n translation keys
const BOT_ID_TO_I18N_KEY: Record<string, string> = {
  'saman-noi': 'saman_noi',
  'mae-mali': 'mae_mali',
  'krailert': 'krailert',
  'phra-suman': 'panya_suman',
  'mae-saeng': 'mekhala_saeng',
  'khun-intharat': 'kiet_intharat',
  'muen-rattanak': 'marut_rattanak',
  'luang-prasert': 'laksit_prasert',
  'chao-surasi': 'chanin_surasi',
  'lady-busaba': 'lalin_busaba',
};

// Helper function to get translated bot content (hook version for component use)
function useBotTranslation(t: (key: string) => string, botId: string) {
  const i18nKey = BOT_ID_TO_I18N_KEY[botId] || botId;

  return {
    backstory: t(`bot.${i18nKey}.backstory`) || '',
    hook: t(`bot.${i18nKey}.hook`) || '',
    opening: t(`bot.${i18nKey}.opening`) || '',
    signature: t(`bot.${i18nKey}.signature`) || '',
    tactical: t(`bot.${i18nKey}.tactical`) || '',
    weakness: t(`bot.${i18nKey}.weakness`) || '',
    chatStyle: t(`bot.${i18nKey}.chat_style`) || '',
  };
}

// Helper function to get a single translated field (for use in loops)
function getBotTranslation(t: (key: string) => string, botId: string, field: string): string {
  const i18nKey = BOT_ID_TO_I18N_KEY[botId] || botId;
  return t(`bot.${i18nKey}.${field}`) || '';
}

const DEFAULT_PLAY_TIME_MS = 10 * 60 * 1000;
const DEFAULT_BOT_REQUEST_TIMEOUT_MS = 2500;
const LEVEL10_BOT_REQUEST_TIMEOUT_MS = 5500;
const BOT_GAME_TIME_CONTROL = {
  initial: DEFAULT_PLAY_TIME_MS / 1000,
  increment: 0,
};

type SideChoice = PieceColor | 'random';

function createBotGameId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `bot_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getBotRequestTimeoutMs(level: number): number {
  return level >= 10 ? LEVEL10_BOT_REQUEST_TIMEOUT_MS : DEFAULT_BOT_REQUEST_TIMEOUT_MS;
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
  const [botThinking, setBotThinking] = useState(false);
  const [botChat, setBotChat] = useState<BotChatMessage | null>(null);
  const [botChatFading, setBotChatFading] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRequestAbortRef = useRef<AbortController | null>(null);
  const pendingBotChatRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botChatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botChatFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botThinkingLineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRequestIdRef = useRef(0);
  const gameStateRef = useRef(gameState);
  const previousGameStateRef = useRef(gameState);
  const moveCountRef = useRef(gameState.moveHistory.length);
  const lastBotChatMoveCountRef = useRef(-99);
  const lastBotChatAtRef = useRef(-100000);
  const botChatVisibleUntilRef = useRef(-100000);
  const recentBotLineKeysRef = useRef<string[]>([]);
  const activeBotChatRef = useRef<BotChatMessage | null>(null);
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
  const isBotGame = true;
  const isPlayerTurn = gameState.turn === playerColor;
  const playerDisplayName = user?.username?.trim()
    || user?.email.split('@')[0]?.trim()
    || 'Anonymous';
  const botName = selectedBot.name;
  const setupIntroPreview = getBotDialoguePack(selectedBot, lang).intro[0] ?? selectedBot.flavorIntroLine;

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

  useEffect(() => {
    activeBotChatRef.current = botChat;
  }, [botChat]);

  const clearPendingBotChat = useCallback(() => {
    if (pendingBotChatRef.current) {
      clearTimeout(pendingBotChatRef.current);
      pendingBotChatRef.current = null;
    }
  }, []);

  const buildBotChatHistory = useCallback((): BotChatHistory => ({
    lastChatMoveCount: lastBotChatMoveCountRef.current,
    lastChatAt: lastBotChatAtRef.current,
    recentLineKeys: recentBotLineKeysRef.current,
    hasActiveMessage: activeBotChatRef.current !== null,
    hasPendingMessage: pendingBotChatRef.current !== null,
  }), []);

  const showBotChat = useCallback((message: BotChatMessage, moveCount: number, displayMs: number) => {
    if (botChatTimeoutRef.current) {
      clearTimeout(botChatTimeoutRef.current);
      botChatTimeoutRef.current = null;
    }
    if (botChatFadeTimeoutRef.current) {
      clearTimeout(botChatFadeTimeoutRef.current);
      botChatFadeTimeoutRef.current = null;
    }

    setBotChatFading(false);
    setBotChat(message);
    lastBotChatMoveCountRef.current = moveCount;
    lastBotChatAtRef.current = Date.now();
    botChatVisibleUntilRef.current = Date.now() + displayMs;
    recentBotLineKeysRef.current = [
      ...recentBotLineKeysRef.current,
      message.lineKey,
    ].slice(-getBotDialogueRules(selectedBot).recentLineWindow);
    botChatTimeoutRef.current = setTimeout(() => {
      setBotChatFading(true);
      botChatFadeTimeoutRef.current = setTimeout(() => {
        setBotChat((current) => (current?.id === message.id ? null : current));
        setBotChatFading(false);
        botChatFadeTimeoutRef.current = null;
      }, 320);
      botChatTimeoutRef.current = null;
    }, displayMs);
  }, [selectedBot]);

  const queueBotChat = useCallback((decision: BotChatDecision | null) => {
    if (!decision) {
      return;
    }

    const now = Date.now();
    const remainingVisibleMs = Math.max(0, botChatVisibleUntilRef.current - now);

    if (!decision.force && pendingBotChatRef.current) {
      return;
    }

    if (decision.force) {
      clearPendingBotChat();
    }

    if (!decision.force && activeBotChatRef.current && remainingVisibleMs > 0) {
      return;
    }

    const scheduledDelayMs = decision.force
      ? decision.delayMs + remainingVisibleMs
      : Math.max(decision.delayMs, remainingVisibleMs);

    pendingBotChatRef.current = setTimeout(() => {
      pendingBotChatRef.current = null;

      if (!gameStarted) {
        return;
      }

      if (!decision.force && gameStateRef.current.moveHistory.length !== decision.expectedMoveCount) {
        return;
      }

      showBotChat(decision.message, decision.expectedMoveCount, decision.displayMs);
    }, scheduledDelayMs);
  }, [clearPendingBotChat, gameStarted, showBotChat]);

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
    return () => {
      clearPendingBotChat();
      if (botChatTimeoutRef.current) clearTimeout(botChatTimeoutRef.current);
      if (botChatFadeTimeoutRef.current) clearTimeout(botChatFadeTimeoutRef.current);
      if (botThinkingLineTimeoutRef.current) clearTimeout(botThinkingLineTimeoutRef.current);
    };
  }, [clearPendingBotChat]);

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
      }, getBotRequestTimeoutMs(botLevel));

      try {
        const result = await requestBotMove(requestedState, botLevel, {
          signal: controller.signal,
          botId: selectedBot.id,
        });
        botMove = result.move;
      } catch {
        botMove = await requestLocalBotMove(requestedState, botLevel, selectedBot.id);
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
        const fallbackMove = await requestLocalBotMove(currentState, botLevel, selectedBot.id);
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
    botLevel,
    gameStarted,
    gameState.board,
    gameState.counting,
    gameState.gameOver,
    gameState.moveHistory.length,
    gameState.turn,
    isPlayerTurn,
    selectedBot.id,
  ]);

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
      if (gameState.gameOver) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          review.stepBackward();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          review.stepForward();
        } else if (e.key === 'Home') {
          e.preventDefault();
          review.jumpToStart();
        } else if (e.key === 'End') {
          e.preventDefault();
          review.jumpToEnd();
        }
        return;
      }

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
  }, [gameState, review, viewMoveIndex]);

  useEffect(() => {
    if (!gameStarted) {
      previousGameStateRef.current = gameState;
      return;
    }

    const previousState = previousGameStateRef.current;

    if (gameState.gameOver && !previousState.gameOver) {
      queueBotChat(createBotOutcomeDecision(selectedBot, lang, gameState, botColor, buildBotChatHistory()));
      previousGameStateRef.current = gameState;
      return;
    }

    if (gameState.moveHistory.length > previousState.moveHistory.length) {
      const actorColor: PieceColor = gameState.turn === 'white' ? 'black' : 'white';
      const dialogue = maybeCreateMoveDialogue({
        persona: selectedBot,
        locale: lang,
        previousState,
        nextState: gameState,
        botColor,
        history: buildBotChatHistory(),
        trigger: actorColor === botColor ? 'after_bot_move' : 'after_player_move',
      });

      if (dialogue) {
        queueBotChat(dialogue);
      }
    }

    previousGameStateRef.current = gameState;
  }, [botColor, buildBotChatHistory, gameStarted, gameState, queueBotChat, selectedBot]);

  useEffect(() => {
    if (botThinkingLineTimeoutRef.current) {
      clearTimeout(botThinkingLineTimeoutRef.current);
      botThinkingLineTimeoutRef.current = null;
    }

    if (!gameStarted || !botThinking || gameState.gameOver) {
      return;
    }

    botThinkingLineTimeoutRef.current = setTimeout(() => {
      const dialogue = maybeCreateThinkingDecision(
        selectedBot,
        lang,
        gameStateRef.current.moveHistory.length,
        buildBotChatHistory(),
      );

      if (dialogue && gameStateRef.current.turn === botColor && !gameStateRef.current.gameOver) {
        queueBotChat(dialogue);
      }
    }, getThinkingTriggerDelayMs(selectedBot));

    return () => {
      if (botThinkingLineTimeoutRef.current) {
        clearTimeout(botThinkingLineTimeoutRef.current);
        botThinkingLineTimeoutRef.current = null;
      }
    };
  }, [botColor, botThinking, buildBotChatHistory, gameStarted, gameState.gameOver, queueBotChat, selectedBot]);

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
    clearPendingBotChat();
    const resolvedColor: PieceColor = sideChoice === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : sideChoice;
    const freshState = createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS);

    if (botThinkingLineTimeoutRef.current) {
      clearTimeout(botThinkingLineTimeoutRef.current);
      botThinkingLineTimeoutRef.current = null;
    }

    setPlayerColor(resolvedColor);
    setGameState(freshState);
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
    previousGameStateRef.current = freshState;
    recentBotLineKeysRef.current = [];
    lastBotChatMoveCountRef.current = -99;
    lastBotChatAtRef.current = -100000;
    botChatVisibleUntilRef.current = -100000;
    setBotChat(null);
    setBotChatFading(false);
    queueBotChat(createBotIntroDecision(selectedBot, lang, buildBotChatHistory()));
  };

  const handleReset = () => {
    clearPendingBotRequest();
    clearPendingBotChat();
    if (botThinkingLineTimeoutRef.current) {
      clearTimeout(botThinkingLineTimeoutRef.current);
      botThinkingLineTimeoutRef.current = null;
    }
    if (botChatTimeoutRef.current) {
      clearTimeout(botChatTimeoutRef.current);
      botChatTimeoutRef.current = null;
    }
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
    setBotChat(null);
    setBotChatFading(false);
    lastBotChatMoveCountRef.current = -99;
    lastBotChatAtRef.current = -100000;
    botChatVisibleUntilRef.current = -100000;
    recentBotLineKeysRef.current = [];
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
    return getLastMoveForView(gameState, viewMoveIndex);
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

  const reviewActive = gameState.gameOver;
  const reviewMode = review.mode;
  const reviewIsViewingHistory = reviewMode === 'analysis'
    || review.selectedMainLineMoveIndex !== gameState.moveHistory.length - 1;
  const isViewingHistory = reviewActive
    ? reviewIsViewingHistory
    : viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1;
  const sideChoiceLabel = sideChoice === 'random'
    ? t('bot.random')
    : t(sideChoice === 'white' ? 'common.white' : 'common.black');
  const difficultyLabel = getBotPublicStrengthLabel(selectedBot.engine.level);
  const levelLabel = t('bot.level_short', { level: botLevel });
  const estimatedEloLabel = t('bot.estimated_elo_range', { range: formatBotEstimatedEloRange(botLevel) });

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header subtitle={t('bot.title')} />

        <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-6xl animate-slideUp">
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
                  <div className="grid min-w-[18rem] grid-cols-2 gap-2 self-start rounded-2xl border border-surface-hover/80 bg-surface/55 p-2">
                    <div className="rounded-xl bg-surface-alt px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.selected_bot')}</div>
                      <div className="mt-1 text-sm font-semibold text-text-bright">{selectedBot.name}</div>
                      <div className="text-xs text-text-dim">{selectedBot.title}</div>
                    </div>
                    <div className="rounded-xl bg-surface-alt px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.level_label')}</div>
                      <div className="mt-1 text-sm font-semibold text-text-bright">{levelLabel}</div>
                      <div className="text-xs text-text-dim">{estimatedEloLabel}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout: Grid with sticky sidebar */}
              <div className="hidden lg:grid gap-6 px-5 py-5 sm:px-7 sm:py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
                {/* Bot Roster - Left Column */}
                <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 p-4 sm:p-5">
                  <label className="mb-3 block text-sm font-medium text-text-dim">{t('bot.roster')}</label>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {BOT_PERSONAS.map((persona, index) => (
                      <BotCard
                        key={persona.id}
                        persona={persona}
                        isSelected={selectedBot.id === persona.id}
                        onSelect={() => setSelectedBotId(persona.id)}
                        t={t}
                        getBotTranslation={(botId, field) => getBotTranslation(t, botId, field)}
                        index={index}
                      />
                    ))}
                  </div>
                </div>

                {/* Detail Panel - Right Column (Sticky) */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                  {/* Main Action Card - Always Visible */}
                  <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-surface/60 to-primary/5 p-5 shadow-lg">
                    {/* Bot Header */}
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 transition-all duration-500 animate-wake-up">
                        <BotAvatar 
                          avatar={selectedBot.avatar} 
                          size={72} 
                          className="ring-2 ring-primary/20 animate-breathe" 
                        />
                      </div>
                      <div className="min-w-0 flex-1 transition-all duration-300">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{t('bot.featured_opponent')}</div>
                        <h3 className="mt-1 text-xl font-bold text-text-bright transition-all duration-300 animate-content-fade">{selectedBot.name}</h3>
                        <p className="text-xs text-text-dim truncate transition-all duration-300">{selectedBot.title}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">{levelLabel}</span>
                          <span className="text-[10px] text-text-dim">{difficultyLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tagline */}
                    <p className="mt-4 text-sm font-medium text-text italic animate-content-fade" key={selectedBot.id}>
                      "{selectedBotTranslation.hook || selectedBot.personalityHook}"
                    </p>

                    {/* Side Selection */}
                    <div className="mt-4">
                      <label className="mb-2 block text-xs font-medium text-text-dim">{t('bot.play_as')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setSideChoice('white')}
                          className={`rounded-xl border px-2 py-3 font-medium transition-all flex flex-col items-center gap-1 ${
                            sideChoice === 'white'
                              ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                              : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                          }`}
                        >
                          <PieceSVG type="K" color="white" size={28} />
                          <span className="text-xs">{t('common.white')}</span>
                        </button>
                        <button
                          onClick={() => setSideChoice('random')}
                          className={`rounded-xl border px-2 py-3 font-medium transition-all flex flex-col items-center gap-1 ${
                            sideChoice === 'random'
                              ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                              : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                          }`}
                        >
                          <span className="text-xl">🎲</span>
                          <span className="text-xs">{t('bot.random')}</span>
                        </button>
                        <button
                          onClick={() => setSideChoice('black')}
                          className={`rounded-xl border px-2 py-3 font-medium transition-all flex flex-col items-center gap-1 ${
                            sideChoice === 'black'
                              ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                              : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                          }`}
                        >
                          <PieceSVG type="K" color="black" size={28} />
                          <span className="text-xs">{t('common.black')}</span>
                        </button>
                      </div>
                    </div>

                    {/* PLAY NOW Button - Primary Action */}
                    <button
                      onClick={handleStartGame}
                      data-testid="start-game-button"
                      className="mt-4 w-full rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-[0_8px_24px_rgba(92,160,26,0.35)] transition-all hover:bg-primary-light hover:shadow-[0_12px_32px_rgba(92,160,26,0.45)] hover:scale-[1.02] active:scale-[0.98] active:translate-y-[1px] flex items-center justify-center gap-2 animate-play-pulse group"
                    >
                      <span className="transition-transform group-hover:translate-x-0.5">▶</span>
                      <span>{t('bot.start')}</span>
                    </button>

                    {/* ELO Note */}
                    <p className="mt-3 text-center text-[11px] leading-4 text-text-dim">
                      {t('bot.estimated_elo_note')}
                    </p>
                  </div>

                  {/* Expandable Bot Details */}
                  <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 overflow-hidden">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="w-full px-4 py-3 text-sm font-medium text-text hover:bg-surface-hover transition-all duration-200 flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`}>▶</span>
                        {t('bot.learn_more')} {selectedBot.name}
                      </span>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        showDetails ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 pb-4 border-t border-surface-hover/50">
                        <p className="mt-3 text-sm leading-6 text-text animate-content-fade">{selectedBotTranslation.backstory || selectedBot.shortBackstory}</p>
                        <div className="mt-4 grid gap-3 text-sm text-text-dim">
                          <div className="animate-content-fade" style={{ animationDelay: '0.05s' }}>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.opening_preference')}</div>
                            <div className="mt-1 text-text">{selectedBotTranslation.opening || selectedBot.openingPreference}</div>
                          </div>
                          <div className="animate-content-fade" style={{ animationDelay: '0.1s' }}>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.signature_style')}</div>
                            <div className="mt-1 text-text">{selectedBotTranslation.signature || selectedBot.signatureStyle}</div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="animate-content-fade" style={{ animationDelay: '0.15s' }}>
                              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.tactical_bias')}</div>
                              <div className="mt-1 text-text">{selectedBotTranslation.tactical || selectedBot.tacticalBias}</div>
                            </div>
                            <div className="animate-content-fade" style={{ animationDelay: '0.2s' }}>
                              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.strategic_weakness')}</div>
                              <div className="mt-1 text-text">{selectedBotTranslation.weakness || selectedBot.strategicWeakness}</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1.5 animate-content-fade" style={{ animationDelay: '0.25s' }}>
                          {selectedBot.personalityTraits.map((trait, idx) => (
                            <span 
                              key={trait} 
                              className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-[11px] text-text-dim"
                              style={{ animationDelay: `${0.25 + idx * 0.05}s` }}
                            >
                              {t(`bot.trait.${trait}`) || trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dialogue Preview Card */}
                  <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 p-4 sm:p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.dialogue_preview')}</div>
                    <p className="mt-2 text-sm italic text-text">"{setupIntroPreview}"</p>
                    <div className="mt-3 text-xs leading-6 text-text-dim">{selectedBotTranslation.chatStyle || selectedBot.chatStyle}</div>
                    <div className="mt-4 border-t border-surface-hover/70 pt-4">
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

              {/* Mobile Layout: Horizontal Carousel + Bottom Sheet */}
              <div className="lg:hidden">
                <div className="px-4 py-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/85 mb-2">
                    {t('home.play_bot')}
                  </p>
                  <h2 className="text-2xl font-bold text-text-bright">{t('bot.setup_title')}</h2>
                  <p className="mt-2 text-sm text-text-dim">
                    {t('bot.setup_desc')}
                  </p>
                </div>

                <div className="mt-4">
                  <MobileBotCarousel
                    personas={BOT_PERSONAS}
                    selectedId={selectedBot.id}
                    onSelect={setSelectedBotId}
                    t={t}
                    getBotTranslation={(botId, field) => getBotTranslation(t, botId, field)}
                  />
                </div>

                {/* Spacer for bottom sheet */}
                <div className="h-[420px]" />
              </div>
          </div>
          </div>
        </main>

        {/* Mobile Bottom Sheet - Fixed at bottom */}
        <div className="lg:hidden">
          <MobileBottomSheet
            bot={selectedBot}
            sideChoice={sideChoice}
            onSideChange={setSideChoice}
            onPlay={handleStartGame}
            onBack={() => navigate('/')}
            t={t}
            botTranslation={selectedBotTranslation}
            levelLabel={levelLabel}
            difficultyLabel={difficultyLabel}
            _estimatedEloLabel={estimatedEloLabel}
            _showDetails={showDetails}
            _onToggleDetails={() => setShowDetails(!showDetails)}
            setupIntroPreview={setupIntroPreview}
          />
        </div>
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
    <>
      <InGameShell
        onHome={() => navigate('/')}
        headerMeta={
          <>
            <AppearanceSettingsButton compact />
            <span className="hidden md:inline">{t('bot.vs_bot')}</span>
            <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] bg-surface text-text-dim border border-surface-hover">
              {levelLabel}
            </span>
            <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] bg-surface text-text-dim border border-surface-hover">
              {difficultyLabel}
            </span>
          </>
        }
        topPanel={
          <Clock
            time={botColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === botColor && !gameState.gameOver}
            color={botColor}
            playerName={botName}
            botAvatar={selectedBot.avatar}
            subtitle={botClockSubtitle}
            capturedPieces={botCaptureSummary.pieces}
            materialDelta={botCaptureSummary.material}
            showTimer={!isBotGame}
          />
        }
        board={
          <BoardErrorBoundary onRetry={() => window.location.reload()}>
            <Board
              board={reviewActive ? review.currentState.board : getDisplayBoard()}
              playerColor={playerColor}
              draggableColor={reviewActive && reviewMode === 'analysis' ? review.currentState.turn : undefined}
              isMyTurn={reviewActive ? reviewMode === 'analysis' : isPlayerTurn && !botThinking}
              legalMoves={reviewActive ? review.legalMoves : isViewingHistory ? [] : legalMoves}
              selectedSquare={reviewActive ? review.selectedSquare : isViewingHistory ? null : selectedSquare}
              lastMove={reviewActive ? review.currentLastMove : getLastMove()}
              isCheck={reviewActive ? review.currentState.isCheck : isViewingHistory ? false : gameState.isCheck}
              checkSquare={reviewActive ? review.currentCheckSquare : getCheckSquare()}
              onSquareClick={reviewActive ? review.handleSquareClick : handleSquareClick}
              onPieceDrop={reviewActive ? review.handlePieceDrop : handlePieceDrop}
              disabled={reviewActive ? reviewMode !== 'analysis' : isViewingHistory || (gameState.gameOver && !isViewingHistory)}
              premove={reviewActive ? null : premove}
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
            showTimer={!isBotGame}
          />
        }
        statusText={statusText}
        moveCount={moveCount}
        isViewingHistory={isViewingHistory}
        showCheckBadge={reviewActive ? review.currentState.isCheck : gameState.isCheck}
        toolbar={
          <>
            {!reviewActive && isViewingHistory && (
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
            <div className="rounded-[1.35rem] border border-surface-hover bg-[radial-gradient(circle_at_top,rgba(173,130,53,0.16),transparent_38%),linear-gradient(180deg,rgba(47,36,28,0.96),rgba(28,22,18,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
              <div className="flex items-start gap-3">
                <BotAvatar avatar={selectedBot.avatar} size={72} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-text-bright">{selectedBot.name}</div>
                  <div className="text-sm text-text-dim">{selectedBot.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                    <span className="rounded-full border border-surface-hover bg-surface px-2 py-1">{levelLabel}</span>
                    <span className="rounded-full border border-surface-hover bg-surface px-2 py-1">{difficultyLabel}</span>
                  </div>
                  <div className="mt-2 text-xs text-text-dim">{estimatedEloLabel}</div>
                </div>
              </div>

              <div className="mt-3 text-sm font-medium text-text">{selectedBotTranslation.hook || selectedBot.personalityHook}</div>
              <div className="mt-2 text-xs leading-6 text-text-dim">{selectedBotTranslation.backstory || selectedBot.shortBackstory}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedBot.personalityTraits.map((trait) => (
                  <span key={trait} className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-[11px] text-text-dim">
                    {t(`bot.trait.${trait}`) || trait}
                  </span>
                ))}
              </div>

              {botChat && (
                <div className="mt-3 flex items-start gap-2.5">
                  <BotAvatar avatar={selectedBot.avatar} size={40} className="shrink-0" />
                  <div className={`min-w-0 flex-1 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-3 py-2.5 text-[13px] leading-5 text-text shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-opacity duration-300 ${botChatFading ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                      {botChat.category === 'thinking'
                        ? t('bot.chat_thinking')
                        : selectedBot.name}
                    </div>
                    <div>{botChat.text}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="font-semibold text-text-bright">{statusText}</div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                  <span>{t('bot.vs_bot')}</span>
                  <span className="rounded-full px-2 py-1 bg-surface text-text-dim border border-surface-hover">
                    {levelLabel}
                  </span>
                  <span className="rounded-full px-2 py-1 bg-surface text-text-dim border border-surface-hover">
                    {difficultyLabel}
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
                  ? handleAnalyzeGame
                  : undefined
                }
              />
            )}

            {reviewActive && (
              <PostGameReviewPanel
                mode={review.mode}
                selectedMainLineMoveIndex={review.selectedMainLineMoveIndex}
                analysisRootMoveIndex={review.analysisRootMoveIndex}
                analysisLine={review.analysisLine}
                canEnterAnalysis={review.canEnterAnalysis}
                canResetAnalysis={review.canResetAnalysis}
                canStepBackward={review.canStepBackward}
                canStepForward={review.canStepForward}
                onEnterAnalysis={review.enterAnalysis}
                onReturnToMainLine={review.returnToMainLine}
                onResetAnalysis={review.resetAnalysis}
                onStepBackward={review.stepBackward}
                onStepForward={review.stepForward}
                onJumpToStart={review.jumpToStart}
                onJumpToEnd={review.jumpToEnd}
                engineAnalysis={reviewEngine.analysis}
                engineAnalyzing={reviewEngine.analyzing}
                engineError={reviewEngine.error}
              />
            )}

            <MoveHistory
              moves={gameState.moveHistory}
              initialBoard={createInitialBoard()}
              currentMoveIndex={reviewActive ? review.selectedMainLineMoveIndex : viewMoveIndex ?? undefined}
              onMoveClick={reviewActive ? review.jumpToMainLine : handleMoveClick}
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
            ? handleAnalyzeGame
            : undefined
          }
          onClose={() => setShowGameOverModal(false)}
        />
      )}
    </>
  );
}
