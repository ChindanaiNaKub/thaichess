import { v4 as uuidv4 } from 'uuid';
import {
  GameRoom, TimeControl, PieceColor, PrivateGameColorPreference, GameMode,
  Position, ClientGameState, Move,
} from '../../shared/types';
import { createInitialGameState, makeMove, startCounting, stopCounting } from '../../shared/engine';

export class GameManager {
  private games: Map<string, GameRoom> = new Map();
  private playerGames: Map<string, string> = new Map(); // playerId -> gameId
  private socketGames: Map<string, string> = new Map(); // socketId -> gameId
  private clockIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private disconnectedPlayers: Map<string, number> = new Map();
  private roomLastActivity: Map<string, number> = new Map();
  private static readonly CLOCK_TICK_MS = 500;
  private static readonly FINISHED_GAME_TTL_MS = 60 * 60 * 1000;
  private static readonly WAITING_ROOM_TTL_MS = 15 * 60 * 1000;
  private static readonly DISCONNECTED_GAME_TTL_MS = 10 * 60 * 1000;

  createGame(
    timeControl: TimeControl,
    options: {
      ownerSocketId?: string;
      ownerPlayerId?: string;
      ownerUserId?: string | null;
      ownerColorPreference?: PrivateGameColorPreference;
      gameMode?: GameMode;
      rated?: boolean;
    } = {},
  ): GameRoom {
    const id = uuidv4().slice(0, 8);
    const initialMs = timeControl.initial * 1000;
    const gameState = createInitialGameState(initialMs, initialMs);
    const ownerColorPreference = options.ownerColorPreference ?? 'random';
    const ownerPlayerId = options.ownerPlayerId ?? options.ownerSocketId ?? null;
    const resolvedOwnerColor = ownerColorPreference === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : ownerColorPreference;

    const room: GameRoom = {
      id,
      white: options.ownerSocketId && resolvedOwnerColor === 'white' ? options.ownerSocketId : null,
      black: options.ownerSocketId && resolvedOwnerColor === 'black' ? options.ownerSocketId : null,
      whitePlayerId: ownerPlayerId && resolvedOwnerColor === 'white' ? ownerPlayerId : null,
      blackPlayerId: ownerPlayerId && resolvedOwnerColor === 'black' ? ownerPlayerId : null,
      whiteUserId: options.ownerSocketId && resolvedOwnerColor === 'white' ? (options.ownerUserId ?? null) : null,
      blackUserId: options.ownerSocketId && resolvedOwnerColor === 'black' ? (options.ownerUserId ?? null) : null,
      spectators: [],
      gameState,
      timeControl,
      status: 'waiting',
      createdAt: Date.now(),
      drawOffer: null,
      ownerColorPreference,
      gameMode: options.gameMode ?? 'private',
      rated: options.rated ?? false,
    };

    this.games.set(id, room);
    if (options.ownerSocketId) {
      this.socketGames.set(options.ownerSocketId, id);
    }
    if (ownerPlayerId) {
      this.playerGames.set(ownerPlayerId, id);
    }
    this.touchGame(id);
    return room;
  }

