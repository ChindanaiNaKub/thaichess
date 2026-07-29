import { useState, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import {
  COOKIE_CONSENT_KEY,
  getCookieConsent,
  isPlausibleAnalyticsConfigured,
  setCookieConsent,
  type CookieConsentChoice,
} from '../lib/cookieConsent';

function CookieIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="15" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

const primaryButtonClassName = `
  shrink-0
  rounded-xl
  bg-primary
  px-5 py-2.5
  text-sm font-semibold
  text-white
  shadow-lg shadow-primary/25
  transition-[color,background-color,box-shadow,transform] duration-200
  hover:bg-primary-bright
  hover:shadow-primary/40
  hover:scale-105
  active:scale-95
  focus:outline-none focus:ring-2 focus:ring-primary/50
`;

const secondaryButtonClassName = `
  shrink-0
  rounded-xl
  bg-surface
  px-5 py-2.5
  text-sm font-semibold
  text-text-bright
  border border-primary/20
  transition-[color,background-color,box-shadow,transform] duration-200
  hover:bg-surface-hover
  hover:scale-105
  active:scale-95
  focus:outline-none focus:ring-2 focus:ring-primary/50
`;

export default function CookieConsent() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const analyticsConfigured = isPlausibleAnalyticsConfigured();

  useEffect(() => {
    if (getCookieConsent()) return;

    const timeoutId = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleChoice = (choice: CookieConsentChoice) => {
    setIsAnimating(false);
    setTimeout(() => {
      setCookieConsent(choice);
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 z-50
        transform transition-[opacity,transform] duration-300 ease-out
        ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
    >
      <div
        className="
          mx-auto max-w-2xl
          rounded-2xl
          bg-surface-alt/95
          border border-primary/30
          shadow-2xl shadow-black/40
          backdrop-blur-md
          overflow-hidden
        "
      >
        <div className="h-1 bg-gradient-to-r from-primary via-primary-bright to-primary" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="
              shrink-0
              w-12 h-12
              rounded-xl
              bg-primary/10
              border border-primary/20
              flex items-center justify-center
            "
            >
              <CookieIcon className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-text-bright mb-1">
                {analyticsConfigured ? t('cookies.title_analytics') : t('cookies.title')}
              </h3>
              <p className="text-sm text-text-dim leading-relaxed">
                {analyticsConfigured ? t('cookies.description_analytics') : t('cookies.description')}
              </p>
            </div>

            {analyticsConfigured ? (
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleChoice('essential')}
                  className={secondaryButtonClassName}
                >
                  {t('cookies.essential_only')}
                </button>
                <button
                  type="button"
                  onClick={() => handleChoice('analytics')}
                  className={primaryButtonClassName}
                >
                  {t('cookies.accept_analytics')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleChoice('essential')}
                className={primaryButtonClassName}
              >
                {t('cookies.dismiss')}
              </button>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-surface-hover/50 flex items-center gap-2 text-xs">
            <span className="text-text-dim/70">
              {t('cookies.read_more')}
            </span>
            <a
              href="/privacy"
              className="text-primary hover:text-primary-bright underline underline-offset-2 transition-colors"
            >
              {t('footer.privacy')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export for callers that historically imported the key from this module.
export { COOKIE_CONSENT_KEY };
