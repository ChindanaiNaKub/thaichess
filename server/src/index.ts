import './env';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors, { type CorsOptions } from 'cors';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { GameManager } from './gameManager';
import { MatchmakingQueue } from './matchmaking';
import {
  initDatabase,
  saveCompletedGame,
  getRecentGames,
  getGame as getDbGame,
  getStats,
  getGameCount,
  getLeaderboard,
  getLeaderboardCount,
  saveFeedback,
  getFeedbackCount,
  getFeedbackForAdmin,
  moderateFeedback,
  updateUsername,
  getCompletedPuzzleIdsForUser,
  getPuzzleProgressForUser,
  markPuzzlePlayed,
  markPuzzleCompleted,
  markPuzzleAttempt,
  mergeCompletedPuzzles,
  mergePuzzleProgress,
  getBotPerformanceStats,
  recordFairPlayEvent,
  getFairPlayCases,
  getFairPlayCaseCount,
  dismissFairPlayCase,
  restrictUserForFairPlay,
  clearFairPlayRestriction,
  getUserById,
  deleteUser,
  type AuthUser,
  type FairPlayCaseStatus,
  type PuzzleProgressRecord,
  type RecentGamesFilter,
} from './database';
import { ServerToClientEvents, ClientToServerEvents, GameRoom, type PieceColor } from '../../shared/types';
import { getIndexablePaths } from '../../shared/seo';
import { logError, logInfo, logWarn } from './logger';
import { MonitoringStore } from './monitoring';
import { getAllowedCorsOrigins, isAllowedCorsOrigin, requireTrustedWriteOrigin, SocketRateLimiter } from './security';
import { clearSessionCookie, getAuthenticatedUser, getAuthenticatedUserFromCookieHeader, hasAdminMfaAccess, normalizeGuestPlayerId, logoutRequest } from './auth';
import { createSocketConnectionHandler, type AuthenticatedSocketData } from './socketHandlers';
import { shouldServeSpaShell } from './spa';
import { normalizeLeaderboardLimit, normalizeLeaderboardPage } from './leaderboardPagination';
import { analyzeGameWithEngine, analyzePositionWithEngine, getBotMoveWithEngine, warmUpReviewEngine } from './engineGateway';
import { betterAuthHandler } from './betterAuth';
import { deserializeAnalysisPosition } from '../../shared/engineAdapter';
import type { Move } from '../../shared/types';
import { getBotPersonaById } from '../../shared/botPersonas';
import { renderSeoHtml } from './seoHtml';
import {
  UpdateProfileSchema,
  SubmitFeedbackSchema,
  ReportFairPlaySchema,
  FairPlayCaseActionSchema,
  SaveBotGameSchema,
  SaveLocalGameSchema,
  AnalyzeGameSchema,
  AnalyzePositionSchema,
  BotMoveSchema,
  PuzzleVisitSchema,
  PuzzleCompleteSchema,
  PuzzleAttemptSchema,
  PuzzleSyncSchema,
  ClientErrorSchema,
  ClientDebugSchema,
} from '../../shared/validation';

const app = express();
app.disable('x-powered-by');
const httpServer = createServer(app);
const startTime = Date.now();
const moduleInitUptimeMs = Math.round(process.uptime() * 1000);
const allowedCorsOrigins = getAllowedCorsOrigins(process.env);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isAllowedCorsOrigin(origin, allowedCorsOrigins)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
};

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, AuthenticatedSocketData>(httpServer, {
  cors: {
    origin: allowedCorsOrigins,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

app.use(cors(corsOptions));
app.use(express.json());
const requireTrustedWriteOriginMiddleware = requireTrustedWriteOrigin(allowedCorsOrigins);

// Trust proxy for rate limiting behind reverse proxy (Fly.io, nginx, etc.)
app.set('trust proxy', 1);

// URL Canonicalization Redirects (SEO - fix Google Search Console issues)
// Redirects: www → non-www, HTTP → HTTPS, trailing slash normalization
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const protocol = req.protocol;
  const url = req.originalUrl;

  let redirectUrl: string | null = null;
  let statusCode = 301; // Permanent redirect for SEO

  // 1. Redirect www to non-www
  if (host.startsWith('www.')) {
    const nonWwwHost = host.slice(4);
    redirectUrl = `https://${nonWwwHost}${url}`;
  }
  // 2. Redirect HTTP to HTTPS (only in production, skip localhost)
  else if (protocol === 'http' && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    redirectUrl = `https://${host}${url}`;
  }

  // 3. Trailing slash normalization (except for files with extensions)
  // Remove trailing slash from URLs like /about/ → /about
  // But keep it for root / and file paths like /assets/image.png
  if (!redirectUrl && url.length > 1 && url.endsWith('/') && !url.match(/\/[^/]+\.[^/]+$/)) {
    redirectUrl = `https://${host}${url.slice(0, -1)}`;
  }

  if (redirectUrl) {
    res.redirect(statusCode, redirectUrl);
    return;
  }

  next();
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Please try again later.' },
});

const gameReviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Game review limit reached. Please try again later.' },
});

const positionAnalysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many position analysis requests. Please slow down.' },
});

// Request logging (lightweight)
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/') && !req.path.includes('/health')) {
    monitoring.increment('apiRequests');
    logInfo('api_request', { method: req.method, path: req.path, ip: req.ip });
  }
  next();
});

function findWorkspaceRoot(startDir: string): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { workspaces?: unknown };
        if (Array.isArray(parsed.workspaces) && parsed.workspaces.includes('server') && parsed.workspaces.includes('client')) {
          return currentDir;
        }
      } catch {
        // Ignore malformed package.json candidates and keep walking upward.
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }
    currentDir = parentDir;
  }
}

// Serve static files in production from the repo root regardless of tsx vs compiled output.
const workspaceRoot = findWorkspaceRoot(__dirname);
const clientDist = path.join(workspaceRoot, 'client', 'dist');
const assetDist = path.join(clientDist, 'assets');

app.use('/assets', express.static(assetDist, {
  immutable: true,
  maxAge: '1y',
  fallthrough: false,
}));

app.use(express.static(clientDist, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return;
    }

    if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));

function getSiteUrl(req?: express.Request): string {
  const configuredUrl = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (req) {
    return `${req.protocol}://${req.get('host')}`;
  }

  return 'https://thaichess.dev';
}

// Initialize database
const gameManager = new GameManager();
const matchmaking = new MatchmakingQueue();
const socketRateLimiter = new SocketRateLimiter();
const ipRateLimiter = new SocketRateLimiter();
const monitoring = new MonitoringStore();
let startupState: 'starting' | 'ready' | 'error' = 'starting';
let startupError: string | null = null;

// Cleanup old games every 30 minutes
setInterval(() => gameManager.cleanupOldGames(), 1800000);
// Cleanup stale matchmaking entries every minute
setInterval(() => matchmaking.cleanupStale(), 60000);
// Cleanup rate limiter buckets every minute
setInterval(() => {
  socketRateLimiter.cleanup();
  ipRateLimiter.cleanup();
}, 60000);

async function saveGameToDb(room: GameRoom, reason: string) {
  const winner = room.gameState.winner;
  return await saveCompletedGame({
    id: room.id,
    result: winner || 'draw',
    resultReason: reason,
    whiteName: room.whitePlayerName,
    blackName: room.blackPlayerName,
    whiteUserId: room.whiteUserId,
    blackUserId: room.blackUserId,
    rated: room.rated,
    gameMode: room.gameMode,
    gameType: room.gameMode === 'bot' ? 'bot' : 'human',
    timeControl: room.timeControl,
    moves: room.gameState.moveHistory,
    finalBoard: room.gameState.board,
    moveCount: room.gameState.moveCount,
  });
}

function getSignedInDisplayName(user: Awaited<ReturnType<typeof getAuthenticatedUser>>) {
  if (!user) return null;
  const username = user.username?.trim();
  if (username) return username;
  const emailPrefix = user.email.split('@')[0]?.trim();
  return emailPrefix || null;
}

function normalizeBotGamePlayerName(
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>,
  rawPlayerName: unknown,
) {
  const signedInDisplayName = getSignedInDisplayName(user);
  if (signedInDisplayName) return signedInDisplayName;
  if (typeof rawPlayerName === 'string' && rawPlayerName.trim()) return rawPlayerName.trim();
  return 'Anonymous';
}

function buildBotName(level: number, botId?: string) {
  if (botId) {
    return getBotPersonaById(botId).name;
  }

  return `Makruk Bot Lv.${level}`;
}

function isValidFairPlayCaseStatus(value: unknown): value is FairPlayCaseStatus {
  return value === 'open' || value === 'reviewed' || value === 'restricted' || value === 'dismissed';
}

function isValidGameIdParam(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9-]{4,64}$/.test(value.trim());
}

