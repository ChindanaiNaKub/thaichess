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
