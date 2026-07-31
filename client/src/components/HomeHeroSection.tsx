import type { NavigateFunction } from 'react-router-dom';
import type { PrivateGameColorPreference } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import { useMemo } from 'react';
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
  timePresets: TimePreset[];
  openCreatePanel: () => void;
  openJoinPanel: () => void;
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
  timePresets,
  openCreatePanel,
  openJoinPanel,
  handleCreateGame,
  handleJoinGame,
}: HomeHeroSectionProps) {
  const { t } = useTranslation();
  const heroBoard = useMemo(() => createInitialBoard(), []);
  const showGamesPlayed = Boolean(stats && stats.totalGames > 0);

  return (
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
              timePresets={timePresets}
              openCreatePanel={openCreatePanel}
              openJoinPanel={openJoinPanel}
              handleCreateGame={handleCreateGame}
              handleJoinGame={handleJoinGame}
            />
          )}
        </div>
      </div>
    </section>
  );
}
