import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSocketConnectionHandler } from '../socketHandlers';
import { GameManager } from '../gameManager';
import { MatchmakingQueue } from '../matchmaking';
import { SocketRateLimiter } from '../security';
import { MonitoringStore } from '../monitoring';
import type { TimeControl } from '../../../shared/types';
import type { AuthUser } from '../database';

const timeControl: TimeControl = { initial: 300, increment: 0 };

// eslint-disable-next-line no-unused-vars
type Handler = (...args: [] | [any]) => void;

function createIoMock() {
  // eslint-disable-next-line no-unused-vars
  type IoTarget = { emit: (...args: any[]) => unknown; emitMock: ReturnType<typeof vi.fn> };
  const targets = new Map<string, IoTarget>();

  return {
    targets,
    to(id: string) {
      if (!targets.has(id)) {
        const emitMock = vi.fn();
        targets.set(id, {
          emit: (...args: any[]) => emitMock(...args),
          emitMock,
        });
      }
      return targets.get(id)!;
    },
  };
}

function createSocketMock(id: string, authUser: AuthUser | null = null, playerId?: string) {
  const handlers = new Map<string, Handler>();
  const roomTarget = { emit: vi.fn() };

  return {
    id,
    data: {
      authUser,
      playerId: playerId ?? authUser?.id ?? id,
    },
    handshake: {
      headers: {},
      address: '203.0.113.10',
    },
    emit: vi.fn(),
    join: vi.fn(),
    to: vi.fn(() => roomTarget),
    on: vi.fn((event: string, handler: Handler) => {
      handlers.set(event, handler);
      return undefined;
    }),
    trigger(event: string, payload?: any) {
      const handler = handlers.get(event);
      if (!handler) {
        throw new Error(`Missing handler for ${event}`);
      }
      handler(payload);
    },
  };
}

function createAuthUser(id: string, email: string, username: string, fairPlayStatus: AuthUser['fair_play_status'] = 'clear'): AuthUser {
  return {
    id,
    email,
    username,
    role: 'user',
    fair_play_status: fairPlayStatus,
    rated_restricted_at: fairPlayStatus === 'restricted' ? 1 : null,
    rated_restriction_note: fairPlayStatus === 'restricted' ? 'Restricted for rated play' : null,
    rating: 1500,
    rated_games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    created_at: 0,
    updated_at: 0,
    last_login_at: null,
  };
}

