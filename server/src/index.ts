import './env';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors, { type CorsOptions } from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { GameManager } from './gameManager';
import { MatchmakingQueue } from './matchmaking';
import {
  initDatabase,
  saveCompletedGame,
  runAllCleanupJobs,
} from './database';
import { ServerToClientEvents, ClientToServerEvents, GameRoom } from '../../shared/types';
import { logError, logInfo, logWarn } from './logger';
import { MonitoringStore } from './monitoring';
import { getAllowedCorsOrigins, isAllowedCorsOrigin, requireTrustedWriteOrigin, SocketRateLimiter } from './security';
import { getAuthenticatedUserFromCookieHeader, normalizeGuestPlayerId, verifyGuestCredentials } from './auth';
import { createSocketConnectionHandler, emitGameOverToParticipants, type AuthenticatedSocketData } from './socketHandlers';
import { warmUpReviewEngine } from './engineGateway';
import { getCanonicalRedirectUrl } from './urlCanonicalization';
import { createAnalysisRouter } from './routes/analysis';
import { createAuthRouter } from './routes/auth';
import { createClientTelemetryRouter } from './routes/clientTelemetry';
import { createFairPlayRouter } from './routes/fairPlay';
import { createFeedbackRouter } from './routes/feedback';
import { createGamesRouter } from './routes/games';
import { createLeaderboardRouter } from './routes/leaderboard';
import { createPuzzlesRouter } from './routes/puzzles';
import { createSeoRouter } from './routes/seo';
import { createSpaRouter } from './routes/spa';
import { findWorkspaceRoot } from './routes/siteUrl';

const app = express();
app.disable('x-powered-by');
const httpServer = createServer(app);
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

// Correlation ID middleware for request tracing
app.use((req, res, next) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
});

const requireTrustedWriteOriginMiddleware = requireTrustedWriteOrigin(allowedCorsOrigins);

// Trust proxy for rate limiting behind reverse proxy (Fly.io, nginx, etc.)
app.set('trust proxy', 1);

// URL Canonicalization Redirects (SEO - fix Google Search Console issues)
// Redirects: www → non-www, HTTP → HTTPS, trailing slash normalization
app.use((req, res, next) => {
  const redirectUrl = getCanonicalRedirectUrl({
    host: req.get('host') || '',
    protocol: req.protocol,
    originalUrl: req.originalUrl,
  });

  if (redirectUrl) {
    res.redirect(301, redirectUrl);
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

const gameManager = new GameManager();
const matchmaking = new MatchmakingQueue();
const socketRateLimiter = new SocketRateLimiter();
const ipRateLimiter = new SocketRateLimiter();
const monitoring = new MonitoringStore();
let startupState: 'starting' | 'ready' | 'error' = 'starting';
let startupError: string | null = null;

// Request logging (lightweight)
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/') && !req.path.includes('/health')) {
    monitoring.increment('apiRequests');
    logInfo('api_request', { method: req.method, path: req.path, ip: req.ip });
  }
  next();
});

// Serve static files in production from the repo root regardless of tsx vs compiled output.
const workspaceRoot = findWorkspaceRoot(process.cwd());
const clientDist = path.join(workspaceRoot, 'client', 'dist');
const assetDist = path.join(clientDist, 'assets');

app.use((_, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use('/assets', express.static(assetDist, {
  immutable: true,
  maxAge: '1y',
  fallthrough: false,
}));

app.use(createSeoRouter());

app.use(express.static(clientDist, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return;
    }

    if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|wasm)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));

const cleanupIntervals: NodeJS.Timeout[] = [];
cleanupIntervals.push(setInterval(() => {
  gameManager.cleanupOldGames({
    onDisconnectedExpired: (room) => {
      monitoring.recordEvent('game.reconnectFailure', 'game_reconnect_failure', {
        gameId: room.id,
        reason: 'disconnect_ttl_expired',
        rated: room.rated,
      });

      if (!room.whitePlayerId && !room.blackPlayerId) return;

      monitoring.increment('gamesFinished');
      void saveGameToDb(room, 'timeout')
        .then(({ ratingChange }) => {
          emitGameOverToParticipants(io, gameManager, room, 'timeout', ratingChange);
        })
        .catch((error) => {
          logError('expired_game_persistence_failed', error, { gameId: room.id });
        });
    },
  });
}, 1800000));
// Cleanup stale matchmaking entries every minute
cleanupIntervals.push(setInterval(() => matchmaking.cleanupStale(), 60000));
// Cleanup rate limiter buckets every minute
cleanupIntervals.push(setInterval(() => {
  socketRateLimiter.cleanup();
  ipRateLimiter.cleanup();
}, 60000));
// Cleanup expired database records every hour
cleanupIntervals.push(setInterval(() => runAllCleanupJobs(), 3600000));

