import { Board, PieceColor, PieceType, Position, GameState } from './types';
import { getLegalMoves, makeMove, getAllPieces, isInCheck } from './engine';
import { getBotPersonaById } from './botPersonas';
import {
  clampBotLevel,
  getBotDisplayedStrength,
  getBotLevelConfig as getStrengthConfig,
  type BotLevelConfig,
  type BotPublicStrengthLabel,
} from './botStrength';

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

export interface BotSearchOptions {
  maxDepth?: number;
  maxNodes?: number;
  maxMs?: number | null;
  botId?: string;
  randomFn?: () => number;
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

export function getBotLevelConfig(level: number): BotLevelConfig {
  return getStrengthConfig(level);
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getGamePhase(state: GameState): 'opening' | 'middlegame' | 'endgame' {
  if (isEndgameBoard(state.board)) {
    return 'endgame';
  }

  if (state.moveCount < 14) {
    return 'opening';
  }

  return 'middlegame';
}

function getPersonaMoveBonus(
  state: GameState,
  newState: GameState,
  move: ScoredMove,
  profile: BotLevelConfig,
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

  return clamp(bonus * profile.styleInfluence, -profile.styleCap, profile.styleCap);
}

function getStrengthMoveBias(
  state: GameState,
  newState: GameState,
  move: ScoredMove,
  profile: BotLevelConfig,
): number {
  const piece = state.board[move.from.row][move.from.col];
  if (!piece) return 0;

  const phase = getGamePhase(state);
  const opponent = piece.color === 'white' ? 'black' : 'white';
  const captured = state.board[move.to.row][move.to.col];
  const attackers = getSquareAttackers(newState.board, opponent, move.to);
  const defenders = getSquareAttackers(newState.board, piece.color, move.to);
  const isLoose = attackers > defenders;
  const isHanging = attackers > 0 && defenders === 0;
  const centerDelta = CENTER_BONUS[move.to.row][move.to.col] - CENTER_BONUS[move.from.row][move.from.col];
  const homeRow = piece.color === 'white' ? 0 : 7;
  const backRankMove = move.to.row === homeRow ? 1 : 0;
  const retreat = piece.color === 'white'
    ? Number(move.to.row < move.from.row)
    : Number(move.to.row > move.from.row);
  const sidePawnPush = piece.type === 'P' && (move.from.col <= 1 || move.from.col >= 6) ? 1 : 0;
  const earlyHeavyPieceMove = phase === 'opening' && (piece.type === 'R' || piece.type === 'K') ? 1 : 0;
  const captureGreed = captured ? (PIECE_VALUES[captured.type] / 100) * profile.captureGreed * 16 : 0;
  const passiveDrift = (retreat + backRankMove + Number(centerDelta < 0)) * profile.passiveBias * 6;
  const openingBadHabits = phase === 'opening'
    ? ((earlyHeavyPieceMove * 12) + (sidePawnPush * 6) + (Number(centerDelta < 0) * 5)) * (1 - profile.openingQuality)
    : 0;

  let bias = captureGreed + passiveDrift + openingBadHabits;

  if (isHanging) {
    bias -= 36 * profile.defenseAwareness;
    bias += profile.captureGreed * 7;
  } else if (isLoose) {
    bias -= 18 * profile.defenseAwareness;
  }

  if (phase === 'endgame') {
    const evalForMover = evaluateBoard(state.board, piece.color);
    const quietShuffle = !captured && centerDelta <= 0 ? 1 : 0;
    if (evalForMover > 180) {
      bias += quietShuffle * (1 - profile.conversionTechnique) * 12;
    } else {
      bias -= quietShuffle * profile.endgameAccuracy * 4;
    }
  }

  return bias;
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

function orderRootMoves(moves: ScoredMove[], state: GameState, profile: BotLevelConfig, botId?: string): ScoredMove[] {
  if (!botId) {
    return orderMoves(moves, state.board);
  }

  return [...moves].sort((a, b) => {
    const aState = makeMove(state, a.from, a.to);
    const bState = makeMove(state, b.from, b.to);
    const aScore = getMoveOrderingScore(state.board, a) + (aState ? getPersonaMoveBonus(state, aState, a, profile, botId) : -999999);
    const bScore = getMoveOrderingScore(state.board, b) + (bState ? getPersonaMoveBonus(state, bState, b, profile, botId) : -999999);
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

function applyDifficultyVariance(
  moves: ScoredMove[],
  profile: BotLevelConfig,
  randomFn: () => number,
): ScoredMove[] {
  if (moves.length === 0 || profile.noise <= 0) {
    return [...moves];
  }

  return moves.map((move) => ({
    ...move,
    score: move.score + ((randomFn() * 2) - 1) * profile.noise,
  }));
}

function rebalanceWeaknessBuckets(
  profile: BotLevelConfig,
  state: GameState,
  bestScore: number,
): BotLevelConfig['bucketWeights'] {
  const phase = getGamePhase(state);
  const weights = { ...profile.bucketWeights };

  const slipInOpening = phase === 'opening' ? (1 - profile.openingQuality) * 0.12 : 0;
  const slipInEndgame = phase === 'endgame' ? (1 - profile.endgameAccuracy) * 0.12 : 0;
  const conversionWobble = bestScore > 180 ? (1 - profile.conversionTechnique) * 0.14 : 0;
  const pressureWobble = bestScore < -120 ? (1 - profile.defenseAwareness) * 0.08 : 0;
  const totalSlip = slipInOpening + slipInEndgame + conversionWobble + pressureWobble;

  if (totalSlip > 0) {
    const removable = Math.min(totalSlip, Math.max(0, weights.best + weights.solid - 0.2));
    const fromBest = Math.min(weights.best * 0.6, removable * 0.55);
    const fromSolid = Math.min(weights.solid * 0.5, removable - fromBest);
    weights.best -= fromBest;
    weights.solid -= fromSolid;
    const distributed = fromBest + fromSolid;
    weights.inaccuracy += distributed * 0.34;
    weights.mistake += distributed * 0.43;
    weights.blunder += distributed * 0.23;
  }

  const total = weights.best + weights.solid + weights.inaccuracy + weights.mistake + weights.blunder;
  return {
    best: weights.best / total,
    solid: weights.solid / total,
    inaccuracy: weights.inaccuracy / total,
    mistake: weights.mistake / total,
    blunder: weights.blunder / total,
  };
}

function classifyMoveBucket(bestScore: number, moveScore: number): keyof BotLevelConfig['bucketWeights'] {
  const delta = bestScore - moveScore;
  if (delta <= 24) return 'best';
  if (delta <= 90) return 'solid';
  if (delta <= 180) return 'inaccuracy';
  if (delta <= 320) return 'mistake';
  return 'blunder';
}

function pickWeightedBucket(
  profile: BotLevelConfig,
  state: GameState,
  scoredMoves: ScoredMove[],
  randomFn: () => number,
): keyof BotLevelConfig['bucketWeights'] {
  const bestScore = Math.max(...scoredMoves.map((move) => move.score));
  const availableBuckets = new Set(scoredMoves.map((move) => classifyMoveBucket(bestScore, move.score)));
  const weights = rebalanceWeaknessBuckets(profile, state, bestScore);
  const orderedBuckets: (keyof BotLevelConfig['bucketWeights'])[] = ['best', 'solid', 'inaccuracy', 'mistake', 'blunder'];
  const filtered = orderedBuckets
    .filter((bucket) => availableBuckets.has(bucket))
    .map((bucket) => ({ bucket, weight: weights[bucket] }));

  const total = filtered.reduce((sum, entry) => sum + entry.weight, 0);
  let threshold = randomFn() * total;

  for (const entry of filtered) {
    threshold -= entry.weight;
    if (threshold <= 0) {
      return entry.bucket;
    }
  }

  return filtered[filtered.length - 1]?.bucket ?? 'best';
}

function chooseMove(
  state: GameState,
  scoredMoves: ScoredMove[],
  profile: BotLevelConfig,
  options?: BotSearchOptions,
): ScoredMove | null {
  if (scoredMoves.length === 0) return null;

  const randomFn = options?.randomFn ?? Math.random;
  const noisyMoves = applyDifficultyVariance(scoredMoves, profile, randomFn);
  const bestScore = Math.max(...noisyMoves.map((move) => move.score));
  const bucket = pickWeightedBucket(profile, state, noisyMoves, randomFn);
  const bucketMoves = noisyMoves.filter((move) => classifyMoveBucket(bestScore, move.score) === bucket);
  const candidates = bucketMoves.length > 0 ? bucketMoves : noisyMoves;

  const ranked = candidates
    .map((move) => {
      const newState = makeMove(state, move.from, move.to);
      const styleBonus = newState ? getPersonaMoveBonus(state, newState, move, profile, options?.botId) : 0;
      const habitBias = newState ? getStrengthMoveBias(state, newState, move, profile) : 0;
      return {
        ...move,
        score: (move.score * profile.evaluationSharpness) + styleBonus + habitBias,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (profile.choiceWindow > 1 && randomFn() < profile.randomPickChance) {
    const pool = ranked.slice(0, Math.min(profile.choiceWindow, ranked.length));
    return pool[Math.floor(randomFn() * pool.length)];
  }

  return ranked[0];
}

function getHeuristicFallbackMove(state: GameState, profile: BotLevelConfig, options?: BotSearchOptions): ScoredMove | null {
  const moves = orderRootMoves(getAllMovesForColor(state.board, state.turn), state, profile, options?.botId)
    .slice(0, Math.max(1, profile.rootBreadth));

  const scoredMoves = moves.map((move) => {
    const newState = makeMove(state, move.from, move.to);
    return {
      ...move,
      score: getMoveOrderingScore(state.board, move)
        + (newState ? getStrengthMoveBias(state, newState, move, profile) : 0),
    };
  });

  return chooseMove(state, scoredMoves, profile, options);
}

function searchBestMove(
  state: GameState,
  profile: BotLevelConfig,
  options?: BotSearchOptions,
): ScoredMove | null {
  let rootMoves = orderRootMoves(getAllMovesForColor(state.board, state.turn), state, profile, options?.botId);
  if (rootMoves.length === 0) return null;

  const context: SearchContext = {
    deadlineAt: options?.maxMs && options.maxMs > 0 ? Date.now() + options.maxMs : null,
    maxNodes: Math.max(1, Math.round(options?.maxNodes ?? profile.maxNodes)),
    nodes: 0,
    timedOut: false,
  };

  const maxDepth = Math.max(1, Math.round(options?.maxDepth ?? profile.maxDepth));
  let bestMove = getHeuristicFallbackMove(state, profile, options);
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
        score: result.score,
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
      bestMove = chooseMove(state, bestRootMoves, profile, options);
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

export function getBotPublicStrengthLabel(level: number): BotPublicStrengthLabel {
  return getBotDisplayedStrength(level).label;
}

export function getBotDisplayedRating(level: number): number {
  return getBotDisplayedStrength(level).rating;
}

export function shouldUseExternalEngineForBot(level: number): boolean {
  return getBotLevelConfig(level).allowExternalEngine;
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
