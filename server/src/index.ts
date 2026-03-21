import express from 'express';
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { GameManager } from './gameManager';
import { MatchmakingQueue, QueueEntry } from './matchmaking';
import { initDatabase, saveCompletedGame, getRecentGames, getGame as getDbGame, getStats, getGameCount, saveFeedback, getFeedbackCount, getFeedbackForAdmin, moderateFeedback, updateUsername } from './database';
import { ServerToClientEvents, ClientToServerEvents, GameRoom } from '../../shared/types';
import { logError, logInfo, logWarn } from './logger';
import { MonitoringStore } from './monitoring';
import { getSocketIp, isValidBoolean, isValidGameId, isValidPosition, isValidTimeControl, SocketRateLimiter } from './security';
import { clearSessionCookie, getAuthenticatedUser, isValidEmail, isValidUsername, issueLoginCode, logoutRequest, normalizeEmail, normalizeUsername, setSessionCookie, verifyLoginCode } from './auth';
import { createSocketConnectionHandler } from './socketHandlers';

const app = express();
const httpServer = createServer(app);
const startTime = Date.now();

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

app.use(cors());
app.use(express.json());

// Trust proxy for rate limiting behind reverse proxy (Fly.io, nginx, etc.)
app.set('trust proxy', 1);

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Request logging (lightweight)
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/') && !req.path.includes('/health')) {
    monitoring.increment('apiRequests');
    logInfo('api_request', { method: req.method, path: req.path, ip: req.ip });
  }
  next();
});

// Serve static files in production (__dirname = server/dist/server/src when compiled)
const clientDist = path.join(__dirname, '../../../../client/dist');
app.use(express.static(clientDist));

// Initialize database
const gameManager = new GameManager();
const matchmaking = new MatchmakingQueue();
const socketRateLimiter = new SocketRateLimiter();
const ipRateLimiter = new SocketRateLimiter();
const monitoring = new MonitoringStore();

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
  await saveCompletedGame({
    id: room.id,
    result: winner || 'draw',
    resultReason: reason,
    timeControl: room.timeControl,
    moves: room.gameState.moveHistory,
    finalBoard: room.gameState.board,
    moveCount: room.gameState.moveCount,
  });
}

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
    res.json({
      id: saved.id,
      status: 'finished',
      result: saved.result,
      resultReason: saved.result_reason,
      timeControl: { initial: saved.time_control_initial, increment: saved.time_control_increment },
      moves: JSON.parse(saved.moves),
      finalBoard: JSON.parse(saved.final_board),
      moveCount: saved.move_count,
      createdAt: saved.created_at,
      finishedAt: saved.finished_at,
    });
    return;
  }
  res.status(404).json({ error: 'Game not found' });
});

app.get('/api/games/recent', async (_req, res) => {
  const page = parseInt(_req.query.page as string) || 0;
  const limit = Math.min(parseInt(_req.query.limit as string) || 20, 50);
  const [games, total] = await Promise.all([
    getRecentGames(limit, page * limit),
    getGameCount(),
  ]);
  res.json({ games, total, page, limit });
});

app.get('/api/stats', async (_req, res) => {
  const stats = await getStats();
  res.json(stats);
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
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

app.post('/api/auth/request-code', authLimiter, async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ''));
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  try {
    await issueLoginCode(email, req.ip);
    res.json({ ok: true });
  } catch (error) {
    logError('auth_request_code_failed', error, { email });
    res.status(503).json({ error: 'Login email is not configured yet.' });
  }
});

app.post('/api/auth/verify-code', authLimiter, async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ''));
  const code = String(req.body?.code || '').trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: 'Invalid email or code.' });
    return;
  }

  const result = await verifyLoginCode(email, code);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  await setSessionCookie(res, result.user.id);
  res.json({ ok: true, user: result.user });
});

app.post('/api/auth/logout', async (req, res) => {
  await logoutRequest(req, res);
  res.json({ ok: true });
});

app.patch('/api/auth/profile', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const username = normalizeUsername(String(req.body?.username || ''));
  if (!isValidUsername(username)) {
    res.status(400).json({ error: 'Username must be 3-20 characters using letters, numbers, or underscores.' });
    return;
  }

  const updated = await updateUsername(user.id, username);
  if (!updated) {
    res.status(400).json({ error: 'Username is unavailable.' });
    return;
  }

  res.json({ ok: true, user: updated });
});

app.post('/api/client-errors', (req, res) => {
  const { source, message, stack, componentStack, url, userAgent } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Invalid client error payload' });
    return;
  }

  monitoring.increment('clientErrors');
  logError('client_error', new Error(message), {
    source: typeof source === 'string' ? source : 'unknown',
    stack: typeof stack === 'string' ? stack : undefined,
    componentStack: typeof componentStack === 'string' ? componentStack : undefined,
    url: typeof url === 'string' ? url : undefined,
    userAgent: typeof userAgent === 'string' ? userAgent : req.headers['user-agent'],
    ip: req.ip,
  });

  res.status(204).end();
});

// Health check — used by hosting platforms to know the server is alive
app.get('/api/health', (_req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const connectedPlayers = io.engine.clientsCount;
  const gameCounts = gameManager.getGameCounts();
  const queueSize = matchmaking.getQueueSize();
  res.json({
    status: 'ok',
    uptime,
    connectedPlayers,
    activeGames: gameCounts.playing,
    rooms: gameCounts,
    queueSize,
    counters: monitoring.snapshot(),
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Feedback endpoint — users can report bugs from the app
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many feedback submissions. Please try again later.' },
});

app.get('/api/feedback', async (req, res) => {
  const admin = await requireAdmin(req, res);
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
  const { type, message, page, userAgent } = req.body;
  if (!message || typeof message !== 'string' || message.length > 2000) {
    res.status(400).json({ error: 'Invalid feedback' });
    return;
  }
  const feedback = {
    type: type || 'bug',
    message: message.slice(0, 2000),
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

app.delete('/api/feedback/:id', async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const feedbackId = Number(req.params.id);
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    res.status(400).json({ error: 'Invalid feedback ID.' });
    return;
  }

  const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : undefined;
  const ok = await moderateFeedback(feedbackId, admin.id, note);
  if (!ok) {
    res.status(500).json({ error: 'Failed to moderate feedback.' });
    return;
  }

  res.json({ ok: true });
});

// SPA fallback (must be last)
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;
process.on('uncaughtException', (error) => {
  monitoring.increment('uncaughtExceptions');
  logError('uncaught_exception', error);
});

process.on('unhandledRejection', (reason) => {
  monitoring.increment('unhandledRejections');
  logError('unhandled_rejection', reason);
});

async function startServer() {
  await initDatabase();

  httpServer.listen(PORT, () => {
    logInfo('server_started', {
      port: Number(PORT),
      environment: process.env.NODE_ENV || 'development',
    });
  });
}

void startServer().catch((error) => {
  logError('server_start_failed', error, {
    port: Number(PORT),
    environment: process.env.NODE_ENV || 'development',
  });
  process.exit(1);
});
