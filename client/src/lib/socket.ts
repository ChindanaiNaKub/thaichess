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

const GUEST_PLAYER_ID_STORAGE_KEY = 'thaichess_guest_player_id';

function createGuestPlayerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `guest_${crypto.randomUUID()}`;
  }

  return `guest_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getGuestPlayerId() {
  if (typeof window === 'undefined') {
    return createGuestPlayerId();
  }

  const existing = window.localStorage.getItem(GUEST_PLAYER_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = createGuestPlayerId();
  window.localStorage.setItem(GUEST_PLAYER_ID_STORAGE_KEY, created);
  return created;
}

function getSocketAuth() {
  return {
    guestPlayerId: getGuestPlayerId(),
  };
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  auth: getSocketAuth(),
});

export function connectSocket() {
  socket.auth = getSocketAuth();
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
