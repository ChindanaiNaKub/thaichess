import { lazy, Suspense, type ComponentProps, type RefObject } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { routes } from '../lib/routes';
import { useTranslation } from '../lib/i18n';

const DeferredLiveGamesPanel = lazy(() => import('./LiveGamesPanel'));

export interface HomeLiveSectionProps {
  navigate: NavigateFunction;
  liveGames: ComponentProps<typeof DeferredLiveGamesPanel>['games'];
  liveGamesLoading: boolean;
  showDeferredContent: boolean;
  deferredContentRef: RefObject<HTMLDivElement | null>;
}

export function HomeLiveSection({
  navigate,
  liveGames,
  liveGamesLoading,
  showDeferredContent,
  deferredContentRef,
}: HomeLiveSectionProps) {
  const { t } = useTranslation();
  const showLiveGames = liveGamesLoading || liveGames.length > 0;

  return (
    <div ref={deferredContentRef}>
      {showDeferredContent ? (
        showLiveGames ? (
          <Suspense
            fallback={
              <section className="deferred-section min-h-[8rem] rounded-xl border border-surface-hover/60 bg-surface-alt/60 p-5">
                <div className="h-10 w-40 rounded-lg bg-surface" />
              </section>
            }
          >
            <DeferredLiveGamesPanel
              games={liveGames}
              loading={liveGamesLoading}
              title={t('home.live_now_title')}
              description={t('home.live_now_desc')}
              emptyTitle={t('home.no_live_games')}
              emptyDesc={t('home.no_live_games_desc')}
              compact
              showViewAll
              viewAllLabel={t('home.view_all_live')}
              onViewAll={() => navigate(routes.watch)}
            />
          </Suspense>
        ) : null
      ) : (
        <section aria-hidden="true" className="deferred-section min-h-[4rem]" />
      )}
    </div>
  );
}