  joinGame(gameId: string, socketId: string, options: { playerId?: string; userId?: string | null } = {}): { room: GameRoom; color: PieceColor; reconnected: boolean } | null {
    const room = this.games.get(gameId);
    if (!room) return null;
    const playerId = options.playerId ?? socketId;

    // Same live connection joining again.
    if (room.white === socketId || room.black === socketId) {
      const color = room.white === socketId ? 'white' : 'black';
      this.socketGames.set(socketId, gameId);
      return { room, color, reconnected: false };
    }

    // Reconnection: restore the player's seat using the durable player id.
    if (room.whitePlayerId === playerId) {
      if (room.white && room.white !== socketId) {
        this.socketGames.delete(room.white);
      }
      room.white = socketId;
      room.whiteUserId = options.userId ?? room.whiteUserId;
      this.socketGames.set(socketId, gameId);
      this.playerGames.set(playerId, gameId);
      this.clearDisconnectedPlayer(gameId, 'white');
      this.touchGame(gameId);
      return { room, color: 'white', reconnected: true };
    }

    if (room.blackPlayerId === playerId) {
      if (room.black && room.black !== socketId) {
        this.socketGames.delete(room.black);
      }
      room.black = socketId;
      room.blackUserId = options.userId ?? room.blackUserId;
      this.socketGames.set(socketId, gameId);
      this.playerGames.set(playerId, gameId);
      this.clearDisconnectedPlayer(gameId, 'black');
      this.touchGame(gameId);
      return { room, color: 'black', reconnected: true };
    }

    if (!room.white) {
      room.white = socketId;
      room.whitePlayerId = playerId;
      room.whiteUserId = options.userId ?? null;
      this.socketGames.set(socketId, gameId);
      this.playerGames.set(playerId, gameId);
      this.clearDisconnectedPlayer(gameId, 'white');
      if (room.status === 'waiting' && room.black) {
        room.status = 'playing';
        room.gameState.lastMoveTime = Date.now();
      }
      this.touchGame(gameId);
      return { room, color: 'white', reconnected: false };
    }

    if (!room.black) {
      room.black = socketId;
      room.blackPlayerId = playerId;
      room.blackUserId = options.userId ?? null;
      this.socketGames.set(socketId, gameId);
      this.playerGames.set(playerId, gameId);
      this.clearDisconnectedPlayer(gameId, 'black');
      if (room.status === 'waiting') {
        room.status = 'playing';
        room.gameState.lastMoveTime = Date.now();
      }
      this.touchGame(gameId);
      return { room, color: 'black', reconnected: false };
    }

    // Game is full, join as spectator
    if (!room.spectators.includes(socketId)) {
      room.spectators.push(socketId);
    }
    this.socketGames.set(socketId, gameId);
    this.touchGame(gameId);
    return null;
  }

  makeMove(gameId: string, socketId: string, from: Position, to: Position): {
    success: boolean;
    room?: GameRoom;
    move?: Move;
    error?: string;
  } {
    const room = this.games.get(gameId);
    if (!room) return { success: false, error: 'Game not found' };
    if (room.status !== 'playing') return { success: false, error: 'Game is not in progress' };

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor) return { success: false, error: 'You are not a player in this game' };
    if (playerColor !== room.gameState.turn) return { success: false, error: 'Not your turn' };

    // Update clock before move
    this.updateClock(room);

    // Check if time ran out
    if (room.gameState.whiteTime <= 0 || room.gameState.blackTime <= 0) {
      room.status = 'finished';
      room.gameState.gameOver = true;
      room.gameState.winner = room.gameState.whiteTime <= 0 ? 'black' : 'white';
      room.gameState.resultReason = 'timeout';
      room.gameState.counting = null;
      this.stopClock(gameId);
      return { success: true, room };
    }

    const newState = makeMove(room.gameState, from, to);
    if (!newState) return { success: false, error: 'Invalid move' };

    // Add time increment
    if (room.timeControl.increment > 0) {
      const incMs = room.timeControl.increment * 1000;
      if (playerColor === 'white') {
        newState.whiteTime += incMs;
      } else {
        newState.blackTime += incMs;
      }
    }

    newState.lastMoveTime = Date.now();
    room.gameState = newState;
    room.drawOffer = null;
    this.touchGame(gameId);

    const lastMove = newState.moveHistory[newState.moveHistory.length - 1];

    if (newState.gameOver) {
      room.status = 'finished';
      this.stopClock(gameId);
    }

