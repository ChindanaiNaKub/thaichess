import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COOKIE_CONSENT_KEY,
  getCookieConsent,
  hasAnalyticsConsent,
  setCookieConsent,
} from '../lib/cookieConsent';

describe('cookieConsent', () => {
  afterEach(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    vi.unstubAllEnvs();
  });

  it('treats legacy true dismiss as essential-only', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    expect(getCookieConsent()).toBe('essential');
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('stores analytics consent and notifies listeners', () => {
    const listener = vi.fn();
    window.addEventListener('thaichess-cookie-consent-change', listener);

    setCookieConsent('analytics');

    expect(getCookieConsent()).toBe('analytics');
    expect(hasAnalyticsConsent()).toBe(true);
    expect(listener).toHaveBeenCalledOnce();

    window.removeEventListener('thaichess-cookie-consent-change', listener);
  });

  it('stores essential consent without enabling analytics', () => {
    setCookieConsent('essential');
    expect(getCookieConsent()).toBe('essential');
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