async function enforceAnalysisFairPlayPolicy(req: express.Request, res: express.Response, user?: AuthUser | null) {
  const analysisUser = user ?? await getAuthenticatedUser(req);
  if (!analysisUser) return false;

  const activeGameId = gameManager.getBlockingPlayerGame(analysisUser.id);
  if (!activeGameId) return false;

  const room = gameManager.getGame(activeGameId);
  if (!room || room.status !== 'playing' || !room.rated) return false;

  await recordFairPlayEvent({
    userId: analysisUser.id,
    type: 'analysis_blocked',
    gameId: activeGameId,
    metadata: {
      path: req.path,
      method: req.method,
      ip: req.ip,
    },
  });

  logWarn('fair_play_analysis_blocked', {
    userId: analysisUser.id,
    gameId: activeGameId,
    path: req.path,
    ip: req.ip,
  });
  res.status(403).json({ error: 'Fair play restriction: analysis is disabled during active rated games.' });
  return true;
}

async function resolveFairPlayReportTarget(gameId: string, reporterUserId: string) {
  const liveRoom = gameManager.getGame(gameId);
  if (liveRoom && liveRoom.status === 'finished' && liveRoom.rated) {
    if (liveRoom.whiteUserId === reporterUserId && liveRoom.blackUserId) {
      return liveRoom.blackUserId;
    }
    if (liveRoom.blackUserId === reporterUserId && liveRoom.whiteUserId) {
      return liveRoom.whiteUserId;
    }
    return null;
  }

  const savedGame = await getDbGame(gameId);
  if (!savedGame || savedGame.rated !== 1) return null;
  if (savedGame.white_user_id === reporterUserId && savedGame.black_user_id) {
    return savedGame.black_user_id;
  }
  if (savedGame.black_user_id === reporterUserId && savedGame.white_user_id) {
    return savedGame.white_user_id;
  }
  return null;
}

io.use(async (socket, next) => {
  try {
    const authUser = await getAuthenticatedUserFromCookieHeader(socket.handshake.headers.cookie);
    const guestPlayerId = normalizeGuestPlayerId(socket.handshake.auth?.guestPlayerId);
    socket.data.authUser = authUser;
    socket.data.playerId = authUser?.id ?? guestPlayerId ?? `guest_${socket.id}`;
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Socket authentication failed.'));
  }
});

io.on('connection', createSocketConnectionHandler({
  io,
  gameManager,
  matchmaking,
  socketRateLimiter,
  ipRateLimiter,
  monitoring,
  saveGameToDb,
}));

// --- REST API ---

async function requireUser(req: express.Request, res: express.Response) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  return user;
}

async function requireAdmin(req: express.Request, res: express.Response) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return null;
  }
  return user;
}

async function requireAdminWithMfa(req: express.Request, res: express.Response) {
  const user = await requireAdmin(req, res);
  if (!user) return null;
  if (!hasAdminMfaAccess(user)) {
    res.status(403).json({ error: 'Admin MFA required.' });
    return null;
  }
  return user;
}

app.get('/api/game/:id', async (req, res) => {
  // Check live games first
  const room = gameManager.getGame(req.params.id);
  if (room) {
    res.json({
      id: room.id,
      status: room.status,
      hasWhite: !!room.white,
      hasBlack: !!room.black,
      timeControl: room.timeControl,
      result: room.gameState.winner || (room.gameState.gameOver ? 'draw' : null),
      resultReason: room.gameState.resultReason || '',
      moves: room.gameState.moveHistory,
      finalBoard: room.gameState.board,
      moveCount: room.gameState.moveCount,
      createdAt: Math.floor(room.createdAt / 1000),
      finishedAt: room.status === 'finished' ? Math.floor(Date.now() / 1000) : null,
    });
    return;
  }
  // Check database for completed games
  const saved = await getDbGame(req.params.id);
  if (saved) {
    try {
      const moves = JSON.parse(saved.moves);
      const finalBoard = JSON.parse(saved.final_board);
      res.json({
        id: saved.id,
        status: 'finished',
        result: saved.result,
        resultReason: saved.result_reason,
        timeControl: { initial: saved.time_control_initial, increment: saved.time_control_increment },
        moves,
        finalBoard,
        moveCount: saved.move_count,
        createdAt: saved.created_at,
        finishedAt: saved.finished_at,
      });
    } catch (err) {
      logError('game_data_parse_failed', err, { gameId: req.params.id });
      res.status(500).json({ error: 'Failed to parse game data' });
    }
    return;
  }
  res.status(404).json({ error: 'Game not found' });
});

