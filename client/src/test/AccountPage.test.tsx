import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import AccountPage from '../components/AccountPage';

const { navigateMock, logoutMock, updateProfileMock, authState, puzzleProgressSummaryState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  logoutMock: vi.fn(),
  updateProfileMock: vi.fn(),
  authState: {
    user: {
      id: 'user-1',
      email: 'player@example.com',
      username: 'player_one',
      role: 'user' as const,
      rating: 1612,
      rated_games: 24,
      wins: 14,
      losses: 6,
      draws: 4,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    },
    loading: false,
  },
  puzzleProgressSummaryState: {
    completedCount: 3,
    totalCount: 7,
    percentComplete: 43,
    favoriteTheme: 'HangingPiece',
    nextPuzzle: {
      id: 5001,
      title: 'Trapped Knight',
      description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
      difficulty: 'intermediate',
      theme: 'TrappedPiece',
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

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: authState.user,
    loading: authState.loading,
    logout: logoutMock,
    updateProfile: updateProfileMock,
  }),
}));

vi.mock('../lib/puzzleProgress', () => ({
  usePuzzleProgressSummary: () => puzzleProgressSummaryState,
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      switch (key) {
        case 'puzzle.completed':
          return `${params?.done}/${params?.total} completed`;
        case 'theme.HangingPiece':
          return 'Hanging Piece';
        case 'theme.TrappedPiece':
          return 'Trapped Piece';
        default:
          return key;
      }
    },
  }),
}));

vi.mock('../components/Header', () => ({
  default: ({ children }: { children?: ReactNode }) => <div data-testid="header">{children}</div>,
}));

describe('AccountPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
    updateProfileMock.mockReset();
    authState.loading = false;
  });

  it('renders rating and record stats for the authenticated user', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText('1612')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('player_one')).toBeInTheDocument();
    expect(screen.getByText('account.puzzle_title')).toBeInTheDocument();
    expect(screen.getByText('3/7 completed')).toBeInTheDocument();
    expect(screen.getByText('Hanging Piece')).toBeInTheDocument();
    expect(screen.getByText('#5001 · Trapped Knight')).toBeInTheDocument();
  });

  it('routes to the next recommended puzzle from the account page', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'account.puzzle_continue' }));
    expect(navigateMock).toHaveBeenCalledWith('/puzzle/5001');
  });
});
