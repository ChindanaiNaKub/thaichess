import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSocketConnectionHandler } from '../socketHandlers';
import { GameManager } from '../gameManager';
import { MatchmakingQueue } from '../matchmaking';
import { SocketRateLimiter } from '../security';
import { MonitoringStore } from '../monitoring';
import type { TimeControl } from '../../../shared/types';
import type { AuthUser } from '../database';

const timeControl: TimeControl = { initial: 300, increment: 0 };

type Handler = (payload?: any) => void;

function createIoMock() {
  const targets = new Map<string, { emit: (...args: any[]) => unknown; emitMock: ReturnType<typeof vi.fn> }>();

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

function createSocketMock(id: string, authUser: AuthUser | null = null) {
  const handlers = new Map<string, Handler>();
  const roomTarget = { emit: vi.fn() };

  return {
    id,
    data: {
      authUser,
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

  function connectSocket(socketId: string, authUser: AuthUser | null = null) {
    const socket = createSocketMock(socketId, authUser);
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

    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Invalid time control.' });
  });

  it('creates private games with a reserved color preference and lets waiting rooms be left', () => {
    const socket = connectSocket('socket-private', {
      id: 'user-private',
      email: 'private@example.com',
      username: 'private_user',
      role: 'user',
      rating: 1500,
      rated_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    });

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
    const socket = connectSocket('socket-queue', {
      id: 'user-queue',
      email: 'queue@example.com',
      username: 'queue_user',
      role: 'user',
      rating: 1500,
      rated_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    });

    socket.trigger('find_game', { timeControl });
    socket.trigger('find_game', { timeControl });

    expect(socket.emit).toHaveBeenCalledWith('matchmaking_started');
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'You are already in the matchmaking queue.' });

    socket.emit.mockClear();
    socket.trigger('cancel_matchmaking');

    expect(socket.emit).toHaveBeenCalledWith('matchmaking_cancelled');
  });

  it('marks signed-in quick-play matches as rated and keeps player user ids', () => {
    const whiteSocket = connectSocket('socket-a', {
      id: 'user-a',
      email: 'a@example.com',
      username: 'user_a',
      role: 'user',
      rating: 1500,
      rated_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    });
    const blackSocket = connectSocket('socket-b', {
      id: 'user-b',
      email: 'b@example.com',
      username: 'user_b',
      role: 'user',
      rating: 1500,
      rated_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    });

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
    const signedInSocket = connectSocket('socket-a', {
      id: 'user-a',
      email: 'a@example.com',
      username: 'user_a',
      role: 'user',
      rating: 1500,
      rated_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    });
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

  it('does not emit rematch events for unfinished games through the socket layer', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');

    const socket = connectSocket('white-socket');
    socket.trigger('request_rematch');

    expect(ioMock.targets.size).toBe(0);
  });

  it('notifies the opponent on disconnect from a live game', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');

    const socket = connectSocket('white-socket');
    socket.trigger('disconnect');

    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith('opponent_disconnected');
  });

  it('emits updated counting state to both players when counting starts', () => {
    const room = gameManager.createGame(timeControl);
    gameManager.joinGame(room.id, 'white-socket');
    gameManager.joinGame(room.id, 'black-socket');
    const activeRoom = gameManager.getGame(room.id)!;
    activeRoom.gameState.counting = {
      active: false,
      type: 'pieces_honor',
      countingColor: 'white',
      strongerColor: 'black',
      currentCount: 9,
      startCount: 3,
      limit: 16,
      finalAttackPending: true,
    };

    const socket = connectSocket('white-socket');
    socket.trigger('start_counting');

    expect(ioMock.to('white-socket').emitMock).toHaveBeenCalledWith(
      'game_state',
      expect.objectContaining({
        counting: expect.objectContaining({
          active: true,
          currentCount: 3,
          startCount: 3,
          finalAttackPending: false,
        }),
      }),
    );
    expect(ioMock.to('black-socket').emitMock).toHaveBeenCalledWith(
      'game_state',
      expect.objectContaining({
        counting: expect.objectContaining({
          active: true,
          currentCount: 3,
          startCount: 3,
          finalAttackPending: false,
        }),
      }),
    );
  });
});
