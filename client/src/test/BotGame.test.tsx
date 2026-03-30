import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import BotGame from '../components/BotGame';

const {
  navigateMock,
  boardPropsMock,
  clockPropsMock,
  requestBotMoveMock,
  requestLocalBotMoveMock,
  fetchMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  boardPropsMock: vi.fn(),
  clockPropsMock: vi.fn(),
  requestBotMoveMock: vi.fn(),
  requestLocalBotMoveMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'player@example.com',
      username: 'Player One',
      role: 'user',
      fair_play_status: 'clear',
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
    },
  }),
}));

vi.mock('../lib/pieceStyle', async () => {
  const actual = await vi.importActual<typeof import('../lib/pieceStyle')>('../lib/pieceStyle');

  return {
    ...actual,
    usePieceStyle: () => ({
      pieceStyle: 'classic',
      setPieceStyle: vi.fn(),
    }),
  };
});

vi.mock('../lib/sounds', () => ({
  playMoveSound: vi.fn(),
  playCaptureSound: vi.fn(),
  playCheckSound: vi.fn(),
  playGameOverSound: vi.fn(),
}));

vi.mock('../lib/analysis', () => ({
  buildInlineAnalysisRoute: vi.fn(() => '/analysis/bot'),
  requestBotMove: (...args: unknown[]) => requestBotMoveMock(...args),
}));

vi.mock('../lib/localBot', () => ({
  requestLocalBotMove: (...args: unknown[]) => requestLocalBotMoveMock(...args),
}));

vi.mock('../components/BoardErrorBoundary', () => ({
  BoardErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/Board', () => ({
  default: (props: any) => {
    boardPropsMock(props);
    return <div data-testid="board" />;
  },
}));

vi.mock('../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('../components/Clock', () => ({
  default: (props: any) => {
    clockPropsMock(props);
    return <div data-testid="clock">{props.playerName}</div>;
  },
}));

vi.mock('../components/MoveHistory', () => ({
  default: () => <div data-testid="move-history" />,
}));

vi.mock('../components/GameOverModal', () => ({
  default: () => null,
}));

vi.mock('../components/GameOverPanel', () => ({
  default: () => null,
}));

vi.mock('../components/PieceSVG', () => ({
  default: () => <div data-testid="piece-svg" />,
}));

function renderBotGame() {
  return render(
    <MemoryRouter>
      <BotGame />
    </MemoryRouter>
  );
}

describe('BotGame', () => {
  beforeEach(() => {
    vi.useRealTimers();
    navigateMock.mockReset();
    boardPropsMock.mockReset();
    clockPropsMock.mockReset();
    requestBotMoveMock.mockReset();
    requestLocalBotMoveMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    requestBotMoveMock.mockResolvedValue({
      move: null,
      evaluation: 0,
      bestMove: null,
      principalVariation: [],
      stats: {
        source: 'service',
        depth: 1,
      },
    });
    requestLocalBotMoveMock.mockResolvedValue({
      from: { row: 2, col: 0 },
      to: { row: 3, col: 0 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the started game with two clocks and without duplicate player badges', () => {
    renderBotGame();

    fireEvent.click(screen.getByRole('button', { name: 'bot.start' }));

    expect(screen.getByTestId('board')).toBeInTheDocument();
    expect(screen.getAllByTestId('clock')).toHaveLength(2);
    expect(screen.getByText('Makruk Bot Lv.5')).toBeInTheDocument();
    expect(screen.getByText('common.you (common.white)')).toBeInTheDocument();
    expect(screen.getAllByText('Makruk Bot Lv.5')).toHaveLength(1);
    expect(screen.getAllByText('common.you (common.white)')).toHaveLength(1);
  });

  it('falls back to a local move when the server returns no bot move', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    renderBotGame();

    fireEvent.click(screen.getByRole('button', { name: 'common.black' }));
    fireEvent.click(screen.getByRole('button', { name: 'bot.start' }));

    await waitFor(() => {
      const lastBoardProps = boardPropsMock.mock.calls.at(-1)?.[0];
      expect(lastBoardProps?.isMyTurn).toBe(true);
    }, { timeout: 2000 });

    expect(requestBotMoveMock).toHaveBeenCalledTimes(1);
    expect(requestLocalBotMoveMock).toHaveBeenCalledTimes(1);
  });

  it('aborts a stalled bot request and falls back locally without waiting for a long server timeout', async () => {
    vi.useFakeTimers();

    requestBotMoveMock.mockImplementation((_state: unknown, _level: unknown, options?: { signal?: AbortSignal }) => (
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      })
    ));

    renderBotGame();

    fireEvent.click(screen.getByRole('button', { name: 'common.black' }));
    fireEvent.click(screen.getByRole('button', { name: 'bot.start' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(requestBotMoveMock).toHaveBeenCalledTimes(1);
    expect(requestLocalBotMoveMock).toHaveBeenCalledTimes(1);
  });

  it('saves finished bot games into the shared recent-games system', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderBotGame();

    fireEvent.click(screen.getByRole('button', { name: 'bot.start' }));
    fireEvent.click(screen.getByRole('button', { name: /bot.resign/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/games/bot', expect.objectContaining({
        method: 'POST',
      }));
    });

    const [, request] = fetchMock.mock.calls.find(([url]) => url === '/api/games/bot') ?? [];
    const body = JSON.parse(String(request?.body ?? '{}'));

    expect(body).toMatchObject({
      playerColor: 'white',
      playerName: 'Player One',
      level: 5,
      result: 'black',
      resultReason: 'resignation',
      timeControl: {
        initial: 600,
        increment: 0,
      },
      moveCount: 0,
    });
    expect(typeof body.id).toBe('string');
  });
});
