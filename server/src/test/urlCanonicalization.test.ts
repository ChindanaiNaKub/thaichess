import { describe, expect, it } from 'vitest';
import { getCanonicalRedirectUrl } from '../urlCanonicalization';
import { getLegacyRedirectPath } from '../legacyRedirects';

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

describe('getLegacyRedirectPath', () => {
  it('redirects the retired quick-play entry path', () => {
    expect(getLegacyRedirectPath('/play')).toBe('/quick-play');
    expect(getLegacyRedirectPath('/play/')).toBe('/quick-play');
  });

  it('redirects legacy lesson aliases to the lessons section', () => {
    expect(getLegacyRedirectPath('/learn')).toBe('/lessons');
    expect(getLegacyRedirectPath('/course')).toBe('/lessons');
    expect(getLegacyRedirectPath('/course-path')).toBe('/lessons');
    expect(getLegacyRedirectPath('/learn/rook-activity')).toBe('/lessons/rook-activity');
    expect(getLegacyRedirectPath('/course/rook-activity')).toBe('/lessons/rook-activity');
  });

  it('leaves canonical paths and nested unknown paths untouched', () => {
    expect(getLegacyRedirectPath('/lessons')).toBeNull();
    expect(getLegacyRedirectPath('/quick-play')).toBeNull();
    expect(getLegacyRedirectPath('/learn/a/b')).toBeNull();
  });
});
