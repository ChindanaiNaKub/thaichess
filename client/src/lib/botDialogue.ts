import {
  getBotDialogueRules,
  type BotDialogueCategory,
  type BotDialogueTrigger,
  type BotPersona,
} from '@shared/botPersonas';
import { getBotDialoguePack, type BotDialogueLocale } from '@shared/botDialogueCatalog';
import type { GameState, Move, PieceColor, PieceType } from '@shared/types';

export interface BotChatMessage {
  id: string;
  text: string;
  category: BotDialogueCategory;
  lineKey: string;
  phase: 'opening' | 'middlegame' | 'endgame';
}

export interface BotChatHistory {
  lastChatMoveCount: number;
  lastChatAt: number;
  recentLineKeys: string[];
  hasActiveMessage: boolean;
  hasPendingMessage: boolean;
}

export interface BotChatDecision {
  message: BotChatMessage;
  delayMs: number;
  displayMs: number;
  trigger: BotDialogueTrigger;
  expectedMoveCount: number;
  force?: boolean;
}

interface MoveDialogueContext {
  persona: BotPersona;
  locale: BotDialogueLocale;
  previousState: GameState;
  nextState: GameState;
  botColor: PieceColor;
  history: BotChatHistory;
  trigger: 'after_player_move' | 'after_bot_move';
}

const PIECE_VALUES: Record<PieceType, number> = {
  K: 0,
  R: 500,
  N: 300,
  S: 250,
  M: 200,
  PM: 200,
  P: 100,
};

function randomBetween(minMs: number, maxMs: number): number {
  if (maxMs <= minMs) {
    return minMs;
  }

  return minMs + Math.round(Math.random() * (maxMs - minMs));
}

