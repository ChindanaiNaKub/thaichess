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
      ownerUserId: 'creator-user',
      ownerDisplayName: 'CreatorName',
      ownerRating: 1675,
      ownerColorPreference: 'black',
      gameMode: 'private',
      rated: false,
    });

    expect(room.white).toBeNull();
    expect(room.black).toBe('creator-socket');
    expect(room.blackUserId).toBe('creator-user');
    expect(manager.getPlayerGame('creator-socket')).toBe(room.id);

    const creatorJoin = manager.joinGame(room.id, 'creator-socket', { userId: 'creator-user', displayName: 'CreatorName', rating: 1675 });
    const guestJoin = manager.joinGame(room.id, 'guest-socket', { userId: 'guest-user', displayName: 'GuestName', rating: 1520 });

    expect(creatorJoin).toMatchObject({ color: 'black' });
    expect(guestJoin).toMatchObject({ color: 'white' });
    expect(manager.getGame(room.id)?.status).toBe('playing');
    expect(manager.getGame(room.id)?.whiteUserId).toBe('guest-user');
    expect(manager.getGame(room.id)?.whitePlayerName).toBe('GuestName');
    expect(manager.getGame(room.id)?.blackPlayerName).toBe('CreatorName');
    expect(manager.getGame(room.id)?.whiteRating).toBe(1520);
    expect(manager.getGame(room.id)?.blackRating).toBe(1675);
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

  it('keeps full-game player joins separate from explicit spectator joins', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    expect(manager.joinGame(room.id, 'extra-socket')).toBeNull();
    expect(manager.getGame(room.id)?.spectators).toEqual([]);

    const spectatorRoom = manager.spectateGame(room.id, 'extra-socket');
    expect(spectatorRoom?.spectators).toEqual(['extra-socket']);

    const spectatorState = manager.getClientGameState(spectatorRoom!, 'extra-socket');
    expect(spectatorState.playerColor).toBeNull();
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

  it('stores a rematch offer until the opponent explicitly accepts it', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');
    manager.resign(room.id, 'white-socket');

    const offered = manager.requestRematch(room.id, 'white-socket');
    expect(offered).toEqual({
      kind: 'offered',
      by: 'white',
      opponentSocketId: 'black-socket',
    });

    const accepted = manager.requestRematch(room.id, 'black-socket');
    expect(accepted?.kind).toBe('accepted');
    expect(accepted?.room?.white).toBe('black-socket');
    expect(accepted?.room?.black).toBe('white-socket');
    expect(accepted?.room?.status).toBe('playing');
  });

  it('treats rematch offers as unavailable once the opponent leaves the finished game', () => {
    const manager = new GameManager();
    const room = manager.createGame(timeControl);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');
    manager.resign(room.id, 'white-socket');

    manager.requestRematch(room.id, 'white-socket');
    manager.leaveGame('white-socket', room.id);

    expect(manager.requestRematch(room.id, 'black-socket')).toEqual({
      kind: 'unavailable',
      by: 'black',
      opponentSocketId: null,
    });
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
    manager.joinGame(room.id, 'white-old', { displayName: 'WhiteUser', rating: 1601 });
    manager.joinGame(room.id, 'black-old', { displayName: 'BlackUser', rating: 1584 });

    manager.offerDraw(room.id, 'white-old');
    manager.handleDisconnect('white-old');
    manager.updatePlayerSocket(room.id, 'white-old', 'white-new');

    const updatedRoom = manager.getGame(room.id);
    expect(updatedRoom?.white).toBe('white-new');
    expect(manager.getPlayerGame('white-old')).toBe(room.id);
    expect(manager.getPlayerGame('white-new')).toBeNull();

    const clientState = manager.getClientGameState(updatedRoom!, 'white-new');
    expect(clientState.playerColor).toBe('white');
    expect(clientState.drawOffer).toBe('white');
    expect(clientState.status).toBe('playing');
    expect(clientState.gameId).toBe(room.id);
    expect(clientState.whitePlayerName).toBe('WhiteUser');
    expect(clientState.blackPlayerName).toBe('BlackUser');
    expect(clientState.whiteRating).toBe(1601);
    expect(clientState.blackRating).toBe(1584);
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

  it('builds a safe public live-games list from quick-play rooms only', () => {
    const manager = new GameManager();

    const privateRoom = manager.createGame(timeControl, { gameMode: 'private', rated: false });
    manager.joinGame(privateRoom.id, 'private-white', { displayName: 'Private White' });
    manager.joinGame(privateRoom.id, 'private-black', { displayName: 'Private Black' });

    const liveQuickPlay = manager.createGame(timeControl, { gameMode: 'quick_play', rated: true });
    manager.joinGame(liveQuickPlay.id, 'live-white', { displayName: 'Rated White', rating: 1820 });
    manager.joinGame(liveQuickPlay.id, 'live-black', { displayName: 'Rated Black', rating: 1765 });
    manager.spectateGame(liveQuickPlay.id, 'spectator-a');
    const liveRoom = manager.getGame(liveQuickPlay.id)!;
    liveRoom.gameState.moveCount = 21;
    liveRoom.gameState.lastMoveTime = Date.now();

    const finishedQuickPlay = manager.createGame(timeControl, { gameMode: 'quick_play', rated: false });
    manager.joinGame(finishedQuickPlay.id, 'finished-white', { displayName: 'Guest One' });
    manager.joinGame(finishedQuickPlay.id, 'finished-black', { displayName: 'Guest Two' });
    manager.resign(finishedQuickPlay.id, 'finished-white');

    const liveOnly = manager.getPublicLiveGames({ status: 'live' });
    expect(liveOnly).toHaveLength(1);
    expect(liveOnly[0]).toMatchObject({
      id: liveQuickPlay.id,
      status: 'playing',
      whitePlayerName: 'Rated White',
      blackPlayerName: 'Rated Black',
      whiteRating: 1820,
      blackRating: 1765,
      spectatorCount: 1,
      moveCount: 21,
      rated: true,
      gameMode: 'quick_play',
    });

    const allPublic = manager.getPublicLiveGames({ status: 'all' }).map((game) => game.id);
    expect(allPublic).toContain(liveQuickPlay.id);
    expect(allPublic).toContain(finishedQuickPlay.id);
    expect(allPublic).not.toContain(privateRoom.id);
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

  it('resets the counting number when board-honor counting starts again after stopping', () => {
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
      currentCount: 12,
      startCount: 0,
      limit: 64,
      finalAttackPending: true,
    };

    const restarted = manager.startCounting(room.id, 'white-socket');

    expect(restarted?.gameState.counting).toMatchObject({
      active: true,
      currentCount: 0,
      startCount: 0,
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

  it('draws on timeout when the side with time left lacks an official winning material set', () => {
    const manager = new GameManager();
    const fastTime: TimeControl = { initial: 1, increment: 0 };
    const room = manager.createGame(fastTime);
    manager.joinGame(room.id, 'white-socket');
    manager.joinGame(room.id, 'black-socket');

    const activeRoom = manager.getGame(room.id)!;
    activeRoom.gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
    activeRoom.gameState.board[0][0] = { type: 'K', color: 'white' };
    activeRoom.gameState.board[2][2] = { type: 'N', color: 'white' };
    activeRoom.gameState.board[7][7] = { type: 'K', color: 'black' };
    activeRoom.gameState.turn = 'black';

    let latestRoom = activeRoom;
    manager.startClock(room.id, (updatedRoom) => {
      latestRoom = updatedRoom;
    });

    vi.advanceTimersByTime(1_100);

    expect(latestRoom.status).toBe('finished');
    expect(latestRoom.gameState.gameOver).toBe(true);
    expect(latestRoom.gameState.isDraw).toBe(true);
    expect(latestRoom.gameState.resultReason).toBe('timeout');
    expect(latestRoom.gameState.winner).toBeNull();
  });
});
