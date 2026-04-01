import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import AccountPage from '../components/AccountPage';
import type { AuthUser } from '../lib/auth';

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
      fair_play_status: 'clear' as const,
      rated_restricted_at: null,
      rated_restriction_note: null,
      rating: 1612,
      rated_games: 24,
      wins: 14,
      losses: 6,
      draws: 4,
      created_at: 0,
      updated_at: 0,
      last_login_at: null,
    } as AuthUser,
    loading: false,
  },
  puzzleProgressSummaryState: {
    completedCount: 3,
    totalCount: 7,
    percentComplete: 43,
    attemptCount: 6,
    successRate: 67,
    recommendedDifficultyScore: 1180,
    favoriteTheme: 'HangingPiece',
    continuePuzzle: {
      id: 5001,
      title: 'Trapped Knight',
      description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
      difficulty: 'intermediate',
      theme: 'TrappedPiece',
    },
    nextPuzzle: {
      id: 5001,
      title: 'Trapped Knight',
      description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
      difficulty: 'intermediate',
      theme: 'TrappedPiece',
    },
    lastPlayed: {
      puzzle: {
        id: 5001,
        title: 'Trapped Knight',
        description: 'Win material in 2. Start with the move that traps the knight, then collect it.',
        difficulty: 'intermediate',
        theme: 'TrappedPiece',
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
          difficulty: 'beginner',
          theme: 'HangingPiece',
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
    lang: 'en',
    t: (key: string, params?: Record<string, unknown>) => {
      switch (key) {
        case 'puzzle.completed':
          return `${params?.done}/${params?.total} completed`;
        case 'theme.HangingPiece':
          return 'Hanging Piece';
        case 'theme.TrappedPiece':
          return 'Trapped Piece';
        case 'account.puzzle_last_played_meta':
          return `${params?.status} · ${params?.date}`;
        case 'account.puzzle_recent_meta':
          return `Solved ${params?.date}`;
        case 'account.puzzle_status_in_progress':
          return 'In progress';
        case 'account.puzzle_status_solved':
          return 'Solved';
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
    expect(screen.getAllByText('Hanging Piece').length).toBeGreaterThan(0);
    expect(screen.getAllByText('#5001 · Trapped Knight').length).toBeGreaterThan(0);
    expect(screen.getByText('account.puzzle_last_played_label')).toBeInTheDocument();
    expect(screen.getByText('#10 · Rook Harvest')).toBeInTheDocument();
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

  it('shows rated restriction messaging when the account is restricted', () => {
    authState.user = {
      ...authState.user,
      fair_play_status: 'restricted',
      rated_restricted_at: 1,
      rated_restriction_note: 'Restricted pending review',
    };

    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    );

    expect(screen.getByText('account.rated_restricted_title')).toBeInTheDocument();
    expect(screen.getByText('Restricted pending review')).toBeInTheDocument();
  });
});
