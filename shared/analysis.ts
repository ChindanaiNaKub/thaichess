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
  };
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

export function classifyMove(evalDelta: number, isExactBestMove: boolean): MoveClassification {
  const loss = Math.max(0, evalDelta);
  if (isExactBestMove) return 'best';
  if (loss <= 15) return 'excellent';
  if (loss <= 45) return 'good';
  if (loss <= 100) return 'inaccuracy';
  if (loss <= 220) return 'mistake';
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
    case 'excellent': return '✦';
    case 'good': return '✓';
    case 'inaccuracy': return '?!';
    case 'mistake': return '?';
    case 'blunder': return '??';
  }
}

export function createEmptySummary(): Record<MoveClassification, number> {
  return { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
}

export function computeAccuracy(classifications: MoveClassification[]): number {
  if (classifications.length === 0) return 100;
  const weights: Record<MoveClassification, number> = {
    best: 1.0, excellent: 0.95, good: 0.85, inaccuracy: 0.6, mistake: 0.3, blunder: 0.0,
  };
  const total = classifications.reduce((sum, c) => sum + weights[c], 0);
  return Math.round((total / classifications.length) * 100);
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
  const whiteClassifications: MoveClassification[] = [];
  const blackClassifications: MoveClassification[] = [];

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

    const classification = classifyMove(evalDelta, isExactBestMove);

    analyzedMoves.push({
      move,
      moveIndex: i,
      evalBefore,
      evalAfter,
      evalDelta,
      bestMove: best.move ? { from: best.move.from, to: best.move.to } : null,
      bestEval: bestEvalNormalized,
      classification,
      color,
    });

    if (color === 'white') {
      whiteSummary[classification]++;
      whiteClassifications.push(classification);
    } else {
      blackSummary[classification]++;
      blackClassifications.push(classification);
    }

    state = newState;

    onProgress?.({ current: i + 1, total: moves.length, done: i === moves.length - 1 });
  }

  return {
    moves: analyzedMoves,
    evaluations,
    whiteAccuracy: computeAccuracy(whiteClassifications),
    blackAccuracy: computeAccuracy(blackClassifications),
    summary: { white: whiteSummary, black: blackSummary },
    engine: {
      label: 'Local analysis',
      source: 'local',
    },
  };
}

export function normalizeEval(rawEval: number): number {
  return Math.max(-1000, Math.min(1000, rawEval)) / 1000;
}

export function formatEval(rawEval: number): string {
  if (rawEval >= 90000) return '#';
  if (rawEval <= -90000) return '#';
  const pawnValue = rawEval / 100;
  const sign = pawnValue > 0 ? '+' : '';
  return `${sign}${pawnValue.toFixed(1)}`;
}
