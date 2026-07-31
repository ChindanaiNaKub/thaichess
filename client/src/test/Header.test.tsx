import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '../components/Header';
import type { AuthUser } from '../lib/auth';
import { I18nProvider } from '../lib/i18n';
import { preloadDetectedTranslations } from '../lib/i18nRuntime';
import { PieceStyleProvider } from '../lib/pieceStyle';

const { navigateMock, authState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  authState: {
    user: null as AuthUser | null,
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
  useAuth: () => authState,
}));

vi.mock('../components/PieceSVG', () => ({
  default: () => <div data-testid="piece-svg" />,
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <PieceStyleProvider>{children}</PieceStyleProvider>
        </I18nProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigateMock.mockReset();
    authState.user = null;
    authState.loading = false;
  });

  it('opens the mobile menu and lets users navigate from it', () => {
    authState.user = null;
    authState.loading = false;
    render(<Header active="play" />, { wrapper });

    expect(document.getElementById('mobile-site-menu')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));

    const menu = document.getElementById('mobile-site-menu');
    expect(menu).not.toBeNull();

    fireEvent.click(within(menu as HTMLElement).getByRole('button', { name: /games/i }));

    expect(navigateMock).toHaveBeenCalledWith('/games');
    expect(document.getElementById('mobile-site-menu')).toBeNull();
  });

  it('nests Puzzles and Tools behind disclosure in the mobile menu', () => {
    render(<Header active="play" />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    const menu = document.getElementById('mobile-site-menu') as HTMLElement;

    expect(within(menu).queryByRole('button', { name: /puzzle streak/i })).toBeNull();
    expect(within(menu).queryByRole('button', { name: /^editor$/i })).toBeNull();

    fireEvent.click(within(menu).getByRole('button', { name: /^puzzles$/i }));
    fireEvent.click(within(menu).getByRole('button', { name: /puzzle streak/i }));
    expect(navigateMock).toHaveBeenCalledWith('/puzzles/streak');

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    const menuAgain = document.getElementById('mobile-site-menu') as HTMLElement;
    fireEvent.click(within(menuAgain).getByRole('button', { name: /^tools$/i }));
    fireEvent.click(within(menuAgain).getByRole('button', { name: /^editor$/i }));
    expect(navigateMock).toHaveBeenCalledWith('/analysis?mode=editor');
  });

  it('exposes Sign In from the mobile menu for guests', () => {
    authState.user = null;
    authState.loading = false;
    render(<Header active="play" />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    const menu = document.getElementById('mobile-site-menu');
    expect(menu).not.toBeNull();

    fireEvent.click(within(menu as HTMLElement).getByRole('button', { name: /sign in/i }));
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('exposes the account entry from the mobile menu when signed in', () => {
    authState.user = {
      id: 'u1',
      email: 'player@example.com',
      username: 'MakrukFan',
      role: 'user',
      twoFactorEnabled: false,
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
    };
    authState.loading = false;
    render(<Header active="play" />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    const menu = document.getElementById('mobile-site-menu');
    expect(menu).not.toBeNull();

    fireEvent.click(within(menu as HTMLElement).getByRole('button', { name: /makrukfan/i }));
    expect(navigateMock).toHaveBeenCalledWith('/account');
  });

  it('shows Lessons as a first-class navigation item', () => {
    render(<Header active="lessons" />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /^lessons$/i }));

    expect(navigateMock).toHaveBeenCalledWith('/lessons');
  });

  it('opens a desktop Tools menu with an editor shortcut', () => {
    render(<Header active="play" />, { wrapper });

    const toolsButton = screen.getByRole('button', { name: /^tools$/i });
    fireEvent.mouseEnter(toolsButton.parentElement as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /^editor$/i }));

    expect(navigateMock).toHaveBeenCalledWith('/analysis?mode=editor');
  });

  it('opens quick analysis from the desktop Tools menu', () => {
    render(<Header active="play" />, { wrapper });

    const toolsButton = screen.getByRole('button', { name: /^tools$/i });
    fireEvent.mouseEnter(toolsButton.parentElement as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /^analysis$/i }));

    expect(navigateMock).toHaveBeenCalledWith('/analysis');
  });

  it('shows database and openings shortcuts in the desktop Tools menu', () => {
    render(<Header active="play" />, { wrapper });

    const toolsButton = screen.getByRole('button', { name: /^tools$/i });
    fireEvent.mouseEnter(toolsButton.parentElement as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /^database$/i }));
    fireEvent.mouseEnter(toolsButton.parentElement as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /^openings$/i }));

    expect(navigateMock).toHaveBeenNthCalledWith(1, '/database');
    expect(navigateMock).toHaveBeenNthCalledWith(2, '/openings');
  });

  it('opens Watch from the desktop Tools menu', () => {
    render(<Header active="play" />, { wrapper });

    const toolsButton = screen.getByRole('button', { name: /^tools$/i });
    fireEvent.mouseEnter(toolsButton.parentElement as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /^watch$/i }));

    expect(navigateMock).toHaveBeenCalledWith('/watch');
  });

  it('does not expose a disabled Import game shortcut in Tools', () => {
    render(<Header active="play" />, { wrapper });

    const toolsButton = screen.getByRole('button', { name: /^tools$/i });
    fireEvent.mouseEnter(toolsButton.parentElement as HTMLElement);

    expect(screen.queryByRole('button', { name: /^import game$/i })).toBeNull();
  });

  it('keeps desktop top-level nav to Play, Lessons, Puzzles, and Tools', () => {
    render(<Header active="play" />, { wrapper });

    const desktopNav = screen.getByRole('navigation');
    expect(within(desktopNav).getByRole('button', { name: /^play$/i })).toBeInTheDocument();
    expect(within(desktopNav).getByRole('button', { name: /^lessons$/i })).toBeInTheDocument();
    expect(within(desktopNav).getByRole('button', { name: /^puzzles$/i })).toBeInTheDocument();
    expect(within(desktopNav).getByRole('button', { name: /^tools$/i })).toBeInTheDocument();
    expect(within(desktopNav).queryByRole('button', { name: /^watch$/i })).toBeNull();
  });

  it('localizes the language switch tooltip in Thai mode', async () => {
    window.localStorage.setItem('thaichess-lang', 'th');
    await preloadDetectedTranslations();

    render(<Header active="play" />, { wrapper });

    expect(screen.getAllByTitle('เปลี่ยนเป็นภาษาอังกฤษ').length).toBeGreaterThan(0);
  });
});
