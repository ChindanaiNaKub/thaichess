import { v4 as uuidv4 } from 'uuid';
import {
  GameRoom, TimeControl, PieceColor, PrivateGameColorPreference, GameMode,
  Position, ClientGameState, Move, PublicLiveGameSummary, PlayerPresence, PlayerPresenceStatus,
} from '../../shared/types';
import { createInitialGameState, makeMove, startCounting, stopCounting } from '../../shared/engine';
import { resolveMakrukTimeoutOutcome } from '../../shared/makrukRules';

type DeferredLock = {
  promise: Promise<void>;
  resolve: () => void;
};

function createDeferredLock(): DeferredLock {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

export class GameManager {
  private games: Map<string, GameRoom> = new Map();
  private playerGames: Map<string, string> = new Map(); // playerId -> gameId
  private socketGames: Map<string, string> = new Map(); // socketId -> gameId
  private rematchOffers: Map<string, PieceColor> = new Map(); // gameId -> offering color
  private clockIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private disconnectedPlayers: Map<string, number> = new Map();
  private roomLastActivity: Map<string, number> = new Map();
  private joinGameLocks: Map<string, Promise<void>> = new Map(); // gameId -> lock promise (prevents race conditions)
  private static readonly CLOCK_TICK_MS = 500;
  private static readonly FINISHED_GAME_TTL_MS = 60 * 60 * 1000;
  private static readonly WAITING_ROOM_TTL_MS = 15 * 60 * 1000;
  private static readonly DISCONNECTED_GAME_TTL_MS = 10 * 60 * 1000;
  private static readonly PRESENCE_STALE_MS = 15 * 1000;

  createGame(
    timeControl: TimeControl,
    options: {
      ownerSocketId?: string;
      ownerPlayerId?: string;
      ownerUserId?: string | null;
      ownerDisplayName?: string | null;
      ownerRating?: number | null;
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
      whitePlayerName: options.ownerSocketId && resolvedOwnerColor === 'white' ? (options.ownerDisplayName ?? null) : null,
      blackPlayerName: options.ownerSocketId && resolvedOwnerColor === 'black' ? (options.ownerDisplayName ?? null) : null,
      whiteRating: options.ownerSocketId && resolvedOwnerColor === 'white' ? (options.ownerRating ?? null) : null,
      blackRating: options.ownerSocketId && resolvedOwnerColor === 'black' ? (options.ownerRating ?? null) : null,
      spectators: [],
      gameState,
      timeControl,
      status: 'waiting',
      createdAt: Date.now(),
      drawOffer: null,
      ownerColorPreference,
      gameMode: options.gameMode ?? 'private',
      rated: options.rated ?? false,
      whitePresence: this.createDisconnectedPresence(),
      blackPresence: this.createDisconnectedPresence(),
    };

    this.games.set(id, room);
    if (options.ownerSocketId) {
      this.socketGames.set(options.ownerSocketId, id);
      this.setPresence(room, resolvedOwnerColor, {
        status: 'active',
        lastSeenAt: Date.now(),
      });
    }
    if (ownerPlayerId) {
      this.playerGames.set(ownerPlayerId, id);
    }
    this.touchGame(id);
    return room;
  }

  async joinGame(
    gameId: string,
    socketId: string,
    options: { playerId?: string; userId?: string | null; displayName?: string | null; rating?: number | null } = {},
  ): Promise<{ room: GameRoom; color: PieceColor; reconnected: boolean } | null> {
    const previousLock = this.joinGameLocks.get(gameId);
    const waitForPreviousLock = previousLock?.catch(() => undefined) ?? Promise.resolve();
    const currentLock = createDeferredLock();
    const queuedLock = waitForPreviousLock.then(() => currentLock.promise);
    this.joinGameLocks.set(gameId, queuedLock);

    await waitForPreviousLock;

    try {
      const room = this.games.get(gameId);
      if (!room) return null;
      const playerId = options.playerId ?? socketId;

      // Same live connection joining again.
      if (room.white === socketId || room.black === socketId) {
        const color = room.white === socketId ? 'white' : 'black';
        this.socketGames.set(socketId, gameId);
        this.setPresence(room, color, {
          status: 'active',
          lastSeenAt: Date.now(),
        });
        return { room, color, reconnected: false };
      }

      // Reconnection: restore the player's seat using the durable player id.
      if (room.whitePlayerId === playerId) {
        if (room.white && room.white !== socketId) {
          this.socketGames.delete(room.white);
        }
        room.white = socketId;
        room.whiteUserId = options.userId ?? room.whiteUserId;
        room.whitePlayerName = options.displayName ?? room.whitePlayerName;
        room.whiteRating = options.rating ?? room.whiteRating;
        this.socketGames.set(socketId, gameId);
        this.playerGames.set(playerId, gameId);
        this.clearDisconnectedPlayer(gameId, 'white');
        this.setPresence(room, 'white', {
          status: 'active',
          lastSeenAt: Date.now(),
        });
        this.touchGame(gameId);
        return { room, color: 'white', reconnected: true };
      }

      if (room.blackPlayerId === playerId) {
        if (room.black && room.black !== socketId) {
          this.socketGames.delete(room.black);
        }
        room.black = socketId;
        room.blackUserId = options.userId ?? room.blackUserId;
        room.blackPlayerName = options.displayName ?? room.blackPlayerName;
        room.blackRating = options.rating ?? room.blackRating;
        this.socketGames.set(socketId, gameId);
        this.playerGames.set(playerId, gameId);
        this.clearDisconnectedPlayer(gameId, 'black');
        this.setPresence(room, 'black', {
          status: 'active',
          lastSeenAt: Date.now(),
        });
        this.touchGame(gameId);
        return { room, color: 'black', reconnected: true };
      }

      // Atomic: Try to join as white (now protected by lock)
      if (!room.white) {
        room.white = socketId;
        room.whitePlayerId = playerId;
        room.whiteUserId = options.userId ?? null;
        room.whitePlayerName = options.displayName ?? null;
        room.whiteRating = options.rating ?? null;
        this.socketGames.set(socketId, gameId);
        this.playerGames.set(playerId, gameId);
        this.clearDisconnectedPlayer(gameId, 'white');
        this.setPresence(room, 'white', {
          status: 'active',
          lastSeenAt: Date.now(),
        });
        if (room.status === 'waiting' && room.black) {
          room.status = 'playing';
          room.gameState.lastMoveTime = Date.now();
        }
        this.touchGame(gameId);
        return { room, color: 'white', reconnected: false };
      }

      // Atomic: Try to join as black (now protected by lock)
      if (!room.black) {
        room.black = socketId;
        room.blackPlayerId = playerId;
        room.blackUserId = options.userId ?? null;
        room.blackPlayerName = options.displayName ?? null;
        room.blackRating = options.rating ?? null;
        this.socketGames.set(socketId, gameId);
        this.playerGames.set(playerId, gameId);
        this.clearDisconnectedPlayer(gameId, 'black');
        this.setPresence(room, 'black', {
          status: 'active',
          lastSeenAt: Date.now(),
        });
        if (room.status === 'waiting') {
          room.status = 'playing';
          room.gameState.lastMoveTime = Date.now();
        }
        this.touchGame(gameId);
        return { room, color: 'black', reconnected: false };
      }

      // Game is full
      return null;
    } finally {
      currentLock.resolve();
      if (this.joinGameLocks.get(gameId) === queuedLock) {
        this.joinGameLocks.delete(gameId);
      }
    }
  }

  spectateGame(gameId: string, socketId: string): GameRoom | null {
    const room = this.games.get(gameId);
    if (!room) return null;
    if (this.getPlayerColor(room, socketId)) return room;

    const previousGameId = this.socketGames.get(socketId);
    if (previousGameId && previousGameId !== gameId) {
      const previousRoom = this.games.get(previousGameId);
      if (previousRoom && !this.getPlayerColor(previousRoom, socketId)) {
        previousRoom.spectators = previousRoom.spectators.filter((spectatorId) => spectatorId !== socketId);
        const shouldDeletePreviousRoom = previousRoom.status === 'waiting'
          && !previousRoom.white
          && !previousRoom.black
          && previousRoom.spectators.length === 0;

        if (shouldDeletePreviousRoom) {
          this.deleteGame(previousGameId, previousRoom);
        } else {
          this.touchGame(previousGameId);
        }
      }
    }

    if (!room.spectators.includes(socketId)) {
      room.spectators.push(socketId);
    }

    this.socketGames.set(socketId, gameId);
    this.touchGame(gameId);
    return room;
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
    this.markPlayerInteraction(room, playerColor);

    // Update clock before move
    this.updateClock(room);

    // Check if time ran out
    if (room.gameState.whiteTime <= 0 || room.gameState.blackTime <= 0) {
      const flaggedColor: PieceColor = room.gameState.whiteTime <= 0 ? 'white' : 'black';
      const timeoutOutcome = resolveMakrukTimeoutOutcome(room.gameState.board, flaggedColor);
      room.status = 'finished';
      room.gameState.gameOver = true;
      room.gameState.isDraw = timeoutOutcome.isDraw;
      room.gameState.winner = timeoutOutcome.winner;
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
    this.markPlayerInteraction(room, playerColor);

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
    this.markPlayerInteraction(room, playerColor);

    room.drawOffer = playerColor;
    this.touchGame(gameId);
    return { room, by: playerColor };
  }

  respondDraw(gameId: string, socketId: string, accept: boolean): GameRoom | null {
    const room = this.games.get(gameId);
    if (!room || !room.drawOffer || room.status !== 'playing') return null;

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor || playerColor === room.drawOffer) return null;
    this.markPlayerInteraction(room, playerColor);

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
    this.markPlayerInteraction(room, playerColor);

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
    this.markPlayerInteraction(room, playerColor);

    const newState = stopCounting(room.gameState);
    if (!newState) return null;

    room.gameState = newState;
    this.touchGame(gameId);
    return room;
  }

  createRematch(gameId: string): GameRoom | null {
    const oldRoom = this.games.get(gameId);
    if (!oldRoom || oldRoom.status !== 'finished') return null;
    if (!oldRoom.white || !oldRoom.black) return null;
    if (!oldRoom.whitePlayerId || !oldRoom.blackPlayerId) return null;

    const newRoom = this.createGame(oldRoom.timeControl);
    // Swap colors for rematch
    newRoom.white = oldRoom.black;
    newRoom.black = oldRoom.white;
    newRoom.whitePlayerId = oldRoom.blackPlayerId;
    newRoom.blackPlayerId = oldRoom.whitePlayerId;
    newRoom.whiteUserId = oldRoom.blackUserId;
    newRoom.blackUserId = oldRoom.whiteUserId;
    newRoom.whitePlayerName = oldRoom.blackPlayerName;
    newRoom.blackPlayerName = oldRoom.whitePlayerName;
    newRoom.whiteRating = oldRoom.blackRating;
    newRoom.blackRating = oldRoom.whiteRating;
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
    if (newRoom.white) {
      this.setPresence(newRoom, 'white', {
        status: 'active',
        lastSeenAt: Date.now(),
      });
    }
    if (newRoom.black) {
      this.setPresence(newRoom, 'black', {
        status: 'active',
        lastSeenAt: Date.now(),
      });
    }

    this.touchGame(newRoom.id);
    return newRoom;
  }

  requestRematch(gameId: string, socketId: string): {
    kind: 'offered' | 'accepted' | 'duplicate' | 'unavailable';
    by: PieceColor;
    opponentSocketId: string | null;
    room?: GameRoom;
  } | null {
    const room = this.games.get(gameId);
    if (!room || room.status !== 'finished') return null;

    const playerColor = this.getPlayerColor(room, socketId);
    if (!playerColor) return null;

    const opponentColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
    const opponentSocketId = opponentColor === 'white' ? room.white : room.black;
    if (!opponentSocketId) {
      this.rematchOffers.delete(gameId);
      return { kind: 'unavailable', by: playerColor, opponentSocketId: null };
    }

    const existingOffer = this.rematchOffers.get(gameId);
    if (existingOffer === playerColor) {
      return { kind: 'duplicate', by: playerColor, opponentSocketId };
    }

    if (existingOffer === opponentColor) {
      this.rematchOffers.delete(gameId);
      const newRoom = this.createRematch(gameId);
      if (!newRoom) {
        return { kind: 'unavailable', by: playerColor, opponentSocketId };
      }
      return { kind: 'accepted', by: playerColor, opponentSocketId, room: newRoom };
    }

    this.rematchOffers.set(gameId, playerColor);
    this.touchGame(gameId);
    return { kind: 'offered', by: playerColor, opponentSocketId };
  }

  handleDisconnect(socketId: string): { gameId: string; color: PieceColor } | null {
    const gameId = this.socketGames.get(socketId);
    if (!gameId) return null;

    const room = this.games.get(gameId);
    if (!room) return null;

    const color = this.getPlayerColor(room, socketId);
    this.socketGames.delete(socketId);
    room.spectators = room.spectators.filter((spectatorId) => spectatorId !== socketId);
    this.rematchOffers.delete(gameId);

    if (color) {
      this.disconnectedPlayers.set(this.getDisconnectedKey(gameId, color), Date.now());
      this.setPresence(room, color, {
        status: 'disconnected',
        lastSeenAt: Date.now(),
      });
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
      this.setPresence(room, 'white', {
        status: 'active',
        lastSeenAt: Date.now(),
      });
    }
    if (room.blackPlayerId === playerId) {
      if (room.black) {
        this.socketGames.delete(room.black);
      }
      room.black = newSocketId;
      this.clearDisconnectedPlayer(gameId, 'black');
      this.setPresence(room, 'black', {
        status: 'active',
        lastSeenAt: Date.now(),
      });
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

  getPublicLiveGames(options: { status?: 'live' | 'all'; limit?: number } = {}): PublicLiveGameSummary[] {
    const statusFilter = options.status ?? 'all';
    const limit = options.limit ?? 20;

    const summaries = Array.from(this.games.values())
      .filter((room) => room.gameMode === 'quick_play')
      .filter((room): room is GameRoom & { status: 'playing' | 'finished' } => room.status === 'playing' || room.status === 'finished')
      .filter((room) => statusFilter === 'all' || room.status === 'playing')
      .map((room) => ({
        id: room.id,
        status: room.status,
        whitePlayerName: room.whitePlayerName,
        blackPlayerName: room.blackPlayerName,
        whiteRating: room.whiteRating,
        blackRating: room.blackRating,
        timeControl: room.timeControl,
        moveCount: room.gameState.moveCount,
        spectatorCount: room.spectators.length,
        rated: room.rated,
        gameMode: room.gameMode,
        createdAt: room.createdAt,
        lastMoveAt: room.gameState.lastMoveTime,
      }))
      .sort((a, b) => {
        const aStatusScore = a.status === 'playing' ? 1 : 0;
        const bStatusScore = b.status === 'playing' ? 1 : 0;
        if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;

        const aRatedScore = a.rated ? 1 : 0;
        const bRatedScore = b.rated ? 1 : 0;
        if (aRatedScore !== bRatedScore) return bRatedScore - aRatedScore;

        if (a.spectatorCount !== b.spectatorCount) return b.spectatorCount - a.spectatorCount;
        if (a.moveCount !== b.moveCount) return b.moveCount - a.moveCount;

        const aRatingSum = (a.whiteRating ?? 0) + (a.blackRating ?? 0);
        const bRatingSum = (b.whiteRating ?? 0) + (b.blackRating ?? 0);
        if (aRatingSum !== bRatingSum) return bRatingSum - aRatingSum;

        return b.lastMoveAt - a.lastMoveAt;
      });

    return summaries.slice(0, limit);
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

  updatePlayerPresence(
    gameId: string,
    socketId: string,
    presence: {
      status: Exclude<PlayerPresenceStatus, 'disconnected'>;
      latencyMs?: number | null;
      lastSeenAt?: number;
    },
  ): GameRoom | null {
    const room = this.games.get(gameId);
    if (!room) return null;

    const color = this.getPlayerColor(room, socketId);
    if (!color) return null;

    this.setPresence(room, color, {
      status: presence.status,
      latencyMs: presence.latencyMs ?? undefined,
      lastSeenAt: presence.lastSeenAt ?? Date.now(),
    });
    this.touchGame(gameId);
    return room;
  }

  getPresenceSnapshot(room: GameRoom) {
    return {
      gameId: room.id,
      whitePresence: this.getEffectivePresence(room, 'white'),
      blackPresence: this.getEffectivePresence(room, 'black'),
    };
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
    if (room.status === 'playing' && playerColor) {
      return null;
    }

    const leavingWhite = room.white === socketId;
    const leavingBlack = room.black === socketId;

    if (leavingWhite && room.whitePlayerId) {
      this.playerGames.delete(room.whitePlayerId);
    }
    if (leavingBlack && room.blackPlayerId) {
      this.playerGames.delete(room.blackPlayerId);
    }

    if (leavingWhite) {
      room.white = null;
      room.whitePresence = this.createDisconnectedPresence();
    }
    if (leavingBlack) {
      room.black = null;
      room.blackPresence = this.createDisconnectedPresence();
    }

    if (room.status === 'waiting' && leavingWhite) {
      room.whitePlayerId = null;
      room.whiteUserId = null;
      room.whitePlayerName = null;
      room.whiteRating = null;
    }
    if (room.status === 'waiting' && leavingBlack) {
      room.blackPlayerId = null;
      room.blackUserId = null;
      room.blackPlayerName = null;
      room.blackRating = null;
    }
    room.spectators = room.spectators.filter((spectatorId) => spectatorId !== socketId);
    this.socketGames.delete(socketId);
    this.rematchOffers.delete(gameId);
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
      lastMove: room.gameState.lastMove,
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
      whitePlayerName: room.whitePlayerName,
      blackPlayerName: room.blackPlayerName,
      whiteRating: room.whiteRating,
      blackRating: room.blackRating,
      drawOffer: room.drawOffer,
      gameId: room.id,
      gameMode: room.gameMode,
      rated: room.rated,
      whitePresence: this.getEffectivePresence(room, 'white'),
      blackPresence: this.getEffectivePresence(room, 'black'),
    };
  }

  private getPlayerColor(room: GameRoom, socketId: string): PieceColor | null {
    if (room.white === socketId) return 'white';
    if (room.black === socketId) return 'black';
    return null;
  }

  private createDisconnectedPresence(): PlayerPresence {
    return {
      status: 'disconnected',
      latencyMs: null,
      lastSeenAt: null,
    };
  }

  private setPresence(
    room: GameRoom,
    color: PieceColor,
    updates: {
      status?: PlayerPresenceStatus;
      latencyMs?: number | null;
      lastSeenAt?: number | null;
    },
  ) {
    const current = color === 'white' ? room.whitePresence : room.blackPresence;
    const next: PlayerPresence = {
      status: updates.status ?? current.status,
      latencyMs: updates.latencyMs ?? current.latencyMs,
      lastSeenAt: updates.lastSeenAt ?? current.lastSeenAt,
    };

    if (color === 'white') {
      room.whitePresence = next;
    } else {
      room.blackPresence = next;
    }
  }

  private getEffectivePresence(room: GameRoom, color: PieceColor): PlayerPresence {
    const base = color === 'white' ? room.whitePresence : room.blackPresence;
    const socketId = color === 'white' ? room.white : room.black;

    if (!socketId) {
      return this.createDisconnectedPresence();
    }

    if (base.status === 'disconnected' || base.lastSeenAt === null) {
      return { ...base, status: 'disconnected' };
    }

    if (Date.now() - base.lastSeenAt > GameManager.PRESENCE_STALE_MS) {
      return { ...base, status: 'disconnected' };
    }

    return { ...base };
  }

  private markPlayerInteraction(room: GameRoom, color: PieceColor) {
    this.setPresence(room, color, {
      status: 'active',
      lastSeenAt: Date.now(),
    });
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
        const timeoutOutcome = resolveMakrukTimeoutOutcome(room.gameState.board, 'white');
        room.gameState.whiteTime = 0;
        room.gameState.gameOver = true;
        room.gameState.isDraw = timeoutOutcome.isDraw;
        room.gameState.winner = timeoutOutcome.winner;
        room.gameState.resultReason = 'timeout';
        room.gameState.counting = null;
        room.status = 'finished';
        this.stopClock(gameId);
      } else if (room.gameState.blackTime <= 0) {
        const timeoutOutcome = resolveMakrukTimeoutOutcome(room.gameState.board, 'black');
        room.gameState.blackTime = 0;
        room.gameState.gameOver = true;
        room.gameState.isDraw = timeoutOutcome.isDraw;
        room.gameState.winner = timeoutOutcome.winner;
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
    this.rematchOffers.delete(gameId);
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
