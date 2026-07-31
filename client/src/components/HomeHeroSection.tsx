import type { NavigateFunction } from 'react-router-dom';
import type { PrivateGameColorPreference } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import { useMemo, useState } from 'react';
import { routes } from '../lib/routes';
import {
  loadBotGameRoute,
  loadLocalGameRoute,
  loadQuickPlayRoute,
} from '../lib/routePrefetch';
import { useTranslation } from '../lib/i18n';
import BoardSnapshot from './BoardSnapshot';
import { HomeFriendPanel } from './HomeFriendPanel';

type TimePreset = {
  label: string;
  nameKey: string;
  initial: number;
  increment: number;
};

const QUICK_PLAY_AUTOSTART = `${routes.quickPlay}?autostart=1`;

export interface HomeHeroSectionProps {
  navigate: NavigateFunction;
  stats: { totalGames: number } | undefined;
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
  joinError: string | null;
  timePresets: TimePreset[];
  openCreatePanel: () => void;
  openJoinPanel: () => void;
  closePrivatePanel: () => void;
  handleCreateGame: () => void;
  handleJoinGame: () => void;
}

export function HomeHeroSection({
  navigate,
  stats,
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
  joinError,
  timePresets,
  openCreatePanel,
  openJoinPanel,
  closePrivatePanel,
  handleCreateGame,
  handleJoinGame,
}: HomeHeroSectionProps) {
  const { t } = useTranslation();
  const heroBoard = useMemo(() => createInitialBoard(), []);
  const showGamesPlayed = Boolean(stats && stats.totalGames > 0);
  const [moreWaysOpen, setMoreWaysOpen] = useState(false);

  const boardClassName =
    'w-full rotate-[-1.5deg] shadow-[0_20px_36px_oklch(0.10_0.02_65_/_0.28),0_28px_90px_rgba(0,0,0,0.45)] brightness-[1.02] contrast-[1.02] sm:brightness-[1.06] sm:contrast-[1.04]';

  return (
    <section className="relative min-h-[min(92vh,58rem)] overflow-hidden">
      {/* Desktop / tablet: board as right-side light source under a left-to-right veil */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden>
        <div className="absolute inset-y-0 right-0 flex w-[min(72%,46rem)] items-center justify-end pr-6 lg:right-[2%] lg:w-[min(62%,42rem)] xl:right-[6%]">
          <div className="home-hero-board w-full max-w-[40rem]">
            <BoardSnapshot
              board={heroBoard}
              playerColor="white"
              lastMove={null}
              className={boardClassName}
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-surface from-0% via-surface/70 via-30% to-transparent to-65% lg:from-surface/95 lg:via-surface/40 lg:via-28% lg:to-transparent lg:to-55%" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[min(92vh,58rem)] w-full max-w-6xl flex-col items-stretch px-4 pb-16 pt-16 sm:items-center sm:px-6 sm:py-20 sm:pb-20">
        <div className="w-full max-w-lg sm:self-start">
          <h1 className="ui-title font-display text-4xl font-bold leading-[1.1] tracking-tight text-text-bright sm:text-5xl lg:text-[3.25rem]">
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
              aria-label={`${t('home.quick_play')} ${t('home.quick_play_time')}`}
              className="button-accent-contrast inline-flex min-h-12 items-baseline gap-2 rounded-md px-8 py-3.5 text-base font-bold"
            >
              <span>{t('home.quick_play')}</span>
              <span className="text-sm font-semibold opacity-80">{t('home.quick_play_time')}</span>
            </button>
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
              onClick={() => setMoreWaysOpen((open) => !open)}
              aria-expanded={moreWaysOpen}
              aria-controls="home-more-ways"
              className="font-semibold text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
            >
              {t('home.more_ways')}
            </button>
          </div>

          {moreWaysOpen && (
            <div
              id="home-more-ways"
              className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
            >
              <button
                type="button"
                onClick={() => navigate(routes.bot)}
                onMouseEnter={() => void loadBotGameRoute()}
                onFocus={() => void loadBotGameRoute()}
                className="text-text-dim underline-offset-4 hover:text-text-bright hover:underline"
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
          )}

          {privateExpanded && (
            <HomeFriendPanel
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              isCreating={isCreating}
              createError={createError}
              privatePanel={privatePanel}
              joinId={joinId}
              setJoinId={setJoinId}
              joinError={joinError}
              timePresets={timePresets}
              openCreatePanel={openCreatePanel}
              openJoinPanel={openJoinPanel}
              closePrivatePanel={closePrivatePanel}
              handleCreateGame={handleCreateGame}
              handleJoinGame={handleJoinGame}
            />
          )}
        </div>

        {/* Mobile: board below the play path — never under type (veil hacks removed) */}
        <div
          className="home-hero-board mx-auto mt-12 w-full max-w-[22rem] opacity-90 sm:hidden"
          aria-hidden
        >
          <BoardSnapshot
            board={heroBoard}
            playerColor="white"
            lastMove={null}
            className={boardClassName}
          />
        </div>
      </div>
    </section>
  );
}
