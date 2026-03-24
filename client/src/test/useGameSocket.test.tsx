import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createInitialGameState } from '@shared/engine';
import { useGameSocket, useGameActions } from '../hooks/useGameSocket';

const {
  navigateMock,
  connectSocketMock,
  playMoveSoundMock,
  playCaptureSoundMock,
  playCheckSoundMock,
  playGameOverSoundMock,
  playGameStartSoundMock,
  socketMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  connectSocketMock: vi.fn(),
  playMoveSoundMock: vi.fn(),
  playCaptureSoundMock: vi.fn(),
  playCheckSoundMock: vi.fn(),
  playGameOverSoundMock: vi.fn(),
  playGameStartSoundMock: vi.fn(),
  socketMock: {
    connected: false,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

type EventHandler = (...args: any[]) => void;

const listeners = new Map<string, Set<EventHandler>>();

function addListener(event: string, handler: EventHandler) {
  const handlers = listeners.get(event) ?? new Set<EventHandler>();
  handlers.add(handler);
  listeners.set(event, handlers);
}

function removeListener(event: string, handler: EventHandler) {
  listeners.get(event)?.delete(handler);
}

function emitSocketEvent(event: string, payload?: unknown) {
  listeners.get(event)?.forEach((handler) => handler(payload));
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../lib/socket', () => ({
  socket: socketMock,
  connectSocket: connectSocketMock,
}));

