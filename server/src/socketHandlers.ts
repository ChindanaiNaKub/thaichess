import type { Socket } from 'socket.io';
import { logInfo, logWarn } from './logger';
import type { ServerToClientEvents, ClientToServerEvents, GameRoom, RatingChangeSummary } from '../../shared/types';
import type { GameManager } from './gameManager';
import type { MatchmakingQueue, QueueEntry } from './matchmaking';
import type { MonitoringStore } from './monitoring';
import type { AuthUser } from './database';
import {
  getSocketIp,
  isValidBoolean,
  isValidGameId,
  isValidPosition,
  isValidPrivateGameColorPreference,
  isValidTimeControl,
  SocketRateLimiter,
} from './security';

export interface AuthenticatedSocketData {
  authUser: AuthUser | null;
  playerId: string;
}

type ServerSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, AuthenticatedSocketData>;
type IoLike = {
  // eslint-disable-next-line no-unused-vars
  to: (roomOrSocketId: string) => {
    // eslint-disable-next-line no-unused-vars
    emit: (...args: any[]) => unknown;
  };
};

export const SOCKET_RATE_LIMITS = {
  create_game: { windowMs: 60 * 1000, max: 6 },
  join_game: { windowMs: 60 * 1000, max: 20 },
  find_game: { windowMs: 60 * 1000, max: 10 },
  find_game_ip: { windowMs: 60 * 1000, max: 30 },
  make_move: { windowMs: 10 * 1000, max: 40 },
  control_action: { windowMs: 30 * 1000, max: 15 },
} as const;

interface SocketHandlerDeps {
  io: IoLike;
  gameManager: GameManager;
  matchmaking: MatchmakingQueue;
  socketRateLimiter: SocketRateLimiter;
  ipRateLimiter: SocketRateLimiter;
  monitoring: MonitoringStore;
  // eslint-disable-next-line no-unused-vars
  saveGameToDb: (...args: [GameRoom, string]) => Promise<{ ratingChange: RatingChangeSummary | null }>;
}

function emitQueueStatusForEntry(io: IoLike, matchmaking: MatchmakingQueue, entry: QueueEntry) {
  io.to(entry.socketId).emit('queue_status', {
    playersInQueue: matchmaking.getQueueSizeForTimeControl(entry.timeControl),
  });
}

function broadcastQueueStatus(io: IoLike, matchmaking: MatchmakingQueue) {
  matchmaking.getEntries().forEach((entry) => emitQueueStatusForEntry(io, matchmaking, entry));
}

function rejectSocketEvent(
  monitoring: MonitoringStore,
  socket: ServerSocket,
  event: string,
  message: string,
  details: Record<string, unknown> = {},
) {
  monitoring.increment('socket.rejected');
  logWarn('socket_event_rejected', {
    socketId: socket.id,
    ip: getSocketIp(socket),
    event,
    message,
    ...details,
  });
  socket.emit('error', { message });
}

function getSocketDisplayName(socket: ServerSocket) {
  const authUser = socket.data.authUser;
  const username = authUser?.username?.trim();
  if (username) return username;

  const localPart = authUser?.email?.split('@')[0]?.trim();
  if (localPart) {
    if (localPart.length <= 2) {
      return `${localPart.slice(0, 1)}***`;
    }
    return `${localPart.slice(0, 2)}***`;
  }

  return 'Guest';
}

function enforceSocketRateLimit(
  socket: ServerSocket,
  event: keyof typeof SOCKET_RATE_LIMITS,
  deps: SocketHandlerDeps,
  scopes: Array<'socket' | 'ip'> = ['socket'],
) {
  for (const scope of scopes) {
    const key = scope === 'socket'
      ? `${scope}:${socket.id}:${event}`
      : `${scope}:${getSocketIp(socket)}:${event}`;
    const limiter = scope === 'socket' ? deps.socketRateLimiter : deps.ipRateLimiter;
    const result = limiter.allow(key, SOCKET_RATE_LIMITS[event]);

    if (!result.allowed) {
      deps.monitoring.increment('socket.rateLimited');
      rejectSocketEvent(deps.monitoring, socket, event, 'Too many requests. Please slow down.', {
        scope,
        retryAfterMs: result.retryAfterMs,
      });
      return false;
    }
  }

  return true;
}

