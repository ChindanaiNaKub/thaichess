import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  posthogInit,
  posthogCapture,
  posthogOptIn,
  posthogOptOut,
  posthogReset,
} = vi.hoisted(() => ({
  posthogInit: vi.fn(),
  posthogCapture: vi.fn(),
  posthogOptIn: vi.fn(),
  posthogOptOut: vi.fn(),
  posthogReset: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    init: posthogInit,
    capture: posthogCapture,
    opt_in_capturing: posthogOptIn,
    opt_out_capturing: posthogOptOut,
    reset: posthogReset,
  },
}));

import {
  captureProductEvent,
  disablePrivacyAnalytics,
  enablePrivacyAnalytics,
  isPostHogConfigured,
  maybeCaptureSignup,
} from '../lib/analytics';
import { COOKIE_CONSENT_KEY, setCookieConsent } from '../lib/cookieConsent';

describe('analytics', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com');
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    sessionStorage.clear();
    posthogInit.mockClear();
    posthogCapture.mockClear();
    posthogOptIn.mockClear();
    posthogOptOut.mockClear();
    posthogReset.mockClear();
  });

  afterEach(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reports configured when VITE_POSTHOG_KEY is set', () => {
    expect(isPostHogConfigured()).toBe(true);
  });

  it('does not init without analytics consent', async () => {
    setCookieConsent('essential');
    await enablePrivacyAnalytics();
    expect(posthogInit).not.toHaveBeenCalled();
  });

  it('inits after analytics consent and captures product events', async () => {
    setCookieConsent('analytics');
    await enablePrivacyAnalytics();

    expect(posthogInit).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: 'https://us.i.posthog.com',
        autocapture: false,
        disable_session_recording: true,
        person_profiles: 'identified_only',
      }),
    );

    await captureProductEvent('game_start', { source: 'matchmaking' });
    expect(posthogCapture).toHaveBeenCalledWith('game_start', { source: 'matchmaking' });
  });

  it('opts out and resets when disabled', async () => {
    setCookieConsent('analytics');
    await enablePrivacyAnalytics();
    await disablePrivacyAnalytics();
    expect(posthogOptOut).toHaveBeenCalled();
    expect(posthogReset).toHaveBeenCalledWith(true);
  });

  it('inits only once when enabled concurrently (StrictMode double-effect)', async () => {
    setCookieConsent('analytics');
    await Promise.all([
      enablePrivacyAnalytics(),
      enablePrivacyAnalytics(),
      enablePrivacyAnalytics(),
    ]);
    expect(posthogInit).toHaveBeenCalledTimes(1);
  });

  it('captures signup only for recently created accounts once per session', async () => {
    setCookieConsent('analytics');
    await enablePrivacyAnalytics();

    await maybeCaptureSignup({ created_at: Date.now() - 60_000 });
    await maybeCaptureSignup({ created_at: Date.now() - 60_000 });
    expect(posthogCapture).toHaveBeenCalledTimes(1);
    expect(posthogCapture).toHaveBeenCalledWith('signup', undefined);

    await maybeCaptureSignup({ created_at: Date.now() - 10 * 60_000 });
    expect(posthogCapture).toHaveBeenCalledTimes(1);
  });
});
