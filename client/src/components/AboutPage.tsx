import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';
import { useQuery } from '@tanstack/react-query';
import Header from './Header';
import PieceSVG from './PieceSVG';
import { aboutStatsQueryOptions } from '../queries/stats';

export default function AboutPage() {
  const { t } = useTranslation();
  const { data: stats } = useQuery(aboutStatsQueryOptions());
  const differenceKeys = ['about.diff1', 'about.diff2', 'about.diff3', 'about.diff4'] as const;
  const pieceCards = [
    { type: 'K' as const, title: t('guide.king'), desc: t('guide.king_move') },
    { type: 'M' as const, title: t('guide.queen'), desc: t('guide.queen_move') },
    { type: 'S' as const, title: t('guide.bishop'), desc: t('guide.bishop_move') },
    { type: 'R' as const, title: t('guide.rook'), desc: t('guide.rook_move') },
    { type: 'N' as const, title: t('guide.knight'), desc: t('guide.knight_move') },
    { type: 'P' as const, title: t('guide.pawn'), desc: t('guide.pawn_move') },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="about" />

      <main id="main-content" className="flex-1 px-4 sm:px-6 py-6 sm:py-8 w-full">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-10">
          <section className="rounded-[2rem] border border-surface-hover/80 bg-[radial-gradient(circle_at_top_left,rgba(173,130,53,0.12),transparent_34%),linear-gradient(180deg,rgba(41,34,28,0.92),rgba(21,19,17,0.98))] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{t('about.eyebrow')}</p>
                <h1 className="mt-3 display text-3xl text-text-bright sm:text-4xl lg:text-[3.2rem]">{t('about.title')}</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-text sm:text-lg">
                  {t('about.hero_desc')}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={routes.quickPlay}
                    className="inline-flex items-center rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/85"
                  >
                    {t('about.cta_play')}
                  </a>
                  <a
                    href={routes.puzzles}
                    className="inline-flex items-center rounded-xl border border-surface-hover bg-surface/55 px-5 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                  >
                    {t('about.cta_puzzles')}
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-accent/20 bg-surface/55 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-dim">{t('about.quick_facts')}</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-surface-hover bg-surface-alt px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('about.fact_heritage_label')}</div>
                    <div className="mt-2 text-sm font-semibold text-text-bright">{t('about.fact_heritage_value')}</div>
                  </div>
                  <div className="rounded-xl border border-surface-hover bg-surface-alt px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('about.fact_style_label')}</div>
                    <div className="mt-2 text-sm font-semibold text-text-bright">{t('about.fact_style_value')}</div>
                  </div>
                </div>
                {stats && stats.totalGames > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-primary-light">{t('about.games_played')}</div>
                      <div className="mt-2 text-2xl font-bold text-text-bright">{stats.totalGames}</div>
                    </div>
                    <div className="rounded-xl border border-surface-hover bg-surface-alt px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('about.total_moves')}</div>
                      <div className="mt-2 text-2xl font-bold text-text-bright">{stats.totalMoves}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-text-bright sm:text-2xl">{t('about.what_title')}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text sm:text-base [&_strong]:text-text-bright [&_.text-primary]:text-primary">
                <p dangerouslySetInnerHTML={{ __html: t('about.what1') }} />
                <p dangerouslySetInnerHTML={{ __html: t('about.what2') }} />
                <p dangerouslySetInnerHTML={{ __html: t('about.what3') }} />
                <p className="text-primary" dangerouslySetInnerHTML={{ __html: t('about.what4') }} />
              </div>
            </div>

            <div className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-text-bright sm:text-2xl">{t('about.intro_title')}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-text sm:text-base [&_strong]:text-text-bright [&_a]:text-primary [&_a:hover]:text-primary-light [&_a]:underline">
                <p dangerouslySetInnerHTML={{ __html: t('about.intro1') }} />
                <p dangerouslySetInnerHTML={{ __html: t('about.intro2') }} />
                <p dangerouslySetInnerHTML={{ __html: t('about.intro3') }} />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-light">{t('about.diff_eyebrow')}</p>
                <h2 className="mt-2 text-2xl font-bold text-text-bright">{t('about.diff_title')}</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {differenceKeys.map((key) => (
                <div key={key} className="rounded-2xl border border-surface-hover bg-surface-alt px-5 py-5">
                  <p className="text-sm leading-6 text-text">{t(key)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t('about.pieces_eyebrow')}</p>
                <h2 className="mt-2 text-2xl font-bold text-text-bright">{t('about.pieces_title')}</h2>
              </div>
              <a href={routes.quickPlay} className="text-sm font-semibold text-primary hover:text-primary-light">
                {t('about.learn_by_playing')}
              </a>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pieceCards.map((piece) => (
                <div key={piece.type} className="rounded-2xl border border-surface-hover bg-surface/50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-hover bg-surface-alt">
                      <PieceSVG type={piece.type} color="white" size={34} />
                    </div>
                    <div>
                      <div className="font-semibold text-text-bright">{piece.title}</div>
                      <div className="mt-1 text-sm text-text-dim">{piece.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {stats && stats.totalGames > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-text-bright">{t('about.stats_title')}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center">
                  <div className="text-2xl font-bold text-primary-light sm:text-3xl">{stats.totalGames}</div>
                  <div className="mt-1 text-xs sm:text-sm text-text-dim">{t('about.games_played')}</div>
                </div>
                <div className="rounded-2xl border border-surface-hover bg-surface-alt p-4 text-center">
                  <div className="text-2xl font-bold text-text-bright sm:text-3xl">{stats.totalMoves}</div>
                  <div className="mt-1 text-xs sm:text-sm text-text-dim">{t('about.total_moves')}</div>
                </div>
                <div className="rounded-2xl border border-surface-hover bg-surface-alt p-4 text-center">
                  <div className="text-2xl font-bold text-text-bright sm:text-3xl">{stats.whiteWins}</div>
                  <div className="mt-1 text-xs sm:text-sm text-text-dim">{t('about.white_wins')}</div>
                </div>
                <div className="rounded-2xl border border-surface-hover bg-surface-alt p-4 text-center">
                  <div className="text-2xl font-bold text-text-bright sm:text-3xl">{stats.blackWins}</div>
                  <div className="mt-1 text-xs sm:text-sm text-text-dim">{t('about.black_wins')}</div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-text-bright sm:text-2xl">{t('about.opensource_title')}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text sm:text-base">{t('about.opensource_desc')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Node.js', 'Socket.IO', 'Tailwind CSS', 'SQLite', 'Vite'].map(tech => (
                <span key={tech} className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-xs sm:text-sm text-text-dim">{tech}</span>
              ))}
            </div>
          </section>
        </div>
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