function enforceFindGameRateLimit(socket: ServerSocket, deps: SocketHandlerDeps) {
  const socketAllowed = enforceSocketRateLimit(socket, 'find_game', deps, ['socket']);
  if (!socketAllowed) return false;

  const key = `ip:${getSocketIp(socket)}:find_game_ip`;
  const result = deps.ipRateLimiter.allow(key, SOCKET_RATE_LIMITS.find_game_ip);
  if (!result.allowed) {
    deps.monitoring.increment('socket.rateLimited');
    rejectSocketEvent(deps.monitoring, socket, 'find_game', 'Too many requests. Please slow down.', {
      scope: 'ip',
      retryAfterMs: result.retryAfterMs,
    });
    return false;
  }

  return true;
}

function tryMatchmakeQueue(deps: SocketHandlerDeps) {
  let foundMatch = true;

  while (foundMatch) {
    foundMatch = false;

    for (const entry of deps.matchmaking.getEntries()) {
      const match = deps.matchmaking.findMatch(entry.socketId);
      if (!match) continue;

      const entryStillQueued = deps.matchmaking.getEntry(entry.socketId);
      const matchStillQueued = deps.matchmaking.getEntry(match.socketId);
      if (!entryStillQueued || !matchStillQueued) continue;

      deps.matchmaking.removeFromQueue(entry.socketId);
      deps.matchmaking.removeFromQueue(match.socketId);

      const whiteId = Math.random() < 0.5 ? entry.socketId : match.socketId;
      const blackId = whiteId === entry.socketId ? match.socketId : entry.socketId;
      const whiteEntry = whiteId === entry.socketId ? entryStillQueued : matchStillQueued;
      const blackEntry = blackId === entry.socketId ? entryStillQueued : matchStillQueued;
      const room = deps.gameManager.createGame(entryStillQueued.timeControl, {
        gameMode: 'quick_play',
        rated: Boolean(whiteEntry.userId && blackEntry.userId),
      });

      room.white = whiteId;
      room.black = blackId;
      room.whitePlayerId = whiteEntry.playerId;
      room.blackPlayerId = blackEntry.playerId;
      room.whiteUserId = whiteEntry.userId;
      room.blackUserId = blackEntry.userId;
      room.whitePlayerName = whiteEntry.displayName;
      room.blackPlayerName = blackEntry.displayName;
      room.status = 'playing';
      room.gameState.lastMoveTime = Date.now();

      deps.gameManager.setSocketGame(whiteId, room.id);
      deps.gameManager.setSocketGame(blackId, room.id);
      deps.gameManager.setPlayerGame(whiteEntry.playerId, room.id);
      deps.gameManager.setPlayerGame(blackEntry.playerId, room.id);
      deps.monitoring.increment('matchmakingMatched');

      logInfo('match_found', { whiteId, blackId, gameId: room.id });

      deps.io.to(whiteId).emit('matchmaking_found', { gameId: room.id, color: 'white' });
      deps.io.to(blackId).emit('matchmaking_found', { gameId: room.id, color: 'black' });

      broadcastQueueStatus(deps.io, deps.matchmaking);
      foundMatch = true;
      break;
    }
  }
}

