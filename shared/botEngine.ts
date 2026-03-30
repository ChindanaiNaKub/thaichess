import { Board, PieceColor, PieceType, Position, GameState } from './types';
import { getLegalMoves, makeMove, getAllPieces, isInCheck } from './engine';
import { getBotPersonaById } from './botPersonas';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface ScoredMove {
  from: Position;
  to: Position;
  score: number;
}

interface SearchResult {
  score: number;
  completed: boolean;
}

export interface BotLevelConfig {
  maxDepth: number;
  maxNodes: number;
  maxMs: number;
  rootBreadth: number;
  replyBreadth: number;
  choiceWindow: number;
  randomPickChance: number;
  noise: number;
}

export interface BotSearchOptions {
  maxDepth?: number;
  maxNodes?: number;
  maxMs?: number | null;
  botId?: string;
}

interface SearchContext {
  deadlineAt: number | null;
  maxNodes: number;
  nodes: number;
  timedOut: boolean;
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

const CENTER_BONUS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 5, 5, 5, 5, 5, 5, 0],
  [0, 5, 15, 15, 15, 15, 5, 0],
  [0, 5, 15, 25, 25, 15, 5, 0],
  [0, 5, 15, 25, 25, 15, 5, 0],
  [0, 5, 15, 15, 15, 15, 5, 0],
  [0, 5, 5, 5, 5, 5, 5, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const PAWN_ADVANCE_BONUS_WHITE = [0, 0, 0, 5, 15, 30, 0, 0];
const PAWN_ADVANCE_BONUS_BLACK = [0, 0, 30, 15, 5, 0, 0, 0];

const KING_SAFETY: number[][] = [
  [20, 20, 10, 0, 0, 10, 20, 20],
  [20, 15, 5, 0, 0, 5, 15, 20],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [20, 15, 5, 0, 0, 5, 15, 20],
  [20, 20, 10, 0, 0, 10, 20, 20],
];

const BOT_LEVEL_CONFIGS: readonly BotLevelConfig[] = [
  { maxDepth: 1, maxNodes: 80, maxMs: 25, rootBreadth: 4, replyBreadth: 3, choiceWindow: 4, randomPickChance: 1, noise: 140 },
  { maxDepth: 1, maxNodes: 120, maxMs: 30, rootBreadth: 5, replyBreadth: 4, choiceWindow: 4, randomPickChance: 0.7, noise: 110 },
  { maxDepth: 1, maxNodes: 170, maxMs: 35, rootBreadth: 6, replyBreadth: 4, choiceWindow: 3, randomPickChance: 0.45, noise: 80 },
  { maxDepth: 2, maxNodes: 230, maxMs: 45, rootBreadth: 5, replyBreadth: 4, choiceWindow: 3, randomPickChance: 0.3, noise: 55 },
  { maxDepth: 2, maxNodes: 320, maxMs: 60, rootBreadth: 6, replyBreadth: 4, choiceWindow: 2, randomPickChance: 0.2, noise: 35 },
  { maxDepth: 2, maxNodes: 430, maxMs: 75, rootBreadth: 7, replyBreadth: 5, choiceWindow: 2, randomPickChance: 0.12, noise: 18 },
  { maxDepth: 2, maxNodes: 560, maxMs: 90, rootBreadth: 8, replyBreadth: 5, choiceWindow: 2, randomPickChance: 0.06, noise: 8 },
  { maxDepth: 3, maxNodes: 800, maxMs: 120, rootBreadth: 7, replyBreadth: 5, choiceWindow: 1, randomPickChance: 0, noise: 0 },
  { maxDepth: 3, maxNodes: 1050, maxMs: 150, rootBreadth: 8, replyBreadth: 5, choiceWindow: 1, randomPickChance: 0, noise: 0 },
  { maxDepth: 3, maxNodes: 1350, maxMs: 180, rootBreadth: 9, replyBreadth: 6, choiceWindow: 1, randomPickChance: 0, noise: 0 },
] as const;

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 5;
  return Math.min(10, Math.max(1, Math.round(level)));
}

