import React, { useState, useRef } from 'react';
import type { BotPersona } from '@shared/botPersonas';
import type { PieceColor } from '@shared/types';
import BotAvatar from './BotAvatar';
import PieceSVG from './PieceSVG';

interface MobileBottomSheetProps {
  bot: BotPersona;
  sideChoice: PieceColor | 'random';
  onSideChange: (_side: PieceColor | 'random') => void;
  onPlay: () => void;
  onBack: () => void;
  t: (_key: string, _params?: Record<string, string | number>) => string;
  botTranslation: {
    backstory: string;
    hook: string;
    opening: string;
    signature: string;
    tactical: string;
    weakness: string;
    chatStyle: string;
  };
  levelLabel: string;
  difficultyLabel: string;
  setupIntroPreview: string;
}

function sideButtonClass(active: boolean) {
  return active
    ? 'border-accent/40 bg-accent/15 text-accent'
    : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover';
}

export default function MobileBottomSheet({
  bot,
  sideChoice,
  onSideChange,
  onPlay,
  onBack,
  t,
  botTranslation,
  levelLabel,
  difficultyLabel,
  setupIntroPreview,
}: MobileBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      setIsExpanded(false);
    }
    setDragY(0);
  };

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        isDragging ? '' : 'transition-transform'
      }`}
      style={{
        transform: `translateY(${isExpanded ? dragY : Math.max(dragY, 0)}px)`,
      }}
    >
      <div className="rounded-t-3xl border-x border-t border-surface-hover bg-surface/95 backdrop-blur-lg">
        <button
          type="button"
          className="flex w-full cursor-grab flex-col items-center border-0 bg-transparent pb-2 pt-3 active:cursor-grabbing"
          onClick={() => setIsExpanded(!isExpanded)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? t('bot.sheet_collapse_aria') : t('bot.sheet_expand_aria')}
        >
          <div className="mb-2 h-1.5 w-12 rounded-full bg-surface-hover" />
          <div className="text-xs font-medium uppercase tracking-wider text-text-dim">
            {isExpanded ? t('bot.sheet_collapse') : t('bot.sheet_expand')}
          </div>
        </button>

        <div className="px-5 pb-4">
          <div className="mb-4 flex items-center gap-4">
            <BotAvatar
              avatar={bot.avatar}
              size={64}
              className="shrink-0 ring-2 ring-accent/20"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-text-bright">{bot.name}</h3>
              <p className="truncate text-sm text-text-dim">{bot.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full border border-surface-hover bg-surface px-2 py-0.5 text-xs font-semibold text-text-dim">{levelLabel}</span>
                <span className="text-xs text-text-dim">{difficultyLabel}</span>
              </div>
            </div>
          </div>

          <p className="mb-4 text-base font-medium italic text-text">
            "{botTranslation.hook || bot.personalityHook}"
          </p>

          <fieldset className="mb-4 min-w-0 border-0 p-0">
            <legend className="mb-2 block text-xs font-medium text-text-dim">{t('bot.play_as')}</legend>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onSideChange('white')}
                className={`flex min-h-[80px] flex-col items-center gap-2 rounded-xl border px-2 py-4 font-medium transition-colors ${sideButtonClass(sideChoice === 'white')}`}
              >
                <PieceSVG type="K" color="white" size={32} />
                <span className="text-sm">{t('common.white')}</span>
              </button>
              <button
                type="button"
                onClick={() => onSideChange('random')}
                className={`flex min-h-[80px] flex-col items-center gap-2 rounded-xl border px-2 py-4 font-medium transition-colors ${sideButtonClass(sideChoice === 'random')}`}
              >
                <span className="text-2xl" aria-hidden="true">?</span>
                <span className="text-sm">{t('bot.random')}</span>
              </button>
              <button
                type="button"
                onClick={() => onSideChange('black')}
                className={`flex min-h-[80px] flex-col items-center gap-2 rounded-xl border px-2 py-4 font-medium transition-colors ${sideButtonClass(sideChoice === 'black')}`}
              >
                <PieceSVG type="K" color="black" size={32} />
                <span className="text-sm">{t('common.black')}</span>
              </button>
            </div>
          </fieldset>

          <button
            type="button"
            onClick={onPlay}
            data-testid="start-game-button"
            className="button-accent-contrast flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold"
          >
            <span aria-hidden="true">▶</span>
            <span>{t('bot.start')}</span>
          </button>

          <p className="mt-3 text-center text-xs text-text-dim">
            {t('bot.estimated_elo_note')}
          </p>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
            isExpanded ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-surface-hover/50 px-5 pb-6 pt-4">
            <p className="mb-4 text-sm leading-6 text-text">{botTranslation.backstory || bot.shortBackstory}</p>

            <div className="mb-4 space-y-3">
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.opening_preference')}</div>
                <div className="mt-1 text-sm text-text">{botTranslation.opening || bot.openingPreference}</div>
              </div>
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.signature_style')}</div>
                <div className="mt-1 text-sm text-text">{botTranslation.signature || bot.signatureStyle}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.tactical_bias')}</div>
                  <div className="mt-1 text-sm text-text">{botTranslation.tactical || bot.tacticalBias}</div>
                </div>
                <div>
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.strategic_weakness')}</div>
                  <div className="mt-1 text-sm text-text">{botTranslation.weakness || bot.strategicWeakness}</div>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {bot.personalityTraits.map((trait) => (
                <span key={trait} className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-xs text-text-dim">
                  {t(`bot.trait.${trait}`) || trait}
                </span>
              ))}
            </div>

            <div className="mb-4">
              <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.dialogue_preview')}</div>
              <p className="text-sm italic text-text">"{setupIntroPreview}"</p>
              <p className="mt-2 text-xs text-text-dim">{botTranslation.chatStyle || bot.chatStyle}</p>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-xl border border-surface-hover bg-surface-alt/85 px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-surface-hover"
            >
              {t('common.back_home')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
