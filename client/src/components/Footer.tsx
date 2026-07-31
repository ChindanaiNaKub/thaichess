import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-surface-hover/70 bg-surface-alt/80 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-xs leading-relaxed text-text-dim">
          {t('footer.support_desc')}{' '}
          <a
            href={routes.donate}
            className="footer-link font-medium text-primary hover:text-primary-light"
          >
            {t('footer.donate')}
          </a>
        </p>

        <h2 className="sr-only">{t('footer.links_label')}</h2>
        <nav
          aria-label={t('footer.links_label')}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-text-dim"
        >
          <a href={routes.whatIsMakruk} className="footer-link hover:text-text-bright transition-colors">
            {t('footer.what_is_makruk')}
          </a>
          <a href={routes.howToPlayMakruk} className="footer-link hover:text-text-bright transition-colors">
            {t('footer.how_to_play_makruk')}
          </a>
          <a
            href="https://discord.gg/hgaxAWRtcD"
            target="_blank"
            rel="noopener"
            className="footer-link inline-flex items-center gap-1.5 hover:text-text-bright transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            {t('footer.discord')}
          </a>
          <a
            href="https://github.com/ChindanaiNaKub/thaichess"
            target="_blank"
            rel="noopener"
            className="footer-link hover:text-text-bright transition-colors"
          >
            {t('footer.star_github')}
          </a>
          <a href={routes.feedback} className="footer-link hover:text-text-bright transition-colors">
            {t('feedback.button')}
          </a>
          <a href={routes.privacy} className="footer-link hover:text-text-bright transition-colors">
            {t('footer.privacy')}
          </a>
          <a href={routes.terms} className="footer-link hover:text-text-bright transition-colors">
            {t('footer.terms')}
          </a>
        </nav>

        <p className="mt-6 text-center text-xs text-text-dim/80">{t('footer.tagline')}</p>
      </div>
    </footer>
  );
}
