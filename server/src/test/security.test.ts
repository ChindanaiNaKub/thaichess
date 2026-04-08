import { describe, expect, it, vi } from 'vitest';
import {
  getAllowedCorsOrigins,
  getSocketIp,
  isAllowedCorsOrigin,
  isValidBoolean,
  isValidGameId,
  isValidPosition,
  isValidTimeControl,
  SocketRateLimiter,
} from '../security';

describe('security utilities', () => {
  it('extracts the first forwarded IP before falling back to handshake address', () => {
    const proxiedSocket = {
      handshake: {
        headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.5' },
        address: '127.0.0.1',
      },
    };

    const directSocket = {
      handshake: {
        headers: {},
        address: '198.51.100.20',
      },
    };

    expect(getSocketIp(proxiedSocket as never)).toBe('203.0.113.10');
    expect(getSocketIp(directSocket as never)).toBe('198.51.100.20');
  });

  it('validates game ids, board positions, booleans, and time controls', () => {
    expect(isValidGameId('abcd-1234')).toBe(true);
    expect(isValidGameId('54718574-8df5-48cc-97f4-16349bf43402')).toBe(true);
    expect(isValidGameId('bad id')).toBe(false);

    expect(isValidPosition({ row: 7, col: 0 })).toBe(true);
    expect(isValidPosition({ row: -1, col: 0 })).toBe(false);

    expect(isValidBoolean(true)).toBe(true);
    expect(isValidBoolean('true')).toBe(false);

    expect(isValidTimeControl({ initial: 300, increment: 5 })).toBe(true);
    expect(isValidTimeControl({ initial: 5, increment: 5 })).toBe(false);
    expect(isValidTimeControl({ initial: 300, increment: 120 })).toBe(false);
  });

  it('rate limits keys until the window expires and then resets', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-21T00:00:00Z'));

    const limiter = new SocketRateLimiter();
    const rule = { windowMs: 10_000, max: 2 };

    expect(limiter.allow('socket:1:create_game', rule)).toEqual({ allowed: true, retryAfterMs: 0 });
    expect(limiter.allow('socket:1:create_game', rule)).toEqual({ allowed: true, retryAfterMs: 0 });

    const limited = limiter.allow('socket:1:create_game', rule);
    expect(limited.allowed).toBe(false);
    expect(limited.retryAfterMs).toBeGreaterThan(0);

    vi.advanceTimersByTime(10_001);

    expect(limiter.allow('socket:1:create_game', rule)).toEqual({ allowed: true, retryAfterMs: 0 });

    vi.useRealTimers();
  });

  it('builds an explicit production CORS allowlist from configured site URLs', () => {
    const origins = getAllowedCorsOrigins({
      NODE_ENV: 'production',
      SITE_URL: 'https://thaichess.dev/',
      PUBLIC_SITE_URL: 'https://thaichess.dev',
      APP_URL: '',
      RENDER_EXTERNAL_URL: 'https://thaichess.onrender.com/',
    });

    expect(origins).toEqual([
      'https://thaichess.dev',
      'https://thaichess.onrender.com',
    ]);
    expect(isAllowedCorsOrigin('https://thaichess.dev/', origins)).toBe(true);
    expect(isAllowedCorsOrigin('https://evil.example', origins)).toBe(false);
  });

  it('allows localhost origins outside production and accepts requests without an origin header', () => {
    const origins = getAllowedCorsOrigins({
      NODE_ENV: 'test',
      SITE_URL: 'https://thaichess.dev',
    });

    expect(origins).toContain('http://localhost:5173');
    expect(origins).toContain('http://localhost:5174');
    expect(isAllowedCorsOrigin(undefined, origins)).toBe(true);
  });
});
