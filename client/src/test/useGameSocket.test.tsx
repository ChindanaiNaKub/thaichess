import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createInitialGameState } from '@shared/engine';
import { useGameSocket } from '../hooks/useGameSocket';

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
});