app.post('/api/analysis/game', analysisLimiter, gameReviewLimiter, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (await enforceAnalysisFairPlayPolicy(req, res, user)) return;

  const parseResult = AnalyzeGameSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid analysis request.' });
    return;
  }

  const { analysisId, moves, depth, movetimeMs } = parseResult.data;
  try {
    const analysis = await analyzeGameWithEngine(moves as Move[], { analysisId, depth, movetimeMs });
    res.json({ analysis });
  } catch (error) {
    logError('analysis_game_failed', error, {
      moveCount: moves.length,
      depth: depth ?? null,
      movetimeMs: movetimeMs ?? null,
      ip: req.ip,
    });
    res.status(503).json({ error: 'Analysis failed. Please try again later.' });
  }
});

app.post('/api/analysis/game/stream', analysisLimiter, gameReviewLimiter, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (await enforceAnalysisFairPlayPolicy(req, res, user)) return;

  const parseResult = AnalyzeGameSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid analysis request.' });
    return;
  }
  const { analysisId, moves, depth, movetimeMs } = parseResult.data;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  const writeEvent = (event: 'progress' | 'result' | 'error', payload: unknown) => {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const analysis = await analyzeGameWithEngine(
      moves as Move[],
      { analysisId, depth, movetimeMs },
      progress => writeEvent('progress', { progress }),
    );
    writeEvent('result', { analysis });
    res.end();
  } catch (error) {
    logError('analysis_game_stream_failed', error, {
      moveCount: moves.length,
      depth: depth ?? null,
      movetimeMs: movetimeMs ?? null,
      ip: req.ip,
    });
    writeEvent('error', {
      message: 'Analysis failed. Please try again later.',
    });
    res.end();
  }
});

app.post('/api/analysis/position', analysisLimiter, positionAnalysisLimiter, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  if (await enforceAnalysisFairPlayPolicy(req, res, user)) return;

  const parseResult = AnalyzePositionSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const positionError = flattened.fieldErrors.position?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = positionError || formError || 'Valid position is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { position, counting, depth, movetimeMs, nodes, multipv } = parseResult.data;
  const snapshot = deserializeAnalysisPosition(position, counting);

  if (!snapshot) {
    res.status(400).json({ error: 'Valid position is required.' });
    return;
  }

  const analysis = await analyzePositionWithEngine(snapshot, {
    depth,
    movetimeMs,
    nodes,
  }, multipv);

  res.json(analysis);
});

app.post('/api/bot/move', analysisLimiter, async (req, res) => {
  if (await enforceAnalysisFairPlayPolicy(req, res)) return;

  const parseResult = BotMoveSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const positionError = flattened.fieldErrors.position?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = positionError || formError || 'Valid position is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { position, counting, level, botId } = parseResult.data;
  const snapshot = deserializeAnalysisPosition(position, counting);

  if (!snapshot) {
    res.status(400).json({ error: 'Valid position is required.' });
    return;
  }

  const result = await getBotMoveWithEngine(snapshot, level, botId);
  res.json(result);
});

app.post('/api/games/bot', async (req, res) => {
  const parseResult = SaveBotGameSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    // Get first field error
    const fieldErrors = Object.values(flattened.fieldErrors);
    const firstFieldError = fieldErrors.find(err => err && err.length > 0)?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = firstFieldError || formError || 'Valid bot game payload is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const {
    id,
    result,
    resultReason,
    playerColor,
    level,
    botId,
    moves,
    finalBoard,
    moveCount,
    timeControl,
    playerName: rawPlayerName,
  } = parseResult.data;

  const user = await getAuthenticatedUser(req);
  const playerName = normalizeBotGamePlayerName(user, rawPlayerName);
  const botColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const botName = buildBotName(level, botId);

  await saveCompletedGame({
    id,
    result,
    resultReason,
    whiteName: playerColor === 'white' ? playerName : botName,
    blackName: playerColor === 'black' ? playerName : botName,
    whiteUserId: playerColor === 'white' ? user?.id ?? null : null,
    blackUserId: playerColor === 'black' ? user?.id ?? null : null,
    rated: false,
    gameMode: 'bot',
    gameType: 'bot',
    opponentType: 'bot',
    opponentName: botName,
    botLevel: level,
    botColor,
    timeControl,
    moves,
    finalBoard,
    moveCount: moveCount ?? moves.length,
  });

  res.json({
    ok: true,
    id,
    opponentName: botName,
    gameType: 'bot',
  });
});