export function createSocketConnectionHandler(deps: SocketHandlerDeps) {
  return (socket: ServerSocket) => {
    const socketIp = getSocketIp(socket);
    deps.monitoring.increment('socket.connected');
    logInfo('socket_connected', { socketId: socket.id, ip: socketIp });

    socket.on('create_game', (payload) => {
      if (!enforceSocketRateLimit(socket, 'create_game', deps, ['socket', 'ip'])) return;
      if (!payload || !isValidTimeControl(payload.timeControl) || !isValidPrivateGameColorPreference(payload.colorPreference)) {
        deps.monitoring.increment('socket.invalidPayload');
        rejectSocketEvent(deps.monitoring, socket, 'create_game', 'Invalid private game settings.');
        return;
      }
      if (deps.gameManager.getBlockingPlayerGame(socket.data.playerId) || deps.matchmaking.isInQueue(socket.id)) {
        rejectSocketEvent(deps.monitoring, socket, 'create_game', 'Leave your current game or queue before creating another game.');
        return;
      }

      const room = deps.gameManager.createGame(payload.timeControl, {
        ownerSocketId: socket.id,
        ownerPlayerId: socket.data.playerId,
        ownerUserId: socket.data.authUser?.id ?? null,
        ownerDisplayName: getSocketDisplayName(socket),
        ownerColorPreference: payload.colorPreference,
        gameMode: 'private',
        rated: false,
      });
      deps.monitoring.increment('gamesCreated');
      logInfo('game_created', {
        gameId: room.id,
        socketId: socket.id,
        timeControl: payload.timeControl,
        colorPreference: payload.colorPreference,
      });
      socket.emit('game_created', { gameId: room.id });
    });

    socket.on('leave_game', (payload) => {
      if (payload?.gameId !== undefined && !isValidGameId(payload.gameId)) {
        deps.monitoring.increment('socket.invalidPayload');
        rejectSocketEvent(deps.monitoring, socket, 'leave_game', 'Invalid game ID.');
        return;
      }

      const result = deps.gameManager.leaveGame(socket.id, payload?.gameId);
      if (!result) return;

      logInfo('game_left', { gameId: result.gameId, socketId: socket.id, deleted: result.deleted });
      socket.emit('game_left', { gameId: result.gameId });
    });

    socket.on('join_game', (payload) => {
      if (!enforceSocketRateLimit(socket, 'join_game', deps, ['socket', 'ip'])) return;
      if (!payload || !isValidGameId(payload.gameId)) {
        deps.monitoring.increment('socket.invalidPayload');
        rejectSocketEvent(deps.monitoring, socket, 'join_game', 'Invalid game ID.');
        return;
      }

      const { gameId } = payload;
      const currentGameId = deps.gameManager.getBlockingPlayerGame(socket.data.playerId);
      if (currentGameId && currentGameId !== gameId) {
        rejectSocketEvent(deps.monitoring, socket, 'join_game', 'Leave your current game before joining another one.');
        return;
      }

      const result = deps.gameManager.joinGame(gameId, socket.id, {
        playerId: socket.data.playerId,
        userId: socket.data.authUser?.id ?? null,
        displayName: getSocketDisplayName(socket),
      });
      if (!result) {
        rejectSocketEvent(deps.monitoring, socket, 'join_game', 'Unable to join game. Game may be full or not found.', { gameId });
        return;
      }

      const { room, color, reconnected } = result;
      socket.join(gameId);

      socket.emit('game_joined', { color, gameState: deps.gameManager.getClientGameState(room, socket.id) });
      socket.to(gameId).emit('game_state', deps.gameManager.getClientGameState(room, room.white || ''));

      if (reconnected && room.status === 'playing') {
        const opponentId = color === 'white' ? room.black : room.white;
        if (opponentId) {
          deps.io.to(opponentId).emit('opponent_reconnected');
        }
      }

      if (room.status === 'playing') {
        deps.gameManager.startClock(gameId, (updatedRoom) => {
          if (updatedRoom.gameState.gameOver) {
            const reason = updatedRoom.gameState.whiteTime <= 0 || updatedRoom.gameState.blackTime <= 0 ? 'timeout' : 'unknown';
            void deps.saveGameToDb(updatedRoom, reason).then(({ ratingChange }) => {
              if (updatedRoom.white) {
                deps.io.to(updatedRoom.white).emit('game_over', {
                  reason,
                  winner: updatedRoom.gameState.winner,
                  gameState: deps.gameManager.getClientGameState(updatedRoom, updatedRoom.white),
                  ratingChange,
                });
              }
              if (updatedRoom.black) {
                deps.io.to(updatedRoom.black).emit('game_over', {
                  reason,
                  winner: updatedRoom.gameState.winner,
                  gameState: deps.gameManager.getClientGameState(updatedRoom, updatedRoom.black),
                  ratingChange,
                });
              }
            });
          } else {
            deps.io.to(gameId).emit('clock_update', {
              whiteTime: updatedRoom.gameState.whiteTime,
              blackTime: updatedRoom.gameState.blackTime,
            });
          }
        });
      }
    });

    socket.on('make_move', (payload) => {
      if (!enforceSocketRateLimit(socket, 'make_move', deps)) return;
      if (!payload || !isValidPosition(payload.from) || !isValidPosition(payload.to)) {
        deps.monitoring.increment('socket.invalidPayload');
        rejectSocketEvent(deps.monitoring, socket, 'make_move', 'Invalid move payload.');
        return;
      }

      const gameId = deps.gameManager.getPlayerGame(socket.data.playerId);
      if (!gameId) {
        rejectSocketEvent(deps.monitoring, socket, 'make_move', 'You are not in a game');
        return;
      }

      const result = deps.gameManager.makeMove(gameId, socket.id, payload.from, payload.to);
      if (!result.success) {
        rejectSocketEvent(deps.monitoring, socket, 'make_move', result.error || 'Invalid move', { gameId });
        return;
      }

      const room = result.room!;

      if (room.white) {
        deps.io.to(room.white).emit('move_made', {
          move: result.move!,
          gameState: deps.gameManager.getClientGameState(room, room.white),
        });
      }
      if (room.black) {
        deps.io.to(room.black).emit('move_made', {
          move: result.move!,
          gameState: deps.gameManager.getClientGameState(room, room.black),
        });
      }

      if (room.gameState.gameOver) {
        const reason = room.gameState.resultReason ?? 'draw';
        deps.monitoring.increment('gamesFinished');
        void deps.saveGameToDb(room, reason).then(({ ratingChange }) => {
          if (room.white) {
            deps.io.to(room.white).emit('game_over', {
              reason,
              winner: room.gameState.winner,
              gameState: deps.gameManager.getClientGameState(room, room.white),
              ratingChange,
            });
          }
          if (room.black) {
            deps.io.to(room.black).emit('game_over', {
              reason,
              winner: room.gameState.winner,
              gameState: deps.gameManager.getClientGameState(room, room.black),
              ratingChange,
            });
          }
        });
      }
    });

    socket.on('resign', () => {
      if (!enforceSocketRateLimit(socket, 'control_action', deps)) return;
      const gameId = deps.gameManager.getPlayerGame(socket.data.playerId);
      if (!gameId) return;

      const room = deps.gameManager.resign(gameId, socket.id);
      if (!room) return;

      deps.monitoring.increment('gamesFinished');
      void deps.saveGameToDb(room, 'resignation').then(({ ratingChange }) => {
        if (room.white) {
          deps.io.to(room.white).emit('game_over', {
            reason: 'resignation',
            winner: room.gameState.winner,
            gameState: deps.gameManager.getClientGameState(room, room.white),
            ratingChange,
          });
        }
        if (room.black) {
          deps.io.to(room.black).emit('game_over', {
            reason: 'resignation',
            winner: room.gameState.winner,
            gameState: deps.gameManager.getClientGameState(room, room.black),
            ratingChange,
          });
        }
      });
    });

    socket.on('offer_draw', () => {
      if (!enforceSocketRateLimit(socket, 'control_action', deps)) return;
      const gameId = deps.gameManager.getPlayerGame(socket.data.playerId);
      if (!gameId) return;

      const result = deps.gameManager.offerDraw(gameId, socket.id);
      if (!result) return;

      const opponentId = result.by === 'white' ? result.room.black : result.room.white;
      if (opponentId) {
        deps.io.to(opponentId).emit('draw_offered', { by: result.by });
      }
    });

    socket.on('start_counting', () => {
      if (!enforceSocketRateLimit(socket, 'control_action', deps)) return;
      const gameId = deps.gameManager.getPlayerGame(socket.data.playerId);
      if (!gameId) return;

      const room = deps.gameManager.startCounting(gameId, socket.id);
      if (!room) return;

      if (room.white) deps.io.to(room.white).emit('game_state', deps.gameManager.getClientGameState(room, room.white));
      if (room.black) deps.io.to(room.black).emit('game_state', deps.gameManager.getClientGameState(room, room.black));
    });

    socket.on('stop_counting', () => {
      if (!enforceSocketRateLimit(socket, 'control_action', deps)) return;
      const gameId = deps.gameManager.getPlayerGame(socket.data.playerId);
      if (!gameId) return;

      const room = deps.gameManager.stopCounting(gameId, socket.id);
      if (!room) return;

      if (room.white) deps.io.to(room.white).emit('game_state', deps.gameManager.getClientGameState(room, room.white));
      if (room.black) deps.io.to(room.black).emit('game_state', deps.gameManager.getClientGameState(room, room.black));
    });

    socket.on('respond_draw', (payload) => {
      if (!enforceSocketRateLimit(socket, 'control_action', deps)) return;
      if (!payload || !isValidBoolean(payload.accept)) {
        deps.monitoring.increment('socket.invalidPayload');
        rejectSocketEvent(deps.monitoring, socket, 'respond_draw', 'Invalid draw response.');
        return;
      }

      const gameId = deps.gameManager.getPlayerGame(socket.data.playerId);
      if (!gameId) return;

      const room = deps.gameManager.respondDraw(gameId, socket.id, payload.accept);
      if (!room) return;

      if (payload.accept) {
        deps.monitoring.increment('gamesFinished');
        void deps.saveGameToDb(room, 'draw_agreement').then(({ ratingChange }) => {
          if (room.white) {
            deps.io.to(room.white).emit('game_over', {
              reason: 'draw_agreement',
              winner: null,
              gameState: deps.gameManager.getClientGameState(room, room.white),
              ratingChange,
            });
          }
          if (room.black) {
            deps.io.to(room.black).emit('game_over', {
              reason: 'draw_agreement',
              winner: null,
              gameState: deps.gameManager.getClientGameState(room, room.black),
              ratingChange,
            });
          }
        });
      } else {
        const offerer = room.white === socket.id ? room.black : room.white;
        if (offerer) deps.io.to(offerer).emit('draw_declined');
      }
    });

    socket.on('request_rematch', () => {
      if (!enforceSocketRateLimit(socket, 'control_action', deps)) return;
      const gameId = deps.gameManager.getPlayerGame(socket.data.playerId);
      if (!gameId) return;

      const rematchResult = deps.gameManager.requestRematch(gameId, socket.id);
      if (!rematchResult) return;

      if (rematchResult.kind === 'duplicate') {
        return;
      }

      if (rematchResult.kind === 'unavailable') {
        rejectSocketEvent(deps.monitoring, socket, 'request_rematch', 'Your opponent already left the finished game.');
        return;
      }

      if (rematchResult.kind === 'offered') {
        if (rematchResult.opponentSocketId) {
          deps.io.to(rematchResult.opponentSocketId).emit('rematch_offered', { by: rematchResult.by });
        }
        return;
      }

      const newRoom = rematchResult.room;
      if (!newRoom) return;

      if (newRoom.white) deps.io.to(newRoom.white).emit('game_created', { gameId: newRoom.id });
      if (newRoom.black) deps.io.to(newRoom.black).emit('game_created', { gameId: newRoom.id });
    });

    socket.on('find_game', (payload) => {
      if (!enforceFindGameRateLimit(socket, deps)) return;
      if (!payload || !isValidTimeControl(payload.timeControl)) {
        deps.monitoring.increment('socket.invalidPayload');
        rejectSocketEvent(deps.monitoring, socket, 'find_game', 'Invalid time control.');
        return;
      }
      if (deps.gameManager.getBlockingPlayerGame(socket.data.playerId)) {
        rejectSocketEvent(deps.monitoring, socket, 'find_game', 'Leave your current game before entering matchmaking.');
        return;
      }
      if (deps.matchmaking.isInQueue(socket.id)) {
        rejectSocketEvent(deps.monitoring, socket, 'find_game', 'You are already in the matchmaking queue.');
        return;
      }

      deps.monitoring.increment('matchmakingStarted');
      logInfo('matchmaking_started', { socketId: socket.id, timeControl: payload.timeControl });

      deps.matchmaking.addToQueue(socket.id, payload.timeControl, {
        playerId: socket.data.playerId,
        userId: socket.data.authUser?.id ?? null,
        displayName: getSocketDisplayName(socket),
      });
      socket.emit('matchmaking_started');
      broadcastQueueStatus(deps.io, deps.matchmaking);
      tryMatchmakeQueue(deps);
    });

    socket.on('cancel_matchmaking', () => {
      const removed = deps.matchmaking.removeFromQueue(socket.id);
      if (removed) {
        logInfo('matchmaking_cancelled', { socketId: socket.id });
        socket.emit('matchmaking_cancelled');
        broadcastQueueStatus(deps.io, deps.matchmaking);
      }
    });

    socket.on('disconnect', () => {
      deps.socketRateLimiter.clearPrefix(`socket:${socket.id}:`);
      deps.monitoring.increment('socket.disconnected');
      logInfo('socket_disconnected', { socketId: socket.id, ip: socketIp });

      const removedFromQueue = deps.matchmaking.removeFromQueue(socket.id);
      if (removedFromQueue) {
        broadcastQueueStatus(deps.io, deps.matchmaking);
      }

      const result = deps.gameManager.handleDisconnect(socket.id);
      if (result) {
        const room = deps.gameManager.getGame(result.gameId);
        if (room) {
          const opponentId = result.color === 'white' ? room.black : room.white;
          if (opponentId) deps.io.to(opponentId).emit('opponent_disconnected');
        }
      }
    });
  };
}
