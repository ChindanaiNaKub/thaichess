import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import GamesPage from '../components/GamesPage';
import { I18nProvider } from '../lib/i18n';

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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  );
}

describe('GamesPage', () => {
  beforeEach(() => {
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
            result: 'white',
            result_reason: 'checkmate',
            rated: 1,
            game_mode: 'quick_play',
            time_control_initial: 300,
            time_control_increment: 0,
            move_count: 32,
            finished_at: Math.floor(Date.now() / 1000),
          },
          {
            id: 'casual-1',
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
        total: 2,
      }),
    });

    render(<GamesPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('rated-1')).toBeInTheDocument();
      expect(screen.getByText('casual-1')).toBeInTheDocument();
    });

    expect(screen.getByText('Rated')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
  });
});
