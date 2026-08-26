import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { PieceColor, GameState } from '@shared/types';
import { getBotDialogueRules } from '@shared/botPersonas';
import type { BotPersona } from '@shared/botPersonas';
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
import type { Language } from '../lib/i18nRuntime';

const CHAT_FADE_MS = 320;
const NO_CHAT_MOVE_COUNT = -99;
const NO_CHAT_TIMESTAMP = -100000;

interface BotChatDialogueOptions {
  gameStarted: boolean;
  gameStateRef: RefObject<GameState>;
  gameOver: boolean;
  moveCount: number;
  botThinking: boolean;
  selectedBot: BotPersona;
  lang: Language;
  botColor: PieceColor;
}

export function useBotChatDialogue({
  gameStarted,
  gameStateRef,
  gameOver,
  moveCount,
  botThinking,
  selectedBot,
  lang,
  botColor,
}: BotChatDialogueOptions) {
  const [botChat, setBotChat] = useState<BotChatMessage | null>(null);
  const [botChatFading, setBotChatFading] = useState(false);
  const pendingBotChatRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botChatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botChatFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botThinkingLineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBotChatMoveCountRef = useRef(NO_CHAT_MOVE_COUNT);
  const lastBotChatAtRef = useRef(NO_CHAT_TIMESTAMP);
  const botChatVisibleUntilRef = useRef(NO_CHAT_TIMESTAMP);
  const recentBotLineKeysRef = useRef<string[]>([]);
  const activeBotChatRef = useRef<BotChatMessage | null>(null);
  const previousGameStateRef = useRef(gameStateRef.current);
  const gameStartedRef = useRef(gameStarted);
  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);
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
  const showBotChat = useCallback((message: BotChatMessage, messageMoveCount: number, displayMs: number) => {
    if (botChatTimeoutRef.current) { clearTimeout(botChatTimeoutRef.current); botChatTimeoutRef.current = null; }
    if (botChatFadeTimeoutRef.current) { clearTimeout(botChatFadeTimeoutRef.current); botChatFadeTimeoutRef.current = null; }
    setBotChatFading(false);
    setBotChat(message);
    lastBotChatMoveCountRef.current = messageMoveCount;
    lastBotChatAtRef.current = Date.now();
    botChatVisibleUntilRef.current = Date.now() + displayMs;
    recentBotLineKeysRef.current = [...recentBotLineKeysRef.current, message.lineKey].slice(-getBotDialogueRules(selectedBot).recentLineWindow);
    botChatTimeoutRef.current = setTimeout(() => {
      setBotChatFading(true);
      botChatFadeTimeoutRef.current = setTimeout(() => {
        setBotChat((current) => (current?.id === message.id ? null : current));
        setBotChatFading(false);
        botChatFadeTimeoutRef.current = null;
      }, CHAT_FADE_MS);
      botChatTimeoutRef.current = null;
    }, displayMs);
  }, [selectedBot]);
  const queueBotChat = useCallback((decision: BotChatDecision | null) => {
    if (!decision) return;
    const now = Date.now();
    const remainingVisibleMs = Math.max(0, botChatVisibleUntilRef.current - now);
    if (!decision.force && pendingBotChatRef.current) return;
    if (decision.force) clearPendingBotChat();
    if (!decision.force && activeBotChatRef.current && remainingVisibleMs > 0) return;
    const scheduledDelayMs = decision.force ? decision.delayMs + remainingVisibleMs : Math.max(decision.delayMs, remainingVisibleMs);
    clearPendingBotChat();
    pendingBotChatRef.current = setTimeout(() => {
      pendingBotChatRef.current = null;
      if (!gameStartedRef.current) return;
      if (!decision.force && gameStateRef.current.moveHistory.length !== decision.expectedMoveCount) return;
      showBotChat(decision.message, decision.expectedMoveCount, decision.displayMs);
    }, scheduledDelayMs);
  }, [clearPendingBotChat, gameStateRef, showBotChat]);
  const clearTimers = useCallback(() => {
    clearPendingBotChat();
    if (botChatTimeoutRef.current) clearTimeout(botChatTimeoutRef.current);
    if (botChatFadeTimeoutRef.current) clearTimeout(botChatFadeTimeoutRef.current);
    if (botThinkingLineTimeoutRef.current) clearTimeout(botThinkingLineTimeoutRef.current);
  }, [clearPendingBotChat]);
  useEffect(() => () => { clearTimers(); }, [clearTimers]);
  useEffect(() => {
    const previousState = previousGameStateRef.current;
    const currentState = gameStateRef.current;
    if (!gameStarted) { previousGameStateRef.current = currentState; return; }
    if (currentState.gameOver && !previousState.gameOver) {
      queueBotChat(createBotOutcomeDecision(selectedBot, lang, currentState, botColor, buildBotChatHistory()));
      previousGameStateRef.current = currentState; return;
    }
    if (currentState.moveHistory.length > previousState.moveHistory.length) {
      const actorColor: PieceColor = currentState.turn === 'white' ? 'black' : 'white';
      const dialogue = maybeCreateMoveDialogue({ persona: selectedBot, locale: lang, previousState, nextState: currentState, botColor, history: buildBotChatHistory(), trigger: actorColor === botColor ? 'after_bot_move' : 'after_player_move' });
      if (dialogue) queueBotChat(dialogue);
    }
    previousGameStateRef.current = currentState;
  }, [botColor, buildBotChatHistory, gameStarted, gameOver, moveCount, lang, queueBotChat, selectedBot, gameStateRef]);
  useEffect(() => {
    if (botThinkingLineTimeoutRef.current) { clearTimeout(botThinkingLineTimeoutRef.current); botThinkingLineTimeoutRef.current = null; }
    if (!gameStarted || !botThinking || gameOver) return;
    botThinkingLineTimeoutRef.current = setTimeout(() => {
      const dialogue = maybeCreateThinkingDecision(selectedBot, lang, gameStateRef.current.moveHistory.length, buildBotChatHistory());
      if (dialogue && gameStateRef.current.turn === botColor && !gameStateRef.current.gameOver) queueBotChat(dialogue);
    }, getThinkingTriggerDelayMs(selectedBot));
    return () => { if (botThinkingLineTimeoutRef.current) { clearTimeout(botThinkingLineTimeoutRef.current); botThinkingLineTimeoutRef.current = null; } };
  }, [botColor, botThinking, buildBotChatHistory, gameStarted, gameOver, lang, queueBotChat, selectedBot, gameStateRef]);
  const resetBotChat = useCallback((nextState?: GameState) => {
    clearTimers(); setBotChat(null); setBotChatFading(false);
    lastBotChatMoveCountRef.current = NO_CHAT_MOVE_COUNT; lastBotChatAtRef.current = NO_CHAT_TIMESTAMP; botChatVisibleUntilRef.current = NO_CHAT_TIMESTAMP; recentBotLineKeysRef.current = [];
    previousGameStateRef.current = nextState ?? gameStateRef.current;
  }, [clearTimers, gameStateRef]);
  const queueIntro = useCallback(() => {
    const history: BotChatHistory = { lastChatMoveCount: lastBotChatMoveCountRef.current, lastChatAt: lastBotChatAtRef.current, recentLineKeys: recentBotLineKeysRef.current, hasActiveMessage: activeBotChatRef.current !== null, hasPendingMessage: pendingBotChatRef.current !== null };
    const decision = createBotIntroDecision(selectedBot, lang, history);
    if (decision) queueBotChat(decision);
  }, [selectedBot, lang, queueBotChat]);
  return { botChat, botChatFading, queueIntro, resetBotChat };
}
