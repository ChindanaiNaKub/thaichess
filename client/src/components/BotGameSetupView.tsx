import { useState } from 'react';
import {
  BOT_STRENGTH_BANDS,
  getBotPersonasInBand,
  getStrengthBandForBotId,
  getVisibleBotPersonas,
  type BotPersona,
  type BotStrengthBand,
} from '@shared/botPersonas';
import BotAvatar from './BotAvatar';
import BotCard from './BotCard';
import Header from './Header';
import MobileBotCarousel from './MobileBotCarousel';
import MobileBottomSheet from './MobileBottomSheet';
import PieceSVG from './PieceSVG';
import {
  getBotTranslation,
  type BotTranslationFields,
  type SideChoice,
  type TranslateFn,
} from './botGameHelpers';

export type BotGameSetupViewProps = {
  t: TranslateFn;
  selectedBot: BotPersona;
  selectedBotTranslation: BotTranslationFields;
  sideChoice: SideChoice;
  showDetails: boolean;
  levelLabel: string;
  difficultyLabel: string;
  estimatedEloLabel: string;
  setupIntroPreview: string;
  onSelectBot: (botId: string) => void;
  onSideChange: (side: SideChoice) => void;
  onToggleDetails: () => void;
  onStartGame: () => void;
  onBackHome: () => void;
};

function sideButtonClass(active: boolean) {
  return active ? 'ui-choice ui-choice-selected' : 'ui-choice bg-surface-alt/85';
}

