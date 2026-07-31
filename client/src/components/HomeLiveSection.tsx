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
  const showEmptyChallenge =
    showDeferredContent && !liveGamesLoading && liveGames.length === 0;

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
        ) : showEmptyChallenge ? (
          <section className="rounded-xl border border-surface-hover/60 bg-surface-alt/60 p-5 sm:p-6">
            <h2 className="ui-title text-lg text-text-bright sm:text-xl">
              {t('home.challenge_title')}
            </h2>
            <p className="ui-body mt-2 max-w-xl text-sm sm:text-base">
              {t('home.challenge_desc')}
            </p>
            <button
              type="button"
              onClick={() => navigate(routes.puzzleStreak)}
              className="button-accent-contrast mt-4 rounded-md px-5 py-2.5 text-sm font-bold"
            >
              {t('home.challenge_cta')}
            </button>
          </section>
        ) : null
      ) : (
        <section aria-hidden="true" className="deferred-section min-h-[4rem]" />
      )}
    </div>
  );
}
