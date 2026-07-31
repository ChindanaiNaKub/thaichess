import posthog from 'posthog-js';
import { hasAnalyticsConsent } from './cookieConsent';

export type ProductAnalyticsEvent = 'game_start' | 'puzzle_complete' | 'signup';

const SIGNUP_FLAG_KEY = 'thaichess-analytics-signup-sent';
const SIGNUP_WINDOW_MS = 5 * 60 * 1000;

let initialized = false;

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

export function enablePrivacyAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  const key = getPostHogKey();
  if (!key) return;

  if (initialized) {
    posthog.opt_in_capturing();
    return;
  }

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
}

export function disablePrivacyAnalytics(): void {
  if (typeof window === 'undefined' || !initialized) return;
  posthog.opt_out_capturing();
  posthog.reset(true);
  initialized = false;
}

export function captureProductEvent(
  event: ProductAnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return;
  if (!initialized || !hasAnalyticsConsent() || !isPostHogConfigured()) return;
  posthog.capture(event, properties);
}

/**
 * Fires anonymous `signup` when the account looks newly created (created_at within
 * a short window). No user id/email is sent. Deduped per browser session.
 */
export function maybeCaptureSignup(user: { created_at: number } | null): void {
  if (!user) return;
  if (typeof window === 'undefined') return;

  try {
    if (sessionStorage.getItem(SIGNUP_FLAG_KEY)) return;
  } catch {
    return;
  }

  if (Date.now() - user.created_at > SIGNUP_WINDOW_MS) return;

  captureProductEvent('signup');
  try {
    sessionStorage.setItem(SIGNUP_FLAG_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}
