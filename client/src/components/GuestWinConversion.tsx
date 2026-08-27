import { useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';
import { SEEN_KEY } from '../lib/guestWinConversion';

export default function GuestWinConversion() {
  const { t } = useTranslation();

  useEffect(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable; card will simply re-offer */
    }
  }, []);

  return (
    <div
      data-testid="guest-win-conversion"
      className="rounded-xl border border-gold/25 bg-gold/10 p-4 text-left"
    >
      <p className="text-sm leading-5 text-text-dim">{t('gameover.guest_win_body')}</p>
      <a
        href={routes.login}
        data-testid="guest-win-conversion-cta"
        className="mt-3 block rounded-lg button-accent-contrast px-3 py-2 text-center text-sm font-semibold"
      >
        {t('gameover.guest_win_cta')}
      </a>
    </div>
  );
}
