import { Board, Piece, PieceColor, PieceType, Position, Move, GameState } from './types';
import {
  getLegalMoves, makeMove, getAllPieces, isInCheck,
  createInitialBoard, createInitialGameState, getBoardAtMove,
} from './engine';
import type { EngineStats } from './engineAdapter';

export type MoveClassification = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface AnalyzedMove {
  move: Move;
  moveIndex: number;
  evalBefore: number;
  evalAfter: number;
  evalDelta: number;
  winPercentBefore: number;
  winPercentAfter: number;
  moveAccuracy: number;
  bestMove: { from: Position; to: Position } | null;
  bestEval: number;
  classification: MoveClassification;
  color: PieceColor;
  principalVariation?: string[];
  engine?: EngineStats;
}

export interface GameAnalysis {
  moves: AnalyzedMove[];
  evaluations: number[];
  whiteAccuracy: number;
  blackAccuracy: number;
  summary: {
    white: Record<MoveClassification, number>;
    black: Record<MoveClassification, number>;
  };
  engine?: {
    label: string;
    source: EngineStats['source'];
    confidence: 'authoritative' | 'provisional';
    reason?: 'local_only' | 'local_fallback_used';
  };
}

const WIN_PERCENT_CP_FACTOR = 0.00368208;
const ACCURACY_SCALE = 103.1668;
const ACCURACY_DECAY = 0.04354;
const ACCURACY_OFFSET = 3.1669;
const WIN_PERCENT_CP_CLAMP = 1000;

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

const PAWN_ADVANCE_WHITE = [0, 0, 0, 5, 15, 30, 0, 0];
const PAWN_ADVANCE_BLACK = [0, 0, 30, 15, 5, 0, 0, 0];

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

function countMobility(board: Board, color: PieceColor): number {
  let mobility = 0;
  const pieces = getAllPieces(board, color);

  for (const { pos } of pieces) {
    mobility += getLegalMoves(board, pos).length;
  }

  return mobility;
}

function getCapturePressure(board: Board, color: PieceColor): number {
  let pressure = 0;
  const pieces = getAllPieces(board, color);

  for (const { pos } of pieces) {
    const legalMoves = getLegalMoves(board, pos);
    for (const move of legalMoves) {
      const captured = board[move.row][move.col];
      if (captured && captured.color !== color) {
        pressure += PIECE_VALUES[captured.type];
      }
    }
  }

  return pressure;
}

export function evaluatePosition(board: Board, perspective: PieceColor): number {
  let score = 0;
  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type];
      let positional = CENTER_BONUS[row][col];

      if (piece.type === 'P') {
        positional += piece.color === 'white'
          ? PAWN_ADVANCE_WHITE[row]
          : PAWN_ADVANCE_BLACK[row];
      }

      if (piece.type === 'K') {
        positional = KING_SAFETY[row][col];
      }

      if (piece.type === 'N') {
        positional += CENTER_BONUS[row][col] * 0.5;
      }

      if (piece.color === perspective) {
        score += value + positional;
      } else {
        score -= value + positional;
      }

      if (piece.color === 'white') {
        whiteMaterial += value;
      } else {
        blackMaterial += value;
      }
    }
  }

  const opponent = perspective === 'white' ? 'black' : 'white';
  const perspectiveMobility = countMobility(board, perspective);
  const opponentMobility = countMobility(board, opponent);
  score += (perspectiveMobility - opponentMobility) * 4;

  const perspectivePressure = getCapturePressure(board, perspective);
  const opponentPressure = getCapturePressure(board, opponent);
  score += (perspectivePressure - opponentPressure) * 0.12;

  const materialLead = perspective === 'white'
    ? whiteMaterial - blackMaterial
    : blackMaterial - whiteMaterial;
  if (materialLead > 0) {
    score += perspectiveMobility * 2;
  }

  if (isInCheck(board, opponent)) score += 50;
  if (isInCheck(board, perspective)) score -= 50;

  return Math.round(score);
}