export function getBotLevelConfig(level: number): BotLevelConfig {
  return BOT_LEVEL_CONFIGS[clampLevel(level) - 1];
}

function evaluateBoard(board: Board, color: PieceColor): number {
  let score = 0;
  const opponent = color === 'white' ? 'black' : 'white';

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type];
      const centerBonus = CENTER_BONUS[row][col];
      let positional = centerBonus;

      if (piece.type === 'P') {
        positional += piece.color === 'white'
          ? PAWN_ADVANCE_BONUS_WHITE[row]
          : PAWN_ADVANCE_BONUS_BLACK[row];
      }

      if (piece.type === 'K') {
        positional = KING_SAFETY[row][col];
      }

      if (piece.type === 'N') {
        positional += centerBonus * 0.5;
      }

      if (piece.color === color) {
        score += value + positional;
      } else {
        score -= value + positional;
      }
    }
  }

  if (isInCheck(board, opponent)) {
    score += 50;
  }
  if (isInCheck(board, color)) {
    score -= 50;
  }

  return score;
}

function getAllMovesForColor(board: Board, color: PieceColor): ScoredMove[] {
  const moves: ScoredMove[] = [];
  const pieces = getAllPieces(board, color);

  for (const { pos } of pieces) {
    const legalMoves = getLegalMoves(board, pos);
    for (const to of legalMoves) {
      moves.push({ from: pos, to, score: 0 });
    }
  }

  return moves;
}

function isMinorPiece(type: PieceType): boolean {
  return type === 'N' || type === 'S' || type === 'M' || type === 'PM';
}

function isEndgameBoard(board: Board): boolean {
  let remainingNonPawnMaterial = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.type === 'K' || piece.type === 'P') continue;
      remainingNonPawnMaterial += PIECE_VALUES[piece.type];
    }
  }

  return remainingNonPawnMaterial <= 1700;
}

function getSquareAttackers(board: Board, color: PieceColor, target: Position): number {
  const pieces = getAllPieces(board, color);
  let attackers = 0;

  for (const { pos } of pieces) {
    const legalMoves = getLegalMoves(board, pos);
    if (legalMoves.some((move) => move.row === target.row && move.col === target.col)) {
      attackers += 1;
    }
  }

  return attackers;
}

function getThreatValue(board: Board, origin: Position, color: PieceColor): number {
  const legalMoves = getLegalMoves(board, origin);
  let threatValue = 0;

  for (const target of legalMoves) {
    const targetPiece = board[target.row][target.col];
    if (!targetPiece || targetPiece.color === color) continue;
    threatValue = Math.max(threatValue, PIECE_VALUES[targetPiece.type]);
  }

  return threatValue;
}

function getDevelopmentScore(board: Board, move: ScoredMove): number {
  const piece = board[move.from.row][move.from.col];
  if (!piece || piece.type === 'K') return 0;

  const homeRow = piece.color === 'white' ? 0 : 7;
  const leavesHomeRow = move.from.row === homeRow && move.to.row !== homeRow;
  const centerGain = Math.max(0, CENTER_BONUS[move.to.row][move.to.col] - CENTER_BONUS[move.from.row][move.from.col]) / 10;

  if (isMinorPiece(piece.type)) {
    return (leavesHomeRow ? 1.2 : 0.35) + centerGain;
  }

  if (piece.type === 'R') {
    return (leavesHomeRow ? 0.8 : 0.2) + centerGain * 0.6;
  }

  if (piece.type === 'P') {
    return Math.max(0, piece.color === 'white' ? move.to.row - move.from.row : move.from.row - move.to.row) * 0.45;
  }

  return centerGain;
}

