import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../components/HomePage';
import { I18nProvider, preloadDetectedTranslations } from '../lib/i18n';
import { PieceStyleProvider } from '../lib/pieceStyle';

const {
  navigateMock,
  connectSocketMock,
  socketMock,
  fetchMock,
  puzzleProgressSummaryState,
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
  fetchMock: vi.fn(),
  puzzleProgressSummaryState: {
    completedCount: 2,
    totalCount: 7,
    percentComplete: 29,
    attemptCount: 4,
    successRate: 50,
    recommendedDifficultyScore: 1120,
    favoriteTheme: 'HangingPiece',
    continuePuzzle: {
      id: 5001,
      title: 'Trapped Knight',
      description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
      theme: 'TrappedPiece',
      difficulty: 'intermediate',
    },
    nextPuzzle: {
      id: 5001,
      title: 'Trapped Knight',
      description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
      theme: 'TrappedPiece',
      difficulty: 'intermediate',
    },
    lastPlayed: {
      puzzle: {
        id: 5001,
        title: 'Trapped Knight',
        description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
        theme: 'TrappedPiece',
        difficulty: 'intermediate',
      },
      lastPlayedAt: 1711660000,
      completedAt: null,
    },
    recentCompleted: [
      {
        puzzle: {
          id: 10,
          title: 'Rook Harvest',
          description: 'Win material by grabbing the loose knight.',
          theme: 'HangingPiece',
          difficulty: 'beginner',
        },
        lastPlayedAt: 1711650000,
        completedAt: 1711650000,
      },
    ],
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

vi.mock('../lib/puzzleProgress', () => ({
  PuzzleProgressProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  usePuzzleProgressSummary: () => puzzleProgressSummaryState,
}));

vi.mock('../components/PieceSVG', () => ({
  default: () => <div data-testid="piece-svg" />,
}));

vi.mock('../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>
        <PieceStyleProvider>{children}</PieceStyleProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigateMock.mockReset();
    connectSocketMock.mockReset();
    socketMock.connected = false;
    socketMock.emit.mockReset();
    socketMock.on.mockReset();
    socketMock.off.mockReset();
    socketMock.once.mockReset();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/stats')) {
        return { json: async () => ({ totalGames: 42 }) };
      }
      if (url.startsWith('/api/live-games')) {
        return { json: async () => ({ games: [], total: 0, status: 'live' }) };
      }
      throw new Error(`Unhandled fetch for ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('does not render the home-page rules section', () => {
    render(<HomePage />, { wrapper });

    expect(screen.queryByText(/how to play thaichess/i)).not.toBeInTheDocument();
  });

  it('renders the learn section and footer guide links in Thai', async () => {
    window.localStorage.setItem('thaichess-lang', 'th');
    await preloadDetectedTranslations();

    render(<HomePage />, { wrapper });

    expect(screen.getByText('คู่มือเริ่มต้น')).toBeInTheDocument();
    expect(screen.getByText('เริ่มจากหน้าที่อ่านแล้วเข้าใจจริง')).toBeInTheDocument();
    expect(screen.getAllByText('หมากรุกไทยคืออะไร').length).toBeGreaterThan(0);
    expect(screen.getAllByText('วิธีเล่นหมากรุกไทย').length).toBeGreaterThan(0);
    expect(screen.getByText('เล่นหมากรุกไทยออนไลน์')).toBeInTheDocument();
  });

  function openCreatePanel() {
    fireEvent.click(screen.getByRole('button', { name: /create a private game/i }));
  }

  it('cleans up create-game socket listeners on unmount', async () => {
    const { unmount } = render(<HomePage />, { wrapper });

    openCreatePanel();
    fireEvent.click(screen.getByRole('button', { name: /play with a friend/i }));

    await waitFor(() => {
      expect(connectSocketMock).toHaveBeenCalledTimes(1);
    });

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
    expect(socketMock.on).toHaveBeenCalledWith('game_created', expect.any(Function));
    expect(socketMock.once).toHaveBeenCalledWith('connect', expect.any(Function));

    const createdHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'game_created')?.[1];
    const connectHandler = socketMock.once.mock.calls.find((call: any[]) => call[0] === 'connect')?.[1];

    unmount();

    expect(socketMock.off).toHaveBeenCalledWith('game_created', createdHandler);
    expect(socketMock.off).toHaveBeenCalledWith('connect', connectHandler);
  });

  it('emits create_game immediately when the socket is already connected', async () => {
    socketMock.connected = true;

    render(<HomePage />, { wrapper });

    openCreatePanel();
    fireEvent.click(screen.getByRole('button', { name: /play with a friend/i }));

    await waitFor(() => {
      expect(connectSocketMock).toHaveBeenCalledTimes(1);
      expect(socketMock.emit).toHaveBeenCalledWith('create_game', {
        timeControl: { initial: 300, increment: 0 },
        colorPreference: 'random',
      });
    });

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
  });

  it('recovers from create_game errors by re-enabling the button and showing the message', async () => {
    render(<HomePage />, { wrapper });

    openCreatePanel();
    fireEvent.click(screen.getByRole('button', { name: /play with a friend/i }));

    await waitFor(() => {
      expect(socketMock.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    const errorHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'error')?.[1];
    expect(errorHandler).toBeTypeOf('function');

    act(() => {
      errorHandler({ message: 'Invalid time control.' });
    });

    expect(screen.getByText('Invalid time control.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play with a friend/i })).toBeEnabled();
  });

  it('uses the selected time preset when creating a private game', async () => {
    socketMock.connected = true;

    render(<HomePage />, { wrapper });

    openCreatePanel();
    fireEvent.click(screen.getByRole('button', { name: /10\+5/i }));
    fireEvent.click(screen.getByRole('button', { name: /play with a friend/i }));

    await waitFor(() => {
      expect(socketMock.emit).toHaveBeenCalledWith('create_game', {
        timeControl: { initial: 600, increment: 5 },
        colorPreference: 'random',
      });
    });
  });

  it('sends the selected color preference when creating a private game', async () => {
    socketMock.connected = true;

    render(<HomePage />, { wrapper });

    openCreatePanel();
    fireEvent.click(screen.getByRole('button', { name: /^white$/i }));
    fireEvent.click(screen.getByRole('button', { name: /play with a friend/i }));

    await waitFor(() => {
      expect(socketMock.emit).toHaveBeenCalledWith('create_game', {
        timeControl: { initial: 300, increment: 0 },
        colorPreference: 'white',
      });
    });
  });

  it('navigates to the created game when the server returns a game id', async () => {
    render(<HomePage />, { wrapper });

    openCreatePanel();
    fireEvent.click(screen.getByRole('button', { name: /play with a friend/i }));

    await waitFor(() => {
      expect(socketMock.on).toHaveBeenCalledWith('game_created', expect.any(Function));
    });

    const createdHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'game_created')?.[1];
    expect(createdHandler).toBeTypeOf('function');

    act(() => {
      createdHandler({ gameId: 'private-room-42' });
    });

    expect(navigateMock).toHaveBeenCalledWith('/game/private-room-42');
    expect(screen.getByRole('button', { name: /play with a friend/i })).toBeEnabled();
  });

  it('reveals the join form and navigates with a trimmed game id from button click or enter key', () => {
    render(<HomePage />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /join a game/i }));

    const input = screen.getByPlaceholderText(/enter game code/i);
    fireEvent.change(input, { target: { value: '  room-abc  ' } });
    fireEvent.click(screen.getByRole('button', { name: /^join$/i }));

    expect(navigateMock).toHaveBeenCalledWith('/game/room-abc');

    navigateMock.mockClear();
    fireEvent.change(input, { target: { value: '  room-enter  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(navigateMock).toHaveBeenCalledWith('/game/room-enter');
  });

  it('ignores blank join ids and routes the other main actions', async () => {
    render(<HomePage />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /join a game/i }));
    const input = screen.getByPlaceholderText(/enter game code/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /^join$/i }));

    expect(navigateMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /find opponent/i }));
    expect(navigateMock).toHaveBeenCalledWith('/quick-play');

    fireEvent.click(screen.getByRole('button', { name: /play vs bot/i }));
    expect(navigateMock).toHaveBeenCalledWith('/bot');

    fireEvent.click(await screen.findByRole('button', { name: /puzzles tactical training/i }));
    expect(navigateMock).toHaveBeenCalledWith('/puzzles');

    fireEvent.click(screen.getAllByText(/^lessons$/i)[0]!.closest('button')!);
    expect(navigateMock).toHaveBeenCalledWith('/lessons');

    fireEvent.click(screen.getByRole('button', { name: /play local/i }));
    expect(navigateMock).toHaveBeenCalledWith('/local');
  });

  it('exposes public live-game discovery from the homepage', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/stats')) {
        return { json: async () => ({ totalGames: 42 }) };
      }
      if (url.startsWith('/api/live-games')) {
        return {
          json: async () => ({
            games: [{
              id: 'live-1234',
              status: 'playing',
              whitePlayerName: 'Rated White',
              blackPlayerName: 'Rated Black',
              whiteRating: 1812,
              blackRating: 1760,
              timeControl: { initial: 300, increment: 3 },
              moveCount: 28,
              spectatorCount: 4,
              rated: true,
              gameMode: 'quick_play',
              createdAt: Date.now(),
              lastMoveAt: Date.now(),
            }],
            total: 1,
            status: 'live',
          }),
        };
      }
      throw new Error(`Unhandled fetch for ${url}`);
    });

    render(<HomePage />, { wrapper });

    expect(await screen.findByText('Live Now')).toBeInTheDocument();
    expect(await screen.findByText('Rated White (1812)')).toBeInTheDocument();
    expect(await screen.findByText('Rated Black (1760)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view all live games/i }));
    expect(navigateMock).toHaveBeenCalledWith('/watch');
  });

  it('shows the streak card and routes to the new default puzzle flow', async () => {
    render(<HomePage />, { wrapper });

    const streakCard = await screen.findByRole('button', { name: /puzzles tactical training/i });
    expect(screen.getByText(/jump back in/i)).toBeInTheDocument();
    expect(streakCard).toBeInTheDocument();
    expect(screen.getByText(/2\/7 lessons solved/i)).toBeInTheDocument();
    expect(screen.getByText(/best lesson theme so far: hanging piece/i)).toBeInTheDocument();
    expect(screen.getByText(/last lesson played: trapped knight/i)).toBeInTheDocument();
    expect(screen.getByText(/latest lesson solved: rook harvest/i)).toBeInTheDocument();

    fireEvent.click(streakCard);
    expect(navigateMock).toHaveBeenCalledWith('/puzzles');
  });
});
