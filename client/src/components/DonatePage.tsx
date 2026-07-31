import { useTranslation } from '../lib/i18n';
import Header from './Header';

export default function DonatePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main id="main-content" className="mx-auto max-w-lg px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-text-bright">{t('donate.title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-dim">{t('donate.desc')}</p>
        <img
          src="/donate-qr.jpg"
          alt={t('donate.qr_alt')}
          className="mx-auto mt-8 w-full max-w-xs"
          width={320}
          height={320}
        />
        <p className="mt-6 text-sm text-text-dim">{t('donate.bank_info')}</p>
        <p className="mt-4 text-sm text-text-bright">{t('donate.thanks')}</p>
      </main>
    </div>
  );
}