function createMessage(
  text: string,
  category: BotDialogueCategory,
  lineKey: string,
  phase: 'opening' | 'middlegame' | 'endgame',
): BotChatMessage {
  return {
    id: `${category}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    category,
    lineKey,
    phase,
  };
}

function getBubbleDisplayDurationMs(text: string): number {
  return Math.max(4000, Math.min(7000, 4000 + Math.round(text.trim().length * 55)));
}

function getLastMove(state: GameState): Move | null {
  return state.moveHistory.at(-1) ?? null;
}

function getNonPawnMaterial(board: GameState['board']): number {
  let total = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.type === 'K' || piece.type === 'P') continue;
      total += PIECE_VALUES[piece.type];
    }
  }

  return total;
}

function getGamePhase(state: GameState): 'opening' | 'middlegame' | 'endgame' {
  if (state.moveHistory.length < 10) {
    return 'opening';
  }

  return getNonPawnMaterial(state.board) <= 1700 ? 'endgame' : 'middlegame';
}

function getCapturedValue(move: Move | null): number {
  if (!move?.captured) return 0;
  return PIECE_VALUES[move.captured.type];
}

function canSpeak(
  persona: BotPersona,
  history: BotChatHistory,
  moveCount: number,
  requiredGap: number,
): boolean {
  const rules = getBotDialogueRules(persona);
  const enoughMovesPassed = moveCount - history.lastChatMoveCount >= requiredGap;
  const enoughTimePassed = Date.now() - history.lastChatAt >= rules.minSilenceMs;

  return enoughMovesPassed
    && enoughTimePassed
    && !history.hasActiveMessage
    && !history.hasPendingMessage;
}

function pickLine(
  persona: BotPersona,
  locale: BotDialogueLocale,
  category: BotDialogueCategory,
  phase: 'opening' | 'middlegame' | 'endgame',
  recentLineKeys: readonly string[],
): BotChatMessage | null {
  const lines = getBotDialoguePack(persona, locale)[category];
  if (!lines.length) return null;

  const candidates = lines
    .map((text, index) => ({ text, lineKey: `${category}:${index}` }))
    .filter((line) => !recentLineKeys.includes(line.lineKey));
  const pool = candidates.length > 0 ? candidates : lines.map((text, index) => ({ text, lineKey: `${category}:${index}` }));
  const picked = pool[Math.floor(Math.random() * pool.length)];

  if (!picked) return null;
  return createMessage(picked.text, category, picked.lineKey, phase);
}

function buildDecision(
  persona: BotPersona,
  locale: BotDialogueLocale,
  category: BotDialogueCategory,
  trigger: BotDialogueTrigger,
  phase: 'opening' | 'middlegame' | 'endgame',
  recentLineKeys: readonly string[],
  expectedMoveCount: number,
  force: boolean = false,
): BotChatDecision | null {
  const message = pickLine(persona, locale, category, phase, recentLineKeys);
  if (!message) return null;

  const rules = getBotDialogueRules(persona);
  const timing = rules.timing[trigger];

  return {
    message,
    delayMs: randomBetween(timing.minMs, timing.maxMs),
    displayMs: Math.max(rules.displayMs, getBubbleDisplayDurationMs(message.text)),
    trigger,
    expectedMoveCount,
    force,
  };
}

function getPhaseChance(
  persona: BotPersona,
  phase: 'opening' | 'middlegame' | 'endgame',
  baseChance: number,
): number {
  const rules = getBotDialogueRules(persona);
  return Math.min(0.8, baseChance * rules.phaseWeight[phase]);
}

export function getThinkingTriggerDelayMs(persona: BotPersona): number {
  const window = getBotDialogueRules(persona).timing.long_think;
  return randomBetween(window.minMs, window.maxMs);
}

export function createBotIntroDecision(
  persona: BotPersona,
  locale: BotDialogueLocale,
  history: BotChatHistory,
): BotChatDecision | null {
  if (history.hasActiveMessage || history.hasPendingMessage) {
    return null;
  }

  return buildDecision(persona, locale, 'intro', 'intro', 'opening', history.recentLineKeys, 0, true);
}

export function createBotOutcomeDecision(
  persona: BotPersona,
  locale: BotDialogueLocale,
  state: GameState,
  botColor: PieceColor,
  history: BotChatHistory,
): BotChatDecision | null {
  const phase = getGamePhase(state);

  if (state.winner === botColor) {
    return buildDecision(persona, locale, 'victory', 'outcome', phase, history.recentLineKeys, state.moveHistory.length, true);
  }

  if (state.winner && state.winner !== botColor) {
    return buildDecision(persona, locale, 'defeat', 'outcome', phase, history.recentLineKeys, state.moveHistory.length, true);
  }

  return buildDecision(persona, locale, 'endgame', 'outcome', phase, history.recentLineKeys, state.moveHistory.length, true);
}

export function maybeCreateThinkingDecision(
  persona: BotPersona,
  locale: BotDialogueLocale,
  moveCount: number,
  history: BotChatHistory,
): BotChatDecision | null {
  const rules = getBotDialogueRules(persona);
  if (!canSpeak(persona, history, moveCount, rules.cooldownPlies)) {
    return null;
  }

  if (Math.random() >= getPhaseChance(persona, moveCount < 10 ? 'opening' : 'middlegame', rules.triggerChance.longThink * 1.1)) {
    return null;
  }

  return buildDecision(persona, locale, 'thinking', 'long_think', moveCount < 10 ? 'opening' : 'middlegame', history.recentLineKeys, moveCount);
}

export function maybeCreateMoveDialogue({
  persona,
  locale,
  previousState,
  nextState,
  botColor,
  history,
  trigger,
}: MoveDialogueContext): BotChatDecision | null {
  const moveCount = nextState.moveHistory.length;
  const lastMove = getLastMove(nextState);
  const capturedValue = getCapturedValue(lastMove);
  const phase = getGamePhase(nextState);
  const boardShifted = previousState.moveHistory.length !== nextState.moveHistory.length;
  const rules = getBotDialogueRules(persona);
  const isMajorTacticalMoment = nextState.isCheck || capturedValue >= 250;
  const isSurpriseMoment = capturedValue >= rules.surpriseCaptureValue || (phase === 'opening' && capturedValue >= 250);
  const isEndgameTension = phase === 'endgame' && (moveCount >= 18 || Boolean(nextState.counting));
  const requiredGap = (isMajorTacticalMoment || isSurpriseMoment || isEndgameTension)
    ? rules.majorCooldownPlies
    : rules.cooldownPlies;

  if (!boardShifted || !canSpeak(persona, history, moveCount, requiredGap)) {
    return null;
  }

  if (trigger === 'after_player_move') {
    if (isMajorTacticalMoment && Math.random() < getPhaseChance(persona, phase, rules.triggerChance.playerTactical * 1.18)) {
      return buildDecision(persona, locale, 'praise', 'player_tactical', phase, history.recentLineKeys, moveCount);
    }

    if (isSurpriseMoment && Math.random() < getPhaseChance(persona, phase, rules.triggerChance.playerSurprise * 1.12)) {
      return buildDecision(persona, locale, 'reaction', 'player_surprise', phase, history.recentLineKeys, moveCount);
    }

    return null;
  }

  if (isMajorTacticalMoment && Math.random() < getPhaseChance(persona, phase, rules.triggerChance.botTactical * 1.16)) {
    const category: BotDialogueCategory = nextState.isCheck || capturedValue >= rules.surpriseCaptureValue ? 'pressure' : 'tactical';
    return buildDecision(persona, locale, category, 'bot_tactical', phase, history.recentLineKeys, moveCount);
  }

  if (isEndgameTension && Math.random() < getPhaseChance(persona, phase, rules.triggerChance.endgameTension * 1.18)) {
    return buildDecision(persona, locale, 'endgame', 'endgame_tension', phase, history.recentLineKeys, moveCount);
  }

  return null;
}
