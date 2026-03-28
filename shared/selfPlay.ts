import { createInitialGameState, getAllPieces, getLegalMoves, makeMove } from './engine';
import { getBotMove, type BotDifficulty } from './botEngine';
import type { GameState, Move, Position } from './types';

export interface SelfPlayOptions {
  whiteDifficulty: BotDifficulty;
  blackDifficulty: BotDifficulty;
  openingRandomPlies: number;
  maxPlies: number;
  seed?: number;
}

export interface SelfPlayGame {
  moves: Move[];
  moveCount: number;
  result: 'white' | 'black' | 'draw';
  resultReason: string;
  whiteDifficulty: BotDifficulty;
  blackDifficulty: BotDifficulty;
  openingRandomPlies: number;
  seed: number;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6D2B79F5;
    let next = Math.imul(value ^ (value >>> 15), value | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function getAllLegalMoves(state: GameState): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];

  for (const { pos } of getAllPieces(state.board, state.turn)) {
    for (const target of getLegalMoves(state.board, pos)) {
      moves.push({
        from: { ...pos },
        to: { ...target },
      });
    }
  }

  return moves;
}

function pickOpeningMove(state: GameState, random: () => number): { from: Position; to: Position } | null {
  const legalMoves = getAllLegalMoves(state);
  if (legalMoves.length === 0) return null;

  const scored = legalMoves.map(move => {
    const piece = state.board[move.from.row][move.from.col];
    const target = state.board[move.to.row][move.to.col];
    let score = 1;

    if (target) score += 4;
    if (piece?.type === 'K') score -= 2;
    if (move.to.col >= 2 && move.to.col <= 5 && move.to.row >= 2 && move.to.row <= 5) score += 2;

    return { move, score };
  });

  const totalScore = scored.reduce((sum, entry) => sum + Math.max(1, entry.score), 0);
  let threshold = random() * totalScore;

  for (const entry of scored) {
    threshold -= Math.max(1, entry.score);
    if (threshold <= 0) {
      return entry.move;
    }
  }

  return scored[scored.length - 1]?.move ?? null;
}

export function playSelfPlayGame(options: SelfPlayOptions): SelfPlayGame {
  const seed = options.seed ?? Date.now();
  const random = mulberry32(seed);
  let state = createInitialGameState(0, 0);

  while (!state.gameOver && state.moveCount < options.maxPlies) {
    const move = state.moveCount < options.openingRandomPlies
      ? pickOpeningMove(state, random)
      : getBotMove(state, state.turn === 'white' ? options.whiteDifficulty : options.blackDifficulty);

    if (!move) {
      break;
    }

    const nextState = makeMove(state, move.from, move.to);
    if (!nextState) {
      break;
    }

    state = nextState;
  }

  const result = state.winner ?? 'draw';
  const resultReason = state.gameOver
    ? state.resultReason ?? 'game_over'
    : state.moveCount >= options.maxPlies
      ? 'max_plies'
      : 'stopped';

  return {
    moves: state.moveHistory,
    moveCount: state.moveCount,
    result,
    resultReason,
    whiteDifficulty: options.whiteDifficulty,
    blackDifficulty: options.blackDifficulty,
    openingRandomPlies: options.openingRandomPlies,
    seed,
  };
}