    return { success: true, room, move: lastMove };
  }

  resign(gameId: string, socketId: string): GameRoom | null {
    const room = this.games.get(gameId);
    if (!room || room.status !== 'playing') return null;

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor) return null;

    room.gameState.gameOver = true;
    room.gameState.winner = playerColor === 'white' ? 'black' : 'white';
    room.gameState.resultReason = 'resignation';
    room.gameState.counting = null;
    room.status = 'finished';
    this.stopClock(gameId);
    this.touchGame(gameId);

    return room;
  }

  offerDraw(gameId: string, socketId: string): { room: GameRoom; by: PieceColor } | null {
    const room = this.games.get(gameId);
    if (!room || room.status !== 'playing') return null;

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor) return null;

    room.drawOffer = playerColor;
    this.touchGame(gameId);
    return { room, by: playerColor };
  }

  respondDraw(gameId: string, socketId: string, accept: boolean): GameRoom | null {
    const room = this.games.get(gameId);
    if (!room || !room.drawOffer || room.status !== 'playing') return null;

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor || playerColor === room.drawOffer) return null;

    if (accept) {
      room.gameState.gameOver = true;
      room.gameState.isDraw = true;
      room.gameState.winner = null;
      room.gameState.resultReason = 'draw_agreement';
      room.gameState.counting = null;
      room.status = 'finished';
      this.stopClock(gameId);
    } else {
      room.drawOffer = null;
    }

    this.touchGame(gameId);
    return room;
  }

  startCounting(gameId: string, socketId: string): GameRoom | null {
    const room = this.games.get(gameId);
    if (!room || room.status !== 'playing') return null;

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor || playerColor !== room.gameState.turn) return null;

    const newState = startCounting(room.gameState);
    if (!newState) return null;

    room.gameState = newState;
    this.touchGame(gameId);
    return room;
  }

  stopCounting(gameId: string, socketId: string): GameRoom | null {
    const room = this.games.get(gameId);
    if (!room || room.status !== 'playing') return null;

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor || playerColor !== room.gameState.turn) return null;

    const newState = stopCounting(room.gameState);
    if (!newState) return null;

    room.gameState = newState;
    this.touchGame(gameId);
    return room;
  }

  createRematch(gameId: string): GameRoom | null {
    const oldRoom = this.games.get(gameId);
    if (!oldRoom || oldRoom.status !== 'finished') return null;

    const newRoom = this.createGame(oldRoom.timeControl);
    // Swap colors for rematch
    newRoom.white = oldRoom.black;
    newRoom.black = oldRoom.white;
    newRoom.whitePlayerId = oldRoom.blackPlayerId;
    newRoom.blackPlayerId = oldRoom.whitePlayerId;
    newRoom.whiteUserId = oldRoom.blackUserId;
    newRoom.blackUserId = oldRoom.whiteUserId;
    newRoom.gameMode = oldRoom.gameMode;
    newRoom.rated = oldRoom.rated;

    if (newRoom.white) this.socketGames.set(newRoom.white, newRoom.id);
    if (newRoom.black) this.socketGames.set(newRoom.black, newRoom.id);
    if (newRoom.whitePlayerId) this.playerGames.set(newRoom.whitePlayerId, newRoom.id);
    if (newRoom.blackPlayerId) this.playerGames.set(newRoom.blackPlayerId, newRoom.id);

    if (newRoom.white && newRoom.black) {
      newRoom.status = 'playing';
      newRoom.gameState.lastMoveTime = Date.now();
    }

    this.touchGame(newRoom.id);
    return newRoom;
  }

  handleDisconnect(socketId: string): { gameId: string; color: PieceColor } | null {
    const gameId = this.socketGames.get(socketId);
    if (!gameId) return null;

    const room = this.games.get(gameId);
    if (!room) return null;

    const color = this.getPlayerColor(room, socketId);
    this.socketGames.delete(socketId);
    room.spectators = room.spectators.filter((spectatorId) => spectatorId !== socketId);

    if (color) {
      this.disconnectedPlayers.set(this.getDisconnectedKey(gameId, color), Date.now());
    }

    this.touchGame(gameId);

    return color ? { gameId, color } : null;
  }

  updatePlayerSocket(gameId: string, playerId: string, newSocketId: string): void {
    const room = this.games.get(gameId);
    if (!room) return;

    if (room.whitePlayerId === playerId) {
      if (room.white) {
        this.socketGames.delete(room.white);
      }
      room.white = newSocketId;
      this.clearDisconnectedPlayer(gameId, 'white');
    }
    if (room.blackPlayerId === playerId) {
      if (room.black) {
        this.socketGames.delete(room.black);
      }
      room.black = newSocketId;
      this.clearDisconnectedPlayer(gameId, 'black');
    }

    this.socketGames.set(newSocketId, gameId);
    this.playerGames.set(playerId, gameId);
    this.touchGame(gameId);
  }

  getGame(gameId: string): GameRoom | null {
    return this.games.get(gameId) || null;
  }

  getGameCounts() {
    let waiting = 0;
    let playing = 0;
    let finished = 0;

    for (const room of this.games.values()) {
      if (room.status === 'waiting') waiting += 1;
      if (room.status === 'playing') playing += 1;
      if (room.status === 'finished') finished += 1;
    }

    return {
      total: this.games.size,
      waiting,
      playing,
      finished,
    };
  }

  getPlayerGame(playerId: string): string | null {
    return this.playerGames.get(playerId) || null;
  }

  getBlockingPlayerGame(playerId: string): string | null {
    const gameId = this.playerGames.get(playerId);
    if (!gameId) return null;

    const room = this.games.get(gameId);
    if (!room) {
      this.playerGames.delete(playerId);
      return null;
    }

    if (room.status === 'finished') {
      this.playerGames.delete(playerId);
      return null;
    }

    return gameId;
  }

  setPlayerGame(playerId: string, gameId: string): void {
    this.playerGames.set(playerId, gameId);
    this.touchGame(gameId);
  }

  setSocketGame(socketId: string, gameId: string): void {
    this.socketGames.set(socketId, gameId);
    this.touchGame(gameId);
  }

  leaveGame(socketId: string, requestedGameId?: string): { gameId: string; deleted: boolean } | null {
    const gameId = this.socketGames.get(socketId);
    if (!gameId || (requestedGameId && requestedGameId !== gameId)) return null;

    const room = this.games.get(gameId);
    if (!room) {
      this.socketGames.delete(socketId);
      return null;
    }

    const playerColor = this.getPlayerColor(room, socketId);
    if (room.status !== 'waiting' && playerColor) {
      return null;
    }

    if (room.white === socketId) {
      if (room.whitePlayerId) {
        this.playerGames.delete(room.whitePlayerId);
      }
      room.white = null;
      room.whitePlayerId = null;
      room.whiteUserId = null;
    }
    if (room.black === socketId) {
      if (room.blackPlayerId) {
        this.playerGames.delete(room.blackPlayerId);
      }
      room.black = null;
      room.blackPlayerId = null;
      room.blackUserId = null;
    }
    room.spectators = room.spectators.filter((spectatorId) => spectatorId !== socketId);
    this.socketGames.delete(socketId);
    this.touchGame(gameId);

    const shouldDelete = room.status === 'waiting' && !room.white && !room.black && room.spectators.length === 0;
    if (shouldDelete) {
      this.deleteGame(gameId, room);
    }

    return { gameId, deleted: shouldDelete };
  }

  getClientGameState(room: GameRoom, socketId: string): ClientGameState {
    const playerColor = this.getPlayerColor(room, socketId);
    return {
      board: room.gameState.board,
      turn: room.gameState.turn,
      moveHistory: room.gameState.moveHistory,
      isCheck: room.gameState.isCheck,
      isCheckmate: room.gameState.isCheckmate,
      isStalemate: room.gameState.isStalemate,
      isDraw: room.gameState.isDraw,
      gameOver: room.gameState.gameOver,
      winner: room.gameState.winner,
      resultReason: room.gameState.resultReason,
      counting: room.gameState.counting,
      whiteTime: room.gameState.whiteTime,
      blackTime: room.gameState.blackTime,
      moveCount: room.gameState.moveCount,
      status: room.status,
      playerColor: playerColor,
      drawOffer: room.drawOffer,
      gameId: room.id,
      gameMode: room.gameMode,
      rated: room.rated,
    };
  }

  private getPlayerColor(room: GameRoom, socketId: string): PieceColor | null {
    if (room.white === socketId) return 'white';
    if (room.black === socketId) return 'black';
    return null;
  }

  private updateClock(room: GameRoom): void {
    if (room.status !== 'playing') return;
    const now = Date.now();
    const elapsed = now - room.gameState.lastMoveTime;

    if (room.gameState.turn === 'white') {
      room.gameState.whiteTime = Math.max(0, room.gameState.whiteTime - elapsed);
    } else {
      room.gameState.blackTime = Math.max(0, room.gameState.blackTime - elapsed);
    }

    room.gameState.lastMoveTime = now;
  }

  // eslint-disable-next-line no-unused-vars
  startClock(gameId: string, onTick: (...args: [GameRoom]) => void): void {
    this.stopClock(gameId);

    const interval = setInterval(() => {
      const room = this.games.get(gameId);
      if (!room || room.status !== 'playing') {
        this.stopClock(gameId);
        return;
      }

      this.updateClock(room);

      if (room.gameState.whiteTime <= 0) {
        room.gameState.whiteTime = 0;
        room.gameState.gameOver = true;
        room.gameState.winner = 'black';
        room.gameState.resultReason = 'timeout';
        room.gameState.counting = null;
        room.status = 'finished';
        this.stopClock(gameId);
      } else if (room.gameState.blackTime <= 0) {
        room.gameState.blackTime = 0;
        room.gameState.gameOver = true;
        room.gameState.winner = 'white';
        room.gameState.resultReason = 'timeout';
        room.gameState.counting = null;
        room.status = 'finished';
        this.stopClock(gameId);
      }

      onTick(room);
    }, GameManager.CLOCK_TICK_MS);

    this.clockIntervals.set(gameId, interval);
  }

  stopClock(gameId: string): void {
    const interval = this.clockIntervals.get(gameId);
    if (interval) {
      clearInterval(interval);
      this.clockIntervals.delete(gameId);
    }
  }

  cleanupOldGames(): void {
    const now = Date.now();
    for (const [id, room] of this.games) {
      const lastActivity = this.roomLastActivity.get(id) ?? room.createdAt;
      const whiteDisconnectedAt = this.disconnectedPlayers.get(this.getDisconnectedKey(id, 'white'));
      const blackDisconnectedAt = this.disconnectedPlayers.get(this.getDisconnectedKey(id, 'black'));
      const waitingExpired = room.status === 'waiting' && now - lastActivity > GameManager.WAITING_ROOM_TTL_MS;
      const finishedExpired = room.status === 'finished' && now - lastActivity > GameManager.FINISHED_GAME_TTL_MS;
      const disconnectedExpired = room.status === 'playing'
        && ((whiteDisconnectedAt !== undefined && now - whiteDisconnectedAt > GameManager.DISCONNECTED_GAME_TTL_MS)
          || (blackDisconnectedAt !== undefined && now - blackDisconnectedAt > GameManager.DISCONNECTED_GAME_TTL_MS));

      if (waitingExpired || finishedExpired || disconnectedExpired) {
        this.deleteGame(id, room);
      }
    }
  }

  private touchGame(gameId: string): void {
    this.roomLastActivity.set(gameId, Date.now());
  }

  private getDisconnectedKey(gameId: string, color: PieceColor) {
    return `${gameId}:${color}`;
  }

  private clearDisconnectedPlayer(gameId: string, color: PieceColor): void {
    this.disconnectedPlayers.delete(this.getDisconnectedKey(gameId, color));
  }

  private deleteGame(gameId: string, room: GameRoom): void {
    this.games.delete(gameId);
    this.stopClock(gameId);
    this.roomLastActivity.delete(gameId);
    this.clearDisconnectedPlayer(gameId, 'white');
    this.clearDisconnectedPlayer(gameId, 'black');

    if (room.white) this.socketGames.delete(room.white);
    if (room.black) this.socketGames.delete(room.black);
    if (room.whitePlayerId) this.playerGames.delete(room.whitePlayerId);
    if (room.blackPlayerId) this.playerGames.delete(room.blackPlayerId);

    for (const spectatorId of room.spectators) {
      this.socketGames.delete(spectatorId);
    }
  }
}