app.post('/api/games/local', async (req, res) => {
  const parseResult = SaveLocalGameSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const fieldErrors = Object.values(flattened.fieldErrors);
    const firstFieldError = fieldErrors.find(err => err && err.length > 0)?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = firstFieldError || formError || 'Valid local game payload is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const {
    id,
    result,
    resultReason,
    whiteName,
    blackName,
    moves,
    finalBoard,
    moveCount,
    timeControl,
  } = parseResult.data;

  await saveCompletedGame({
    id,
    result,
    resultReason,
    whiteName: whiteName || 'White',
    blackName: blackName || 'Black',
    whiteUserId: null,
    blackUserId: null,
    rated: false,
    gameMode: 'private',
    gameType: 'human',
    opponentType: null,
    opponentName: null,
    timeControl,
    moves,
    finalBoard,
    moveCount: moveCount ?? moves.length,
  });

  res.json({
    ok: true,
    id,
    gameType: 'local',
  });
});

app.get('/api/games/recent', async (_req, res) => {
  const page = parseInt(_req.query.page as string) || 0;
  const limit = Math.min(parseInt(_req.query.limit as string) || 20, 50);
  const filter = _req.query.filter === 'rated' || _req.query.filter === 'casual' || _req.query.filter === 'bot'
    ? _req.query.filter as RecentGamesFilter
    : 'all';
  const [games, total, botStats] = await Promise.all([
    getRecentGames(limit, page * limit, filter),
    getGameCount(filter),
    getBotPerformanceStats(),
  ]);
  res.json({ games, total, page, limit, filter, botStats });
});

app.get('/api/leaderboard', async (req, res) => {
  const page = normalizeLeaderboardPage(req.query.page as string | undefined);
  const limit = normalizeLeaderboardLimit(req.query.limit as string | undefined);
  const [players, total] = await Promise.all([
    getLeaderboard(limit, page * limit),
    getLeaderboardCount(),
  ]);
  res.json({ players, total, page, limit });
});

app.get('/api/stats', async (_req, res) => {
  const stats = await getStats();
  res.json(stats);
});

app.get('/api/live-games', (req, res) => {
  const rawLimit = parseInt(String(req.query.limit ?? '12'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 40) : 12;
  const status = req.query.status === 'live' ? 'live' : 'all';
  const games = gameManager.getPublicLiveGames({ status, limit });

  res.json({
    games,
    total: games.length,
    status,
  });
});

app.get('/api/auth/me', async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    clearSessionCookie(res);
    res.json({ user: null });
    return;
  }

  res.json({ user });
});

app.post('/api/auth/logout', requireTrustedWriteOriginMiddleware, async (req, res) => {
  await logoutRequest(req, res);
  res.json({ ok: true });
});

app.patch('/api/auth/profile', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parseResult = UpdateProfileSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const usernameError = flattened.fieldErrors.username?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = usernameError || formError || 'Invalid username.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { username } = parseResult.data;

  const updated = await updateUsername(user.id, username);
  if (!updated) {
    res.status(400).json({ error: 'Username is unavailable.' });
    return;
  }

  res.json({ ok: true, user: updated });
});

app.delete('/api/auth/user', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    // Delete user from database
    const deleted = await deleteUser(user.id);
    
    if (!deleted) {
      res.status(500).json({ error: 'Failed to delete account' });
      return;
    }
    
    // Clear session cookie
    clearSessionCookie(res);
    
    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.all('/api/auth/*', betterAuthHandler);

const fairPlayReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many fair-play reports. Please try again later.' },
});

app.get('/api/fair-play/cases', async (req, res) => {
  const admin = await requireAdminWithMfa(req, res);
  if (!admin) return;

  const page = parseInt(req.query.page as string) || 0;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const rawStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
  const status = rawStatus === 'all'
    ? 'all'
    : isValidFairPlayCaseStatus(rawStatus)
      ? rawStatus
      : 'open';

  const [cases, total] = await Promise.all([
    getFairPlayCases(limit, page * limit, status),
    getFairPlayCaseCount(status),
  ]);
  res.json({ cases, total, page, limit, status });
});

