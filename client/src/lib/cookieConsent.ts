export const COOKIE_CONSENT_KEY = 'thaichess-cookie-consent';
export const COOKIE_CONSENT_CHANGE_EVENT = 'thaichess-cookie-consent-change';

export type CookieConsentChoice = 'essential' | 'analytics';

/** Legacy dismiss value from the essential-only banner (`'true'`). */
function normalizeConsent(raw: string | null): CookieConsentChoice | null {
  if (raw === 'analytics') return 'analytics';
  if (raw === 'essential' || raw === 'true') return 'essential';
  return null;
}

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
  } catch {
    return null;
  }
}

export function setCookieConsent(choice: CookieConsentChoice): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: choice }),
  );
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'analytics';
}

export function isPlausibleAnalyticsConfigured(): boolean {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  return typeof domain === 'string' && domain.trim().length > 0;
}

export function getPlausibleDomain(): string | null {
  if (!isPlausibleAnalyticsConfigured()) return null;
  return String(import.meta.env.VITE_PLAUSIBLE_DOMAIN).trim();
}

export function getPlausibleScriptUrl(): string {
  const configured = import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.trim();
  }
  return 'https://plausible.io/js/script.js';
}
