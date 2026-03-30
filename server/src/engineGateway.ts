import type { Move } from '../../shared/types';
import { createInitialGameState, makeMove } from '../../shared/engine';
import {
  analyzeGame,
  classifyMove,
  computeAccuracy,
  createEmptySummary,
  evaluatePosition,
  findBestMove,
  getMoveWinPercents,
  moveAccuracyFromWinPercent,
  type AnalyzedMove,
  type GameAnalysis,
} from '../../shared/analysis';
import { getBotMove, type BotDifficulty } from '../../shared/botEngine';
import {
  moveToUci,
  serializeAnalysisPosition,
  type AnalysisPositionSnapshot,
  type BotMoveResult,
  type EngineServiceAnalyzeRequest,
  type EngineServiceAnalyzeResponse,
  type PositionAnalysisResult,
  uciToMove,
} from '../../shared/engineAdapter';
import { logWarn } from './logger';
import { analyzeBotWithBinaryEngine, analyzeWithBinaryEngine, hasBinaryEngineConfigured } from './fairyStockfishBinary';

const SERVICE_URL = process.env.FAIRY_STOCKFISH_SERVICE_URL?.trim() || '';

const BOT_LEVEL_MOVETIMES_MS = [40, 60, 80, 110, 150, 200, 250, 300, 350, 400] as const;
const REVIEW_MOVETIME_MS = 250;
const REVIEW_MIN_MOVETIME_MS = 80;
const REVIEW_TOTAL_TARGET_MS = 8000;

function getServiceUrl(pathname: string): string | null {
  if (!SERVICE_URL) return null;
  return `${SERVICE_URL.replace(/\/+$/, '')}${pathname}`;
}

export function hasExternalEngineSupport(): boolean {
  return Boolean(SERVICE_URL) || hasBinaryEngineConfigured();
}

function clampBotLevel(level: number): number {
  if (!Number.isFinite(level)) return 5;
  return Math.min(10, Math.max(1, Math.round(level)));
}

function getBotMovetime(level: number): number {
  return BOT_LEVEL_MOVETIMES_MS[clampBotLevel(level) - 1];
}

export function getReviewMovetime(moveCount: number, requestedMovetimeMs: number = REVIEW_MOVETIME_MS): number {
  const safeRequested = Math.max(REVIEW_MIN_MOVETIME_MS, Math.round(requestedMovetimeMs));
  const adaptive = Math.floor(REVIEW_TOTAL_TARGET_MS / Math.max(1, moveCount + 1));
  return Math.max(REVIEW_MIN_MOVETIME_MS, Math.min(safeRequested, adaptive));
}

function getFallbackDifficulty(level: number): BotDifficulty {
  if (level <= 3) return 'easy';
  if (level <= 7) return 'medium';
  return 'hard';
}

function getFallbackDepth(search: EngineServiceAnalyzeRequest['search']): number {
  if (search.depth) return Math.min(4, Math.max(1, search.depth));
  const movetime = search.movetimeMs ?? 400;
  if (movetime <= 150) return 1;
  if (movetime <= 600) return 2;
  return 3;
}

function createStateFromSnapshot(snapshot: AnalysisPositionSnapshot) {
  const state = createInitialGameState(0, 0);
  return {
    ...state,
    board: snapshot.board.map(row => row.map(cell => (cell ? { ...cell } : null))),
    turn: snapshot.turn,
    counting: snapshot.counting ? { ...snapshot.counting } : null,
  };
}

function buildLocalBotMoveResult(
  snapshot: AnalysisPositionSnapshot,
  level: number,
): BotMoveResult {
  const normalizedLevel = clampBotLevel(level);
  const state = createStateFromSnapshot(snapshot);
  const move = getBotMove(state, getFallbackDifficulty(normalizedLevel));

  return {
    move,
    evaluation: evaluatePosition(snapshot.board, 'white'),
    bestMove: move,
    principalVariation: move ? [moveToUci(move)] : [],
    stats: {
      source: 'local',
      depth: getFallbackDepth({ movetimeMs: getBotMovetime(normalizedLevel) }),
    },
  };
}

