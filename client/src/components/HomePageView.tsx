import type { RefObject } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { PrivateGameColorPreference } from '@shared/types';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import Footer from './Footer';
import { HomeHeroSection } from './HomeHeroSection';
import { HomeLiveSection } from './HomeLiveSection';
import { HomeLearnSection } from './HomeLearnSection';
import type { HomeLiveSectionProps } from './HomeLiveSection';

type TimePreset = {
  label: string;
  nameKey: string;
  initial: number;
  increment: number;
};

export interface HomePageViewProps {
  navigate: NavigateFunction;
  stats: { totalGames: number } | undefined;
  liveGames: HomeLiveSectionProps['liveGames'];
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

  return (
    <div className="home-brand min-h-screen bg-surface flex flex-col">
      <Header active="play" subtitle={t('app.tagline')} />

      <main id="main-content" className="relative flex-1">
        <HomeHeroSection
          navigate={navigate}
          stats={stats}
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

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
          <HomeLiveSection
            navigate={navigate}
            liveGames={liveGames}
            liveGamesLoading={liveGamesLoading}
            showDeferredContent={showDeferredContent}
            deferredContentRef={deferredContentRef}
          />
          <HomeLearnSection learnCards={learnCards} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
