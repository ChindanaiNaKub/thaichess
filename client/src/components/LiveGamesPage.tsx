import { useNavigate } from 'react-router-dom';
import Header from './Header';
import LiveGamesPanel from './LiveGamesPanel';
import { useTranslation } from '../lib/i18n';
import { usePublicLiveGames } from '../hooks/usePublicLiveGames';

export default function LiveGamesPage() {
  const { t } = useTranslation();
  const { games, loading } = usePublicLiveGames({ status: 'all', limit: 24 });
  const liveGames = games.filter((game) => game.status === 'playing');
  const finishedGames = games.filter((game) => game.status === 'finished');

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="watch" />

      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <header className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-text-bright sm:text-4xl">
              {t('live.title')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-text-dim sm:text-base">
              {t('live.desc')}
            </p>
          </header>

          <LiveGamesPanel
            games={liveGames}
            loading={loading}
            title={t('live.live_now')}
            description={t('live.desc')}
            emptyTitle={t('live.empty_title')}
            emptyDesc={t('live.empty_desc')}
            omitSectionChrome
          />

          {(finishedGames.length > 0 || (loading && liveGames.length === 0)) && (
            <LiveGamesPanel
              games={finishedGames}
              loading={loading && liveGames.length === 0}
              title={t('live.recently_finished')}
              description={t('live.recently_finished_desc')}
              emptyTitle={t('live.empty_title')}
              emptyDesc={t('live.empty_desc')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
