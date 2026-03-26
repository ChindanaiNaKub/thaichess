import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types';

const URL = import.meta.env.DEV ? 'http://localhost:3000' : '';
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

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
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