let inFlightGameSaves = 0;

async function saveGameToDb(room: GameRoom, reason: string) {
  inFlightGameSaves += 1;
  try {
    const winner = room.gameState.winner;
    const result = await saveCompletedGame({
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

    if (room.rated) {
      for (let i = 0; i < result.busyRetries; i += 1) {
        monitoring.recordEvent('game.ratedSaveRetry', 'rated_game_save_retry', {
          gameId: room.id,
          retryIndex: i + 1,
        });
      }
      if (result.persistence === 'duplicate') {
        monitoring.recordEvent('game.ratedDuplicate', 'rated_game_duplicate', {
          gameId: room.id,
        });
      }
    }

    return { ratingChange: result.ratingChange };
  } finally {
    inFlightGameSaves -= 1;
  }
}

io.use(async (socket, next) => {
  try {
    const authUser = await getAuthenticatedUserFromCookieHeader(socket.handshake.headers.cookie);
    const claimedGuestPlayerId = normalizeGuestPlayerId(socket.handshake.auth?.guestPlayerId);
    const guestPlayerId = claimedGuestPlayerId && verifyGuestCredentials(claimedGuestPlayerId, socket.handshake.auth?.guestToken)
      ? claimedGuestPlayerId
      : null;

    if (claimedGuestPlayerId && !guestPlayerId) {
      monitoring.increment('socket.guestIdentityRejected');
      logWarn('guest_identity_rejected', { socketId: socket.id });
    }

    socket.data.authUser = authUser;
    socket.data.playerId = authUser?.id ?? guestPlayerId ?? `guest_${socket.id}`;
    next();
  } catch (error) {
    logError('socket_auth_failed', error, { socketId: socket.id });
    next(error instanceof Error ? error : new Error('Socket authentication failed.'));
  }
});

// Global Socket.IO error handler
io.on('connect_error', (error) => {
  logError('socket_connect_error', error);
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

// --- REST API (domain routers) ---
app.use(createGamesRouter({ gameManager }));
app.use(createAnalysisRouter({
  gameManager,
  analysisLimiter,
  gameReviewLimiter,
  positionAnalysisLimiter,
}));
app.use(createLeaderboardRouter({
  monitoring,
  getStartupState: () => startupState,
  getStartupError: () => startupError,
}));
app.use(createAuthRouter({ requireTrustedWriteOriginMiddleware }));
app.use(createFairPlayRouter({ gameManager, requireTrustedWriteOriginMiddleware }));
app.use(createPuzzlesRouter({ requireTrustedWriteOriginMiddleware }));
app.use(createClientTelemetryRouter({ monitoring }));
app.use(createFeedbackRouter({ requireTrustedWriteOriginMiddleware }));

// SPA fallback (must be last before error handler)
app.use(createSpaRouter({ clientDist }));

// Global error handler for Express (must be after all routes)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string;
  logError('express_unhandled_error', err, { correlationId, path: req.path, method: req.method });

  if (res.headersSent) {
    next(err);
    return;
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    correlationId,
  });
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

const SHUTDOWN_GRACE_MS = 10_000;
let isShuttingDown = false;

function waitForInFlightGameSaves(): Promise<void> {
  if (inFlightGameSaves === 0) return Promise.resolve();
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const poll = setInterval(() => {
      if (inFlightGameSaves === 0 || Date.now() - startedAt >= SHUTDOWN_GRACE_MS) {
        clearInterval(poll);
        resolve();
      }
    }, 100);
  });
}

async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logInfo('server_shutdown_started', {
    signal,
    inFlightGameSaves,
    uptimeMs: getProcessUptimeMs(),
  });

  // Stop accepting new work first so the platform stops routing traffic here.
  cleanupIntervals.forEach((interval) => clearInterval(interval));
  if (httpServer.listening) {
    httpServer.close();
  }
  io.disconnectSockets(true);

  // Let in-flight game saves (rated transactions, position batches) complete
  // instead of killing them mid-write on deploy.
  await waitForInFlightGameSaves();

  logInfo('server_shutdown_complete', {
    signal,
    uptimeMs: getProcessUptimeMs(),
  });
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

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
