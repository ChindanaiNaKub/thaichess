import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authClient } from './authClient';
import { scheduleOnUserIntent } from './defer';

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  email_verified?: boolean;
  twoFactorEnabled: boolean;
  image?: string | null;
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
  verifyCode: (email: string, code: string) => Promise<{ ok: true; twoFactorRedirect: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialUser] = useState<AuthUser | null>(() => readCachedUser());
  const deferInitialRefresh = !initialUser && shouldDeferInitialAuthRefresh();
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser && !deferInitialRefresh);

  async function refreshUser() {
    const response = await fetch('/api/auth/me', {
      cache: 'no-store',
    });
    const data = await readJsonOrThrow(response);
    const nextUser = data.user ?? null;
    setUser(nextUser);
    writeCachedUser(nextUser);
  }

  useEffect(() => {
    if (deferInitialRefresh) {
      return scheduleOnUserIntent(() => {
        refreshUser()
          .catch(() => {
            setUser(null);
            writeCachedUser(null);
          })
          .finally(() => setLoading(false));
      }, {
        timeoutMs: 12_000,
        label: 'auth_refresh',
      });
    }

    refreshUser()
      .catch(() => {
        setUser(null);
        writeCachedUser(null);
      })
      .finally(() => setLoading(false));
  }, [deferInitialRefresh]);

  async function requestCode(email: string) {
    const response = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to send code.');
    }

    return { ok: true as const };
  }

  async function verifyCode(email: string, code: string) {
    const response = await authClient.signIn.emailOtp({
      email,
      otp: code,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to sign in.');
    }

    await refreshUser();
    return {
      ok: true as const,
      twoFactorRedirect: Boolean(response.data?.twoFactorRedirect),
    };
  }

  async function signInWithProvider(provider: 'google' | 'facebook') {
    const callbackURL = typeof window === 'undefined'
      ? '/account'
      : `${window.location.origin}/account`;

    const response = await authClient.signIn.social({
      provider,
      callbackURL,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to sign in.');
    }
  }

  async function signInWithGoogle() {
    await signInWithProvider('google');
  }

  async function signInWithFacebook() {
    await signInWithProvider('facebook');
  }

  async function logout() {
    await authClient.signOut();
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
    <AuthContext.Provider
      value={{ user, loading, refreshUser, requestCode, verifyCode, signInWithGoogle, signInWithFacebook, logout, updateProfile }}
    >
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
