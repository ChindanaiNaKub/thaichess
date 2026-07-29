import { useEffect, useState } from 'react';
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  getPlausibleDomain,
  getPlausibleScriptUrl,
  hasAnalyticsConsent,
  type CookieConsentChoice,
} from '../lib/cookieConsent';

const SCRIPT_ID = 'thaichess-plausible-analytics';

function removePlausibleScript() {
  document.getElementById(SCRIPT_ID)?.remove();
}

function ensurePlausibleScript(domain: string) {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.defer = true;
  script.dataset.domain = domain;
  script.src = getPlausibleScriptUrl();
  document.head.appendChild(script);
}

/**
 * Loads Plausible only after analytics consent and when VITE_PLAUSIBLE_DOMAIN is set.
 * Plausible.js sends Cross-Origin-Resource-Policy: cross-origin, so it works with COEP.
 */
export default function PrivacyAnalytics() {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => hasAnalyticsConsent());
  const domain = getPlausibleDomain();

  useEffect(() => {
    const onConsentChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentChoice>).detail;
      setAnalyticsAllowed(detail === 'analytics');
    };

    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, onConsentChange);
  }, []);

  useEffect(() => {
    if (!domain || !analyticsAllowed) {
      removePlausibleScript();
      return;
    }

    ensurePlausibleScript(domain);
  }, [analyticsAllowed, domain]);

  return null;
}