app.post('/api/fair-play/report', requireTrustedWriteOriginMiddleware, fairPlayReportLimiter, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parseResult = ReportFairPlaySchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const gameIdError = flattened.fieldErrors.gameId?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = gameIdError || formError || 'Valid gameId is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { gameId, message } = parseResult.data;

  const targetUserId = await resolveFairPlayReportTarget(gameId, user.id);
  if (!targetUserId) {
    res.status(400).json({ error: 'Only finished rated games against a signed-in opponent can be reported.' });
    return;
  }

  const result = await recordFairPlayEvent({
    userId: targetUserId,
    type: 'user_reported',
    gameId,
    reporterUserId: user.id,
    metadata: {
      message: message || null,
    },
  });
  if (!result.event) {
    res.status(500).json({ error: 'Failed to submit fair-play report.' });
    return;
  }

  res.json({ ok: true });
});

app.post('/api/fair-play/cases/:id/restrict', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const admin = await requireAdminWithMfa(req, res);
  if (!admin) return;

  const caseId = Number(req.params.id);
  if (!Number.isInteger(caseId) || caseId <= 0) {
    res.status(400).json({ error: 'Invalid case ID.' });
    return;
  }

  const parseResult = FairPlayCaseActionSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const noteError = flattened.fieldErrors.note?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = noteError || formError || 'Invalid request.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { note } = parseResult.data;
  const ok = await restrictUserForFairPlay(caseId, admin.id, note);
  if (!ok) {
    res.status(500).json({ error: 'Failed to restrict player.' });
    return;
  }

  res.json({ ok: true });
});

app.post('/api/fair-play/cases/:id/dismiss', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const admin = await requireAdminWithMfa(req, res);
  if (!admin) return;

  const caseId = Number(req.params.id);
  if (!Number.isInteger(caseId) || caseId <= 0) {
    res.status(400).json({ error: 'Invalid case ID.' });
    return;
  }

  const parseResult = FairPlayCaseActionSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const noteError = flattened.fieldErrors.note?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = noteError || formError || 'Invalid request.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { note } = parseResult.data;
  const ok = await dismissFairPlayCase(caseId, admin.id, note);
  if (!ok) {
    res.status(500).json({ error: 'Failed to dismiss case.' });
    return;
  }

  res.json({ ok: true });
});

app.post('/api/fair-play/users/:id/clear', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const admin = await requireAdminWithMfa(req, res);
  if (!admin) return;

  const userId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
  if (!userId) {
    res.status(400).json({ error: 'Invalid user ID.' });
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'Player not found.' });
    return;
  }

  const parseResult = FairPlayCaseActionSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const noteError = flattened.fieldErrors.note?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = noteError || formError || 'Invalid request.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { note } = parseResult.data;
  const ok = await clearFairPlayRestriction(user.id, admin.id, note);
  if (!ok) {
    res.status(500).json({ error: 'Failed to clear restriction.' });
    return;
  }

  res.json({ ok: true });
});

app.get('/api/puzzle-progress', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const progressRecords = await getPuzzleProgressForUser(user.id);
  const completedPuzzleIds = await getCompletedPuzzleIdsForUser(user.id);
  res.json({ completedPuzzleIds, progressRecords });
});

app.post('/api/puzzle-progress/visit', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parseResult = PuzzleVisitSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const puzzleIdError = flattened.fieldErrors.puzzleId?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = puzzleIdError || formError || 'Valid puzzleId is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { puzzleId } = parseResult.data;

  const progressRecords = await markPuzzlePlayed(user.id, puzzleId);
  const completedPuzzleIds = progressRecords
    .filter(record => record.completedAt !== null)
    .map(record => record.puzzleId);
  res.json({ ok: true, completedPuzzleIds, progressRecords });
});

app.post('/api/puzzle-progress/complete', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parseResult = PuzzleCompleteSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const puzzleIdError = flattened.fieldErrors.puzzleId?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = puzzleIdError || formError || 'Valid puzzleId is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { puzzleId } = parseResult.data;

  const progressRecords = await markPuzzleCompleted(user.id, puzzleId);
  const completedPuzzleIds = progressRecords
    .filter(record => record.completedAt !== null)
    .map(record => record.puzzleId);
  res.json({ ok: true, completedPuzzleIds, progressRecords });
});

