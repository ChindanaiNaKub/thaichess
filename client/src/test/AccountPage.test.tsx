import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import AccountPage from '../components/AccountPage';

const { navigateMock, logoutMock, updateProfileMock, authState } = vi.hoisted(() => ({
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

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('player_one')).toBeInTheDocument();
  });
});
