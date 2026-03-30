import type { Move } from '../../shared/types';
import { createInitialGameState, makeMove } from '../../shared/engine';
import {
  analyzeGame,
  classifyMove,
  computeAccuracy,
  createEmptySummary,
  evaluatePosition,
  findBestMove,
  getMoveQualityWinPercents,
  getMoveWinPercents,
  moveAccuracyFromWinPercent,
  type AnalyzedMove,
  type GameAnalysis,
} from '../../shared/analysis';
import { getBotLevelConfig, getBotMoveForLevel } from '../../shared/botEngine';
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
import { logInfo, logWarn } from './logger';
import { analyzeBotWithBinaryEngine, analyzeWithBinaryEngine, hasBinaryEngineConfigured } from './fairyStockfishBinary';

const SERVICE_URL = process.env.FAIRY_STOCKFISH_SERVICE_URL?.trim() || '';

const BOT_LEVEL_MOVETIMES_MS = [50, 60, 70, 80, 95, 110, 130, 150, 170, 190] as const;
const BOT_LEVEL_REQUEST_TIMEOUT_MS = [900, 950, 1000, 1050, 1150, 1250, 1350, 1450, 1550, 1650] as const;
const REVIEW_MOVETIME_MS = 250;
const REVIEW_MIN_MOVETIME_MS = 60;
const REVIEW_TOTAL_TARGET_MS = 12000;
const REVIEW_TOTAL_BUDGET_MIN_MS = 18000;
const REVIEW_TOTAL_BUDGET_MAX_MS = 40000;
const REVIEW_ANALYSIS_MIN_TIMEOUT_MS = 1400;
const REVIEW_ANALYSIS_TIMEOUT_BUFFER_MS = 900;
const REVIEW_LOCAL_FALLBACK_DEADLINE_BUFFER_MS = 1800;

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

export function getBotRequestTimeoutMs(level: number): number {
  return BOT_LEVEL_REQUEST_TIMEOUT_MS[clampBotLevel(level) - 1];
}

export function getReviewMovetime(moveCount: number, requestedMovetimeMs: number = REVIEW_MOVETIME_MS): number {
  const safeRequested = Math.max(REVIEW_MIN_MOVETIME_MS, Math.round(requestedMovetimeMs));
  const adaptive = Math.floor(REVIEW_TOTAL_TARGET_MS / Math.max(1, moveCount + 1));
  return Math.max(REVIEW_MIN_MOVETIME_MS, Math.min(safeRequested, adaptive));
}

export function getReviewTotalBudgetMs(moveCount: number): number {
  const adaptive = 6000 + Math.max(0, moveCount) * 180;
  return Math.max(REVIEW_TOTAL_BUDGET_MIN_MS, Math.min(REVIEW_TOTAL_BUDGET_MAX_MS, adaptive));
}

function getReviewAnalysisTimeoutMs(search: EngineServiceAnalyzeRequest['search']): number {
  if (search.depth || search.nodes) {
    return 6000;
  }

  const movetime = Math.max(REVIEW_MIN_MOVETIME_MS, search.movetimeMs ?? REVIEW_MOVETIME_MS);
  return Math.max(REVIEW_ANALYSIS_MIN_TIMEOUT_MS, movetime + REVIEW_ANALYSIS_TIMEOUT_BUFFER_MS);
}