function getPersonaMoveBonus(
  state: GameState,
  newState: GameState,
  move: ScoredMove,
  botId?: string,
): number {
  if (!botId) return 0;

  const persona = getBotPersonaById(botId);
  const piece = state.board[move.from.row][move.from.col];
  if (!piece) return 0;

  const opponent = piece.color === 'white' ? 'black' : 'white';
  const captured = state.board[move.to.row][move.to.col];
  const endgame = isEndgameBoard(newState.board) ? 1 : 0;
  const opening = isEndgameBoard(state.board) ? 0 : 1;
  const centerGain = (CENTER_BONUS[move.to.row][move.to.col] - CENTER_BONUS[move.from.row][move.from.col]) / 10;
  const development = getDevelopmentScore(state.board, move);
  const pawnAdvance = piece.type === 'P'
    ? Math.max(0, piece.color === 'white' ? move.to.row - move.from.row : move.from.row - move.to.row)
    : 0;
  const originMobility = getLegalMoves(state.board, move.from).length;
  const destinationMobility = getLegalMoves(newState.board, move.to).length;
  const mobilityGain = Math.max(0, destinationMobility - originMobility);
  const threatValue = getThreatValue(newState.board, move.to, piece.color) / 100;
  const attackers = getSquareAttackers(newState.board, opponent, move.to);
  const defenders = getSquareAttackers(newState.board, piece.color, move.to);
  const isHanging = attackers > 0 && defenders === 0;
  const isLoose = attackers > defenders;
  const kingActivity = piece.type === 'K' ? CENTER_BONUS[move.to.row][move.to.col] / 25 : 0;
  const riskTolerance = persona.engine.aggression - persona.engine.caution;
  const moveDistance = Math.abs(move.to.row - move.from.row) + Math.abs(move.to.col - move.from.col);

  let bonus = 0;

  if (captured) {
    bonus += (PIECE_VALUES[captured.type] / 100) * (7 + persona.engine.aggression * 3);
  }
  if (newState.isCheck) {
    bonus += 12 + persona.engine.aggression * 8 + persona.engine.trickiness * 4;
  }

  bonus += centerGain * (4 + persona.engine.development * 3);
  bonus += development * (4 + persona.engine.development * 4);
  bonus += pawnAdvance * (2 + persona.engine.aggression * 1.5);
  bonus += threatValue * (3 + persona.engine.trickiness * 5 + persona.engine.aggression * 2);
  bonus += mobilityGain * (0.6 + persona.engine.development * 0.3);
  bonus += endgame * kingActivity * persona.engine.endgame * 8;
  bonus += Math.max(0, riskTolerance) * moveDistance * 0.8;

  if (piece.type === 'K' && opening) {
    bonus -= 8 + persona.engine.caution * 7;
  }
  if (isHanging) {
    bonus -= 8 + persona.engine.caution * 9;
    bonus += riskTolerance * 7;
  } else if (isLoose) {
    bonus -= 3 + persona.engine.caution * 4;
    bonus += riskTolerance * 3;
  } else if (defenders > 0) {
    bonus += persona.engine.caution * 1.5;
  }

  return bonus;
}

function getMoveOrderingScore(board: Board, move: ScoredMove): number {
  const captured = board[move.to.row][move.to.col];
  const movingPiece = board[move.from.row][move.from.col];

  let score = CENTER_BONUS[move.to.row][move.to.col];

  if (captured) {
    score += PIECE_VALUES[captured.type] * 12;
  }

  if (movingPiece?.type === 'P') {
    score += movingPiece.color === 'white'
      ? PAWN_ADVANCE_BONUS_WHITE[move.to.row]
      : PAWN_ADVANCE_BONUS_BLACK[move.to.row];
  }

  if (movingPiece?.type === 'K') {
    score -= 12;
  }

  return score;
}

function orderMoves(moves: ScoredMove[], board: Board): ScoredMove[] {
  return moves.sort((a, b) => getMoveOrderingScore(board, b) - getMoveOrderingScore(board, a));
}