describe('socket entry handlers', () => {
  let gameManager: GameManager;
  let matchmaking: MatchmakingQueue;
  let socketRateLimiter: SocketRateLimiter;
  let ipRateLimiter: SocketRateLimiter;
  let monitoring: MonitoringStore;
  let ioMock: ReturnType<typeof createIoMock>;

  beforeEach(() => {
    gameManager = new GameManager();
    matchmaking = new MatchmakingQueue();
    socketRateLimiter = new SocketRateLimiter();
    ipRateLimiter = new SocketRateLimiter();
    monitoring = new MonitoringStore();
    ioMock = createIoMock();
  });

  function connectSocket(socketId: string, authUser: AuthUser | null = null, playerId?: string) {
    const socket = createSocketMock(socketId, authUser, playerId);
    const handler = createSocketConnectionHandler({
      io: ioMock,
      gameManager,
      matchmaking,
      socketRateLimiter,
      ipRateLimiter,
      monitoring,
      saveGameToDb: vi.fn().mockResolvedValue({ ratingChange: null }),
    });

    handler(socket as never);
    return socket;
  }

  it('rejects invalid find_game payloads through the live socket handler', () => {
    const socket = connectSocket('socket-invalid-find');

    socket.trigger('find_game', { timeControl: { initial: 5, increment: 0 } });

    expect(socket.emit).toHaveBeenCalledWith('error', { message: expect.stringContaining('Invalid fields:') });
  });

  it('creates private games with a reserved color preference and lets waiting rooms be left', () => {
    const socket = connectSocket('socket-private', createAuthUser('user-private', 'private@example.com', 'private_user'));

    socket.trigger('create_game', { timeControl, colorPreference: 'black' });

    expect(socket.emit).toHaveBeenCalledWith('game_created', { gameId: expect.any(String) });

    const createdCall = socket.emit.mock.calls.find((call: any[]) => call[0] === 'game_created');
    const createdGameId = createdCall?.[1]?.gameId;
    expect(createdGameId).toBeTypeOf('string');

    const createdRoom = gameManager.getGame(createdGameId)!;
    expect(createdRoom.black).toBe('socket-private');
    expect(createdRoom.white).toBeNull();
    expect(createdRoom.blackUserId).toBe('user-private');
    expect(createdRoom.gameMode).toBe('private');
    expect(createdRoom.rated).toBe(false);

    socket.emit.mockClear();
    socket.trigger('leave_game', { gameId: createdGameId });

    expect(socket.emit).toHaveBeenCalledWith('game_left', { gameId: createdGameId });
    expect(gameManager.getGame(createdGameId)).toBeNull();
  });

  it('prevents duplicate matchmaking entries and emits cancellation when removed', () => {
    const socket = connectSocket('socket-queue', createAuthUser('user-queue', 'queue@example.com', 'queue_user'));

    socket.trigger('find_game', { timeControl });
    socket.trigger('find_game', { timeControl });

    expect(socket.emit).toHaveBeenCalledWith('matchmaking_started');
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'You are already in the matchmaking queue.' });

    socket.emit.mockClear();
    socket.trigger('cancel_matchmaking');

    expect(socket.emit).toHaveBeenCalledWith('matchmaking_cancelled');
  });

  it('marks signed-in quick-play matches as rated and keeps player user ids', () => {
    const whiteSocket = connectSocket('socket-a', createAuthUser('user-a', 'a@example.com', 'user_a'));
    const blackSocket = connectSocket('socket-b', createAuthUser('user-b', 'b@example.com', 'user_b'));

    whiteSocket.trigger('find_game', { timeControl });
    blackSocket.trigger('find_game', { timeControl });

    const createdGameId = (ioMock.to('socket-a').emitMock.mock.calls.find((call: any[]) => call[0] === 'matchmaking_found')?.[1]?.gameId
      ?? ioMock.to('socket-b').emitMock.mock.calls.find((call: any[]) => call[0] === 'matchmaking_found')?.[1]?.gameId) as string;
    const room = gameManager.getGame(createdGameId)!;

    expect(room.gameMode).toBe('quick_play');
    expect(room.rated).toBe(true);
    expect([room.whiteUserId, room.blackUserId].sort()).toEqual(['user-a', 'user-b']);
  });

  it('keeps mixed-auth quick-play matches casual', () => {
    const signedInSocket = connectSocket('socket-a', createAuthUser('user-a', 'a@example.com', 'user_a'));
    const anonymousSocket = connectSocket('socket-b');

    signedInSocket.trigger('find_game', { timeControl });
    anonymousSocket.trigger('find_game', { timeControl });

    const createdGameId = (ioMock.to('socket-a').emitMock.mock.calls.find((call: any[]) => call[0] === 'matchmaking_found')?.[1]?.gameId
      ?? ioMock.to('socket-b').emitMock.mock.calls.find((call: any[]) => call[0] === 'matchmaking_found')?.[1]?.gameId) as string;
    const room = gameManager.getGame(createdGameId)!;

    expect(room.gameMode).toBe('quick_play');
    expect(room.rated).toBe(false);
    expect([room.whiteUserId, room.blackUserId].filter(Boolean)).toEqual(['user-a']);
  });

  it('keeps restricted users out of rated quick-play while still allowing casual pairing', () => {
    const restrictedSocket = connectSocket('socket-a', createAuthUser('user-a', 'a@example.com', 'user_a', 'restricted'));
    const clearSocket = connectSocket('socket-b', createAuthUser('user-b', 'b@example.com', 'user_b'));

    restrictedSocket.trigger('find_game', { timeControl });
    clearSocket.trigger('find_game', { timeControl });

    const createdGameId = (ioMock.to('socket-a').emitMock.mock.calls.find((call: any[]) => call[0] === 'matchmaking_found')?.[1]?.gameId
      ?? ioMock.to('socket-b').emitMock.mock.calls.find((call: any[]) => call[0] === 'matchmaking_found')?.[1]?.gameId) as string;
    const room = gameManager.getGame(createdGameId)!;

    expect(room.rated).toBe(false);
    expect([room.whiteUserId, room.blackUserId].sort()).toEqual(['user-a', 'user-b']);
  });

  it('does not emit rematch events for unfinished games through the socket layer', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');

    const socket = connectSocket('white-socket');
    socket.trigger('request_rematch');

    expect(ioMock.targets.size).toBe(0);
  });

  it('requires explicit confirmation from both players before creating a rematch', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');
    gameManager.resign(room.id, 'white-socket');

    const whiteSocket = connectSocket('white-socket');
    const blackSocket = connectSocket('black-socket');

    whiteSocket.trigger('request_rematch');

    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith('rematch_offered', { by: 'white' });
    expect(ioMock.to('white-socket').emitMock).not.toHaveBeenCalledWith('game_created', expect.anything());
    expect(ioMock.to('black-socket').emitMock).not.toHaveBeenCalledWith('game_created', expect.anything());

    blackSocket.trigger('request_rematch');

    expect(ioMock.to('white-socket').emitMock).toHaveBeenCalledWith('game_created', { gameId: expect.any(String) });
    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith('game_created', { gameId: expect.any(String) });
  });

  it('clears pending rematch offers when a player leaves a finished game', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');
    gameManager.resign(room.id, 'white-socket');

    const whiteSocket = connectSocket('white-socket');
    const blackSocket = connectSocket('black-socket');

    whiteSocket.trigger('request_rematch');
    whiteSocket.emit.mockClear();

    whiteSocket.trigger('leave_game', { gameId: room.id });

    expect(whiteSocket.emit).toHaveBeenCalledWith('game_left', { gameId: room.id });
    expect(gameManager.getPlayerGame('white-socket')).toBeNull();

    blackSocket.trigger('request_rematch');

    expect(blackSocket.emit).toHaveBeenCalledWith('error', { message: 'Your opponent already left the finished game.' });
    expect(ioMock.to('white-socket').emitMock).not.toHaveBeenCalledWith('game_created', expect.anything());
    expect(ioMock.to('black-socket').emitMock).not.toHaveBeenCalledWith('game_created', expect.anything());
  });

  it('notifies the opponent on disconnect from a live game', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');

    const socket = connectSocket('white-socket');
    socket.trigger('disconnect');

    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith('opponent_disconnected');
  });

  it('broadcasts presence heartbeat updates and marks players disconnected when the socket drops', () => {
    const room = gameManager.createGame(timeControl, {
      ownerSocketId: 'white-socket',
      ownerPlayerId: 'player-white',
      ownerColorPreference: 'white',
    });
    gameManager.joinGame(room.id, 'black-socket', { playerId: 'player-black' });

    const whiteSocket = connectSocket('white-socket', null, 'player-white');
    const blackSocket = connectSocket('black-socket', null, 'player-black');

    whiteSocket.trigger('join_game', { gameId: room.id });
    blackSocket.trigger('join_game', { gameId: room.id });

    whiteSocket.emit.mockClear();
    ioMock.to('black-socket').emitMock.mockClear();

    whiteSocket.trigger('presence_heartbeat', {
      gameId: room.id,
      sentAt: 1234,
      clientStatus: 'idle',
      latencyMs: 187,
    });

    expect(whiteSocket.emit).toHaveBeenCalledWith('heartbeat_ack', { sentAt: 1234 });
    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith(
      'presence_update',
      expect.objectContaining({
        gameId: room.id,
        whitePresence: expect.objectContaining({
          status: 'idle',
          latencyMs: 187,
        }),
      }),
    );

    ioMock.to('black-socket').emitMock.mockClear();
    whiteSocket.trigger('disconnect');

    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith('opponent_disconnected');
    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith(
      'presence_update',
      expect.objectContaining({
        gameId: room.id,
        whitePresence: expect.objectContaining({
          status: 'disconnected',
        }),
      }),
    );
  });

  it('restores a disconnected player seat when the same player reconnects with a new socket id', () => {
    const room = gameManager.createGame(timeControl, {
      ownerSocketId: 'white-old',
      ownerPlayerId: 'guest_white',
      ownerColorPreference: 'white',
    });
    gameManager.joinGame(room.id, 'black-old', { playerId: 'guest_black' });

    const disconnectedSocket = connectSocket('white-old', null, 'guest_white');
    disconnectedSocket.trigger('disconnect');

    const reconnectedSocket = connectSocket('white-new', null, 'guest_white');
    reconnectedSocket.trigger('join_game', { gameId: room.id });

    expect(reconnectedSocket.emit).toHaveBeenCalledWith(
      'game_joined',
      expect.objectContaining({ color: 'white' }),
    );
    expect(gameManager.getGame(room.id)?.white).toBe('white-new');
    expect(gameManager.getPlayerGame('guest_white')).toBe(room.id);
    expect(ioMock.to('black-old').emitMock).toHaveBeenCalledWith('opponent_reconnected');
  });

  it('lets spectators join read-only and receive live updates without becoming players', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');

    const spectatorSocket = connectSocket('spectator-socket');
    spectatorSocket.trigger('spectate_game', { gameId: room.id });

    expect(spectatorSocket.join).toHaveBeenCalledWith(room.id);
    expect(spectatorSocket.emit).toHaveBeenCalledWith(
      'game_joined',
      expect.objectContaining({ color: null }),
    );
    expect(gameManager.getGame(room.id)?.spectators).toContain('spectator-socket');

    const whiteSocket = connectSocket('white-socket');
    whiteSocket.trigger('make_move', {
      from: { row: 2, col: 0 },
      to: { row: 3, col: 0 },
    });

    expect(ioMock.to('spectator-socket').emitMock).toHaveBeenCalledWith(
      'move_made',
      expect.objectContaining({
        move: expect.objectContaining({
          from: { row: 2, col: 0 },
          to: { row: 3, col: 0 },
        }),
        gameState: expect.objectContaining({ playerColor: null }),
      }),
    );

    spectatorSocket.emit.mockClear();
    spectatorSocket.trigger('make_move', {
      from: { row: 2, col: 1 },
      to: { row: 3, col: 1 },
    });

    expect(spectatorSocket.emit).toHaveBeenCalledWith('error', { message: 'You are not in a game' });
  });

  it('tells a third player to use spectator mode when a live game is already full', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');

    const thirdSocket = connectSocket('third-socket');
    thirdSocket.trigger('join_game', { gameId: room.id });

    expect(thirdSocket.emit).toHaveBeenCalledWith('error', {
      message: 'Game is full. Redirecting to spectator mode.',
    });
  });

  it('prevents an active player from spectating a different live game on the same session', () => {
    const roomA = gameManager.createGame(timeControl);
    gameManager.joinGame(roomA.id, 'white-socket', { playerId: 'player-1' });
    gameManager.joinGame(roomA.id, 'black-socket', { playerId: 'player-2' });

    const roomB = gameManager.createGame(timeControl);
    gameManager.joinGame(roomB.id, 'white-b', { playerId: 'player-3' });
    gameManager.joinGame(roomB.id, 'black-b', { playerId: 'player-4' });

    const activePlayerSocket = connectSocket('white-socket', null, 'player-1');
    activePlayerSocket.trigger('spectate_game', { gameId: roomB.id });

    expect(activePlayerSocket.emit).toHaveBeenCalledWith('error', {
      message: 'Leave your current game before spectating another one.',
    });
    expect(gameManager.getGame(roomB.id)?.spectators).toEqual([]);
  });

  it('emits updated counting state to both players when counting starts', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');
    const activeRoom = gameManager.getGame(room.id)!;
    activeRoom.gameState.counting = {
      active: false,
      type: 'board_honor',
      countingColor: 'white',
      strongerColor: 'black',
      currentCount: 9,
      startCount: 0,
      limit: 64,
      finalAttackPending: true,
    };

    const socket = connectSocket('white-socket');
    socket.trigger('start_counting');

    expect(ioMock.to('white-socket').emitMock).toHaveBeenCalledWith(
      'game_state',
      expect.objectContaining({
        counting: expect.objectContaining({
          active: true,
          currentCount: 0,
          startCount: 0,
          finalAttackPending: false,
        }),
      }),
    );
    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith(
      'game_state',
      expect.objectContaining({
        counting: expect.objectContaining({
          active: true,
          currentCount: 0,
          startCount: 0,
          finalAttackPending: false,
        }),
      }),
    );
  });
});
