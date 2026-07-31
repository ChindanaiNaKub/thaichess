import React, { lazy, Suspense, type RefObject, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { PieceType, PrivateGameColorPreference } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import { routes } from '../lib/routes';
import {
  loadBotGameRoute,
  loadLocalGameRoute,
  loadQuickPlayRoute,
} from '../lib/routePrefetch';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import Footer from './Footer';
import BoardSnapshot from './BoardSnapshot';
import PieceSVG from './PieceSVG';

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
const LEARN_PIECES: PieceType[] = ['K', 'M', 'R'];

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
    <div className="home-brand min-h-screen bg-surface flex flex-col">
      <Header active="play" subtitle={t('app.tagline')} />

      <main id="main-content" className="relative flex-1">
        <section className="relative min-h-[min(92vh,58rem)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-y-0 right-0 flex w-[min(68%,44rem)] items-center justify-center pr-4 sm:pr-8 lg:right-[4%] lg:w-[min(58%,40rem)] lg:justify-end xl:right-[8%]">
              <div className="home-hero-board w-full max-w-[38rem]">
                <BoardSnapshot
                  board={heroBoard}
                  playerColor="white"
                  lastMove={null}
                  className="w-full rotate-[-1.5deg] shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
                />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent lg:via-surface/55 lg:to-surface/10" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[min(92vh,58rem)] w-full max-w-6xl items-center px-4 py-20 sm:px-6">
            <div className="max-w-lg">
              <h1 className="ui-title font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                {t('home.hero_title')}
              </h1>
              <p className="ui-body mt-5 max-w-md text-base sm:text-lg">
                {t('home.hero_desc')}
              </p>
              {showGamesPlayed && (
                <p className="mt-3 text-sm text-text-dim">
                  {t('home.games_played', { count: stats!.totalGames })}
                </p>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => navigate(QUICK_PLAY_AUTOSTART)}
                  onMouseEnter={() => void loadQuickPlayRoute()}
                  onFocus={() => void loadQuickPlayRoute()}
                  className="button-accent-contrast rounded-md px-8 py-3.5 text-base font-bold"
                >
                  {t('home.quick_play')}
                </button>
                <p className="mt-2 text-sm text-text-dim">{t('home.quick_play_desc')}</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <button
                  type="button"
                  onClick={openCreatePanel}
                  className="font-semibold text-text-bright underline-offset-4 hover:text-accent hover:underline"
                >
                  {t('home.play_friend')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(routes.bot)}
                  onMouseEnter={() => void loadBotGameRoute()}
                  onFocus={() => void loadBotGameRoute()}
                  className="font-semibold text-text-bright underline-offset-4 hover:text-accent hover:underline"
                >
                  {t('home.play_bot')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(routes.puzzleStreak)}
                  aria-label={`${t('home.puzzles')} ${t('home.puzzles_desc')}`}
                  className="text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
                >
                  {t('home.puzzles')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(routes.local)}
                  onMouseEnter={() => void loadLocalGameRoute()}
                  onFocus={() => void loadLocalGameRoute()}
                  className="text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
                >
                  {t('home.play_local')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(routes.lessons)}
                  className="text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
                >
                  {t('home.lessons')}
                </button>
              </div>

              {privateExpanded && (
                <div className="mt-6 max-w-md space-y-4 rounded-xl border border-surface-hover/70 bg-surface-alt/90 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-text-bright">
                      {t('home.play_friend')}
                    </h2>
                    <div className="grid grid-cols-2 rounded-lg border border-surface-hover/70 bg-surface p-1">
                      <button
                        type="button"
                        onClick={openCreatePanel}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          privatePanel === 'create'
                            ? 'bg-surface-hover text-text-bright'
                            : 'text-text-dim hover:text-text-bright'
                        }`}
                      >
                        {t('home.create_private')}
                      </button>
                      <button
                        type="button"
                        onClick={openJoinPanel}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          privatePanel === 'join'
                            ? 'bg-surface-hover text-text-bright'
                            : 'text-text-dim hover:text-text-bright'
                        }`}
                      >
                        {t('home.join_title')}
                      </button>
                    </div>
                  </div>

                  {privatePanel === 'create' ? (
                    <>
                      <fieldset className="min-w-0 border-0 p-0">
                        <legend className="mb-2 block text-sm text-text-dim">
                          {t('home.time_control')}
                        </legend>
                        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                          {timePresets.map((preset) => (
                            <button
                              type="button"
                              key={preset.label}
                              onClick={() => setSelectedTime(preset)}
                              className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${
                                selectedTime.label === preset.label
                                  ? 'border-accent/40 bg-accent/12 text-accent'
                                  : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="min-w-0 border-0 p-0">
                        <legend className="mb-2 block text-sm text-text-dim">
                          {t('home.choose_color')}
                        </legend>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['random', 'white', 'black'] as const).map((color) => (
                            <button
                              type="button"
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${
                                selectedColor === color
                                  ? 'border-accent/40 bg-accent/12 text-accent'
                                  : 'border-surface-hover/70 bg-surface text-text-dim hover:text-text-bright'
                              }`}
                            >
                              {t(`home.color_${color}`)}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <button
                        type="button"
                        onClick={handleCreateGame}
                        disabled={isCreating}
                        className="button-primary-contrast w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60"
                      >
                        {isCreating ? t('home.creating') : t('home.play_with_friend')}
                      </button>

                      {createError && (
                        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                          {createError}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                        placeholder={t('home.join_placeholder')}
                        className="flex-1 rounded-lg border border-surface-hover/80 bg-surface px-3 py-2 text-sm text-text-bright"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleJoinGame}
                        className="rounded-lg border border-primary/35 bg-primary/12 px-4 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/18"
                      >
                        {t('home.join')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
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
              <section
                aria-hidden="true"
                className="deferred-section min-h-[4rem]"
              />
            )}
          </div>

          <section className="deferred-section">
            <p className="ui-eyebrow">{t('home.learn_eyebrow')}</p>
            <h2 className="ui-title font-display mt-2 text-2xl">{t('home.learn_title')}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text-dim">
              {t('home.learn_desc')}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {learnCards.map((card, i) => (
                <a
                  key={card.href}
                  href={card.href}
                  className="group overflow-hidden rounded-xl border border-surface-hover/70 bg-surface-alt/80 transition-colors hover:border-accent/35 hover:bg-surface-hover/40"
                >
                  <div className="flex items-center gap-3 border-b border-surface-hover/60 px-4 py-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface">
                      <PieceSVG
                        type={LEARN_PIECES[i] ?? 'K'}
                        color="white"
                        size={40}
                      />
                    </div>
                    <span className="font-display text-xs font-semibold uppercase tracking-wider text-accent">
                      0{i + 1}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <div className="text-base font-semibold text-text-bright">
                      {card.title}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-text-dim">
                      {card.desc}
                    </div>
                  </div>
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
