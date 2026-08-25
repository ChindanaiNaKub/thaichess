import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types';

/**
 * Socket.IO base URL.
 * - Browser: always the page origin. In Vite DEV that hits the `/socket.io` proxy;
 *   in production Express serves Socket.IO on the same host.
 * - Do NOT use `''` — socket.io-client treats it as host-less `http://` and never connects
 *   (Quick Play freezes on "Sending…").
 * - Non-browser fallback: direct API port for Node scripts/tests.
 */
function getSocketUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return import.meta.env.DEV ? 'http://localhost:3000' : 'http://127.0.0.1:3000';
}

const GUEST_CREDENTIALS_STORAGE_KEY = 'thaichess_guest_player_id';

interface GuestCredentials {
  playerId: string;
  token: string;
}

function isGuestCredentials(value: unknown): value is GuestCredentials {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.playerId === 'string'
    && record.playerId.startsWith('guest_')
    && typeof record.token === 'string';
}

function readStoredGuestCredentials(): GuestCredentials | null {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(GUEST_CREDENTIALS_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (isGuestCredentials(parsed)) return parsed;
  } catch {
    window.localStorage.removeItem(GUEST_CREDENTIALS_STORAGE_KEY);
    return null;
  }

  window.localStorage.removeItem(GUEST_CREDENTIALS_STORAGE_KEY);
  return null;
}

async function requestGuestCredentials(): Promise<GuestCredentials> {
  const response = await fetch('/api/auth/guest', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Guest credential request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isGuestCredentials(payload)) {
    throw new Error('Invalid guest credential payload.');
  }
  return payload;
}

let guestCredentialsPromise: Promise<GuestCredentials | null> | null = null;

export function ensureGuestCredentials(): Promise<GuestCredentials | null> {
  const stored = readStoredGuestCredentials();
  if (stored) return Promise.resolve(stored);

  if (!guestCredentialsPromise) {
    guestCredentialsPromise = requestGuestCredentials()
      .then((credentials) => {
        window.localStorage.setItem(GUEST_CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
        return credentials;
      })
      .catch(() => {
        guestCredentialsPromise = null;
        return null;
      });
  }

  return guestCredentialsPromise;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  auth: {},
});

export function connectSocket() {
  void ensureGuestCredentials().then((credentials) => {
    socket.auth = credentials
      ? { guestPlayerId: credentials.playerId, guestToken: credentials.token }
      : {};
    if (!socket.connected) {
      socket.connect();
    }
  });
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
