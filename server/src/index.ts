import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { GameManager } from './gameManager';
import { initDatabase, saveCompletedGame, getRecentGames, getGame as getDbGame, getStats, getGameCount } from './database';
import { ServerToClientEvents, ClientToServerEvents, GameRoom } from '../../shared/types';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve static files in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Initialize database
initDatabase();

const gameManager = new GameManager();

// Cleanup old games every 30 minutes
setInterval(() => gameManager.cleanupOldGames(), 1800000);

function saveGameToDb(room: GameRoom, reason: string) {
  const winner = room.gameState.winner;
  saveCompletedGame({
    id: room.id,
    result: winner || 'draw',
    resultReason: reason,
    timeControl: room.timeControl,
    moves: room.gameState.moveHistory,
    finalBoard: room.gameState.board,
    moveCount: room.gameState.moveCount,
  });
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('create_game', ({ timeControl }) => {
    const room = gameManager.createGame(timeControl);
    console.log(`Game created: ${room.id}`);
    socket.emit('game_created', { gameId: room.id });
  });

  socket.on('join_game', ({ gameId }) => {
    const result = gameManager.joinGame(gameId, socket.id);
    if (!result) {
      socket.emit('error', { message: 'Unable to join game. Game may be full or not found.' });
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

          saveGameToDb(updatedRoom, reason);

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

  socket.on('make_move', ({ from, to }) => {
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) {
      socket.emit('error', { message: 'You are not in a game' });
      return;
    }

    const result = gameManager.makeMove(gameId, socket.id, from, to);
    if (!result.success) {
      socket.emit('error', { message: result.error || 'Invalid move' });
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
      const reason = room.gameState.isCheckmate ? 'checkmate'
        : room.gameState.isStalemate ? 'stalemate'
        : room.gameState.isDraw ? 'draw'
        : 'timeout';

      saveGameToDb(room, reason);

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
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const room = gameManager.resign(gameId, socket.id);
    if (!room) return;

    saveGameToDb(room, 'resignation');

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

  socket.on('respond_draw', ({ accept }) => {
    const gameId = gameManager.getPlayerGame(socket.id);
    if (!gameId) return;

    const room = gameManager.respondDraw(gameId, socket.id, accept);
    if (!room) return;

    if (accept) {
      saveGameToDb(room, 'draw_agreement');

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

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
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

app.get('/api/game/:id', (req, res) => {
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
  const saved = getDbGame(req.params.id);
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

app.get('/api/games/recent', (_req, res) => {
  const page = parseInt(_req.query.page as string) || 0;
  const limit = Math.min(parseInt(_req.query.limit as string) || 20, 50);
  const games = getRecentGames(limit, page * limit);
  const total = getGameCount();
  res.json({ games, total, page, limit });
});

app.get('/api/stats', (_req, res) => {
  const stats = getStats();
  res.json(stats);
});

// SPA fallback (must be last)
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Makruk server running on port ${PORT}`);
});
