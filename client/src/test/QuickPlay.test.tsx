import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import QuickPlay from '../components/QuickPlay';
import { I18nProvider, preloadDetectedTranslations } from '../lib/i18n';
import type { AuthUser } from '../lib/auth';

const {
  navigateMock,
  connectSocketMock,
  socketMock,
  authState,
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
  authState: {
    user: {
      id: 'user-1',
      email: 'player@example.com',
      twoFactorEnabled: false,
      username: 'player_one',
      role: 'user' as const,
      fair_play_status: 'clear' as const,
      rated_restricted_at: null,
      rated_restriction_note: null,
      rating: 1500,
      rated_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    } as AuthUser | null,
  },
}));

function createUser(fairPlayStatus: AuthUser['fair_play_status'] = 'clear'): AuthUser {
  return {
    id: 'user-1',
    email: 'player@example.com',
    twoFactorEnabled: false,
    username: 'player_one',
    role: 'user',
    fair_play_status: fairPlayStatus,
    rated_restricted_at: fairPlayStatus === 'restricted' ? 1 : null,
    rated_restriction_note: fairPlayStatus === 'restricted' ? 'Restricted from rated play' : null,
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

vi.mock('../lib/auth', () => ({
  useAuth: () => authState,
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
  beforeEach(async () => {
    await preloadDetectedTranslations();
    vi.useFakeTimers();
    navigateMock.mockReset();
    connectSocketMock.mockReset();
    socketMock.connected = false;
    socketMock.emit.mockReset();
    socketMock.on.mockReset();
    socketMock.off.mockReset();
    socketMock.once.mockReset();
    authState.user = createUser();
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

  it('shows rated disabled copy for restricted accounts', () => {
    authState.user = createUser('restricted');

    render(<QuickPlay />, { wrapper });

    expect(screen.getByText('Rated Disabled')).toBeInTheDocument();
    expect(screen.getByText('This account can still quick-play casually, but rated pairings are disabled.')).toBeInTheDocument();
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

  it('offers an honest bot fallback after 12 seconds of searching', () => {
    socketMock.connected = true;

    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));

    const matchmakingStartedHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'matchmaking_started')?.[1];
    act(() => {
      matchmakingStartedHandler();
    });

    expect(screen.queryByRole('button', { name: /play bot now/i })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    expect(screen.getByText('No opponent yet')).toBeInTheDocument();
    expect(screen.getByText('Play a bot now, or keep searching for a human match.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play bot now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep searching/i })).toBeInTheDocument();
  });

  it('cancels matchmaking and navigates to bot play when the fallback is chosen', () => {
    socketMock.connected = true;

    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));

    const matchmakingStartedHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'matchmaking_started')?.[1];
    act(() => {
      matchmakingStartedHandler();
    });

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    fireEvent.click(screen.getByRole('button', { name: /play bot now/i }));

    expect(socketMock.emit).toHaveBeenCalledWith('cancel_matchmaking');
    expect(navigateMock).toHaveBeenCalledWith('/bot?source=matchmaking_fallback');
  });

  it('keeps matchmaking active when the user chooses to keep searching', () => {
    socketMock.connected = true;

    render(<QuickPlay />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));

    const matchmakingStartedHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'matchmaking_started')?.[1];
    act(() => {
      matchmakingStartedHandler();
    });
    socketMock.emit.mockClear();

    act(() => {
      vi.advanceTimersByTime(12_000);
    });

    fireEvent.click(screen.getByRole('button', { name: /keep searching/i }));

    expect(socketMock.emit).not.toHaveBeenCalledWith('cancel_matchmaking');
    expect(screen.queryByText('No opponent yet')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(screen.getByText('Searching for 14s')).toBeInTheDocument();
  });

  it('uses measured copy that does not promise instant human pairing', () => {
    render(<QuickPlay />, { wrapper });

    expect(screen.getByText('Search for a human match. If nobody is around, you can switch to bot play without waiting.')).toBeInTheDocument();
    expect(screen.queryByText(/find an opponent instantly/i)).not.toBeInTheDocument();
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

  it('shows rated availability for signed-in users and casual-only for anonymous users', () => {
    const { rerender } = render(<QuickPlay />, { wrapper });

    expect(screen.getByText('Rated Available')).toBeInTheDocument();
    expect(screen.getByText('Rated if your opponent is also signed in.')).toBeInTheDocument();

    authState.user = null;
    rerender(<QuickPlay />);

    expect(screen.getByText('Casual Only')).toBeInTheDocument();
    expect(screen.getByText('Sign in to unlock rated games.')).toBeInTheDocument();
  });
});
