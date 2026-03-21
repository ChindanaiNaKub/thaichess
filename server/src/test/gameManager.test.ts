import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../gameManager';
import type { TimeControl } from '../../../shared/types';

const timeControl: TimeControl = { initial: 300, increment: 2 };

describe('GameManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-21T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a game when the second player joins and tracks both players', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);

    const whiteJoin = manager.joinGame(room.id, 'white-socket');
    const blackJoin = manager.joinGame(room.id, 'black-socket');

    expect(whiteJoin).toMatchObject({ color: 'white' });
    expect(blackJoin).toMatchObject({ color: 'black' });
    expect(manager.getPlayerGame('white-socket')).toBe(room.id);
    expect(manager.getPlayerGame('black-socket')).toBe(room.id);
    expect(manager.getGame(room.id)?.status).toBe('playing');
  });

  it('rejects moves from non-players and from the wrong turn', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    expect(manager.makeMove(room.id, 'spectator', { row: 2, col: 0 }, { row: 3, col: 0 })).toEqual({
      success: false,
      error: 'You are not a player in this game',
    });

    expect(manager.makeMove(room.id, 'black-socket', { row: 5, col: 0 }, { row: 4, col: 0 })).toEqual({
      success: false,
      error: 'Not your turn',
    });
  });

  it('creates a rematch with colors swapped', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    const rematch = manager.createRematch(room.id);

    expect(rematch).not.toBeNull();
    expect(rematch?.white).toBe('black-socket');
    expect(rematch?.black).toBe('white-socket');
    expect(rematch?.status).toBe('playing');
  });

  it('cleans up stale waiting, finished, and disconnected games', () => {
    const manager = new GameManager();

    const waitingRoom = manager.createGame(timeControl);

    const finishedRoom = manager.createGame(timeControl);
    manager.joinGame(finishedRoom.id, 'finished-white');
    manager.joinGame(finishedRoom.id, 'finished-black');
    manager.resign(finishedRoom.id, 'finished-white');

    const disconnectedRoom = manager.createGame(timeControl);
    manager.joinGame(disconnectedRoom.id, 'disconnect-white');
    manager.joinGame(disconnectedRoom.id, 'disconnect-black');
    manager.handleDisconnect('disconnect-white');

    vi.advanceTimersByTime(61 * 60 * 1000);
    manager.cleanupOldGames();

    expect(manager.getGame(waitingRoom.id)).toBeNull();
    expect(manager.getGame(finishedRoom.id)).toBeNull();
    expect(manager.getGame(disconnectedRoom.id)).toBeNull();
    expect(manager.getPlayerGame('disconnect-black')).toBeNull();
  });
});