interface ScoredMove {
  from: Position;
  to: Position;
  score: number;
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

function orderMoves(moves: ScoredMove[], board: Board): ScoredMove[] {
  return moves.sort((a, b) => {
    const captureA = board[a.to.row][a.to.col];
    const captureB = board[b.to.row][b.to.col];
    const scoreA = captureA ? PIECE_VALUES[captureA.type] : 0;
    const scoreB = captureB ? PIECE_VALUES[captureB.type] : 0;
    return scoreB - scoreA;
  });
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  evalColor: PieceColor,
): number {
  if (depth === 0 || state.gameOver) {
    if (state.isCheckmate) {
      return maximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
    }
    if (state.isDraw || state.isStalemate) return 0;
    return evaluatePosition(state.board, evalColor);
  }

  let moves = getAllMovesForColor(state.board, state.turn);
  moves = orderMoves(moves, state.board);

  if (moves.length === 0) {
    if (isInCheck(state.board, state.turn)) {
      return maximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
    }
    return 0;
  }

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newState = makeMove(state, move.from, move.to);
      if (!newState) continue;
      const val = minimax(newState, depth - 1, alpha, beta, false, evalColor);
      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newState = makeMove(state, move.from, move.to);
      if (!newState) continue;
      const val = minimax(newState, depth - 1, alpha, beta, true, evalColor);
      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function findBestMove(
  state: GameState,
  depth: number = 3,
): { move: ScoredMove | null; eval: number } {
  const color = state.turn;
  let moves = getAllMovesForColor(state.board, color);
  if (moves.length === 0) return { move: null, eval: 0 };

  moves = orderMoves(moves, state.board);

  let bestMove: ScoredMove | null = null;
  let bestEval = -Infinity;

  for (const move of moves) {
    const newState = makeMove(state, move.from, move.to);
    if (!newState) continue;
    const val = minimax(newState, depth - 1, -Infinity, Infinity, false, color);
    move.score = val;
    if (val > bestEval) {
      bestEval = val;
      bestMove = move;
    }
  }

  return { move: bestMove, eval: bestEval };
}

function clampCentipawns(rawEval: number): number {
  if (rawEval >= 90000) return WIN_PERCENT_CP_CLAMP;
  if (rawEval <= -90000) return -WIN_PERCENT_CP_CLAMP;
  return Math.max(-WIN_PERCENT_CP_CLAMP, Math.min(WIN_PERCENT_CP_CLAMP, rawEval));
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function centipawnToWinPercent(rawEval: number): number {
  const cp = clampCentipawns(rawEval);
  return 50 + 50 * (2 / (1 + Math.exp(-WIN_PERCENT_CP_FACTOR * cp)) - 1);
}

export function moveAccuracyFromWinPercent(winPercentBefore: number, winPercentAfter: number): number {
  const drop = Math.max(0, winPercentBefore - winPercentAfter);
  return clampPercent(ACCURACY_SCALE * Math.exp(-ACCURACY_DECAY * drop) - ACCURACY_OFFSET);
}

export function getMoveWinPercents(
  evalBefore: number,
  evalAfter: number,
  color: PieceColor,
): { before: number; after: number } {
  const perspective = color === 'white' ? 1 : -1;
  return {
    before: centipawnToWinPercent(evalBefore * perspective),
    after: centipawnToWinPercent(evalAfter * perspective),
  };
}

export function getMoveQualityWinPercents(
  bestEval: number,
  playedEval: number,
  color: PieceColor,
): { best: number; played: number } {
  const perspective = color === 'white' ? 1 : -1;
  return {
    best: centipawnToWinPercent(bestEval * perspective),
    played: centipawnToWinPercent(playedEval * perspective),
  };
}

export function classifyMove(moveAccuracy: number, isExactBestMove: boolean): MoveClassification {
  if (isExactBestMove) return 'best';
  if (moveAccuracy >= 98) return 'excellent';
  if (moveAccuracy >= 90) return 'good';
  if (moveAccuracy >= 75) return 'inaccuracy';
  if (moveAccuracy >= 50) return 'mistake';
  return 'blunder';
}

export function getClassificationColor(classification: MoveClassification): string {
  switch (classification) {
    case 'best': return '#96bc4b';
    case 'excellent': return '#96bc4b';
    case 'good': return '#96bc4b';
    case 'inaccuracy': return '#f7c631';
    case 'mistake': return '#e69d28';
    case 'blunder': return '#ca3431';
  }
}

export function getClassificationSymbol(classification: MoveClassification): string {
  switch (classification) {
    case 'best': return '!!';
    case 'excellent': return '!';
    case 'good': return '';
    case 'inaccuracy': return '?!';
    case 'mistake': return '?';
    case 'blunder': return '??';
  }
}

export function getClassificationIcon(classification: MoveClassification): string {
  switch (classification) {
    case 'best': return '⭐';
    case 'excellent': return '👍';
    case 'good': return '✓';
    case 'inaccuracy': return '?!';
    case 'mistake': return '?';
    case 'blunder': return '??';
  }
}

export function createEmptySummary(): Record<MoveClassification, number> {
  return { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
}

function harmonicMean(values: number[]): number {
  if (values.length === 0) return 100;
  if (values.some(value => value <= 0)) return 0;

  const denominator = values.reduce((sum, value) => sum + (1 / value), 0);
  return denominator === 0 ? 100 : values.length / denominator;
}

function arithmeticMean(values: number[]): number {
  if (values.length === 0) return 100;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = arithmeticMean(values);
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function getSideMoves(moves: AnalyzedMove[], color: PieceColor): AnalyzedMove[] {
  return moves.filter(move => move.color === color);
}

function buildSideWinPercentSeries(sideMoves: AnalyzedMove[]): number[] {
  if (sideMoves.length === 0) return [];
  return [
    sideMoves[0].winPercentBefore,
    ...sideMoves.map(move => move.winPercentAfter),
  ];
}

function getWindowBounds(index: number, seriesLength: number, windowSize: number): { start: number; end: number } {
  const clampedWindowSize = Math.min(seriesLength, Math.max(1, windowSize));
  let start = Math.max(0, index - Math.floor(clampedWindowSize / 2));
  let end = start + clampedWindowSize;

  if (end > seriesLength) {
    end = seriesLength;
    start = Math.max(0, end - clampedWindowSize);
  }

  return { start, end };
}

function volatilityWeightedMean(moveAccuracies: number[], winSeries: number[]): number {
  if (moveAccuracies.length === 0) return 100;

  const windowSize = Math.min(8, Math.max(2, Math.round(Math.sqrt(moveAccuracies.length))));
  const weighted = moveAccuracies.map((accuracy, index) => {
    const pointIndex = index + 1;
    const { start, end } = getWindowBounds(pointIndex, winSeries.length, windowSize);
    const weight = standardDeviation(winSeries.slice(start, end));
    return { accuracy, weight };
  });

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) {
    return arithmeticMean(moveAccuracies);
  }

  return weighted.reduce((sum, entry) => sum + (entry.accuracy * entry.weight), 0) / totalWeight;
}

export function computeAccuracy(moves: AnalyzedMove[], color: PieceColor): number {
  const sideMoves = getSideMoves(moves, color);
  if (sideMoves.length === 0) return 100;

  const moveAccuracies = sideMoves.map(move => move.moveAccuracy);
  const harmonic = harmonicMean(moveAccuracies);
  const weighted = volatilityWeightedMean(moveAccuracies, buildSideWinPercentSeries(sideMoves));

  return Math.round(clampPercent((harmonic + weighted) / 2));
}

export interface AnalysisProgress {
  current: number;
  total: number;
  done: boolean;
}

export function analyzeGame(
  moves: Move[],
  depth: number = 2,
  onProgress?: (progress: AnalysisProgress) => void,
): GameAnalysis {
  const analysisDepth = depth;
  const analyzedMoves: AnalyzedMove[] = [];
  const evaluations: number[] = [];
  const whiteSummary = createEmptySummary();
  const blackSummary = createEmptySummary();

  let state = createInitialGameState(0, 0);
  const initialEval = evaluatePosition(state.board, 'white');
  evaluations.push(initialEval);

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const color = state.turn;
    const evalBefore = evaluatePosition(state.board, 'white');

    const best = findBestMove(state, analysisDepth);

    const newState = makeMove(state, move.from, move.to);
    if (!newState) break;

    const evalAfter = evaluatePosition(newState.board, 'white');
    evaluations.push(evalAfter);

    let bestEvalNormalized: number;
    if (best.move) {
      const bestState = makeMove(state, best.move.from, best.move.to);
      bestEvalNormalized = bestState
        ? evaluatePosition(bestState.board, 'white')
        : evalAfter;
    } else {
      bestEvalNormalized = evalAfter;
    }

    let evalDelta: number;
    if (color === 'white') {
      evalDelta = bestEvalNormalized - evalAfter;
    } else {
      evalDelta = evalAfter - bestEvalNormalized;
    }

    const isExactBestMove = !!best.move
      && best.move.from.row === move.from.row
      && best.move.from.col === move.from.col
      && best.move.to.row === move.to.row
      && best.move.to.col === move.to.col;

    const { before: winPercentBefore, after: winPercentAfter } = getMoveWinPercents(evalBefore, evalAfter, color);
    const { best: bestWinPercent, played: playedWinPercent } = getMoveQualityWinPercents(bestEvalNormalized, evalAfter, color);
    const moveAccuracy = isExactBestMove ? 100 : moveAccuracyFromWinPercent(bestWinPercent, playedWinPercent);
    const classification = classifyMove(moveAccuracy, isExactBestMove);

    analyzedMoves.push({
      move,
      moveIndex: i,
      evalBefore,
      evalAfter,
      evalDelta,
      winPercentBefore,
      winPercentAfter,
      moveAccuracy,
      bestMove: best.move ? { from: best.move.from, to: best.move.to } : null,
      bestEval: bestEvalNormalized,
      classification,
      color,
    });

    if (color === 'white') {
      whiteSummary[classification]++;
    } else {
      blackSummary[classification]++;
    }

    state = newState;

    onProgress?.({ current: i + 1, total: moves.length, done: i === moves.length - 1 });
  }

  return {
    moves: analyzedMoves,
    evaluations,
    whiteAccuracy: computeAccuracy(analyzedMoves, 'white'),
    blackAccuracy: computeAccuracy(analyzedMoves, 'black'),
    summary: { white: whiteSummary, black: blackSummary },
    engine: {
      label: 'Local analysis',
      source: 'local',
      confidence: 'provisional',
      reason: 'local_only',
    },
  };
}

export function normalizeEval(rawEval: number): number {
  return Math.max(-1000, Math.min(1000, rawEval)) / 1000;
}

export function formatEval(rawEval: number, mate?: number | null): string {
  if (mate !== undefined && mate !== null) {
    return `${mate < 0 ? '-' : ''}M${Math.abs(mate)}`;
  }
  if (rawEval >= 90000) return 'M';
  if (rawEval <= -90000) return '-M';
  const pawnValue = rawEval / 100;
  const sign = pawnValue > 0 ? '+' : '';
  return `${sign}${pawnValue.toFixed(1)}`;
}