app.post('/api/puzzle-progress/attempt', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parseResult = PuzzleAttemptSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const puzzleIdError = flattened.fieldErrors.puzzleId?.[0];
    const succeededError = flattened.fieldErrors.succeeded?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = puzzleIdError || succeededError || formError || 'Valid puzzleId and succeeded status are required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { puzzleId, succeeded } = parseResult.data;

  const progressRecords = await markPuzzleAttempt(user.id, puzzleId, succeeded);
  const completedPuzzleIds = progressRecords
    .filter(record => record.completedAt !== null)
    .map(record => record.puzzleId);
  res.json({ ok: true, completedPuzzleIds, progressRecords });
});

app.post('/api/puzzle-progress/sync', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parseResult = PuzzleSyncSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const progressRecordsError = flattened.fieldErrors.progressRecords?.[0];
    const completedPuzzleIdsError = flattened.fieldErrors.completedPuzzleIds?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = progressRecordsError || completedPuzzleIdsError || formError || 'progressRecords or completedPuzzleIds is required.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { progressRecords: rawProgressRecords, completedPuzzleIds: rawPuzzleIds } = parseResult.data;

  let progressRecords: PuzzleProgressRecord[];
  if (rawProgressRecords) {
    progressRecords = await mergePuzzleProgress(
      user.id,
      rawProgressRecords.map((value) => ({
        puzzleId: value.puzzleId,
        lastPlayedAt: value.lastPlayedAt,
        completedAt: value.completedAt ?? null,
        attempts: value.attempts,
        successes: value.successes,
        failures: value.failures,
      })),
    );
  } else if (rawPuzzleIds) {
    await mergeCompletedPuzzles(user.id, rawPuzzleIds);
    progressRecords = await getPuzzleProgressForUser(user.id);
  } else {
    // Should not happen due to schema validation, but handle gracefully
    res.status(400).json({ error: 'progressRecords or completedPuzzleIds is required.' });
    return;
  }

  const completedPuzzleIds = progressRecords
    .filter(record => record.completedAt !== null)
    .map(record => record.puzzleId);
  res.json({ ok: true, completedPuzzleIds, progressRecords });
});

app.post('/api/client-errors', (req, res) => {
  const parseResult = ClientErrorSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const messageError = flattened.fieldErrors.message?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = messageError || formError || 'Invalid client error payload';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { source, message, stack, componentStack, url, userAgent } = parseResult.data;

  monitoring.increment('clientErrors');
  logError('client_error', new Error(message), {
    source: source || 'unknown',
    stack: stack || undefined,
    componentStack: componentStack || undefined,
    url: url || undefined,
    userAgent: userAgent || req.headers['user-agent'],
    ip: req.ip,
  });

  res.status(204).end();
});

app.post('/api/client-debug', (req, res) => {
  const parseResult = ClientDebugSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const entriesError = flattened.fieldErrors.entries?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = entriesError || formError || 'Invalid client debug payload';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { entries, url, userAgent } = parseResult.data;

  for (const entry of entries) {
    logInfo('client_debug', {
      eventName: entry.event,
      clientTs: entry.ts,
      path: entry.path,
      detail: entry.detail,
      url: url || undefined,
      userAgent: userAgent || req.headers['user-agent'],
      ip: req.ip,
    });
  }

  res.status(204).end();
});

// Health check — used by hosting platforms to know the server is alive
app.get('/api/health', (_req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const connectedPlayers = io.engine.clientsCount;
  const gameCounts = gameManager.getGameCounts();
  const queueSize = matchmaking.getQueueSize();
  const statusCode = startupState === 'ready' ? 200 : startupState === 'starting' ? 503 : 500;
  res.status(statusCode).json({
    status: startupState === 'ready' ? 'ok' : startupState,
    uptime,
    connectedPlayers,
    activeGames: gameCounts.playing,
    rooms: gameCounts,
    queueSize,
    counters: monitoring.snapshot(),
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    startupError,
  });
});

// Feedback endpoint — users can report bugs from the app
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many feedback submissions. Please try again later.' },
});

app.get('/api/feedback', async (req, res) => {
  const admin = await requireAdminWithMfa(req, res);
  if (!admin) return;

  const page = parseInt(req.query.page as string) || 0;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const type = (req.query.type as string) || undefined;
  const [feedback, total] = await Promise.all([
    getFeedbackForAdmin(limit, page * limit, type),
    getFeedbackCount(type),
  ]);
  res.json({ feedback, total, page, limit });
});