vi.mock('../lib/sounds', () => ({
  playMoveSound: playMoveSoundMock,
  playCaptureSound: playCaptureSoundMock,
  playCheckSound: playCheckSoundMock,
  playGameOverSound: playGameOverSoundMock,
  playGameStartSound: playGameStartSoundMock,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('useGameSocket', () => {
  beforeEach(() => {
    listeners.clear();
    navigateMock.mockReset();
    connectSocketMock.mockReset();
    playMoveSoundMock.mockReset();
    playCaptureSoundMock.mockReset();
    playCheckSoundMock.mockReset();
    playGameOverSoundMock.mockReset();
    playGameStartSoundMock.mockReset();
    socketMock.connected = false;
    socketMock.emit.mockReset();
    socketMock.on.mockImplementation((event: string, handler: EventHandler) => {
      addListener(event, handler);
      return socketMock;
    });
    socketMock.off.mockImplementation((event: string, handler: EventHandler) => {
      removeListener(event, handler);
      return socketMock;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when no gameId is provided', () => {
    renderHook(() => useGameSocket({}), { wrapper });

    expect(connectSocketMock).not.toHaveBeenCalled();
    expect(socketMock.on).not.toHaveBeenCalled();
    expect(socketMock.emit).not.toHaveBeenCalled();
  });

  it('joins only once across repeated connect events', async () => {
    renderHook(() => useGameSocket({ gameId: 'room-1234' }), { wrapper });

    expect(connectSocketMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      emitSocketEvent('connect');
      emitSocketEvent('connect');
    });

    expect(socketMock.emit).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenCalledWith('join_game', { gameId: 'room-1234' });
  });

  it('joins immediately when the socket is already connected', () => {
    socketMock.connected = true;

    const { result } = renderHook(() => useGameSocket({ gameId: 'room-hot' }), { wrapper });

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenCalledWith('join_game', { gameId: 'room-hot' });
    expect(result.current.joinedRef.current).toBe(true);
  });

  it('rejoins after a disconnect followed by reconnect', async () => {
    renderHook(() => useGameSocket({ gameId: 'room-reconnect' }), { wrapper });

    await act(async () => {
      emitSocketEvent('connect');
    });

    expect(socketMock.emit).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenLastCalledWith('join_game', { gameId: 'room-reconnect' });

    await act(async () => {
      emitSocketEvent('disconnect');
      emitSocketEvent('connect');
    });

    expect(socketMock.emit).toHaveBeenCalledTimes(2);
    expect(socketMock.emit).toHaveBeenLastCalledWith('join_game', { gameId: 'room-reconnect' });
  });

  it('updates local state from server events and tears down listeners on unmount', async () => {
    const initialState = createInitialGameState(300_000, 300_000);
    initialState.moveCount = 12;
    initialState.isCheck = true;

    const { result, unmount } = renderHook(() => useGameSocket({ gameId: 'room-5678' }), { wrapper });

    act(() => {
      emitSocketEvent('game_joined', {
        color: 'white',
        gameState: {
          ...initialState,
          gameMode: 'private',
          rated: false,
          status: 'playing',
          playerColor: 'white',
          drawOffer: null,
          gameId: 'room-5678',
        },
      });
    });

    await waitFor(() => {
      expect(result.current.playerColor).toBe('white');
      expect(result.current.gameState?.moveCount).toBe(12);
    });

    act(() => {
      emitSocketEvent('draw_offered');
      emitSocketEvent('opponent_disconnected');
      emitSocketEvent('error', { message: 'rate limited' });
    });

    await waitFor(() => {
      expect(result.current.drawOffered).toBe(true);
      expect(result.current.opponentDisconnected).toBe(true);
      expect(result.current.error).toBe('rate limited');
    });

    unmount();

    socketMock.emit.mockClear();

    act(() => {
      emitSocketEvent('connect');
      emitSocketEvent('error', { message: 'should be ignored' });
    });

    expect(socketMock.emit).not.toHaveBeenCalled();
    expect(result.current.error).toBe('rate limited');
  });

  it('handles transition, sound, timing, draw, game-over, and replacement events', async () => {
    const initialState = createInitialGameState(300_000, 300_000);
    const waitingState = {
      ...initialState,
      gameMode: 'private' as const,
      rated: false,
      status: 'waiting' as const,
      playerColor: 'white' as const,
      drawOffer: null,
      gameId: 'room-events',
    };

    const { result } = renderHook(() => useGameSocket({ gameId: 'room-events' }), { wrapper });

    act(() => {
      emitSocketEvent('game_joined', {
        color: 'white',
        gameState: waitingState,
      });
    });

    await waitFor(() => {
      expect(result.current.playerColor).toBe('white');
      expect(result.current.gameState?.status).toBe('waiting');
    });

    expect(playGameStartSoundMock).not.toHaveBeenCalled();

    act(() => {
      emitSocketEvent('game_state', {
        ...waitingState,
        status: 'playing',
      });
    });

    expect(playGameStartSoundMock).toHaveBeenCalledTimes(1);
    expect(result.current.gameState?.status).toBe('playing');

    act(() => {
      emitSocketEvent('move_made', {
        move: { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, captured: false },
        gameState: {
          ...waitingState,
          status: 'playing',
          isCheck: false,
        },
      });
    });
    expect(playMoveSoundMock).toHaveBeenCalledTimes(1);

    act(() => {
      emitSocketEvent('move_made', {
        move: { from: { row: 1, col: 4 }, to: { row: 2, col: 4 }, captured: true },
        gameState: {
          ...waitingState,
          status: 'playing',
          isCheck: false,
        },
      });
    });
    expect(playCaptureSoundMock).toHaveBeenCalledTimes(1);

    act(() => {
      emitSocketEvent('move_made', {
        move: { from: { row: 0, col: 4 }, to: { row: 1, col: 4 }, captured: false },
        gameState: {
          ...waitingState,
          status: 'playing',
          isCheck: true,
        },
      });
    });
    expect(playCheckSoundMock).toHaveBeenCalledTimes(1);

    act(() => {
      emitSocketEvent('clock_update', { whiteTime: 123_000, blackTime: 222_000 });
      emitSocketEvent('draw_offered');
      emitSocketEvent('opponent_disconnected');
    });

    await waitFor(() => {
      expect(result.current.gameState?.whiteTime).toBe(123_000);
      expect(result.current.gameState?.blackTime).toBe(222_000);
      expect(result.current.drawOffered).toBe(true);
      expect(result.current.opponentDisconnected).toBe(true);
    });

    act(() => {
      emitSocketEvent('draw_declined');
      emitSocketEvent('opponent_reconnected');
      emitSocketEvent('game_over', {
        reason: 'checkmate',
        winner: 'white',
        ratingChange: null,
        gameState: {
          ...waitingState,
          status: 'finished',
          gameOver: true,
        },
      });
    });

    await waitFor(() => {
      expect(result.current.drawOffered).toBe(false);
      expect(result.current.opponentDisconnected).toBe(false);
      expect(result.current.gameOverInfo).toEqual({ reason: 'checkmate', winner: 'white', ratingChange: null });
    });

    expect(playGameOverSoundMock).toHaveBeenCalledTimes(1);

    act(() => {
      emitSocketEvent('game_created', { gameId: 'replacement-room' });
    });

    await waitFor(() => {
      expect(result.current.gameState).toBeNull();
      expect(result.current.gameOverInfo).toBeNull();
      expect(result.current.drawOffered).toBe(false);
    });

    expect(result.current.joinedRef.current).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith('/game/replacement-room');
  });
});

describe('useGameActions', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    socketMock.emit.mockReset();
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('emits resign only after confirmation and exposes the other game actions', () => {
    const confirmMock = vi.mocked(window.confirm);
    const { result } = renderHook(() => useGameActions(), { wrapper });

    result.current.handleResign();
    expect(confirmMock).toHaveBeenCalledWith('Are you sure you want to resign?');
    expect(socketMock.emit).toHaveBeenCalledWith('resign');

    confirmMock.mockReturnValue(false);
    result.current.handleResign();
    expect(socketMock.emit).toHaveBeenCalledTimes(1);

    result.current.handleOfferDraw();
    expect(socketMock.emit).toHaveBeenCalledWith('offer_draw');

    result.current.handleRespondDraw(true);
    expect(socketMock.emit).toHaveBeenCalledWith('respond_draw', { accept: true });

    result.current.handleRematch();
    expect(socketMock.emit).toHaveBeenCalledWith('request_rematch');

    result.current.handleNewGame();
    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
