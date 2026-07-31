import { useEffect, useState } from 'react';
import {
  disablePrivacyAnalytics,
  enablePrivacyAnalytics,
  isPostHogConfigured,
} from '../lib/analytics';
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  hasAnalyticsConsent,
  type CookieConsentChoice,
} from '../lib/cookieConsent';

/**
 * Initializes PostHog only after analytics consent and when VITE_POSTHOG_KEY is set.
 * No autocapture, heatmaps, or session replay — product events are captured explicitly.
 */
export default function PrivacyAnalytics() {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => hasAnalyticsConsent());
  const configured = isPostHogConfigured();

  useEffect(() => {
    const onConsentChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentChoice>).detail;
      setAnalyticsAllowed(detail === 'analytics');
    };

    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  useEffect(() => {
    if (!configured || !analyticsAllowed) {
      disablePrivacyAnalytics();
      return;
    }

    enablePrivacyAnalytics();
  }, [analyticsAllowed, configured]);

  return null;
}
