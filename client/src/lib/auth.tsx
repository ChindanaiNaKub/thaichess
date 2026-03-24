import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  role: 'user' | 'admin';
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

async function readJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed.');
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const response = await fetch('/api/auth/me');
    const data = await readJsonOrThrow(response);
    setUser(data.user ?? null);
  }

  useEffect(() => {
    refreshUser()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

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
    setUser(data.user ?? null);
    return { ok: true as const };
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  async function updateProfile(username: string) {
    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await readJsonOrThrow(response);
    setUser(data.user);
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
