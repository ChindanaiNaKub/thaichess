import React, { lazy, Suspense, type RefObject, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { PrivateGameColorPreference } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import { routes } from '../lib/routes';
import {
  loadQuickPlayRoute,
} from '../lib/routePrefetch';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import Footer from './Footer';
import BoardSnapshot from './BoardSnapshot';
import { HomePlayAside } from './HomePlayAside';

const DeferredLiveGamesPanel = lazy(() => import('./LiveGamesPanel'));

type TimePreset = {
  label: string;
  nameKey: string;
  initial: number;
  increment: number;
};

export interface HomePageViewProps {
  navigate: NavigateFunction;
  stats: { totalGames: number } | undefined;
  liveGames: React.ComponentProps<typeof DeferredLiveGamesPanel>['games'];
  liveGamesLoading: boolean;
  showDeferredContent: boolean;
  deferredContentRef: RefObject<HTMLDivElement | null>;
  selectedTime: TimePreset;
  setSelectedTime: (preset: TimePreset) => void;
  selectedColor: PrivateGameColorPreference;
  setSelectedColor: (color: PrivateGameColorPreference) => void;
  isCreating: boolean;
  createError: string | null;
  privatePanel: 'create' | 'join';
  privateExpanded: boolean;
  joinId: string;
  setJoinId: (value: string) => void;
  timePresets: TimePreset[];
  learnCards: Array<{ href: string; title: string; desc: string }>;
  openCreatePanel: () => void;
  openJoinPanel: () => void;
  handleCreateGame: () => void;
  handleJoinGame: () => void;
}

const QUICK_PLAY_AUTOSTART = `${routes.quickPlay}?autostart=1`;

export function HomePageView({
  navigate,
  stats,
  liveGames,
  liveGamesLoading,
  showDeferredContent,
  deferredContentRef,
  selectedTime,
  setSelectedTime,
  selectedColor,
  setSelectedColor,
  isCreating,
  createError,
  privatePanel,
  privateExpanded,
  joinId,
  setJoinId,
  timePresets,
  learnCards,
  openCreatePanel,
  openJoinPanel,
  handleCreateGame,
  handleJoinGame,
}: HomePageViewProps) {
  const { t } = useTranslation();
  const heroBoard = useMemo(() => createInitialBoard(), []);
  const showGamesPlayed = Boolean(stats && stats.totalGames > 0);
  const showLiveGames = liveGamesLoading || liveGames.length > 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="play" subtitle={t('app.tagline')} />

      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_300px]">
            <div className="ui-card rounded-2xl p-6 sm:p-8 lg:p-10">
              <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                    {t('nav.play')}
                  </p>

                  <h1 className="ui-title mt-3 max-w-3xl text-3xl sm:text-4xl lg:text-5xl">
                    {t('home.hero_title')}
                  </h1>
                  <p className="ui-body mt-4 max-w-2xl text-base sm:text-lg">
                    {t('home.hero_desc')}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-full border border-surface-hover/70 bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                      {t('home.no_signup')}
                    </span>
                    {showGamesPlayed && (
                      <span className="rounded-full border border-surface-hover/70 bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                        {t('home.games_played', { count: stats!.totalGames })}
                      </span>
                    )}
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => navigate(QUICK_PLAY_AUTOSTART)}
                      onMouseEnter={() => void loadQuickPlayRoute()}
                      onFocus={() => void loadQuickPlayRoute()}
                      className="button-accent-contrast w-full sm:w-auto min-w-[14rem] rounded-lg px-6 py-3.5 text-base font-bold"
                    >
                      {t('home.quick_play')}
                    </button>
                    <button
                      type="button"
                      onClick={openCreatePanel}
                      className="ui-btn-secondary w-full sm:w-auto px-6 py-3.5 text-base"
                    >
                      {t('home.choose_mode')}
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-text-dim">{t('home.quick_play_desc')}</p>
                </div>

                <div className="home-hero-board mx-auto w-full max-w-[240px] sm:max-w-[260px]">
                  <BoardSnapshot
                    board={heroBoard}
                    playerColor="white"
                    lastMove={null}
                    className="w-full shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                  />
                </div>
              </div>
            </div>

            <HomePlayAside
              navigate={navigate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              isCreating={isCreating}
              createError={createError}
              privatePanel={privatePanel}
              privateExpanded={privateExpanded}
              joinId={joinId}
              setJoinId={setJoinId}
              timePresets={timePresets}
              openCreatePanel={openCreatePanel}
              openJoinPanel={openJoinPanel}
              handleCreateGame={handleCreateGame}
              handleJoinGame={handleJoinGame}
            />
          </section>

          <div ref={deferredContentRef}>
            {showDeferredContent ? (
              showLiveGames ? (
                <Suspense fallback={<section className="deferred-section ui-card rounded-2xl p-5 sm:p-6 min-h-[12rem]"><div className="h-10 w-40 rounded-lg bg-surface" /></section>}>
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
              ) : (
                <section className="deferred-section ui-card rounded-2xl p-5 sm:p-6">
                  <p className="ui-eyebrow">{t('home.challenge_eyebrow')}</p>
                  <h2 className="ui-title mt-2 text-2xl">{t('home.challenge_title')}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-text-dim">
                    {t('home.challenge_desc')}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(routes.puzzleStreak)}
                    className="button-accent-contrast mt-5 rounded-lg px-5 py-3 text-sm font-bold"
                  >
                    {t('home.challenge_cta')}
                  </button>
                </section>
              )
            ) : (
              <section aria-hidden="true" className="deferred-section ui-card rounded-2xl p-5 sm:p-6 min-h-[12rem]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded-full bg-surface" />
                    <div className="h-4 w-56 rounded-full bg-surface" />
                  </div>
                  <div className="h-10 w-36 rounded-lg bg-surface" />
                </div>
              </section>
            )}
          </div>

          <section className="deferred-section ui-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="ui-eyebrow">
                  {t('home.learn_eyebrow')}
                </p>
                <h2 className="ui-title mt-2 text-2xl">
                  {t('home.learn_title')}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-text-dim">
                {t('home.learn_desc')}
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {learnCards.map((card) => (
                <a
                  key={card.href}
                  href={card.href}
                  className="ui-card-soft rounded-2xl px-4 py-4 transition-colors hover:bg-surface-hover"
                >
                  <div className="text-lg font-semibold text-text-bright">{card.title}</div>
                  <div className="mt-2 text-sm leading-6 text-text-dim">{card.desc}</div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
