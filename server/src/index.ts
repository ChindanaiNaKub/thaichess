import express from 'express';
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { GameManager } from './gameManager';
import { MatchmakingQueue, QueueEntry } from './matchmaking';
import { initDatabase, saveCompletedGame, getRecentGames, getGame as getDbGame, getStats, getGameCount, saveFeedback, getFeedback, getFeedbackCount } from './database';
import { ServerToClientEvents, ClientToServerEvents, GameRoom } from '../../shared/types';
import { logError, logInfo, logWarn } from './logger';
import { getSocketIp, isValidBoolean, isValidGameId, isValidPosition, isValidTimeControl, SocketRateLimiter } from './security';

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

const SOCKET_RATE_LIMITS = {
  create_game: { windowMs: 60 * 1000, max: 6 },
  join_game: { windowMs: 60 * 1000, max: 20 },
  find_game: { windowMs: 60 * 1000, max: 10 },
  make_move: { windowMs: 10 * 1000, max: 40 },
  control_action: { windowMs: 30 * 1000, max: 15 },
} as const;

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

function emitQueueStatusForEntry(entry: QueueEntry) {
  io.to(entry.socketId).emit('queue_status', {
    playersInQueue: matchmaking.getQueueSizeForTimeControl(entry.timeControl),
  });
}

function broadcastQueueStatus() {
  matchmaking.getEntries().forEach(emitQueueStatusForEntry);
}

function tryMatchmakeQueue() {
  let foundMatch = true;

  while (foundMatch) {
    foundMatch = false;

    for (const entry of matchmaking.getEntries()) {
      const match = matchmaking.findMatch(entry.socketId);
      if (!match) continue;

      const entryStillQueued = matchmaking.getEntry(entry.socketId);
      const matchStillQueued = matchmaking.getEntry(match.socketId);
      if (!entryStillQueued || !matchStillQueued) continue;

      matchmaking.removeFromQueue(entry.socketId);
      matchmaking.removeFromQueue(match.socketId);

      const room = gameManager.createGame(entryStillQueued.timeControl);
      const whiteId = Math.random() < 0.5 ? entry.socketId : match.socketId;
      const blackId = whiteId === entry.socketId ? match.socketId : entry.socketId;

      room.white = whiteId;
      room.black = blackId;
      room.status = 'playing';
      room.gameState.lastMoveTime = Date.now();

      gameManager.setPlayerGame(whiteId, room.id);
      gameManager.setPlayerGame(blackId, room.id);

      logInfo('match_found', { whiteId, blackId, gameId: room.id });

      io.to(whiteId).emit('matchmaking_found', { gameId: room.id, color: 'white' });
      io.to(blackId).emit('matchmaking_found', { gameId: room.id, color: 'black' });

      broadcastQueueStatus();
      foundMatch = true;
      break;
    }
  }
}

function rejectSocketEvent(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  event: string,
  message: string,
  details: Record<string, unknown> = {},
) {
  logWarn('socket_event_rejected', {
    socketId: socket.id,
    ip: getSocketIp(socket),
    event,
    message,
    ...details,
  });
  socket.emit('error', { message });
}

function enforceSocketRateLimit(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  event: keyof typeof SOCKET_RATE_LIMITS,
  scopes: Array<'socket' | 'ip'> = ['socket'],
) {
  for (const scope of scopes) {
    const key = scope === 'socket'
      ? `${scope}:${socket.id}:${event}`
      : `${scope}:${getSocketIp(socket)}:${event}`;
    const limiter = scope === 'socket' ? socketRateLimiter : ipRateLimiter;
    const result = limiter.allow(key, SOCKET_RATE_LIMITS[event]);

    if (!result.allowed) {
      rejectSocketEvent(socket, event, 'Too many requests. Please slow down.', {
        scope,
        retryAfterMs: result.retryAfterMs,
      });
      return false;
    }
  }

  return true;
}