export function resolveBotMoveCandidate(
  snapshot: AnalysisPositionSnapshot,
  level: number,
  candidate: { from: { row: number; col: number }; to: { row: number; col: number } } | null,
): { move: { from: { row: number; col: number }; to: { row: number; col: number } } | null; source: 'engine' | 'local' } {
  if (candidate) {
    const state = createStateFromSnapshot(snapshot);
    if (makeMove(state, candidate.from, candidate.to)) {
      return {
        move: candidate,
        source: 'engine',
      };
    }
  }

  return {
    move: buildLocalBotMoveResult(snapshot, level).move,
    source: 'local',
  };
}

async function callService(
  pathname: string,
  request: EngineServiceAnalyzeRequest,
): Promise<EngineServiceAnalyzeResponse | null> {
  const url = getServiceUrl(pathname);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      logWarn('engine_service_bad_status', { pathname, status: response.status });
      return null;
    }

    return await response.json() as EngineServiceAnalyzeResponse;
  } catch (error) {
    logWarn('engine_service_unavailable', {
      pathname,
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return null;
  }
}

function buildLocalPositionAnalysis(
  snapshot: AnalysisPositionSnapshot,
  search: EngineServiceAnalyzeRequest['search'],
): PositionAnalysisResult {
  const state = createStateFromSnapshot(snapshot);
  const depth = getFallbackDepth(search);
  const best = findBestMove(state, depth);

  return {
    evaluation: evaluatePosition(snapshot.board, 'white'),
    bestMove: best.move ? { from: best.move.from, to: best.move.to } : null,
    principalVariation: best.move ? [moveToUci(best.move)] : [],
    stats: {
      source: 'local',
      depth,
    },
  };
}

export async function analyzePositionWithEngine(
  snapshot: AnalysisPositionSnapshot,
  search: EngineServiceAnalyzeRequest['search'],
  multipv: number = 1,
): Promise<PositionAnalysisResult> {
  const serialized = serializeAnalysisPosition(snapshot);
  const request: EngineServiceAnalyzeRequest = {
    variant: 'makruk',
    position: serialized.position,
    counting: serialized.counting,
    search,
    multipv,
  };

  const remote = await callService('/analyze', request);
  const binary = remote ? null : await analyzeWithBinaryEngine(request);
  const result = remote ?? binary;

  if (!result) {
    return buildLocalPositionAnalysis(snapshot, search);
  }

  return {
    evaluation: result.evalCp,
    bestMove: result.bestMoveUci ? uciToMove(result.bestMoveUci) : null,
    principalVariation: result.pvUci ?? [],
    stats: {
      source: remote ? 'service' : 'binary',
      depth: result.depth,
      selDepth: result.selDepth ?? undefined,
      nodes: result.nodes ?? undefined,
      nps: result.nps ?? undefined,
    },
  };
}

export async function analyzeGameWithEngine(
  moves: Move[],
  options?: { movetimeMs?: number; depth?: number },
  onProgress?: (progress: { current: number; total: number; done: boolean }) => void,
): Promise<GameAnalysis> {
  const movetimeMs = getReviewMovetime(moves.length, options?.movetimeMs);
  const fallbackDepth = options?.depth ?? getFallbackDepth({ movetimeMs });

  if (!hasExternalEngineSupport()) {
    return analyzeGame(moves, fallbackDepth, onProgress);
  }

  const evaluatedMoves: AnalyzedMove[] = [];
  const evaluations: number[] = [];
  const whiteSummary = createEmptySummary();
  const blackSummary = createEmptySummary();

  let state = createInitialGameState(0, 0);
  let currentAnalysis = await analyzePositionWithEngine({
    board: state.board,
    turn: state.turn,
    counting: state.counting,
  }, { movetimeMs, nodes: 0 });
  evaluations.push(currentAnalysis.evaluation);

  for (let moveIndex = 0; moveIndex < moves.length; moveIndex += 1) {
    const move = moves[moveIndex];
    const color = state.turn;
    const before = currentAnalysis;

    const nextState = makeMove(state, move.from, move.to);
    if (!nextState) break;

    currentAnalysis = await analyzePositionWithEngine({
      board: nextState.board,
      turn: nextState.turn,
      counting: nextState.counting,
    }, { movetimeMs, nodes: 0 });
    const after = currentAnalysis;

    evaluations.push(after.evaluation);

    const evalDelta = color === 'white'
      ? before.evaluation - after.evaluation
      : after.evaluation - before.evaluation;

    const isExactBestMove = !!before.bestMove
      && before.bestMove.from.row === move.from.row
      && before.bestMove.from.col === move.from.col
      && before.bestMove.to.row === move.to.row
      && before.bestMove.to.col === move.to.col;

    const { before: winPercentBefore, after: winPercentAfter } = getMoveWinPercents(before.evaluation, after.evaluation, color);
    const moveAccuracy = isExactBestMove ? 100 : moveAccuracyFromWinPercent(winPercentBefore, winPercentAfter);
    const classification = classifyMove(moveAccuracy, isExactBestMove);

    evaluatedMoves.push({
      move,
      moveIndex,
      evalBefore: before.evaluation,
      evalAfter: after.evaluation,
      evalDelta,
      winPercentBefore,
      winPercentAfter,
      moveAccuracy,
      bestMove: before.bestMove,
      bestEval: before.evaluation,
      classification,
      color,
      principalVariation: before.principalVariation,
      engine: before.stats,
    });

    if (color === 'white') {
      whiteSummary[classification] += 1;
    } else {
      blackSummary[classification] += 1;
    }

    state = nextState;
    onProgress?.({ current: moveIndex + 1, total: moves.length, done: moveIndex === moves.length - 1 });
  }

  return {
    moves: evaluatedMoves,
    evaluations,
    whiteAccuracy: computeAccuracy(evaluatedMoves, 'white'),
    blackAccuracy: computeAccuracy(evaluatedMoves, 'black'),
    summary: {
      white: whiteSummary,
      black: blackSummary,
    },
    engine: {
      label: remoteEngineLabel(),
      source: SERVICE_URL ? 'service' : 'binary',
    },
  };
}

export async function getBotMoveWithEngine(
  snapshot: AnalysisPositionSnapshot,
  level: number,
): Promise<BotMoveResult> {
  const normalizedLevel = clampBotLevel(level);
  const serialized = serializeAnalysisPosition(snapshot);
  const request: EngineServiceAnalyzeRequest = {
    variant: 'makruk',
    position: serialized.position,
    counting: serialized.counting,
    search: {
      movetimeMs: getBotMovetime(normalizedLevel),
    },
    multipv: normalizedLevel <= 4 ? 2 : 1,
  };

  const remote = await callService('/bot-move', request);
  const binary = remote ? null : await analyzeBotWithBinaryEngine(request);
  const result = remote ?? binary;

  if (result) {
    const parsedMove = result.bestMoveUci ? uciToMove(result.bestMoveUci) : null;
    const resolved = resolveBotMoveCandidate(snapshot, normalizedLevel, parsedMove);

    if (resolved.source === 'engine') {
      return {
        move: resolved.move,
        evaluation: result.evalCp,
        bestMove: resolved.move,
        principalVariation: result.pvUci ?? [],
        stats: {
          source: remote ? 'service' : 'binary',
          depth: result.depth,
          selDepth: result.selDepth ?? undefined,
          nodes: result.nodes ?? undefined,
          nps: result.nps ?? undefined,
        },
      };
    }

    logWarn('engine_bot_move_unusable', {
      level: normalizedLevel,
      engineSource: remote ? 'service' : 'binary',
      bestMoveUci: result.bestMoveUci,
      reason: parsedMove ? 'illegal_move' : 'missing_or_unparseable_move',
    });
  }

  return buildLocalBotMoveResult(snapshot, normalizedLevel);
}

function remoteEngineLabel(): string {
  if (SERVICE_URL) return 'Fairy-Stockfish service';
  if (hasBinaryEngineConfigured()) return 'Fairy-Stockfish binary';
  return 'Local analysis';
}
