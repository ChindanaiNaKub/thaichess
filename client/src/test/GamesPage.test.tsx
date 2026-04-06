import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GamesPage from '../components/GamesPage';
import { I18nProvider, preloadDetectedTranslations } from '../lib/i18n';

const { navigateMock, fetchMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../components/Header', () => ({
  default: ({ children }: { children?: ReactNode }) => <div data-testid="header">{children}</div>,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>{children}</I18nProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

describe('GamesPage', () => {
  beforeEach(async () => {
    await preloadDetectedTranslations();
    navigateMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders rated and casual badges for recent games', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        games: [
          {
            id: 'rated-1',
            white_name: 'Rated White',
            black_name: 'Rated Black',
            result: 'white',
            result_reason: 'checkmate',
            rated: 1,
            game_mode: 'quick_play',
            white_rating_before: 1500,
            black_rating_before: 1500,
            time_control_initial: 300,
            time_control_increment: 0,
            move_count: 32,
            finished_at: Math.floor(Date.now() / 1000),
          },
          {
            id: 'bot-1',
            white_name: 'Guest One',
            black_name: 'Makruk Bot Lv.3',
            result: 'white',
            result_reason: 'checkmate',
            rated: 0,
            game_mode: 'bot',
            game_type: 'bot',
            opponent_type: 'bot',
            opponent_name: 'Makruk Bot Lv.3',
            time_control_initial: 600,
            time_control_increment: 0,
            move_count: 44,
            finished_at: Math.floor(Date.now() / 1000),
          },
          {
            id: 'casual-1',
            white_name: 'Guest One',
            black_name: 'Guest Two',
            result: 'draw',
            result_reason: 'draw',
            rated: 0,
            game_mode: 'private',
            time_control_initial: 300,
            time_control_increment: 0,
            move_count: 18,
            finished_at: Math.floor(Date.now() / 1000),
          },
        ],
        total: 3,
        botStats: {
          gamesCount: 4,
          winRate: 75,
          highestBotLevelDefeated: 6,
        },
      }),
    });

    const Wrapper = createWrapper();
    render(<GamesPage />, { wrapper: Wrapper });

    // Wait for loading to finish and data to appear
    expect(await screen.findByText('rated-1')).toBeInTheDocument();
    expect(await screen.findByText('bot-1')).toBeInTheDocument();
    expect(await screen.findByText('casual-1')).toBeInTheDocument();

    expect(screen.getAllByText('Rated').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Casual').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bot').length).toBeGreaterThan(0);
    expect(screen.getByText('Rated White (1500) vs Rated Black (1500)')).toBeInTheDocument();
    expect(screen.getByText('Guest One vs 🤖 Makruk Bot Lv.3')).toBeInTheDocument();
    expect(screen.getByText('Guest One vs Guest Two')).toBeInTheDocument();
    expect(screen.getByText('Games vs bot')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Lv.6')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/games/recent?page=0&limit=20&filter=all');
  });

  it('requests filtered recent games when the filter changes', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        games: [],
        total: 0,
        botStats: {
          gamesCount: 0,
          winRate: 0,
          highestBotLevelDefeated: null,
        },
      }),
    });

    const Wrapper = createWrapper();
    render(<GamesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/games/recent?page=0&limit=20&filter=all');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Rated' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/games/recent?page=0&limit=20&filter=rated');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Casual' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/games/recent?page=0&limit=20&filter=casual');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Bot' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/games/recent?page=0&limit=20&filter=bot');
    });
  });

  it('opens finished games in analysis instead of the live game route', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        games: [
          {
            id: 'finished-1',
            white_name: 'White Side',
            black_name: 'Black Side',
            result: 'white',
            result_reason: 'timeout',
            rated: 1,
            game_mode: 'quick_play',
            time_control_initial: 60,
            time_control_increment: 0,
            move_count: 77,
            finished_at: Math.floor(Date.now() / 1000),
          },
        ],
        total: 1,
        botStats: {
          gamesCount: 0,
          winRate: 0,
          highestBotLevelDefeated: null,
        },
      }),
    });

    const Wrapper = createWrapper();
    render(<GamesPage />, { wrapper: Wrapper });

    // Wait for loading to finish and data to appear
    expect(await screen.findByText('finished-1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('finished-1'));

    expect(navigateMock).toHaveBeenCalledWith('/analysis/finished-1');
  });
});
