import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../lib/auth';

function AuthProbe() {
  const { authError, loading, user } = useAuth();
  return <div>{loading ? 'loading' : authError ?? user?.email ?? 'guest'}</div>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('defers the initial auth refresh on the homepage until non-click user intent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });

    window.history.pushState({}, '', '/');
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText('guest')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.keyUp(window, { key: 'Tab' });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
        cache: 'no-store',
      });
    });
  });

  it('refreshes auth immediately on non-home routes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });

    window.history.pushState({}, '', '/account');
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
        cache: 'no-store',
      });
    });
  });

  it('keeps a cached user when the initial auth refresh has a transient server failure', async () => {
    window.sessionStorage.setItem('thaichess-auth-user', JSON.stringify({
      id: 'player-one',
      email: 'player@example.com',
      username: 'player_one',
      twoFactorEnabled: false,
      role: 'user',
      fair_play_status: 'clear',
      rated_restricted_at: null,
      rated_restriction_note: null,
      rating: 500,
      rated_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      created_at: 1710000000,
      updated_at: 1710000000,
      last_login_at: null,
    }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Bad gateway' }),
    });

    window.history.pushState({}, '', '/account');
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
        cache: 'no-store',
      });
    });

    expect(screen.getByText('session_check_failed')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('thaichess-auth-user')).toContain('player@example.com');
  });
});
