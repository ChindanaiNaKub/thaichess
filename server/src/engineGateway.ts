import type { Move } from '../../shared/types';
import { createInitialGameState, getAllPieces, getLegalMoves, isInCheck, makeMove } from '../../shared/engine';
import {
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
import {
  getBotLevelConfig,
  getBotMoveForLevel,
  scoreBotMoveCandidate,
  shouldUseExternalEngineForBot,
  type BotSearchOptions,
} from '../../shared/botEngine';
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
import { getCachedGameAnalysis, saveCachedGameAnalysis } from './database';

const SERVICE_URL = process.env.FAIRY_STOCKFISH_SERVICE_URL?.trim() || '';
const GAME_ANALYSIS_CACHE_VERSION = 3;
const POSITION_ANALYSIS_CACHE_MAX = 1200;

const BOT_LEVEL_MOVETIMES_MS = [50, 60, 70, 80, 95, 110, 130, 450, 700, 900] as const;
const BOT_LEVEL_REQUEST_TIMEOUT_MS = [900, 950, 1000, 1050, 1150, 1250, 1350, 2500, 3500, 5000] as const;
const REVIEW_MOVETIME_MS = 250;
const REVIEW_MIN_MOVETIME_MS = 60;
const REVIEW_TOTAL_TARGET_MS = 12000;
const REVIEW_TOTAL_BUDGET_MIN_MS = 18000;
const REVIEW_TOTAL_BUDGET_MAX_MS = 40000;
const REVIEW_ANALYSIS_MIN_TIMEOUT_MS = 1400;
const REVIEW_ANALYSIS_TIMEOUT_BUFFER_MS = 900;
const REVIEW_LOCAL_FALLBACK_DEADLINE_BUFFER_MS = 1800;
const LEVEL10_ENGINE_OVERRIDE_DELTA = 140;

interface EngineAnalysisOptions {
  allowLocalFallback?: boolean;
}

interface GameAnalysisOptions {
  analysisId?: string | null;
  movetimeMs?: number;
  depth?: number;
}

interface ExternalPositionAnalysisResult {
  response: EngineServiceAnalyzeResponse;
  source: 'service' | 'binary';
}

const positionAnalysisCache = new Map<string, ExternalPositionAnalysisResult>();
const positionAnalysisInFlight = new Map<string, Promise<ExternalPositionAnalysisResult | null>>();
const gameAnalysisInFlight = new Map<string, Promise<GameAnalysis>>();

interface Level10BotSearchPlan {
  search: EngineServiceAnalyzeRequest['search'];
  localValidation: BotSearchOptions;
}

function getServiceUrl(pathname: string): string | null {
  if (!SERVICE_URL) return null;
  return `${SERVICE_URL.replace(/\/+$/, '')}${pathname}`;
}

export function hasExternalEngineSupport(): boolean {
  return Boolean(SERVICE_URL) || hasBinaryEngineConfigured();
}

function serializeMoveForCache(move: Move): string {
  return [
    move.from.row,
    move.from.col,
    move.to.row,
    move.to.col,
    move.promotion ?? '',
    move.promoted ? '1' : '0',
  ].join('');
}

function hashText(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function getMovesHash(moves: Move[]): string {
  return `${moves.length}-${hashText(moves.map(serializeMoveForCache).join('|'))}`;
}

function getGameAnalysisCacheKey(params: {
  analysisId?: string | null;
  moves: Move[];
  movetimeMs: number;
  depth?: number;
}): { cacheKey: string; movesHash: string } {
  const movesHash = getMovesHash(params.moves);
  const normalizedId = params.analysisId?.trim() || `moves-${movesHash}`;
  return {
    movesHash,
    cacheKey: [
      'game-analysis',
      GAME_ANALYSIS_CACHE_VERSION,
      normalizedId,
      movesHash,
      params.movetimeMs,
      params.depth ?? 'auto',
    ].join(':'),
  };
}

function getPositionAnalysisCacheKey(request: EngineServiceAnalyzeRequest): string {
  return JSON.stringify({
    engine: SERVICE_URL || 'binary',
    variant: request.variant,
    position: request.position,
    counting: request.counting ?? null,
    search: request.search,
    multipv: request.multipv ?? 1,
  });
}

function getCachedPositionAnalysis(cacheKey: string): ExternalPositionAnalysisResult | null {
  const cached = positionAnalysisCache.get(cacheKey);
  if (!cached) return null;
  positionAnalysisCache.delete(cacheKey);
  positionAnalysisCache.set(cacheKey, cached);
  return cached;
}

function writeCachedPositionAnalysis(cacheKey: string, result: ExternalPositionAnalysisResult): void {
  if (positionAnalysisCache.has(cacheKey)) {
    positionAnalysisCache.delete(cacheKey);
  }
  positionAnalysisCache.set(cacheKey, result);
  while (positionAnalysisCache.size > POSITION_ANALYSIS_CACHE_MAX) {
    const oldest = positionAnalysisCache.keys().next().value as string | undefined;
    if (!oldest) break;
    positionAnalysisCache.delete(oldest);
  }
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

export function normalizeEngineMate(mate: number | null | undefined, turn: AnalysisPositionSnapshot['turn']): number | null {
  if (mate === undefined || mate === null) return null;
  return turn === 'white' ? mate : -mate;
}

function isSnapshotEndgame(snapshot: AnalysisPositionSnapshot): boolean {
  let remainingNonPawnMaterial = 0;

  for (const row of snapshot.board) {
    for (const piece of row) {
      if (!piece || piece.type === 'K' || piece.type === 'P') continue;
      remainingNonPawnMaterial += piece.type === 'R'
        ? 500
        : piece.type === 'N'
          ? 300
          : piece.type === 'S'
            ? 250
            : 200;
    }
  }

  return remainingNonPawnMaterial <= 1700 || Boolean(snapshot.counting);
}

function getSnapshotMoveSignals(snapshot: AnalysisPositionSnapshot): { captureCount: number; checkingCount: number } {
  const pieces = getAllPieces(snapshot.board, snapshot.turn);
  let captureCount = 0;
  let checkingCount = 0;

  for (const { pos } of pieces) {
    const legalMoves = getLegalMoves(snapshot.board, pos);
    for (const move of legalMoves) {
      const target = snapshot.board[move.row][move.col];
      if (target && target.color !== snapshot.turn) {
        captureCount += 1;
      }

      const state = createStateFromSnapshot(snapshot);
      const nextState = makeMove(state, pos, move);
      if (nextState?.isCheck) {
        checkingCount += 1;
      }
    }
  }

  return { captureCount, checkingCount };
}

export function createLevel10BotSearchPlan(snapshot: AnalysisPositionSnapshot): Level10BotSearchPlan {
  const inCheck = isInCheck(snapshot.board, snapshot.turn);
  const endgame = isSnapshotEndgame(snapshot);
  const { captureCount, checkingCount } = getSnapshotMoveSignals(snapshot);
  const forcing = inCheck || checkingCount > 0 || captureCount >= 2;

  if (inCheck) {
    return {
      search: { depth: 12 },
      localValidation: { maxDepth: 7, maxNodes: 26000, maxMs: 1200 },
    };
  }

  if (forcing) {
    return {
      search: { depth: 10 },
      localValidation: { maxDepth: 6, maxNodes: 20000, maxMs: 950 },
    };
  }

  if (endgame) {
    return {
      search: { depth: 10 },
      localValidation: { maxDepth: 6, maxNodes: 18000, maxMs: 900 },
    };
  }

  return {
    search: { movetimeMs: getBotMovetime(10) },
    localValidation: { maxDepth: 5, maxNodes: 12000, maxMs: 700 },
  };
}

function createExternalBotSearch(
  snapshot: AnalysisPositionSnapshot,
  level: number,
): EngineServiceAnalyzeRequest['search'] {
  const normalizedLevel = clampBotLevel(level);
  if (normalizedLevel >= 10) {
    return createLevel10BotSearchPlan(snapshot).search;
  }

  const inCheck = isInCheck(snapshot.board, snapshot.turn);
  const endgame = isSnapshotEndgame(snapshot);
  const { captureCount, checkingCount } = getSnapshotMoveSignals(snapshot);
  const forcing = inCheck || endgame || checkingCount > 0 || captureCount >= 2;

  if (normalizedLevel >= 9) {
    return forcing ? { depth: 9 } : { movetimeMs: getBotMovetime(normalizedLevel) };
  }

  if (normalizedLevel >= 8) {
    return forcing ? { depth: 7 } : { movetimeMs: getBotMovetime(normalizedLevel) };
  }

  return { movetimeMs: getBotMovetime(normalizedLevel) };
}

function getPreferredBotEngineSource(level: number): 'service' | 'binary' | 'none' {
  if (clampBotLevel(level) === 10 && hasBinaryEngineConfigured()) {
    return 'binary';
  }

  if (SERVICE_URL) return 'service';
  if (hasBinaryEngineConfigured()) return 'binary';
  return 'none';
}

function buildLocalBotMoveResult(
  snapshot: AnalysisPositionSnapshot,
  level: number,
  botId?: string,
): BotMoveResult {
  const normalizedLevel = clampBotLevel(level);
  const config = getBotLevelConfig(normalizedLevel);
  const state = createStateFromSnapshot(snapshot);
  const localSearch = normalizedLevel === 10
    ? { ...createLevel10BotSearchPlan(snapshot).localValidation, botId }
    : {
      maxDepth: config.maxDepth,
      maxNodes: config.maxNodes,
      maxMs: config.maxMs,
      botId,
    };
  const move = getBotMoveForLevel(state, normalizedLevel, localSearch);

  return {
    move,
    evaluation: evaluatePosition(snapshot.board, 'white'),
    bestMove: move,
    principalVariation: move ? [moveToUci(move)] : [],
    stats: {
      source: 'local',
      depth: localSearch.maxDepth,
    },
  };
}

export function resolveBotMoveCandidate(
  snapshot: AnalysisPositionSnapshot,
  level: number,
  candidate: { from: { row: number; col: number }; to: { row: number; col: number } } | null,
  botId?: string,
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
    move: buildLocalBotMoveResult(snapshot, level, botId).move,
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

async function requestExternalPositionAnalysis(
  request: EngineServiceAnalyzeRequest,
  timeoutMs: number,
): Promise<ExternalPositionAnalysisResult | null> {
  const cacheKey = getPositionAnalysisCacheKey(request);
  const cached = getCachedPositionAnalysis(cacheKey);
  if (cached) return cached;

  const inFlight = positionAnalysisInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const requestPromise = (async (): Promise<ExternalPositionAnalysisResult | null> => {
    const remote = await callService('/analyze', request, { timeoutMs });
    if (remote) {
      const result: ExternalPositionAnalysisResult = { response: remote, source: 'service' };
      writeCachedPositionAnalysis(cacheKey, result);
      return result;
    }

    const binary = await analyzeWithBinaryEngine(request);
    if (binary) {
      const result: ExternalPositionAnalysisResult = { response: binary, source: 'binary' };
      writeCachedPositionAnalysis(cacheKey, result);
      return result;
    }

    return null;
  })();

  positionAnalysisInFlight.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    positionAnalysisInFlight.delete(cacheKey);
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

function validateLevel10EngineMove(
  snapshot: AnalysisPositionSnapshot,
  candidate: { from: { row: number; col: number }; to: { row: number; col: number } },
  botId?: string,
): { move: { from: { row: number; col: number }; to: { row: number; col: number } }; source: 'engine' | 'local'; depth: number } {
  const state = createStateFromSnapshot(snapshot);
  const plan = createLevel10BotSearchPlan(snapshot);
  const localBest = getBotMoveForLevel(state, 10, { ...plan.localValidation, botId });

  if (!localBest) {
    return { move: candidate, source: 'engine', depth: plan.localValidation.maxDepth ?? 0 };
  }

  const candidateScore = scoreBotMoveCandidate(state, 10, candidate, plan.localValidation);
  const localScore = scoreBotMoveCandidate(state, 10, localBest, plan.localValidation);
  const shouldOverride = localScore > candidateScore + LEVEL10_ENGINE_OVERRIDE_DELTA
    || (candidateScore <= -90000 && localScore >= 0);

  if (!shouldOverride) {
    return { move: candidate, source: 'engine', depth: plan.localValidation.maxDepth ?? 0 };
  }

  logInfo('engine_bot_move_overridden_level10', {
    candidateScore,
    localScore,
    engineMove: moveToUci(candidate),
    localMove: moveToUci(localBest),
  });

  return {
    move: localBest,
    source: 'local',
    depth: plan.localValidation.maxDepth ?? 0,
  };
}

export function resolvePositionAnalysisResult(
  snapshot: AnalysisPositionSnapshot,
  search: EngineServiceAnalyzeRequest['search'],
  result: EngineServiceAnalyzeResponse,
  source: 'service' | 'binary',
  options: EngineAnalysisOptions = {},
): PositionAnalysisResult {
  const parsedMove = result.bestMoveUci ? uciToMove(result.bestMoveUci) : null;
  const resolved = resolveValidatedAnalysisMove(snapshot, parsedMove);

  if (resolved.source === 'local' && result.bestMoveUci) {
    logWarn('engine_analysis_move_unusable', {
      engineSource: source,
      bestMoveUci: result.bestMoveUci,
      reason: parsedMove ? 'illegal_move' : 'missing_or_unparseable_move',
    });
    if (options.allowLocalFallback === false) {
      throw new Error(`Fairy-Stockfish returned an unusable move: ${result.bestMoveUci}`);
    }
    return buildLocalPositionAnalysis(snapshot, search);
  }

  return {
    evaluation: normalizeEngineEvaluation(result.evalCp, snapshot.turn),
    mate: normalizeEngineMate(result.mate, snapshot.turn),
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
  options: EngineAnalysisOptions = {},
): Promise<PositionAnalysisResult> {
  const serialized = serializeAnalysisPosition(snapshot);
  const request: EngineServiceAnalyzeRequest = {
    variant: 'makruk',
    position: serialized.position,
    counting: serialized.counting,
    search,
    multipv,
  };

  const result = await requestExternalPositionAnalysis(request, getReviewAnalysisTimeoutMs(search));

  if (!result) {
    if (options.allowLocalFallback === false) {
      throw new Error('Fairy-Stockfish analysis is unavailable.');
    }
    return buildLocalPositionAnalysis(snapshot, search);
  }

  return resolvePositionAnalysisResult(snapshot, search, result.response, result.source, options);
}

export async function analyzeGameWithEngine(
  moves: Move[],
  options?: GameAnalysisOptions,
  onProgress?: (progress: { current: number; total: number; done: boolean }) => void,
): Promise<GameAnalysis> {
  const movetimeMs = getReviewMovetime(moves.length, options?.movetimeMs);
  const cacheMeta = getGameAnalysisCacheKey({
    analysisId: options?.analysisId,
    moves,
    movetimeMs,
    depth: options?.depth,
  });
  const cached = await getCachedGameAnalysis(cacheMeta.cacheKey);
  if (cached) {
    logInfo('game_analysis_cache_hit', {
      cacheKey: cacheMeta.cacheKey,
      gameId: options?.analysisId ?? null,
      movesHash: cacheMeta.movesHash,
      moveCount: moves.length,
    });
    onProgress?.({ current: moves.length, total: moves.length, done: true });
    return cached.analysis;
  }

  const inFlight = gameAnalysisInFlight.get(cacheMeta.cacheKey);
  if (inFlight) {
    logInfo('game_analysis_in_flight_joined', {
      cacheKey: cacheMeta.cacheKey,
      gameId: options?.analysisId ?? null,
      movesHash: cacheMeta.movesHash,
      moveCount: moves.length,
    });
    return inFlight;
  }

  const analysisPromise = analyzeGameWithEngineUncached(
    moves,
    { ...options, movetimeMs },
    onProgress,
  ).then(async (analysis) => {
    await saveCachedGameAnalysis({
      cacheKey: cacheMeta.cacheKey,
      gameId: options?.analysisId ?? null,
      movesHash: cacheMeta.movesHash,
      movetimeMs,
      depth: options?.depth ?? null,
      analysis,
    });
    return analysis;
  });

  gameAnalysisInFlight.set(cacheMeta.cacheKey, analysisPromise);
  try {
    return await analysisPromise;
  } finally {
    gameAnalysisInFlight.delete(cacheMeta.cacheKey);
  }
}

async function analyzeGameWithEngineUncached(
  moves: Move[],
  options: GameAnalysisOptions & { movetimeMs: number },
  onProgress?: (progress: { current: number; total: number; done: boolean }) => void,
): Promise<GameAnalysis> {
  const movetimeMs = options.movetimeMs;

  if (!hasExternalEngineSupport()) {
    throw new Error('Fairy-Stockfish is not configured for game review.');
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
      throw new Error('Fairy-Stockfish review timed out before all positions were analyzed.');
    }

    return analyzePositionWithEngine(
      snapshot,
      createReviewSearch(movetimeMs, remainingPositions, remainingBudgetMs),
      1,
      { allowLocalFallback: false },
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
  botId?: string,
): Promise<BotMoveResult> {
  const normalizedLevel = clampBotLevel(level);
  const startedAt = Date.now();
  const config = getBotLevelConfig(normalizedLevel);
  const fallback = buildLocalBotMoveResult(snapshot, normalizedLevel, botId);
  const requiresExternalEngine = shouldUseExternalEngineForBot(normalizedLevel);

  if (!requiresExternalEngine) {
    logInfo('bot_move_calibrated_local', {
      level: normalizedLevel,
      elapsedMs: Date.now() - startedAt,
      rating: config.displayedRating,
      label: config.publicLabel,
    });
    return fallback;
  }

  const serialized = serializeAnalysisPosition(snapshot);
  const request: EngineServiceAnalyzeRequest = {
    variant: 'makruk',
    position: serialized.position,
    counting: serialized.counting,
    search: createExternalBotSearch(snapshot, normalizedLevel),
    multipv: 1,
  };

  const preferredSource = getPreferredBotEngineSource(normalizedLevel);
  const remote = preferredSource === 'service'
    ? await callService('/bot-move', request, { timeoutMs: getBotRequestTimeoutMs(normalizedLevel) })
    : null;
  const binary = preferredSource === 'binary'
    ? await analyzeBotWithBinaryEngine(request)
    : remote || preferredSource === 'service'
      ? null
      : await analyzeBotWithBinaryEngine(request);
  const result = remote ?? binary;

  if (result) {
    const parsedMove = result.bestMoveUci ? uciToMove(result.bestMoveUci) : null;
    const resolved = resolveBotMoveCandidate(snapshot, normalizedLevel, parsedMove, botId);

    if (resolved.source === 'engine') {
      return {
        move: resolved.move!,
        evaluation: normalizeEngineEvaluation(result.evalCp, snapshot.turn),
        mate: normalizeEngineMate(result.mate, snapshot.turn),
        bestMove: resolved.move!,
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

  if (requiresExternalEngine) {
    logWarn('bot_move_engine_required_unavailable', {
      level: normalizedLevel,
      elapsedMs: Date.now() - startedAt,
      engineSourceTried: preferredSource,
    });
    throw new Error('Fairy-Stockfish is required for this bot level but is unavailable.');
  }

  logInfo('bot_move_fallback_local', {
    level: normalizedLevel,
    elapsedMs: Date.now() - startedAt,
    engineSourceTried: preferredSource,
  });
  return fallback;
}

export async function warmUpReviewEngine(): Promise<void> {
  if (!hasExternalEngineSupport()) return;

  const state = createInitialGameState(0, 0);
  const startedAt = Date.now();
  try {
    await analyzePositionWithEngine({
      board: state.board,
      turn: state.turn,
      counting: state.counting,
    }, { nodes: 1000 }, 1, { allowLocalFallback: false });
    logInfo('review_engine_warmed', { elapsedMs: Date.now() - startedAt });
  } catch (error) {
    logWarn('review_engine_warmup_failed', {
      elapsedMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function remoteEngineLabel(): string {
  if (SERVICE_URL) return 'Fairy-Stockfish service';
  if (hasBinaryEngineConfigured()) return 'Fairy-Stockfish binary';
  return 'Local analysis';
}
