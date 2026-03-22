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

  it('reserves the creator color for private games before the game page joins', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl, {
      ownerSocketId: 'creator-socket',
      ownerColorPreference: 'black',
    });

    expect(room.white).toBeNull();
    expect(room.black).toBe('creator-socket');
    expect(manager.getPlayerGame('creator-socket')).toBe(room.id);

    const creatorJoin = manager.joinGame(room.id, 'creator-socket');
    const guestJoin = manager.joinGame(room.id, 'guest-socket');

    expect(creatorJoin).toMatchObject({ color: 'black' });
    expect(guestJoin).toMatchObject({ color: 'white' });
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
    manager.resign(room.id, 'white-socket');

    const rematch = manager.createRematch(room.id);

    expect(rematch).not.toBeNull();
    expect(rematch?.white).toBe('black-socket');
    expect(rematch?.black).toBe('white-socket');
    expect(rematch?.status).toBe('playing');
  });

  it('rejects rematches for games that are not finished', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    expect(manager.createRematch(room.id)).toBeNull();
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

  it('handles draw offers, decline, and acceptance rules correctly', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    const offer = manager.offerDraw(room.id, 'white-socket');
    expect(offer).toMatchObject({ by: 'white' });
    expect(manager.getGame(room.id)?.drawOffer).toBe('white');

    expect(manager.respondDraw(room.id, 'white-socket', true)).toBeNull();

    const declined = manager.respondDraw(room.id, 'black-socket', false);
    expect(declined?.drawOffer).toBeNull();
    expect(declined?.status).toBe('playing');

    manager.offerDraw(room.id, 'white-socket');
    const accepted = manager.respondDraw(room.id, 'black-socket', true);
    expect(accepted?.status).toBe('finished');
    expect(accepted?.gameState.isDraw).toBe(true);
    expect(accepted?.gameState.resultReason).toBe('draw_agreement');
  });

  it('updates reconnecting player sockets and exposes client state metadata', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-old');
    manager.joinGame(room.id, 'black-old');

    manager.offerDraw(room.id, 'white-old');
    manager.handleDisconnect('white-old');
    manager.updatePlayerSocket(room.id, 'white-old', 'white-new');

    const updatedRoom = manager.getGame(room.id);
    expect(updatedRoom?.white).toBe('white-new');
    expect(manager.getPlayerGame('white-old')).toBeNull();
    expect(manager.getPlayerGame('white-new')).toBe(room.id);

    const clientState = manager.getClientGameState(updatedRoom!, 'white-new');
    expect(clientState.playerColor).toBe('white');
    expect(clientState.drawOffer).toBe('white');
    expect(clientState.status).toBe('playing');
    expect(clientState.gameId).toBe(room.id);
  });

  it('returns null for blocking-game lookup once a game is finished', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    expect(manager.getBlockingPlayerGame('white-socket')).toBe(room.id);

    manager.resign(room.id, 'white-socket');

    expect(manager.getBlockingPlayerGame('white-socket')).toBeNull();
    expect(manager.getPlayerGame('white-socket')).toBeNull();
  });

  it('removes waiting rooms when the only player leaves before the game starts', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl, {
      ownerSocketId: 'creator-socket',
      ownerColorPreference: 'white',
    });

    expect(manager.getBlockingPlayerGame('creator-socket')).toBe(room.id);

    expect(manager.leaveGame('creator-socket', room.id)).toEqual({
      gameId: room.id,
      deleted: true,
    });
    expect(manager.getGame(room.id)).toBeNull();
    expect(manager.getPlayerGame('creator-socket')).toBeNull();
    expect(manager.getBlockingPlayerGame('creator-socket')).toBeNull();
  });

  it('starts and stops counting only for the current player and active counting state', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');
    const activeRoom = manager.getGame(room.id)!;
    activeRoom.gameState.counting = {
      active: false,
      type: 'board_honor',
      countingColor: 'white',
      strongerColor: 'black',
      currentCount: 0,
      limit: 64,
      finalAttackPending: false,
    };

    expect(manager.startCounting(room.id, 'black-socket')).toBeNull();

    const started = manager.startCounting(room.id, 'white-socket');
    expect(started?.gameState.counting?.active).toBe(true);

    expect(manager.stopCounting(room.id, 'black-socket')).toBeNull();

    const stopped = manager.stopCounting(room.id, 'white-socket');
    expect(stopped?.gameState.counting?.active).toBe(false);
  });

  it('resets the counting number when the counting side starts again after stopping', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');
    const activeRoom = manager.getGame(room.id)!;
    activeRoom.gameState.counting = {
      active: false,
      type: 'pieces_honor',
      countingColor: 'white',
      strongerColor: 'black',
      currentCount: 12,
      startCount: 3,
      limit: 16,
      finalAttackPending: true,
    };

    const restarted = manager.startCounting(room.id, 'white-socket');

    expect(restarted?.gameState.counting).toMatchObject({
      active: true,
      currentCount: 3,
      startCount: 3,
      finalAttackPending: false,
    });
  });

  it('ends the game on timeout when the running clock expires', () => {
    const manager = new GameManager();
    const fastTime: TimeControl = { initial: 1, increment: 0 };
    const room = manager.createGame(fastTime);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    let latestRoom = manager.getGame(room.id)!;
    manager.startClock(room.id, (updatedRoom) => {
      latestRoom = updatedRoom;
    });

    vi.advanceTimersByTime(1_100);

    expect(latestRoom.status).toBe('finished');
    expect(latestRoom.gameState.gameOver).toBe(true);
    expect(latestRoom.gameState.resultReason).toBe('timeout');
    expect(latestRoom.gameState.winner).toBe('black');
  });
});
