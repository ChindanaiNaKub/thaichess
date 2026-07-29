import { BOT_PERSONAS, type BotPersona } from '@shared/botPersonas';
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
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header subtitle={t('bot.title')} />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl animate-slideUp">
          <div className="overflow-hidden rounded-[1.75rem] border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(96,160,24,0.08),transparent_38%),linear-gradient(180deg,rgba(33,25,20,0.96),rgba(24,18,15,0.98))] shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
            <div className="border-b border-surface-hover/70 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/85">
                    {t('home.play_bot')}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-bright">{t('bot.setup_title')}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-text-dim">
                    {t('bot.setup_desc')}
                  </p>
                </div>
                <div className="grid min-w-[18rem] grid-cols-2 gap-2 self-start rounded-2xl border border-surface-hover/80 bg-surface/55 p-2">
                  <div className="rounded-xl bg-surface-alt px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.selected_bot')}</div>
                    <div className="mt-1 text-sm font-semibold text-text-bright">{selectedBot.name}</div>
                    <div className="text-xs text-text-dim">{selectedBot.title}</div>
                  </div>
                  <div className="rounded-xl bg-surface-alt px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.level_label')}</div>
                    <div className="mt-1 text-sm font-semibold text-text-bright">{levelLabel}</div>
                    <div className="text-xs text-text-dim">{estimatedEloLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout: Grid with sticky sidebar */}
            <div className="hidden lg:grid gap-6 px-5 py-5 sm:px-7 sm:py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
              {/* Bot Roster - Left Column */}
              <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 p-4 sm:p-5">
                <fieldset className="min-w-0 border-0 p-0">
                  <legend className="mb-3 block text-sm font-medium text-text-dim">{t('bot.roster')}</legend>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {BOT_PERSONAS.map((persona, index) => (
                      <BotCard
                        key={persona.id}
                        persona={persona}
                        isSelected={selectedBot.id === persona.id}
                        onSelect={() => onSelectBot(persona.id)}
                        t={t}
                        getBotTranslation={(botId, field) => getBotTranslation(t, botId, field)}
                        index={index}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Detail Panel - Right Column (Sticky) */}
              <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                {/* Main Action Card - Always Visible */}
                <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-surface/60 to-primary/5 p-5 shadow-lg">
                  {/* Bot Header */}
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 transition-transform duration-500 animate-wake-up">
                      <BotAvatar
                        avatar={selectedBot.avatar}
                        size={72}
                        className="ring-2 ring-primary/20 animate-breathe"
                      />
                    </div>
                    <div className="min-w-0 flex-1 transition-opacity duration-300">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{t('bot.featured_opponent')}</div>
                      <h3 className="mt-1 text-xl font-bold text-text-bright transition-opacity duration-300 animate-content-fade">{selectedBot.name}</h3>
                      <p className="text-xs text-text-dim truncate transition-opacity duration-300">{selectedBot.title}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">{levelLabel}</span>
                        <span className="text-[10px] text-text-dim">{difficultyLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="mt-4 text-sm font-medium text-text italic animate-content-fade" key={selectedBot.id}>
                    "{selectedBotTranslation.hook || selectedBot.personalityHook}"
                  </p>

                  {/* Side Selection */}
                  <div className="mt-4">
                    <fieldset className="min-w-0 border-0 p-0">
                      <legend className="mb-2 block text-xs font-medium text-text-dim">{t('bot.play_as')}</legend>
                      <div className="grid grid-cols-3 gap-2">
                      <button type="button"
                        onClick={() => onSideChange('white')}
                        className={`rounded-xl border px-2 py-3 font-medium transition-colors flex flex-col items-center gap-1 ${
                          sideChoice === 'white'
                            ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                            : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                        }`}
                      >
                        <PieceSVG type="K" color="white" size={28} />
                        <span className="text-xs">{t('common.white')}</span>
                      </button>
                      <button type="button"
                        onClick={() => onSideChange('random')}
                        className={`rounded-xl border px-2 py-3 font-medium transition-colors flex flex-col items-center gap-1 ${
                          sideChoice === 'random'
                            ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                            : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                        }`}
                      >
                        <span className="text-xl">🎲</span>
                        <span className="text-xs">{t('bot.random')}</span>
                      </button>
                      <button type="button"
                        onClick={() => onSideChange('black')}
                        className={`rounded-xl border px-2 py-3 font-medium transition-colors flex flex-col items-center gap-1 ${
                          sideChoice === 'black'
                            ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                            : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                        }`}
                      >
                        <PieceSVG type="K" color="black" size={28} />
                        <span className="text-xs">{t('common.black')}</span>
                      </button>
                      </div>
                    </fieldset>
                  </div>

                  {/* PLAY NOW Button - Primary Action */}
                  <button type="button"
                    onClick={onStartGame}
                    data-testid="start-game-button"
                    className="mt-4 w-full rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-[0_8px_24px_rgba(92,160,26,0.35)] transition-[color,background-color,box-shadow,transform] hover:bg-primary-light hover:shadow-[0_12px_32px_rgba(92,160,26,0.45)] hover:scale-[1.02] active:scale-[0.98] active:translate-y-[1px] flex items-center justify-center gap-2 animate-play-pulse group"
                  >
                    <span className="transition-transform group-hover:translate-x-0.5">▶</span>
                    <span>{t('bot.start')}</span>
                  </button>

                  {/* ELO Note */}
                  <p className="mt-3 text-center text-[11px] leading-4 text-text-dim">
                    {t('bot.estimated_elo_note')}
                  </p>
                </div>

                {/* Expandable Bot Details */}
                <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 overflow-hidden">
                  <button type="button"
                    onClick={onToggleDetails}
                    className="w-full px-4 py-3 text-sm font-medium text-text hover:bg-surface-hover transition-colors duration-200 flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`}>▶</span>
                      {t('bot.learn_more')} {selectedBot.name}
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                      showDetails ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-4 pb-4 border-t border-surface-hover/50">
                      <p className="mt-3 text-sm leading-6 text-text animate-content-fade">{selectedBotTranslation.backstory || selectedBot.shortBackstory}</p>
                      <div className="mt-4 grid gap-3 text-sm text-text-dim">
                        <div className="animate-content-fade" style={{ animationDelay: '0.05s' }}>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.opening_preference')}</div>
                          <div className="mt-1 text-text">{selectedBotTranslation.opening || selectedBot.openingPreference}</div>
                        </div>
                        <div className="animate-content-fade" style={{ animationDelay: '0.1s' }}>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.signature_style')}</div>
                          <div className="mt-1 text-text">{selectedBotTranslation.signature || selectedBot.signatureStyle}</div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="animate-content-fade" style={{ animationDelay: '0.15s' }}>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.tactical_bias')}</div>
                            <div className="mt-1 text-text">{selectedBotTranslation.tactical || selectedBot.tacticalBias}</div>
                          </div>
                          <div className="animate-content-fade" style={{ animationDelay: '0.2s' }}>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.strategic_weakness')}</div>
                            <div className="mt-1 text-text">{selectedBotTranslation.weakness || selectedBot.strategicWeakness}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5 animate-content-fade" style={{ animationDelay: '0.25s' }}>
                        {selectedBot.personalityTraits.map((trait, idx) => (
                          <span
                            key={trait}
                            className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-[11px] text-text-dim"
                            style={{ animationDelay: `${0.25 + idx * 0.05}s` }}
                          >
                            {t(`bot.trait.${trait}`) || trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dialogue Preview Card */}
                <div className="rounded-2xl border border-surface-hover/80 bg-surface/45 p-4 sm:p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.dialogue_preview')}</div>
                  <p className="mt-2 text-sm italic text-text">"{setupIntroPreview}"</p>
                  <div className="mt-3 text-xs leading-6 text-text-dim">{selectedBotTranslation.chatStyle || selectedBot.chatStyle}</div>
                  <div className="mt-4 border-t border-surface-hover/70 pt-4">
                    <button type="button"
                      onClick={onBackHome}
                      className="w-full rounded-xl border border-surface-hover bg-surface-alt/85 px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-surface-hover"
                    >
                      {t('common.back_home')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout: Horizontal Carousel + Bottom Sheet */}
            <div className="lg:hidden">
              <div className="px-4 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/85 mb-2">
                  {t('home.play_bot')}
                </p>
                <h2 className="text-2xl font-bold text-text-bright">{t('bot.setup_title')}</h2>
                <p className="mt-2 text-sm text-text-dim">
                  {t('bot.setup_desc')}
                </p>
              </div>

              <div className="mt-4">
                <MobileBotCarousel
                  personas={BOT_PERSONAS}
                  selectedId={selectedBot.id}
                  onSelect={onSelectBot}
                  t={t}
                  getBotTranslation={(botId, field) => getBotTranslation(t, botId, field)}
                />
              </div>

              {/* Spacer for bottom sheet */}
              <div className="h-[420px]" />
            </div>
        </div>
        </div>
      </main>

      {/* Mobile Bottom Sheet - Fixed at bottom */}
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
          _estimatedEloLabel={estimatedEloLabel}
          _showDetails={showDetails}
          _onToggleDetails={onToggleDetails}
          setupIntroPreview={setupIntroPreview}
        />
      </div>
    </div>
  );
}
