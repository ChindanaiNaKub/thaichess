import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createInitialGameState } from '@shared/engine';
import type { ClientGameState, Move } from '@shared/types';
import SpectatorPage from '../components/SpectatorPage';

const {
  navigateMock,
  connectSocketMock,
  playMoveSoundMock,
  playCaptureSoundMock,
  playCheckSoundMock,
  playGameOverSoundMock,
  socketMock,
  boardPropsMock,
  moveHistoryPropsMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  connectSocketMock: vi.fn(),
  playMoveSoundMock: vi.fn(),
  playCaptureSoundMock: vi.fn(),
  playCheckSoundMock: vi.fn(),
  playGameOverSoundMock: vi.fn(),
  socketMock: {
    connected: false,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  boardPropsMock: vi.fn(),
  moveHistoryPropsMock: vi.fn(),
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
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (!params) return key;
      return `${key}:${JSON.stringify(params)}`;
    },
  }),
}));

vi.mock('../components/BoardErrorBoundary', () => ({
  BoardErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/Board', () => ({
  default: (props: any) => {
    boardPropsMock(props);
    return <div data-testid="board">{String(props.disabled)}</div>;
  },
}));

vi.mock('../components/Clock', () => ({
  default: (props: any) => (
    <div data-testid={`clock-${props.color}`}>
      {props.playerName}
      {typeof props.rating === 'number' ? ` (${props.rating})` : ''}
    </div>
  ),
}));

vi.mock('../components/MoveHistory', () => ({
  default: (props: any) => {
    moveHistoryPropsMock(props);
    return (
      <div data-testid="move-history">
        <button onClick={() => props.onMoveClick?.(0)}>jump-first-move</button>
      </div>
    );
  },
}));

vi.mock('../components/ConnectionStatus', () => ({
  default: () => null,
}));

vi.mock('../components/PieceSVG', () => ({
  default: () => <div data-testid="piece-svg" />,
}));

vi.mock('../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('../components/AppearanceSettingsButton', () => ({
  default: () => <button>theme</button>,
}));

function renderSpectatorPage(initialRoute = '/spectate/watch-room') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/spectate/:gameId" element={<SpectatorPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function makeGameState(overrides: Partial<ClientGameState> = {}): ClientGameState {
  const base = createInitialGameState(300_000, 300_000);
  return {
    ...base,
    gameId: 'watch-room',
    gameMode: 'private',
    rated: false,
    status: 'playing',
    playerColor: null,
    whitePlayerName: 'White Player',
    blackPlayerName: 'Black Player',
    whiteRating: 1620,
    blackRating: 1580,
    whitePresence: {
      status: 'active',
      latencyMs: 42,
      lastSeenAt: 1_000,
    },
    blackPresence: {
      status: 'active',
      latencyMs: 58,
      lastSeenAt: 1_000,
    },
    moveHistory: [],
    gameOver: false,
    winner: null,
    drawOffer: null,
    isCheck: false,
    counting: null,
    ...overrides,
  };
}

describe('SpectatorPage', () => {
  beforeEach(() => {
    listeners.clear();
    navigateMock.mockReset();
    connectSocketMock.mockReset();
    playMoveSoundMock.mockReset();
    playCaptureSoundMock.mockReset();
    playCheckSoundMock.mockReset();
    playGameOverSoundMock.mockReset();
    boardPropsMock.mockReset();
    moveHistoryPropsMock.mockReset();
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
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('joins through the spectator socket event and renders a read-only live view', async () => {
    socketMock.connected = true;
    renderSpectatorPage();

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenCalledWith('spectate_game', { gameId: 'watch-room' });

    await act(async () => {
      emitSocketEvent('game_joined', {
        color: null,
        gameState: makeGameState(),
      });
    });

    expect(screen.getAllByText('game.spectator_mode')).toHaveLength(2);
    expect(screen.getByText('game.watching_live_game')).toBeInTheDocument();
    expect(screen.getByText('White Player (1620)')).toBeInTheDocument();
    expect(screen.getByText('Black Player (1580)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'game.offer_draw' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'game.resign' })).not.toBeInTheDocument();
    expect(boardPropsMock.mock.lastCall?.[0].disabled).toBe(true);
    expect(boardPropsMock.mock.lastCall?.[0].playerColor).toBe('white');

    fireEvent.click(screen.getByRole('button', { name: 'game.flip_board' }));
    expect(boardPropsMock.mock.lastCall?.[0].playerColor).toBe('black');

    fireEvent.click(screen.getByRole('button', { name: 'game.share' }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    });
  });

  it('keeps move history read-only during live play and enables review navigation after game end', async () => {
    renderSpectatorPage('/spectate/endgame-room');

    const liveState = makeGameState({
      gameId: 'endgame-room',
      moveHistory: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } } as Move],
    });

    await act(async () => {
      emitSocketEvent('game_joined', {
        color: null,
        gameState: liveState,
      });
    });

    expect(moveHistoryPropsMock.mock.lastCall?.[0].onMoveClick).toBeUndefined();

    await act(async () => {
      emitSocketEvent('move_made', {
        move: { from: { row: 5, col: 0 }, to: { row: 4, col: 0 }, captured: false },
        gameState: makeGameState({
          gameId: 'endgame-room',
          moveHistory: [
            { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } } as Move,
            { from: { row: 5, col: 0 }, to: { row: 4, col: 0 } } as Move,
          ],
        }),
      });
    });

    expect(playMoveSoundMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      emitSocketEvent('game_over', {
        reason: 'checkmate',
        winner: 'white',
        ratingChange: null,
        gameState: makeGameState({
          gameId: 'endgame-room',
          moveHistory: [
            { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } } as Move,
            { from: { row: 5, col: 0 }, to: { row: 4, col: 0 } } as Move,
          ],
          status: 'finished',
          gameOver: true,
          winner: 'white',
          resultReason: 'checkmate',
        }),
      });
    });

    expect(playGameOverSoundMock).toHaveBeenCalledTimes(1);
    expect(moveHistoryPropsMock.mock.lastCall?.[0].onMoveClick).toBeTypeOf('function');

    fireEvent.click(screen.getByText('jump-first-move'));
    expect(screen.getByText('game.nav_hint')).toBeInTheDocument();
  });
});