function orderRootMoves(moves: ScoredMove[], state: GameState, botId?: string): ScoredMove[] {
  if (!botId) {
    return orderMoves(moves, state.board);
  }

  return [...moves].sort((a, b) => {
    const aState = makeMove(state, a.from, a.to);
    const bState = makeMove(state, b.from, b.to);
    const aScore = getMoveOrderingScore(state.board, a) + (aState ? getPersonaMoveBonus(state, aState, a, botId) : -999999);
    const bScore = getMoveOrderingScore(state.board, b) + (bState ? getPersonaMoveBonus(state, bState, b, botId) : -999999);
    return bScore - aScore;
  });
}

function isBudgetExceeded(context: SearchContext): boolean {
  if (context.timedOut) {
    return true;
  }

  if (context.nodes >= context.maxNodes) {
    context.timedOut = true;
    return true;
  }

  if (context.deadlineAt !== null && Date.now() >= context.deadlineAt) {
    context.timedOut = true;
    return true;
  }

  return false;
}

function getBreadthLimit(profile: BotLevelConfig, ply: number): number {
  if (ply === 0) {
    return profile.rootBreadth;
  }

  const reduction = Math.min(2, ply - 1);
  return Math.max(3, profile.replyBreadth - reduction);
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  botColor: PieceColor,
  context: SearchContext,
  profile: BotLevelConfig,
  ply: number,
): SearchResult {
  if (depth === 0 || state.gameOver) {
    if (state.isCheckmate) {
      return { score: maximizing ? -100000 + (10 - depth) : 100000 - (10 - depth), completed: true };
    }
    if (state.isDraw || state.isStalemate) {
      return { score: 0, completed: true };
    }

    return { score: evaluateBoard(state.board, botColor), completed: true };
  }

  if (isBudgetExceeded(context)) {
    return { score: evaluateBoard(state.board, botColor), completed: false };
  }

  let moves = getAllMovesForColor(state.board, state.turn);
  if (moves.length === 0) {
    if (isInCheck(state.board, state.turn)) {
      return { score: maximizing ? -100000 + (10 - depth) : 100000 - (10 - depth), completed: true };
    }

    return { score: 0, completed: true };
  }

  moves = orderMoves(moves, state.board).slice(0, getBreadthLimit(profile, ply));

  if (maximizing) {
    let maxEval = -Infinity;

    for (const move of moves) {
      if (isBudgetExceeded(context)) {
        return { score: maxEval === -Infinity ? evaluateBoard(state.board, botColor) : maxEval, completed: false };
      }

      context.nodes += 1;
      const newState = makeMove(state, move.from, move.to);
      if (!newState) continue;

      const result = minimax(newState, depth - 1, alpha, beta, false, botColor, context, profile, ply + 1);
      maxEval = Math.max(maxEval, result.score);
      alpha = Math.max(alpha, result.score);

      if (!result.completed) {
        return { score: maxEval === -Infinity ? result.score : maxEval, completed: false };
      }

      if (beta <= alpha) break;
    }

    return { score: maxEval === -Infinity ? evaluateBoard(state.board, botColor) : maxEval, completed: true };
  }

  let minEval = Infinity;

  for (const move of moves) {
    if (isBudgetExceeded(context)) {
      return { score: minEval === Infinity ? evaluateBoard(state.board, botColor) : minEval, completed: false };
    }

    context.nodes += 1;
    const newState = makeMove(state, move.from, move.to);
    if (!newState) continue;

    const result = minimax(newState, depth - 1, alpha, beta, true, botColor, context, profile, ply + 1);
    minEval = Math.min(minEval, result.score);
    beta = Math.min(beta, result.score);

    if (!result.completed) {
      return { score: minEval === Infinity ? result.score : minEval, completed: false };
    }

    if (beta <= alpha) break;
  }

  return { score: minEval === Infinity ? evaluateBoard(state.board, botColor) : minEval, completed: true };
}

function applyDifficultyVariance(moves: ScoredMove[], profile: BotLevelConfig): ScoredMove[] {
  if (moves.length === 0 || profile.noise <= 0) {
    return [...moves];
  }

  return moves.map((move) => ({
    ...move,
    score: move.score + ((Math.random() * 2) - 1) * profile.noise,
  }));
}