function StrengthBandPicker({
  t,
  activeBand,
  onSelect,
}: {
  t: TranslateFn;
  activeBand: BotStrengthBand;
  onSelect: (band: BotStrengthBand) => void;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-medium text-text-dim">{t('bot.strength_bands')}</span>
      <select
        data-testid="bot-strength-band-select"
        value={activeBand}
        onChange={(event) => onSelect(event.target.value as BotStrengthBand)}
        className="w-full rounded-lg border border-surface-hover bg-surface-alt/85 px-3 py-2.5 text-sm font-semibold text-text-bright outline-none transition-colors focus:border-accent"
      >
        {BOT_STRENGTH_BANDS.map((band) => (
          <option key={band.id} value={band.id}>
            {t(band.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DesktopRosterPanel({
  t,
  showAllBots,
  visiblePersonas,
  selectedBotId,
  strengthBand,
  onSelectStrengthBand,
  onShowAllBots,
  onHideRoster,
  onSelectBot,
}: {
  t: TranslateFn;
  showAllBots: boolean;
  visiblePersonas: readonly BotPersona[];
  selectedBotId: string;
  strengthBand: BotStrengthBand;
  onSelectStrengthBand: (band: BotStrengthBand) => void;
  onShowAllBots: () => void;
  onHideRoster: () => void;
  onSelectBot: (botId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-text-dim">{t('bot.roster')}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShowAllBots}
            className="rounded-lg border border-surface-hover bg-surface-alt/85 px-3 py-1.5 text-xs font-semibold text-text-bright transition-colors hover:bg-surface-hover"
          >
            {showAllBots ? t('bot.show_featured') : t('bot.show_all_bots')}
          </button>
          <button
            type="button"
            onClick={onHideRoster}
            className="rounded-lg border border-surface-hover bg-surface-alt/85 px-3 py-1.5 text-xs font-semibold text-text-dim transition-colors hover:bg-surface-hover hover:text-text-bright"
          >
            {t('bot.hide_roster')}
          </button>
        </div>
      </div>
      {showAllBots && (
        <StrengthBandPicker
          t={t}
          activeBand={strengthBand}
          onSelect={onSelectStrengthBand}
        />
      )}
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="sr-only">{t('bot.roster')}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {visiblePersonas.map((persona, index) => (
            <BotCard
              key={persona.id}
              persona={persona}
              isSelected={selectedBotId === persona.id}
              onSelect={() => onSelectBot(persona.id)}
              t={t}
              getBotTranslation={(botId, field) => getBotTranslation(t, botId, field)}
              index={index}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function BotDetailsDisclosure({
  t,
  showDetails,
  onToggleDetails,
  selectedBot,
  selectedBotTranslation,
  difficultyLabel,
  estimatedEloLabel,
  setupIntroPreview,
}: {
  t: TranslateFn;
  showDetails: boolean;
  onToggleDetails: () => void;
  selectedBot: BotPersona;
  selectedBotTranslation: BotTranslationFields;
  difficultyLabel: string;
  estimatedEloLabel: string;
  setupIntroPreview: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 overflow-hidden">
      <button
        type="button"
        onClick={onToggleDetails}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text transition-colors duration-200 hover:bg-surface-hover group"
      >
        <span className="flex items-center gap-2">
          <span className={`transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`} aria-hidden="true">▶</span>
          {t('bot.learn_more')} {selectedBot.name}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          showDetails ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {showDetails ? (
        <div className="border-t border-surface-hover/50 px-4 pb-4">
          <p className="mt-3 text-sm font-medium italic text-text" key={selectedBot.id}>
            "{selectedBotTranslation.hook || selectedBot.personalityHook}"
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-dim">
            <span className="rounded-full border border-surface-hover bg-surface px-2 py-0.5 font-semibold">{difficultyLabel}</span>
            <span>{estimatedEloLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-text-dim">{t('bot.estimated_elo_note')}</p>
          <p className="mt-3 text-sm leading-6 text-text">{selectedBotTranslation.backstory || selectedBot.shortBackstory}</p>
          <div className="mt-4 grid gap-3 text-sm text-text-dim">
            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.opening_preference')}</div>
              <div className="mt-1 text-text">{selectedBotTranslation.opening || selectedBot.openingPreference}</div>
            </div>
            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.signature_style')}</div>
              <div className="mt-1 text-text">{selectedBotTranslation.signature || selectedBot.signatureStyle}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.tactical_bias')}</div>
                <div className="mt-1 text-text">{selectedBotTranslation.tactical || selectedBot.tacticalBias}</div>
              </div>
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.strategic_weakness')}</div>
                <div className="mt-1 text-text">{selectedBotTranslation.weakness || selectedBot.strategicWeakness}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {selectedBot.personalityTraits.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-xs text-text-dim"
              >
                {t(`bot.trait.${trait}`) || trait}
              </span>
            ))}
          </div>
          <div className="mt-4 border-t border-surface-hover/60 pt-4">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.dialogue_preview')}</div>
            <p className="mt-2 text-sm italic text-text">"{setupIntroPreview}"</p>
            <div className="mt-3 text-xs leading-6 text-text-dim">{selectedBotTranslation.chatStyle || selectedBot.chatStyle}</div>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}

function MobileOpponentStage({
  t,
  selectedBot,
  selectedBotTranslation,
  levelLabel,
  difficultyLabel,
  onChangeOpponent,
}: {
  t: TranslateFn;
  selectedBot: BotPersona;
  selectedBotTranslation: BotTranslationFields;
  levelLabel: string;
  difficultyLabel: string;
  onChangeOpponent: () => void;
}) {
  return (
    <div
      data-testid="bot-mobile-opponent-stage"
      className="flex min-h-[42vh] flex-col items-center justify-center px-6 pb-4 pt-8 text-center"
    >
      <BotAvatar
        avatar={selectedBot.avatar}
        size={96}
        className="ring-2 ring-accent/25"
      />
      <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-text-bright">
        {selectedBot.name}
      </h2>
      <p className="mt-1 max-w-xs text-sm text-text-dim">{selectedBot.title}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-dim">
          {levelLabel}
        </span>
        <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-dim">
          {difficultyLabel}
        </span>
      </div>
      <p className="mt-4 max-w-sm text-sm italic leading-6 text-text">
        “{selectedBotTranslation.hook || selectedBot.personalityHook}”
      </p>
      <button
        type="button"
        onClick={onChangeOpponent}
        className="mt-5 rounded-lg border border-surface-hover bg-surface-alt/85 px-4 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
      >
        {t('bot.change_opponent')}
      </button>
    </div>
  );
}

export function BotGameSetupView({
  t,
  selectedBot,
  selectedBotTranslation,
  sideChoice,
  showDetails,
  levelLabel,
  difficultyLabel,
  estimatedEloLabel,
  setupIntroPreview,
  onSelectBot,
  onSideChange,
  onToggleDetails,
  onStartGame,
  onBackHome,
}: BotGameSetupViewProps) {
  const [rosterMode, setRosterMode] = useState<'closed' | 'featured' | 'all'>('closed');
  const [strengthBand, setStrengthBand] = useState<BotStrengthBand>(() => getStrengthBandForBotId(selectedBot.id));
  const showRoster = rosterMode !== 'closed';
  const showAllBots = rosterMode === 'all';

  const openAllBots = () => {
    setRosterMode('all');
    setStrengthBand(getStrengthBandForBotId(selectedBot.id));
  };

  const visiblePersonas = showAllBots
    ? getBotPersonasInBand(strengthBand)
    : getVisibleBotPersonas(selectedBot.id, false);

  const handleSelectBot = (botId: string) => {
    onSelectBot(botId);
    setRosterMode('closed');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header subtitle={t('bot.title')} />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl animate-slideUp">
          <div className="overflow-hidden rounded-2xl border border-surface-hover/80 bg-surface-alt/90">
            <div className="hidden border-b border-surface-hover/70 px-5 py-5 lg:block sm:px-7">
              <h2 className="text-3xl font-bold tracking-tight text-text-bright">{t('bot.setup_title')}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-dim">
                {t('bot.setup_desc')}
              </p>
            </div>

            {/* Desktop: Start path first; roster only when choosing an opponent */}
            <div className={`hidden lg:grid gap-6 px-5 py-5 sm:px-7 sm:py-6 ${
              showRoster
                ? 'lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]'
                : 'lg:grid-cols-1 lg:max-w-md lg:mx-auto'
            }`}>
              {showRoster && (
                <DesktopRosterPanel
                  t={t}
                  showAllBots={showAllBots}
                  visiblePersonas={visiblePersonas}
                  selectedBotId={selectedBot.id}
                  strengthBand={strengthBand}
                  onSelectStrengthBand={setStrengthBand}
                  onShowAllBots={openAllBots}
                  onHideRoster={() => setRosterMode('closed')}
                  onSelectBot={handleSelectBot}
                />
              )}

              {/* Detail Panel - Start path: opponent + side + Start */}
              <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-surface-hover/80 bg-surface/60 p-5">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <BotAvatar
                        avatar={selectedBot.avatar}
                        size={72}
                        className="ring-2 ring-accent/20"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-text-bright">{selectedBot.name}</h3>
                      <p className="text-xs text-text-dim truncate">{selectedBot.title}</p>
                      <div className="mt-2">
                        <span className="rounded-full border border-surface-hover bg-surface px-2 py-0.5 text-[0.7rem] font-semibold text-text-dim">{levelLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <fieldset className="min-w-0 border-0 p-0">
                      <legend className="mb-2 block text-xs font-medium text-text-dim">{t('bot.play_as')}</legend>
                      <div className="grid grid-cols-3 gap-2">
                      <button type="button"
                        onClick={() => onSideChange('white')}
                        className={`rounded-xl border px-2 py-3 font-medium transition-colors flex flex-col items-center gap-1 ${sideButtonClass(sideChoice === 'white')}`}
                      >
                        <PieceSVG type="K" color="white" size={28} />
                        <span className="text-xs">{t('common.white')}</span>
                      </button>
                      <button type="button"
                        onClick={() => onSideChange('random')}
                        className={`rounded-xl border px-2 py-3 font-medium transition-colors flex flex-col items-center gap-1 ${sideButtonClass(sideChoice === 'random')}`}
                      >
                        <span className="text-xl" aria-hidden="true">?</span>
                        <span className="text-xs">{t('bot.random')}</span>
                      </button>
                      <button type="button"
                        onClick={() => onSideChange('black')}
                        className={`rounded-xl border px-2 py-3 font-medium transition-colors flex flex-col items-center gap-1 ${sideButtonClass(sideChoice === 'black')}`}
                      >
                        <PieceSVG type="K" color="black" size={28} />
                        <span className="text-xs">{t('common.black')}</span>
                      </button>
                      </div>
                    </fieldset>
                  </div>

                  <button type="button"
                    onClick={onStartGame}
                    data-testid="start-game-button"
                    className="button-accent-contrast mt-4 w-full rounded-xl px-6 py-3.5 text-base font-bold flex items-center justify-center gap-2"
                  >
                    <span aria-hidden="true">▶</span>
                    <span>{t('bot.start')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRosterMode(showRoster ? 'closed' : 'featured')}
                    className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold text-text-dim transition-colors hover:bg-surface-hover/60 hover:text-text-bright"
                  >
                    {showRoster ? t('bot.hide_roster') : t('bot.change_opponent')}
                  </button>
                </div>

                <BotDetailsDisclosure
                  t={t}
                  showDetails={showDetails}
                  onToggleDetails={onToggleDetails}
                  selectedBot={selectedBot}
                  selectedBotTranslation={selectedBotTranslation}
                  difficultyLabel={difficultyLabel}
                  estimatedEloLabel={estimatedEloLabel}
                  setupIntroPreview={setupIntroPreview}
                />

                <button type="button"
                  onClick={onBackHome}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-text-dim transition-colors hover:bg-surface-hover/50 hover:text-text-bright"
                >
                  {t('common.back_home')}
                </button>
              </div>
            </div>

            {/* Mobile: bottom sheet owns Start; upper half stages the opponent when roster is closed */}
            <div className={`lg:hidden ${showRoster ? 'pb-[22rem]' : 'pb-[16rem]'}`}>
              {showRoster ? (
                <>
                  <div className="flex items-center justify-between gap-3 px-4 pt-4">
                    <p className="text-sm font-medium text-text-dim">{t('bot.roster')}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={openAllBots}
                        className="rounded-lg border border-surface-hover bg-surface-alt/85 px-3 py-1.5 text-xs font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                      >
                        {showAllBots ? t('bot.show_featured') : t('bot.show_all_bots')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRosterMode('closed')}
                        className="rounded-lg border border-surface-hover bg-surface-alt/85 px-3 py-1.5 text-xs font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                      >
                        {t('bot.hide_roster')}
                      </button>
                    </div>
                  </div>

                  {showAllBots ? (
                    <div className="px-4 pt-3">
                      <StrengthBandPicker
                        t={t}
                        activeBand={strengthBand}
                        onSelect={setStrengthBand}
                      />
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <MobileBotCarousel
                      personas={visiblePersonas}
                      selectedId={selectedBot.id}
                      onSelect={handleSelectBot}
                      t={t}
                      getBotTranslation={(botId, field) => getBotTranslation(t, botId, field)}
                      layout={showAllBots ? 'list' : 'carousel'}
                    />
                  </div>
                </>
              ) : (
                <MobileOpponentStage
                  t={t}
                  selectedBot={selectedBot}
                  selectedBotTranslation={selectedBotTranslation}
                  levelLabel={levelLabel}
                  difficultyLabel={difficultyLabel}
                  onChangeOpponent={() => setRosterMode('featured')}
                />
              )}
            </div>
        </div>
        </div>
      </main>

      <div className="lg:hidden">
        <MobileBottomSheet
          bot={selectedBot}
          sideChoice={sideChoice}
          onSideChange={onSideChange}
          onPlay={onStartGame}
          onBack={onBackHome}
          t={t}
          botTranslation={selectedBotTranslation}
          levelLabel={levelLabel}
          difficultyLabel={difficultyLabel}
          estimatedEloLabel={estimatedEloLabel}
          setupIntroPreview={setupIntroPreview}
        />
      </div>
    </div>
  );
}
