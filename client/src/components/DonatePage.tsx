import { useTranslation } from '../lib/i18n';
import Header from './Header';
import PromptPayQr from './PromptPayQr';

export default function DonatePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main id="main-content" className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-bold tracking-tight text-text-bright">{t('donate.title')}</h1>
        <div className="mt-4 max-w-sm space-y-4">
          <p className="text-sm leading-relaxed text-text-dim">{t('donate.desc')}</p>
          <div className="inline-block border-2 border-surface-hover p-4">
            <PromptPayQr label={t('donate.qr_alt')} />
          </div>
        </div>
      </main>
    </div>
  );
}