function createReviewSearch(
  requestedMovetimeMs: number,
  remainingPositions: number,
  remainingBudgetMs: number,
): EngineServiceAnalyzeRequest['search'] {
  const perPositionBudget = Math.floor(remainingBudgetMs / Math.max(1, remainingPositions));
  const adaptiveMovetime = Math.floor(perPositionBudget * 0.5);

  return {
    movetimeMs: Math.max(
      REVIEW_MIN_MOVETIME_MS,
      Math.min(Math.max(REVIEW_MIN_MOVETIME_MS, requestedMovetimeMs), adaptiveMovetime),
    ),
  };
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

export function normalizeEngineEvaluation(evalCp: number, turn: AnalysisPositionSnapshot['turn']): number {
  return turn === 'white' ? evalCp : -evalCp;
}

function buildLocalBotMoveResult(
  snapshot: AnalysisPositionSnapshot,
  level: number,
): BotMoveResult {
  const normalizedLevel = clampBotLevel(level);
  const config = getBotLevelConfig(normalizedLevel);
  const state = createStateFromSnapshot(snapshot);
  const move = getBotMoveForLevel(state, normalizedLevel, {
    maxDepth: config.maxDepth,
    maxNodes: config.maxNodes,
    maxMs: config.maxMs,
  });

  return {
    move,
    evaluation: evaluatePosition(snapshot.board, 'white'),
    bestMove: move,
    principalVariation: move ? [moveToUci(move)] : [],
    stats: {
      source: 'local',
      depth: config.maxDepth,
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
  options?: { timeoutMs?: number },
): Promise<EngineServiceAnalyzeResponse | null> {
  const url = getServiceUrl(pathname);
  if (!url) return null;

  const controller = options?.timeoutMs ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), Math.max(1, options?.timeoutMs ?? 0))
    : null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller?.signal,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      logWarn('engine_service_bad_status', { pathname, status: response.status });
      return null;
    }

    return await response.json() as EngineServiceAnalyzeResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    const event = controller?.signal.aborted ? 'engine_service_timeout' : 'engine_service_unavailable';
    logWarn(event, { pathname, message, timeoutMs: options?.timeoutMs });
    return null;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
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

function resolveValidatedAnalysisMove(
  snapshot: AnalysisPositionSnapshot,
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
    move: null,
    source: 'local',
  };
}

export function resolvePositionAnalysisResult(
  snapshot: AnalysisPositionSnapshot,
  search: EngineServiceAnalyzeRequest['search'],
  result: EngineServiceAnalyzeResponse,
  source: 'service' | 'binary',
): PositionAnalysisResult {
  const parsedMove = result.bestMoveUci ? uciToMove(result.bestMoveUci) : null;
  const resolved = resolveValidatedAnalysisMove(snapshot, parsedMove);

  if (resolved.source === 'local' && result.bestMoveUci) {
    logWarn('engine_analysis_move_unusable', {
      engineSource: source,
      bestMoveUci: result.bestMoveUci,
      reason: parsedMove ? 'illegal_move' : 'missing_or_unparseable_move',
    });
    return buildLocalPositionAnalysis(snapshot, search);
  }

  return {
    evaluation: normalizeEngineEvaluation(result.evalCp, snapshot.turn),
    bestMove: resolved.move,
    principalVariation: result.pvUci ?? [],
    stats: {
      source,
      depth: result.depth,
      selDepth: result.selDepth ?? undefined,
      nodes: result.nodes ?? undefined,
      nps: result.nps ?? undefined,
    },
  };
}

function getBestEvalForPosition(
  state: ReturnType<typeof createStateFromSnapshot>,
  bestMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null,
  fallbackEval: number,
): number {
  if (!bestMove) {
    return fallbackEval;
  }

  const bestState = makeMove(state, bestMove.from, bestMove.to);
  if (!bestState) {
    return fallbackEval;
  }

  return evaluatePosition(bestState.board, 'white');
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

  const remote = await callService('/analyze', request, { timeoutMs: getReviewAnalysisTimeoutMs(search) });
  const binary = remote ? null : await analyzeWithBinaryEngine(request);
  const result = remote ?? binary;

  if (!result) {
    return buildLocalPositionAnalysis(snapshot, search);
  }

  return resolvePositionAnalysisResult(snapshot, search, result, remote ? 'service' : 'binary');
}

