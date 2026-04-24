import { describe, expect, it } from 'vitest';
import { getCanonicalRedirectUrl } from '../urlCanonicalization';

describe('getCanonicalRedirectUrl', () => {
  it('redirects trailing-slash app routes to the sitemap URL', () => {
    expect(getCanonicalRedirectUrl({
      host: 'thaichess.dev',
      protocol: 'https',
      originalUrl: '/how-to-play-makruk/',
    })).toBe('https://thaichess.dev/how-to-play-makruk');
  });

  it('preserves query strings when removing trailing slashes', () => {
    expect(getCanonicalRedirectUrl({
      host: 'thaichess.dev',
      protocol: 'https',
      originalUrl: '/how-to-play-makruk/?utm_source=gsc',
    })).toBe('https://thaichess.dev/how-to-play-makruk?utm_source=gsc');
  });

  it('keeps root and static file URLs unchanged', () => {
    expect(getCanonicalRedirectUrl({
      host: 'thaichess.dev',
      protocol: 'https',
      originalUrl: '/',
    })).toBeNull();
    expect(getCanonicalRedirectUrl({
      host: 'thaichess.dev',
      protocol: 'https',
      originalUrl: '/assets/piece.svg',
    })).toBeNull();
  });
});