app.post('/api/feedback', feedbackLimiter, async (req, res) => {
  const parseResult = SubmitFeedbackSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const messageError = flattened.fieldErrors.message?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = messageError || formError || 'Invalid feedback';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { type, message, page, userAgent } = parseResult.data;
  
  const feedback = {
    type,
    message,
    page: page || 'unknown',
    userAgent: userAgent || req.headers['user-agent'] || 'unknown',
    ip: req.ip,
    userId: (await getAuthenticatedUser(req))?.id ?? null,
    timestamp: new Date().toISOString(),
  };
  logInfo('feedback_received', { feedback });
  await saveFeedback(feedback);
  res.json({ ok: true });
});

app.delete('/api/feedback/:id', requireTrustedWriteOriginMiddleware, async (req, res) => {
  const admin = await requireAdminWithMfa(req, res);
  if (!admin) return;

  const feedbackId = Number(req.params.id);
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    res.status(400).json({ error: 'Invalid feedback ID.' });
    return;
  }

  const parseResult = FairPlayCaseActionSchema.safeParse(req.body);
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten();
    const noteError = flattened.fieldErrors.note?.[0];
    const formError = flattened.formErrors[0];
    const errorMessage = noteError || formError || 'Invalid request.';
    res.status(400).json({ error: errorMessage });
    return;
  }

  const { note } = parseResult.data;
  const ok = await moderateFeedback(feedbackId, admin.id, note);
  if (!ok) {
    res.status(500).json({ error: 'Failed to moderate feedback.' });
    return;
  }

  res.json({ ok: true });
});

app.get('/robots.txt', (req, res) => {
  const siteUrl = getSiteUrl(req);
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /account',
    'Disallow: /analysis',
    'Disallow: /feedback',
    'Disallow: /game',
    'Disallow: /login',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const siteUrl = getSiteUrl(req);
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = getIndexablePaths()
    .map((pathname) => [
      '  <url>',
      `    <loc>${siteUrl}${pathname}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      pathname === '/' ? '    <priority>1.0</priority>' : '    <priority>0.8</priority>',
      '  </url>',
    ].join('\n'))
    .join('\n');

  res.type('application/xml').send([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
  ].join('\n'));
});

// SPA fallback (must be last)
app.get('*', (req, res) => {
  // Never answer asset/file requests with the SPA shell.
  if (!shouldServeSpaShell(req.path)) {
    res.status(404).type('text/plain').send('Not found');
    return;
  }

  const indexPath = path.join(clientDist, 'index.html');

  try {
    const template = fs.readFileSync(indexPath, 'utf8');
    const html = renderSeoHtml(template, req.path, getSiteUrl(req));
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.type('html').send(html);
  } catch (error) {
    logWarn('spa_fallback_template_read_failed', {
      path: indexPath,
      error: error instanceof Error ? error.message : String(error),
    });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(indexPath);
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST?.trim() || undefined;
const normalizedPort = Number(PORT);

function getProcessUptimeMs() {
  return Math.round(process.uptime() * 1000);
}

logInfo('server_bootstrap_ready', {
  environment: process.env.NODE_ENV || 'development',
  moduleInitUptimeMs,
});

process.on('uncaughtException', (error) => {
  monitoring.increment('uncaughtExceptions');
  logError('uncaught_exception', error);
});

process.on('unhandledRejection', (reason) => {
  monitoring.increment('unhandledRejections');
  logError('unhandled_rejection', reason);
});

async function startServer() {
  const databaseInitStartedAt = Date.now();
  logInfo('server_bootstrap_start', {
    port: normalizedPort,
    host: HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeMs: getProcessUptimeMs(),
    moduleInitUptimeMs,
  });

  const onStarted = () => {
    logInfo('server_started', {
      port: normalizedPort,
      host: HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptimeMs: getProcessUptimeMs(),
      moduleInitUptimeMs,
    });
  };

  if (HOST) {
    httpServer.listen(normalizedPort, HOST, onStarted);
  } else {
    httpServer.listen(normalizedPort, onStarted);
  }

  try {
    logInfo('database_initializing', {
      port: normalizedPort,
      host: HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptimeMs: getProcessUptimeMs(),
    });
    await initDatabase();
    startupState = 'ready';
    startupError = null;
    void warmUpReviewEngine();
    logInfo('server_ready', {
      port: normalizedPort,
      host: HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptimeMs: getProcessUptimeMs(),
      databaseInitDurationMs: Date.now() - databaseInitStartedAt,
      moduleInitUptimeMs,
    });
  } catch (error) {
    startupState = 'error';
    startupError = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

void startServer().catch((error) => {
  logError('server_start_failed', error, {
    port: normalizedPort,
    host: HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
  process.exit(1);
});
