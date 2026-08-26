import { hasAnalyticsConsent } from './cookieConsent';

export type ProductAnalyticsEvent = 'game_start' | 'puzzle_complete' | 'signup';

type PostHogClient = typeof import('posthog-js')['default'];

const SIGNUP_FLAG_KEY = 'thaichess-analytics-signup-sent';
const SIGNUP_WINDOW_MS = 5 * 60 * 1000;

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let loadPromise: Promise<PostHogClient> | null = null;

function loadPostHog(): Promise<PostHogClient> {
  if (!loadPromise) {
    // posthog-js (~40kB gzipped) is fetched only once analytics consent exists.
    loadPromise = import('posthog-js').then((module) => module.default);
  }
  return loadPromise;
}

/**
 * Resolves once posthog is loaded-and-initialized (or definitively skipped).
 * Concurrent callers share one flight so StrictMode double-effects and
 * rapid consent toggles can never call posthog.init() twice.
 */
function ensureInitialized(): Promise<boolean> {
  if (!initPromise) {
    initPromise = (async () => {
      const key = getPostHogKey();
      if (!key) return false;

      const posthog = await loadPostHog();

      // Consent may have been revoked while the script was loading.
      // Don't cache this outcome: a later re-consent must be able to init.
      if (!hasAnalyticsConsent()) {
        initPromise = null;
        return false;
      }

      if (initialized) return true;

      posthog.init(key, {
        api_host: getPostHogHost(),
        autocapture: false,
        capture_pageview: 'history_change',
        capture_pageleave: false,
        disable_session_recording: true,
        person_profiles: 'identified_only',
        persistence: 'localStorage+cookie',
      });
      initialized = true;
      return true;
    })();
  }
  return initPromise;
}

export function isPostHogConfigured(): boolean {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

export function getPostHogKey(): string | null {
  if (!isPostHogConfigured()) return null;
  return String(import.meta.env.VITE_POSTHOG_KEY).trim();
}

export function getPostHogHost(): string {
  const configured = import.meta.env.VITE_POSTHOG_HOST;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim();
  }
  return 'https://us.i.posthog.com';
}

/** Alias used by the cookie banner when analytics env is present. */
export function isAnalyticsConfigured(): boolean {
  return isPostHogConfigured();
}

export async function enablePrivacyAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  await ensureInitialized();

  if (initialized) {
    const posthog = await loadPostHog();
    posthog.opt_in_capturing();
  }
}

export async function disablePrivacyAnalytics(): Promise<void> {
  if (typeof window === 'undefined' || !initialized) return;
  const posthog = await loadPostHog();
  posthog.opt_out_capturing();
  posthog.reset(true);
  initialized = false;
  initPromise = null;
}

export async function captureProductEvent(
  event: ProductAnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!initialized || !hasAnalyticsConsent() || !isPostHogConfigured()) return;
  const posthog = await loadPostHog();
  if (!hasAnalyticsConsent()) return;
  posthog.capture(event, properties);
}

/**
 * Fires anonymous `signup` when the account looks newly created (created_at within
 * a short window). No user id/email is sent. Deduped per browser session.
 */
export async function maybeCaptureSignup(user: { created_at: number } | null): Promise<void> {
  if (!user) return;
  if (typeof window === 'undefined') return;

  try {
    if (sessionStorage.getItem(SIGNUP_FLAG_KEY)) return;
  } catch {
    return;
  }

  if (Date.now() - user.created_at > SIGNUP_WINDOW_MS) return;

  // Set the flag before the async capture so concurrent calls stay deduped.
  try {
    sessionStorage.setItem(SIGNUP_FLAG_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
  await captureProductEvent('signup');
}
