import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  role: 'user' | 'admin';
  fair_play_status: 'clear' | 'restricted';
  rated_restricted_at: number | null;
  rated_restriction_note: string | null;
  rating: number;
  rated_games: number;
  wins: number;
  losses: number;
  draws: number;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  requestCode: (email: string) => Promise<{ ok: true }>;
  verifyCode: (email: string, code: string) => Promise<{ ok: true }>;
  logout: () => Promise<void>;
  updateProfile: (username: string) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_CACHE_KEY = 'thaichess-auth-user';

async function readJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed.');
  }
  return data;
}

function readCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(AUTH_CACHE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.sessionStorage.removeItem(AUTH_CACHE_KEY);
    return null;
  }
}

function writeCachedUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;

  if (user) {
    window.sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
    return;
  }

  window.sessionStorage.removeItem(AUTH_CACHE_KEY);
}

function shouldDeferInitialAuthRefresh() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/';
}

function scheduleAfterPageLoad(task: () => void) {
  if (typeof window === 'undefined') return () => {};

  const runTask = () => {
    const requestIdle = window.requestIdleCallback;
    if (typeof requestIdle === 'function') {
      const idleId = requestIdle(task, { timeout: 1500 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(task, 350);
    return () => window.clearTimeout(timeoutId);
  };

  if (document.readyState === 'complete') {
    return runTask();
  }

  let cleanup = () => {};
  const handleLoad = () => {
    cleanup = runTask();
  };

  window.addEventListener('load', handleLoad, { once: true });
  return () => {
    window.removeEventListener('load', handleLoad);
    cleanup();
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialUser = readCachedUser();
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  async function refreshUser() {
    const response = await fetch('/api/auth/me');
    const data = await readJsonOrThrow(response);
    const nextUser = data.user ?? null;
    setUser(nextUser);
    writeCachedUser(nextUser);
  }

  useEffect(() => {
    if (!initialUser && shouldDeferInitialAuthRefresh()) {
      return scheduleAfterPageLoad(() => {
        refreshUser()
          .catch(() => {
            setUser(null);
            writeCachedUser(null);
          })
          .finally(() => setLoading(false));
      });
    }

    refreshUser()
      .catch(() => {
        setUser(null);
        writeCachedUser(null);
      })
      .finally(() => setLoading(false));
  }, [initialUser]);

  async function requestCode(email: string) {
    const response = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    await readJsonOrThrow(response);
    return { ok: true as const };
  }

  async function verifyCode(email: string, code: string) {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await readJsonOrThrow(response);
    const nextUser = data.user ?? null;
    setUser(nextUser);
    writeCachedUser(nextUser);
    return { ok: true as const };
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    writeCachedUser(null);
  }

  async function updateProfile(username: string) {
    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await readJsonOrThrow(response);
    setUser(data.user);
    writeCachedUser(data.user as AuthUser);
    return data.user as AuthUser;
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, requestCode, verifyCode, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