export async function analyzeGameWithEngine(
  moves: Move[],
  options?: { movetimeMs?: number; depth?: number },
  onProgress?: (progress: { current: number; total: number; done: boolean }) => void,
): Promise<GameAnalysis> {
  const movetimeMs = getReviewMovetime(moves.length, options?.movetimeMs);

  if (!hasExternalEngineSupport()) {
    return analyzeGame(moves, options?.depth ?? getFallbackDepth({ movetimeMs }), onProgress);
  }

  const evaluatedMoves: AnalyzedMove[] = [];
  const evaluations: number[] = [];
  const whiteSummary = createEmptySummary();
  const blackSummary = createEmptySummary();
  const reviewStartedAt = Date.now();
  const reviewDeadlineMs = reviewStartedAt + getReviewTotalBudgetMs(moves.length);

  let state = createInitialGameState(0, 0);
  let loggedBudgetFallback = false;
  const analyzeReviewPosition = async (
    snapshot: AnalysisPositionSnapshot,
    remainingPositions: number,
  ): Promise<PositionAnalysisResult> => {
    const remainingBudgetMs = reviewDeadlineMs - Date.now();
    if (remainingBudgetMs <= REVIEW_LOCAL_FALLBACK_DEADLINE_BUFFER_MS) {
      if (!loggedBudgetFallback) {
        loggedBudgetFallback = true;
        logInfo('review_analysis_budget_exhausted', {
          moveCount: moves.length,
          elapsedMs: Date.now() - reviewStartedAt,
          totalBudgetMs: getReviewTotalBudgetMs(moves.length),
        });
      }
      return buildLocalPositionAnalysis(snapshot, { movetimeMs: REVIEW_MIN_MOVETIME_MS });
    }

    return analyzePositionWithEngine(
      snapshot,
      createReviewSearch(movetimeMs, remainingPositions, remainingBudgetMs),
    );
  };

  let currentAnalysis = await analyzeReviewPosition({
    board: state.board,
    turn: state.turn,
    counting: state.counting,
  }, moves.length + 1);
  evaluations.push(currentAnalysis.evaluation);
  let usedLocalFallback = currentAnalysis.stats.source === 'local';

  for (let moveIndex = 0; moveIndex < moves.length; moveIndex += 1) {
    const move = moves[moveIndex];
    const color = state.turn;
    const before = currentAnalysis;

    const nextState = makeMove(state, move.from, move.to);
    if (!nextState) break;

    currentAnalysis = await analyzeReviewPosition({
      board: nextState.board,
      turn: nextState.turn,
      counting: nextState.counting,
    }, moves.length - moveIndex);
    const after = currentAnalysis;
    usedLocalFallback = usedLocalFallback || before.stats.source === 'local' || after.stats.source === 'local';

    const bestEval = getBestEvalForPosition(state, before.bestMove, after.evaluation);

    evaluations.push(after.evaluation);

    const evalDelta = color === 'white'
      ? bestEval - after.evaluation
      : after.evaluation - bestEval;

    const isExactBestMove = !!before.bestMove
      && before.bestMove.from.row === move.from.row
      && before.bestMove.from.col === move.from.col
      && before.bestMove.to.row === move.to.row
      && before.bestMove.to.col === move.to.col;

    const { before: winPercentBefore, after: winPercentAfter } = getMoveWinPercents(before.evaluation, after.evaluation, color);
    const { best: bestWinPercent, played: playedWinPercent } = getMoveQualityWinPercents(bestEval, after.evaluation, color);
    const moveAccuracy = isExactBestMove ? 100 : moveAccuracyFromWinPercent(bestWinPercent, playedWinPercent);
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
      bestEval,
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
      label: usedLocalFallback ? `${remoteEngineLabel()} + local fallback` : remoteEngineLabel(),
      source: SERVICE_URL ? 'service' : 'binary',
      confidence: usedLocalFallback ? 'provisional' : 'authoritative',
      reason: usedLocalFallback ? 'local_fallback_used' : undefined,
    },
  };
}

export async function getBotMoveWithEngine(
  snapshot: AnalysisPositionSnapshot,
  level: number,
): Promise<BotMoveResult> {
  const normalizedLevel = clampBotLevel(level);
  const startedAt = Date.now();
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

  const remote = SERVICE_URL
    ? await callService('/bot-move', request, { timeoutMs: getBotRequestTimeoutMs(normalizedLevel) })
    : null;
  const binary = remote || SERVICE_URL ? null : await analyzeBotWithBinaryEngine(request);
  const result = remote ?? binary;

  if (result) {
    const parsedMove = result.bestMoveUci ? uciToMove(result.bestMoveUci) : null;
    const resolved = resolveBotMoveCandidate(snapshot, normalizedLevel, parsedMove);

    if (resolved.source === 'engine') {
      return {
        move: resolved.move,
        evaluation: normalizeEngineEvaluation(result.evalCp, snapshot.turn),
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

  const fallback = buildLocalBotMoveResult(snapshot, normalizedLevel);
  logInfo('bot_move_fallback_local', {
    level: normalizedLevel,
    elapsedMs: Date.now() - startedAt,
    engineSourceTried: SERVICE_URL ? 'service' : hasBinaryEngineConfigured() ? 'binary' : 'none',
  });
  return fallback;
}

function remoteEngineLabel(): string {
  if (SERVICE_URL) return 'Fairy-Stockfish service';
  if (hasBinaryEngineConfigured()) return 'Fairy-Stockfish binary';
  return 'Local analysis';
}
