import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { GameManager } from './gameManager';
import { MatchmakingQueue } from './matchmaking';
import { initDatabase, saveCompletedGame, getRecentGames, getGame as getDbGame, getStats, getGameCount, getLeaderboard, getLeaderboardCount, saveFeedback, getFeedbackCount, getFeedbackForAdmin, moderateFeedback, updateUsername, type RecentGamesFilter } from './database';
import { ServerToClientEvents, ClientToServerEvents, GameRoom } from '../../shared/types';
import { getIndexablePaths, getPublicSeoRoute } from '../../shared/seo';
import { logError, logInfo, logWarn } from './logger';
import { MonitoringStore } from './monitoring';
import { SocketRateLimiter } from './security';
import { clearSessionCookie, getAuthenticatedUser, getAuthenticatedUserFromCookieHeader, isValidEmail, isValidUsername, issueLoginCode, logoutRequest, normalizeEmail, normalizeGuestPlayerId, normalizeUsername, setSessionCookie, verifyLoginCode } from './auth';
import { createSocketConnectionHandler, type AuthenticatedSocketData } from './socketHandlers';
import { shouldServeSpaShell } from './spa';
import { normalizeLeaderboardLimit, normalizeLeaderboardPage } from './leaderboardPagination';

const app = express();
const httpServer = createServer(app);
const startTime = Date.now();

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, AuthenticatedSocketData>(httpServer, {
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertHeadTag(html: string, pattern: RegExp, replacement: string): string {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace('</head>', `  ${replacement}\n  </head>`);
}

function renderSeoHtml(template: string, pathname: string, baseUrl: string): string {
  const seo = getPublicSeoRoute(pathname, baseUrl);
  const canonicalUrl = new URL(seo.path, `${baseUrl}/`).toString();
  const robots = seo.robots ?? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  const keywords = seo.keywords?.join(', ');
  const structuredData = seo.structuredData?.length
    ? JSON.stringify(seo.structuredData.length === 1 ? seo.structuredData[0] : seo.structuredData).replace(/</g, '\\u003c')
    : null;

  let html = template;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(seo.title)}</title>`);
  html = upsertHeadTag(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(seo.description)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, `<meta name="keywords" content="${escapeHtml(keywords ?? '')}" />`);
  html = upsertHeadTag(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${escapeHtml(seo.type ?? 'website')}" />`);
  html = upsertHeadTag(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/i, '<meta name="twitter:card" content="summary" />');
  html = upsertHeadTag(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`);
  html = upsertHeadTag(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`);

  html = html.replace(/\s*<script[^>]*data-seo-server="true"[^>]*>.*?<\/script>/gs, '');
  if (structuredData) {
    html = html.replace('</head>', `  <script type="application/ld+json" data-seo-server="true">${structuredData}</script>\n  </head>`);
  }

  return html;
}

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
  return await saveCompletedGame({
    id: room.id,
    result: winner || 'draw',
    resultReason: reason,
    whiteUserId: room.whiteUserId,
    blackUserId: room.blackUserId,
    rated: room.rated,
    gameMode: room.gameMode,
    timeControl: room.timeControl,
    moves: room.gameState.moveHistory,
    finalBoard: room.gameState.board,
    moveCount: room.gameState.moveCount,
  });
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
  const filter = _req.query.filter === 'rated' || _req.query.filter === 'casual'
    ? _req.query.filter as RecentGamesFilter
    : 'all';
  const [games, total] = await Promise.all([
    getRecentGames(limit, page * limit, filter),
    getGameCount(filter),
  ]);
  res.json({ games, total, page, limit, filter });
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