function chooseMove(scoredMoves: ScoredMove[], profile: BotLevelConfig): ScoredMove | null {
  if (scoredMoves.length === 0) return null;

  const ranked = applyDifficultyVariance(scoredMoves, profile)
    .sort((a, b) => b.score - a.score);

  if (profile.choiceWindow > 1 && Math.random() < profile.randomPickChance) {
    const pool = ranked.slice(0, Math.min(profile.choiceWindow, ranked.length));
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return ranked[0];
}

function getHeuristicFallbackMove(state: GameState, profile: BotLevelConfig, botId?: string): ScoredMove | null {
  const moves = orderRootMoves(getAllMovesForColor(state.board, state.turn), state, botId)
    .slice(0, Math.max(1, profile.choiceWindow));

  const scoredMoves = moves.map((move) => {
    const newState = makeMove(state, move.from, move.to);
    return {
      ...move,
      score: getMoveOrderingScore(state.board, move) + (newState ? getPersonaMoveBonus(state, newState, move, botId) : 0),
    };
  });

  return chooseMove(scoredMoves, profile);
}

function searchBestMove(
  state: GameState,
  profile: BotLevelConfig,
  options?: BotSearchOptions,
): ScoredMove | null {
  let rootMoves = orderRootMoves(getAllMovesForColor(state.board, state.turn), state, options?.botId);
  if (rootMoves.length === 0) return null;

  const context: SearchContext = {
    deadlineAt: options?.maxMs && options.maxMs > 0 ? Date.now() + options.maxMs : null,
    maxNodes: Math.max(1, Math.round(options?.maxNodes ?? profile.maxNodes)),
    nodes: 0,
    timedOut: false,
  };

  const maxDepth = Math.max(1, Math.round(options?.maxDepth ?? profile.maxDepth));
  let bestMove = getHeuristicFallbackMove(state, profile, options?.botId);
  let bestRootMoves = [...rootMoves];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    if (isBudgetExceeded(context)) break;

    const iterationMoves: ScoredMove[] = [];
    const candidates = bestRootMoves.slice(0, Math.min(bestRootMoves.length, profile.rootBreadth));
    let completed = true;

    for (const move of candidates) {
      if (isBudgetExceeded(context)) {
        completed = false;
        break;
      }

      context.nodes += 1;
      const newState = makeMove(state, move.from, move.to);
      if (!newState) continue;

      const result = minimax(newState, depth - 1, -Infinity, Infinity, false, state.turn, context, profile, 1);
      iterationMoves.push({
        from: move.from,
        to: move.to,
        score: result.score + getPersonaMoveBonus(state, newState, move, options?.botId),
      });

      if (!result.completed) {
        completed = false;
        break;
      }
    }

    if (iterationMoves.length === 0) {
      break;
    }

    bestRootMoves = [...iterationMoves].sort((a, b) => b.score - a.score);

    if (completed) {
      bestMove = chooseMove(bestRootMoves, profile);
      continue;
    }

    break;
  }

  return bestMove;
}

export function getBotMoveForLevel(
  state: GameState,
  level: number,
  options?: BotSearchOptions,
): { from: Position; to: Position } | null {
  if (state.gameOver) return null;

  const move = searchBestMove(state, getBotLevelConfig(level), options);
  if (!move) return null;

  return { from: move.from, to: move.to };
}

export function getBotMove(
  state: GameState,
  difficulty: BotDifficulty,
): { from: Position; to: Position } | null {
  const legacyLevel = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 6 : 10;
  const profile = getBotLevelConfig(legacyLevel);
  const move = searchBestMove(state, profile, {
    maxDepth: profile.maxDepth,
    maxNodes: profile.maxNodes,
    maxMs: null,
  });

  if (!move) return null;
  return { from: move.from, to: move.to };
}
