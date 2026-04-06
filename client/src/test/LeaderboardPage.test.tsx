import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaderboardPage from '../components/LeaderboardPage';
import { I18nProvider } from '../lib/i18n';

const { navigateMock, fetchMock, authState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  fetchMock: vi.fn(),
  authState: {
    user: {
      id: 'player-2',
      email: 'player2@example.com',
      username: 'player_two',
      role: 'user' as const,
      fair_play_status: 'clear' as const,
      rated_restricted_at: null,
      rated_restriction_note: null,
      rating: 1488,
      rated_games: 1,
      wins: 0,
      losses: 1,
      draws: 0,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    },
  },
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

vi.mock('../lib/auth', () => ({
  useAuth: () => authState,
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

describe('LeaderboardPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders ranked players and highlights the signed-in user', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        players: [
          {
            id: 'player-1',
            display_name: 'Champion',
            rating: 1610,
            rated_games: 20,
            wins: 15,
            losses: 3,
            draws: 2,
          },
          {
            id: 'player-2',
            display_name: 'player_two',
            rating: 1488,
            rated_games: 1,
            wins: 0,
            losses: 1,
            draws: 0,
          },
        ],
        total: 2,
      }),
    });

    const Wrapper = createWrapper();
    render(<LeaderboardPage />, { wrapper: Wrapper });

    // Wait for loading to finish and data to appear
    expect(await screen.findByText('Champion')).toBeInTheDocument();
    expect(await screen.findByText('player_two')).toBeInTheDocument();

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('1610')).toBeInTheDocument();
    expect(screen.getByText('1488')).toBeInTheDocument();
  });
});
