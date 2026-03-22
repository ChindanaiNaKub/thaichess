import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n';
import Header from './Header';

interface Stats {
  totalGames: number;
  totalMoves: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
}

export default function AboutPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="about" />

      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Mission */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-bright mb-4">{t('about.title')}</h2>
          <div className="text-text text-base sm:text-lg leading-relaxed space-y-4 [&_strong]:text-text-bright [&_a]:text-primary [&_a:hover]:text-primary-light [&_a]:underline">
            <p dangerouslySetInnerHTML={{ __html: t('about.intro1') }} />
            <p dangerouslySetInnerHTML={{ __html: t('about.intro2') }} />
            <p dangerouslySetInnerHTML={{ __html: t('about.intro3') }} />
          </div>
        </section>

        {/* Stats */}
        {stats && stats.totalGames > 0 && (
          <section className="mb-8 sm:mb-10">
            <h3 className="text-lg sm:text-xl font-bold text-text-bright mb-4">{t('about.stats_title')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-surface-alt rounded-lg p-3 sm:p-4 text-center border border-surface-hover">
                <div className="text-xl sm:text-2xl font-bold text-primary-light">{stats.totalGames}</div>
                <div className="text-text-dim text-xs sm:text-sm">{t('about.games_played')}</div>
              </div>
              <div className="bg-surface-alt rounded-lg p-3 sm:p-4 text-center border border-surface-hover">
                <div className="text-xl sm:text-2xl font-bold text-text-bright">{stats.totalMoves}</div>
                <div className="text-text-dim text-xs sm:text-sm">{t('about.total_moves')}</div>
              </div>
              <div className="bg-surface-alt rounded-lg p-3 sm:p-4 text-center border border-surface-hover">
                <div className="text-xl sm:text-2xl font-bold text-text-bright">{stats.whiteWins}</div>
                <div className="text-text-dim text-xs sm:text-sm">{t('about.white_wins')}</div>
              </div>
              <div className="bg-surface-alt rounded-lg p-3 sm:p-4 text-center border border-surface-hover">
                <div className="text-xl sm:text-2xl font-bold text-text-bright">{stats.blackWins}</div>
                <div className="text-text-dim text-xs sm:text-sm">{t('about.black_wins')}</div>
              </div>
            </div>
          </section>
        )}

        {/* What is ThaiChess */}
        <section className="mb-8 sm:mb-10">
          <h3 className="text-lg sm:text-xl font-bold text-text-bright mb-4">{t('about.what_title')}</h3>
          <div className="text-text leading-relaxed space-y-3 text-sm sm:text-base [&_strong]:text-text-bright [&_.text-primary]:text-primary">
            <p dangerouslySetInnerHTML={{ __html: t('about.what1') }} />
            <p dangerouslySetInnerHTML={{ __html: t('about.what2') }} />
            <p dangerouslySetInnerHTML={{ __html: t('about.what3') }} />
            <p className="text-primary" dangerouslySetInnerHTML={{ __html: t('about.what4') }} />
          </div>
        </section>

        {/* Tech */}
        <section className="mb-8 sm:mb-10">
          <h3 className="text-lg sm:text-xl font-bold text-text-bright mb-4">{t('about.opensource_title')}</h3>
          <p className="text-text mb-4 text-sm sm:text-base">{t('about.opensource_desc')}</p>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Node.js', 'Socket.IO', 'Tailwind CSS', 'SQLite', 'Vite'].map(tech => (
              <span key={tech} className="bg-surface-hover text-text-dim px-3 py-1 rounded-full text-xs sm:text-sm">{tech}</span>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-surface-alt border-t border-surface-hover py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6">
            {/* Play */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.play')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/quick-play" className="hover:text-primary transition-colors">{t('home.quick_play')}</a></li>
                <li><a href="/local" className="hover:text-primary transition-colors">{t('home.play_local')}</a></li>
                <li><a href="/bot" className="hover:text-primary transition-colors">{t('home.play_bot')}</a></li>
              </ul>
            </div>
            {/* Puzzles */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.puzzles')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/puzzles" className="hover:text-primary transition-colors">{t('puzzle.title')}</a></li>
              </ul>
            </div>
            {/* About */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.about')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/games" className="hover:text-primary transition-colors">{t('games.title')}</a></li>
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">{t('footer.github')}</a></li>
              </ul>
            </div>
            {/* Community */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('footer.community')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">{t('footer.star_github')}</a></li>
                <li><a href="/feedback" className="hover:text-primary transition-colors">{t('feedback.button')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-hover text-center">
            <p className="text-text-dim text-xs">{t('about.footer')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
