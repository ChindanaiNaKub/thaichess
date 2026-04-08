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
  _estimatedEloLabel: string;
  _showDetails: boolean;
  _onToggleDetails: () => void;
  setupIntroPreview: string;
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
  _estimatedEloLabel,
  _showDetails,
  _onToggleDetails,
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
      <div className="bg-surface/95 backdrop-blur-lg rounded-t-3xl border-t border-x border-surface-hover shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        {/* Drag Handle */}
        <div 
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onClick={() => setIsExpanded(!isExpanded)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-surface-hover rounded-full mb-2" />
          <div className="text-xs text-text-dim font-medium uppercase tracking-wider">
            {isExpanded ? '▼ Tap to collapse' : '▲ Swipe up for details'}
          </div>
        </div>

        {/* Always Visible Content */}
        <div className="px-5 pb-4">
          {/* Bot Header */}
          <div className="flex items-center gap-4 mb-4">
            <BotAvatar 
              avatar={bot.avatar} 
              size={64} 
              className="shrink-0 ring-2 ring-primary/20 animate-breathe" 
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{t('bot.featured_opponent')}</div>
              <h3 className="text-xl font-bold text-text-bright">{bot.name}</h3>
              <p className="text-sm text-text-dim truncate">{bot.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">{levelLabel}</span>
                <span className="text-xs text-text-dim">{difficultyLabel}</span>
              </div>
            </div>
          </div>

          {/* Hook */}
          <p className="text-base font-medium text-text italic mb-4">
            "{botTranslation.hook || bot.personalityHook}"
          </p>

          {/* Side Selection */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-text-dim">{t('bot.play_as')}</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => onSideChange('white')}
                className={`rounded-xl border-2 px-2 py-4 font-medium transition-all flex flex-col items-center gap-2 min-h-[80px] ${
                  sideChoice === 'white'
                    ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                    : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                }`}
              >
                <PieceSVG type="K" color="white" size={32} />
                <span className="text-sm">{t('common.white')}</span>
              </button>
              <button
                onClick={() => onSideChange('random')}
                className={`rounded-xl border-2 px-2 py-4 font-medium transition-all flex flex-col items-center gap-2 min-h-[80px] ${
                  sideChoice === 'random'
                    ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                    : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                }`}
              >
                <span className="text-2xl">🎲</span>
                <span className="text-sm">{t('bot.random')}</span>
              </button>
              <button
                onClick={() => onSideChange('black')}
                className={`rounded-xl border-2 px-2 py-4 font-medium transition-all flex flex-col items-center gap-2 min-h-[80px] ${
                  sideChoice === 'black'
                    ? 'border-primary/40 bg-primary text-white shadow-[0_8px_20px_rgba(92,160,26,0.28)]'
                    : 'border-surface-hover bg-surface-alt/85 text-text hover:bg-surface-hover'
                }`}
              >
                <PieceSVG type="K" color="black" size={32} />
                <span className="text-sm">{t('common.black')}</span>
              </button>
            </div>
          </div>

          {/* PLAY NOW Button */}
          <button
            onClick={onPlay}
            data-testid="start-game-button"
            className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-white shadow-[0_8px_24px_rgba(92,160,26,0.35)] transition-all hover:bg-primary-light hover:shadow-[0_12px_32px_rgba(92,160,26,0.45)] hover:scale-[1.02] active:scale-[0.98] active:translate-y-[1px] flex items-center justify-center gap-2 animate-play-pulse"
          >
            <span>▶</span>
            <span>{t('bot.start')}</span>
          </button>

          {/* ELO Note */}
          <p className="mt-3 text-center text-xs text-text-dim">
            {t('bot.estimated_elo_note')}
          </p>
        </div>

        {/* Expandable Content */}
        <div 
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-5 pb-6 border-t border-surface-hover/50 pt-4">
            {/* Backstory */}
            <p className="text-sm leading-6 text-text mb-4">{botTranslation.backstory || bot.shortBackstory}</p>

            {/* Details Grid */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.opening_preference')}</div>
                <div className="mt-1 text-sm text-text">{botTranslation.opening || bot.openingPreference}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.signature_style')}</div>
                <div className="mt-1 text-sm text-text">{botTranslation.signature || bot.signatureStyle}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.tactical_bias')}</div>
                  <div className="mt-1 text-sm text-text">{botTranslation.tactical || bot.tacticalBias}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('bot.strategic_weakness')}</div>
                  <div className="mt-1 text-sm text-text">{botTranslation.weakness || bot.strategicWeakness}</div>
                </div>
              </div>
            </div>

            {/* Traits */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {bot.personalityTraits.map((trait) => (
                <span key={trait} className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-xs text-text-dim">
                  {t(`bot.trait.${trait}`) || trait}
                </span>
              ))}
            </div>

            {/* Dialogue Preview */}
            <div className="mb-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim mb-2">{t('bot.dialogue_preview')}</div>
              <p className="text-sm italic text-text">"{setupIntroPreview}"</p>
              <p className="mt-2 text-xs text-text-dim">{botTranslation.chatStyle || bot.chatStyle}</p>
            </div>

            {/* Back Button */}
            <button
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
