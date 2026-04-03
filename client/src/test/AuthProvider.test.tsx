import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../lib/auth';

function AuthProbe() {
  const { loading, user } = useAuth();
  return <div>{loading ? 'loading' : user?.email ?? 'guest'}</div>;
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

  it('defers the initial auth refresh on the homepage until user intent', async () => {
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
    fireEvent.click(window);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/me');
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
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/me');
    });
  });
});
