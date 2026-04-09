import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-surface-alt border-t border-surface-hover py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Support Section */}
        <div className="mb-6 p-4 rounded-xl border border-accent/20 bg-accent/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-text-bright font-semibold text-sm">{t('footer.support')}</p>
              <p className="text-text-dim text-xs mt-1 max-w-md">{t('footer.support_desc')}</p>
            </div>
            <a
              href="/donate-qr.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4B0082] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#4B0082]/85 hover:scale-105 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 11h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v3h-3v-3zm-2 2h3v3h-3v-3zm2 2h3v3h-3v-3zm-9 2h3v3H9v-3zm2 2h3v3h-3v-3zm-2 2h3v3H9v-3z"/>
              </svg>
              {t('footer.donate_thai')}
            </a>
          </div>
          {/* Bank Info */}
          <div className="mt-3 pt-3 border-t border-accent/10 text-center">
            <p className="text-text-dim/80 text-xs">{t('footer.bank_info')}</p>
          </div>
        </div>

        <h2 className="sr-only">{t('footer.links_label')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-5 sm:gap-6 mb-4">
          {/* Play */}
          <div>
            <p className="text-text-bright font-semibold mb-2 text-sm">{t('nav.play')}</p>
            <ul className="space-y-2 text-text-dim text-xs">
              <li><a href={routes.quickPlay} className="footer-link hover:text-primary transition-colors">{t('home.quick_play')}</a></li>
              <li><a href={routes.watch} className="footer-link hover:text-primary transition-colors">{t('home.watch_live')}</a></li>
              <li><a href={routes.local} className="footer-link hover:text-primary transition-colors">{t('home.play_local')}</a></li>
              <li><a href={routes.bot} className="footer-link hover:text-primary transition-colors">{t('home.play_bot')}</a></li>
            </ul>
          </div>
          {/* Puzzles */}
          <div>
            <p className="text-text-bright font-semibold mb-2 text-sm">{t('nav.puzzles')}</p>
            <ul className="space-y-2 text-text-dim text-xs">
              <li><a href={routes.puzzles} className="footer-link hover:text-primary transition-colors">{t('puzzle.title')}</a></li>
            </ul>
          </div>
          {/* About */}
          <div>
            <p className="text-text-bright font-semibold mb-2 text-sm">{t('nav.about')}</p>
            <ul className="space-y-2 text-text-dim text-xs">
              <li><a href={routes.games} className="footer-link hover:text-primary transition-colors">{t('games.title')}</a></li>
              <li><a href={routes.whatIsMakruk} className="footer-link hover:text-primary transition-colors">{t('footer.what_is_makruk')}</a></li>
              <li><a href={routes.howToPlayMakruk} className="footer-link hover:text-primary transition-colors">{t('footer.how_to_play_makruk')}</a></li>
            </ul>
          </div>
          {/* Community */}
          <div>
            <p className="text-text-bright font-semibold mb-2 text-sm">{t('footer.community')}</p>
            <ul className="space-y-2 text-text-dim text-xs">
              <li>
                <a href="https://discord.gg/hgaxAWRtcD" target="_blank" rel="noopener" className="footer-link hover:text-primary transition-colors inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord
                </a>
              </li>
              <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="footer-link hover:text-primary transition-colors">{t('footer.star_github')}</a></li>
              <li><a href={routes.feedback} className="footer-link hover:text-primary transition-colors">{t('feedback.button')}</a></li>
            </ul>
          </div>
          {/* Legal - New */}
          <div>
            <p className="text-text-bright font-semibold mb-2 text-sm">{t('footer.privacy')} & {t('footer.terms')}</p>
            <ul className="space-y-2 text-text-dim text-xs">
              <li><a href={routes.privacy} className="footer-link hover:text-primary transition-colors">{t('footer.privacy')}</a></li>
              <li><a href={routes.terms} className="footer-link hover:text-primary transition-colors">{t('footer.terms')}</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-4 border-t border-surface-hover text-center">
          <p className="text-text-dim text-xs">{t('footer.tagline')} — {t('footer.inspired')}{' '}
            <a href="https://lichess.org" target="_blank" rel="noopener" className="footer-link text-primary hover:text-primary-light">
              Lichess
            </a>
            {' '}and{' '}
            <a href="https://chess.com" target="_blank" rel="noopener" className="footer-link text-primary hover:text-primary-light">
              Chess.com
            </a>
          </p>
          <p className="text-text-dim/70 text-xs mt-2">{t('footer.thanks')}</p>
        </div>
      </div>
    </footer>
  );
}
