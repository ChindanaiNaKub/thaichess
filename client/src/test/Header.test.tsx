import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';
import { I18nProvider } from '../lib/i18n';
import { PieceStyleProvider } from '../lib/pieceStyle';

const { navigateMock, authState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  authState: {
    user: null,
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
  return (
    <MemoryRouter>
      <I18nProvider>
        <PieceStyleProvider>{children}</PieceStyleProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('opens the mobile menu and lets users navigate from it', () => {
    render(<Header active="play" />, { wrapper });

    expect(document.getElementById('mobile-site-menu')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));

    const menu = document.getElementById('mobile-site-menu');
    expect(menu).not.toBeNull();

    fireEvent.click(within(menu as HTMLElement).getByRole('button', { name: /games/i }));

    expect(navigateMock).toHaveBeenCalledWith('/games');
    expect(document.getElementById('mobile-site-menu')).toBeNull();
  });

  it('shows Lessons as a first-class navigation item', () => {
    render(<Header active="lessons" />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /^lessons$/i }));

    expect(navigateMock).toHaveBeenCalledWith('/lessons');
  });
});
