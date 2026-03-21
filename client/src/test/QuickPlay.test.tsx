import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import QuickPlay from '../components/QuickPlay';
import { I18nProvider } from '../lib/i18n';

const {
  navigateMock,
  connectSocketMock,
  socketMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  connectSocketMock: vi.fn(),
  socketMock: {
    connected: false,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
  },
}));

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

vi.mock('../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  );
}

describe('QuickPlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigateMock.mockReset();
    connectSocketMock.mockReset();
    socketMock.connected = false;
    socketMock.emit.mockReset();
    socketMock.on.mockReset();
    socketMock.off.mockReset();
    socketMock.once.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not emit cancel_matchmaking on unmount when no search was started', () => {
    socketMock.connected = true;

    const { unmount } = render(<QuickPlay />, { wrapper });

    unmount();

    expect(socketMock.emit).not.toHaveBeenCalledWith('cancel_matchmaking');
  });

  it('cancels matchmaking on unmount when a search is in progress', () => {
    socketMock.connected = true;

    const { unmount } = render(<QuickPlay />, { wrapper });

    const matchmakingStartedHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'matchmaking_started')?.[1];
    expect(matchmakingStartedHandler).toBeTypeOf('function');

    act(() => {
      matchmakingStartedHandler();
    });

    unmount();

    expect(socketMock.emit).toHaveBeenCalledWith('cancel_matchmaking');
  });

  it('queues a connect callback when searching while disconnected and clears it on cancel', () => {
    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));

    const connectHandler = socketMock.once.mock.calls.find((call: any[]) => call[0] === 'connect')?.[1];
    expect(connectSocketMock).toHaveBeenCalled();
    expect(connectHandler).toBeTypeOf('function');

    const matchmakingStartedHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'matchmaking_started')?.[1];
    act(() => {
      matchmakingStartedHandler();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(socketMock.off).toHaveBeenCalledWith('connect', connectHandler);
    expect(socketMock.emit).toHaveBeenCalledWith('cancel_matchmaking');
  });

  it('emits find_game immediately when already connected and ignores duplicate requests while pending', () => {
    socketMock.connected = true;

    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));
    fireEvent.click(screen.getByRole('button', { name: /sending/i }));

    expect(connectSocketMock).toHaveBeenCalledTimes(2);
    expect(socketMock.emit).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenCalledWith('find_game', {
      timeControl: { initial: 300, increment: 0 },
    });
  });

  it('shows queue and timer while searching, then navigates when a match is found', async () => {
    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));

    const matchmakingStartedHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'matchmaking_started')?.[1];
    const queueStatusHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'queue_status')?.[1];
    const matchFoundHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'matchmaking_found')?.[1];

    act(() => {
      matchmakingStartedHandler();
      queueStatusHandler({ playersInQueue: 7 });
    });

    expect(screen.getByText('Finding opponent...')).toBeInTheDocument();
    expect(screen.getByText('7 player(s) in queue')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Searching for 3s')).toBeInTheDocument();

    act(() => {
      matchFoundHandler({ gameId: 'matched-room', color: 'black' });
    });

    expect(navigateMock).toHaveBeenCalledWith('/game/matched-room');

    expect(screen.queryByText('Finding opponent...')).not.toBeInTheDocument();
  });

  it('recovers from matchmaking errors and lets the user return home', () => {
    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));

    const errorHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'error')?.[1];

    act(() => {
      errorHandler({ message: 'No servers available.' });
    });

    expect(screen.getByText('No servers available.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find opponent/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('allows changing the time preset before searching', () => {
    socketMock.connected = true;

    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /10\+5/i }));
    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));

    expect(socketMock.emit).toHaveBeenCalledWith('find_game', {
      timeControl: { initial: 600, increment: 5 },
    });
  });
});
