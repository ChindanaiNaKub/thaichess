import { render, screen, waitFor } from '@testing-library/react';
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

  it('defers the initial auth refresh on the homepage until idle time', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });
    const idleCallbacks: IdleRequestCallback[] = [];

    window.history.pushState({}, '', '/');
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('requestIdleCallback', vi.fn((callback: IdleRequestCallback) => {
      idleCallbacks.push(callback);
      return 1;
    }));
    vi.stubGlobal('cancelIdleCallback', vi.fn());

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(idleCallbacks).toHaveLength(1);

    idleCallbacks[0]({
      didTimeout: false,
      timeRemaining: () => 50,
    });

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
