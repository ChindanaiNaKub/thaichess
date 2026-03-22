import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  Position,
  TimeControl,
  PrivateGameColorPreference,
} from '../../shared/types';

interface RateLimitRule {
  windowMs: number;
  max: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

export class SocketRateLimiter {
  private buckets = new Map<string, RateLimitState>();

  allow(key: string, rule: RateLimitRule) {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + rule.windowMs,
      });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (existing.count >= rule.max) {
      return { allowed: false, retryAfterMs: Math.max(0, existing.resetAt - now) };
    }

    existing.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, state] of this.buckets) {
      if (now >= state.resetAt) {
        this.buckets.delete(key);
      }
    }
  }

  clearPrefix(prefix: string) {
    for (const key of this.buckets.keys()) {
      if (key.startsWith(prefix)) {
        this.buckets.delete(key);
      }
    }
  }
}

export function getSocketIp(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
  const forwardedFor = socket.handshake.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return socket.handshake.address || 'unknown';
}

export function isValidGameId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9-]{4,32}$/.test(value);
}

export function isValidPosition(value: unknown): value is Position {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Position;
  return Number.isInteger(candidate.row)
    && Number.isInteger(candidate.col)
    && candidate.row >= 0
    && candidate.row < 8
    && candidate.col >= 0
    && candidate.col < 8;
}

export function isValidTimeControl(value: unknown): value is TimeControl {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as TimeControl;
  return Number.isInteger(candidate.initial)
    && Number.isInteger(candidate.increment)
    && candidate.initial >= 10
    && candidate.initial <= 7200
    && candidate.increment >= 0
    && candidate.increment <= 60;
}

export function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isValidPrivateGameColorPreference(value: unknown): value is PrivateGameColorPreference {
  return value === 'white' || value === 'black' || value === 'random';
}
