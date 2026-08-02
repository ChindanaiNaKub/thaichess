import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import LiveGamesPage from '../components/LiveGamesPage';
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

describe('LiveGamesPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/live-games')) {
        return {
          ok: true,
          json: async () => ({
            games: [
              {
                id: 'live-a',
                status: 'playing',
                whitePlayerName: 'FM White',
                blackPlayerName: 'FM Black',
                whiteRating: 1825,
                blackRating: 1790,
                timeControl: { initial: 180, increment: 2 },
                moveCount: 31,
                spectatorCount: 6,
                rated: true,
                gameMode: 'quick_play',
                createdAt: Date.now(),
                lastMoveAt: Date.now(),
              },
              {
                id: 'finished-b',
                status: 'finished',
                whitePlayerName: 'Guest One',
                blackPlayerName: 'Guest Two',
                whiteRating: null,
                blackRating: null,
                timeControl: { initial: 300, increment: 0 },
                moveCount: 42,
                spectatorCount: 2,
                rated: false,
                gameMode: 'quick_play',
                createdAt: Date.now(),
                lastMoveAt: Date.now(),
              },
            ],
            total: 2,
            status: 'all',
          }),
        };
      }
      throw new Error(`Unhandled fetch for ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('loads public live games and opens spectator mode from the listing', async () => {
    render(<LiveGamesPage />, { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/live-games?status=all&limit=24');
    });

    expect(await screen.findByText('FM White (1825)')).toBeInTheDocument();
    expect(screen.getByText('FM Black (1790)')).toBeInTheDocument();
    expect(screen.getByText('Guest One')).toBeInTheDocument();
    expect(screen.getByText('Guest Two')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /open spectator mode|live\.view_spectator/i })[0]);
    expect(navigateMock).toHaveBeenCalledWith('/spectate/live-a');
  });

  it('offers Find opponent and Play vs Bot when there are no live games', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/live-games')) {
        return {
          ok: true,
          json: async () => ({ games: [], total: 0, status: 'all' }),
        };
      }
      throw new Error(`Unhandled fetch for ${url}`);
    });

    render(<LiveGamesPage />, { wrapper });

    expect(await screen.findByText(/no live games|live\.empty_title/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /find opponent|live\.empty_find/i }));
    expect(navigateMock).toHaveBeenCalledWith('/quick-play');

    fireEvent.click(screen.getByRole('button', { name: /play vs bot|live\.empty_bot/i }));
    expect(navigateMock).toHaveBeenCalledWith('/bot');
  });
});