io.on('connection', (socket) => {
  const socketIp = getSocketIp(socket);
  logInfo('socket_connected', { socketId: socket.id, ip: socketIp });

  socket.on('create_game', (payload) => {
    if (!enforceSocketRateLimit(socket, 'create_game', ['socket', 'ip'])) return;
    if (!payload || !isValidTimeControl(payload.timeControl)) {
      rejectSocketEvent(socket, 'create_game', 'Invalid time control.');
      return;
    }
    if (gameManager.getPlayerGame(socket.id) || matchmaking.isInQueue(socket.id)) {
      rejectSocketEvent(socket, 'create_game', 'Leave your current game or queue before creating another game.');
      return;
    }

    const { timeControl } = payload;
    const room = gameManager.createGame(timeControl);
    logInfo('game_created', { gameId: room.id, socketId: socket.id, timeControl });
    socket.emit('game_created', { gameId: room.id });
  });

  socket.on('join_game', (payload) => {
    if (!enforceSocketRateLimit(socket, 'join_game', ['socket', 'ip'])) return;
    if (!payload || !isValidGameId(payload.gameId)) {
      rejectSocketEvent(socket, 'join_game', 'Invalid game ID.');
      return;
    }

    const { gameId } = payload;
    const currentGameId = gameManager.getPlayerGame(socket.id);
    if (currentGameId && currentGameId !== gameId) {
      rejectSocketEvent(socket, 'join_game', 'Leave your current game before joining another one.');
      return;
    }

    const result = gameManager.joinGame(gameId, socket.id);
    if (!result) {
      rejectSocketEvent(socket, 'join_game', 'Unable to join game. Game may be full or not found.', {
        gameId,
      });
      return;
    }

    const { room, color } = result;
    socket.join(gameId);

    const clientState = gameManager.getClientGameState(room, socket.id);
    socket.emit('game_joined', { color, gameState: clientState });

    // Notify other players
    socket.to(gameId).emit('game_state', gameManager.getClientGameState(room, room.white || ''));

    if (room.status === 'playing') {
      gameManager.startClock(gameId, (updatedRoom) => {
        if (updatedRoom.gameState.gameOver) {
          const reason = updatedRoom.gameState.whiteTime <= 0 || updatedRoom.gameState.blackTime <= 0
            ? 'timeout' : 'unknown';

          void saveGameToDb(updatedRoom, reason);

          if (updatedRoom.white) {
            io.to(updatedRoom.white).emit('game_over', {
              reason,
              winner: updatedRoom.gameState.winner,
              gameState: gameManager.getClientGameState(updatedRoom, updatedRoom.white),
            });
          }
          if (updatedRoom.black) {
            io.to(updatedRoom.black).emit('game_over', {
              reason,
              winner: updatedRoom.gameState.winner,
              gameState: gameManager.getClientGameState(updatedRoom, updatedRoom.black),
            });
          }
        } else {
          io.to(gameId).emit('clock_update', {
            whiteTime: updatedRoom.gameState.whiteTime,
            blackTime: updatedRoom.gameState.blackTime,
          });
        }
      });
    }
  });

  socket.on('make_move', (payload) => {
    if (!enforceSocketRateLimit(socket, 'make_move')) return;
    if (!payload || !isValidPosition(payload.from) || !isValidPosition(payload.to)) {
      rejectSocketEvent(socket, 'make_move', 'Invalid move payload.');
      return;
    }

    const { from, to } = payload;
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) {
      rejectSocketEvent(socket, 'make_move', 'You are not in a game');
      return;
    }

    const result = gameManager.makeMove(gameId, socket.id, from, to);
    if (!result.success) {
      rejectSocketEvent(socket, 'make_move', result.error || 'Invalid move', { gameId });
      return;
    }

    const room = result.room!;

    if (room.white) {
      io.to(room.white).emit('move_made', {
        move: result.move!,
        gameState: gameManager.getClientGameState(room, room.white),
      });
    }
    if (room.black) {
      io.to(room.black).emit('move_made', {
        move: result.move!,
        gameState: gameManager.getClientGameState(room, room.black),
      });
    }

    if (room.gameState.gameOver) {
      const reason = room.gameState.resultReason ?? 'draw';

      void saveGameToDb(room, reason);

      if (room.white) {
        io.to(room.white).emit('game_over', {
          reason,
          winner: room.gameState.winner,
          gameState: gameManager.getClientGameState(room, room.white),
        });
      }
      if (room.black) {
        io.to(room.black).emit('game_over', {
          reason,
          winner: room.gameState.winner,
          gameState: gameManager.getClientGameState(room, room.black),
        });
      }
    }
  });

  socket.on('resign', () => {
    if (!enforceSocketRateLimit(socket, 'control_action')) return;
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const room = gameManager.resign(gameId, socket.id);
    if (!room) return;

    void saveGameToDb(room, 'resignation');

    if (room.white) {
      io.to(room.white).emit('game_over', {
        reason: 'resignation',
        winner: room.gameState.winner,
        gameState: gameManager.getClientGameState(room, room.white),
      });
    }
    if (room.black) {
      io.to(room.black).emit('game_over', {
        reason: 'resignation',
        winner: room.gameState.winner,
        gameState: gameManager.getClientGameState(room, room.black),
      });
    }
  });

  socket.on('offer_draw', () => {
    if (!enforceSocketRateLimit(socket, 'control_action')) return;
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const result = gameManager.offerDraw(gameId, socket.id);
    if (!result) return;

    const { room, by } = result;
    const opponentId = by === 'white' ? room.black : room.white;
    if (opponentId) {
      io.to(opponentId).emit('draw_offered', { by });
    }
  });

  socket.on('start_counting', () => {
    if (!enforceSocketRateLimit(socket, 'control_action')) return;
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const room = gameManager.startCounting(gameId, socket.id);
    if (!room) return;

    if (room.white) {
      io.to(room.white).emit('game_state', gameManager.getClientGameState(room, room.white));
    }
    if (room.black) {
      io.to(room.black).emit('game_state', gameManager.getClientGameState(room, room.black));
    }
  });

  socket.on('stop_counting', () => {
    if (!enforceSocketRateLimit(socket, 'control_action')) return;
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const room = gameManager.stopCounting(gameId, socket.id);
    if (!room) return;

    if (room.white) {
      io.to(room.white).emit('game_state', gameManager.getClientGameState(room, room.white));
    }
    if (room.black) {
      io.to(room.black).emit('game_state', gameManager.getClientGameState(room, room.black));
    }
  });

  socket.on('respond_draw', (payload) => {
    if (!enforceSocketRateLimit(socket, 'control_action')) return;
    if (!payload || !isValidBoolean(payload.accept)) {
      rejectSocketEvent(socket, 'respond_draw', 'Invalid draw response.');
      return;
    }

    const { accept } = payload;
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const room = gameManager.respondDraw(gameId, socket.id, accept);
    if (!room) return;

    if (accept) {
      void saveGameToDb(room, 'draw_agreement');

      if (room.white) {
        io.to(room.white).emit('game_over', {
          reason: 'draw_agreement',
          winner: null,
          gameState: gameManager.getClientGameState(room, room.white),
        });
      }
      if (room.black) {
        io.to(room.black).emit('game_over', {
          reason: 'draw_agreement',
          winner: null,
          gameState: gameManager.getClientGameState(room, room.black),
        });
      }
    } else {
      const offerer = room.white === socket.id ? room.black : room.white;
      if (offerer) {
        io.to(offerer).emit('draw_declined');
      }
    }
  });

  socket.on('request_rematch', () => {
    if (!enforceSocketRateLimit(socket, 'control_action')) return;
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const room = gameManager.getGame(gameId);
    if (!room) return;

    const newRoom = gameManager.createRematch(gameId);
    if (!newRoom) return;

    if (newRoom.white) {
      io.to(newRoom.white).emit('game_created', { gameId: newRoom.id });
    }
    if (newRoom.black) {
      io.to(newRoom.black).emit('game_created', { gameId: newRoom.id });
    }
  });

  socket.on('find_game', (payload) => {
    if (!enforceSocketRateLimit(socket, 'find_game', ['socket', 'ip'])) return;
    if (!payload || !isValidTimeControl(payload.timeControl)) {
      rejectSocketEvent(socket, 'find_game', 'Invalid time control.');
      return;
    }
    if (gameManager.getPlayerGame(socket.id)) {
      rejectSocketEvent(socket, 'find_game', 'Leave your current game before entering matchmaking.');
      return;
    }
    if (matchmaking.isInQueue(socket.id)) {
      rejectSocketEvent(socket, 'find_game', 'You are already in the matchmaking queue.');
      return;
    }

    const { timeControl } = payload;
    logInfo('matchmaking_started', { socketId: socket.id, timeControl });

    matchmaking.addToQueue(socket.id, timeControl);
    socket.emit('matchmaking_started');
    broadcastQueueStatus();
    tryMatchmakeQueue();
  });

  socket.on('cancel_matchmaking', () => {
    const removed = matchmaking.removeFromQueue(socket.id);
    if (removed) {
      logInfo('matchmaking_cancelled', { socketId: socket.id });
      socket.emit('matchmaking_cancelled');
      broadcastQueueStatus();
    }
  });

  socket.on('disconnect', () => {
    socketRateLimiter.clearPrefix(`socket:${socket.id}:`);
    logInfo('socket_disconnected', { socketId: socket.id, ip: socketIp });
    const removedFromQueue = matchmaking.removeFromQueue(socket.id);
    if (removedFromQueue) {
      broadcastQueueStatus();
    }
    const result = gameManager.handleDisconnect(socket.id);
    if (result) {
      const room = gameManager.getGame(result.gameId);
      if (room) {
        const opponentId = result.color === 'white' ? room.black : room.white;
        if (opponentId) {
          io.to(opponentId).emit('opponent_disconnected');
        }
      }
    }
  });
});

// --- REST API ---

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

app.post('/api/client-errors', (req, res) => {
  const { source, message, stack, componentStack, url, userAgent } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Invalid client error payload' });
    return;
  }

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
  res.json({
    status: 'ok',
    uptime,
    connectedPlayers,
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

app.get('/api/feedback', async (_req, res) => {
  const page = parseInt(_req.query.page as string) || 0;
  const limit = Math.min(parseInt(_req.query.limit as string) || 20, 50);
  const type = (_req.query.type as string) || undefined;
  const [feedback, total] = await Promise.all([
    getFeedback(limit, page * limit, type),
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
    timestamp: new Date().toISOString(),
  };
  logInfo('feedback_received', { feedback });
  await saveFeedback(feedback);
  res.json({ ok: true });
});

// SPA fallback (must be last)
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;
process.on('uncaughtException', (error) => {
  logError('uncaught_exception', error);
});

process.on('unhandledRejection', (reason) => {
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
