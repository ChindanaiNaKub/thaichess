import { memo } from 'react';
import type { BotPersona } from '@shared/botPersonas';
import { getBotPublicStrengthLabel } from '@shared/botEngine';
import BotAvatar from './BotAvatar';

interface BotCardProps {
  persona: BotPersona;
  isSelected: boolean;
  onSelect: () => void;
  t: (_key: string, _params?: Record<string, string | number>) => string;
  getBotTranslation: (_botId: string, _field: string) => string;
  index?: number;
}

function BotCard({ persona, isSelected, onSelect, t, getBotTranslation, index = 0 }: BotCardProps) {
  const hook = getBotTranslation(persona.id, 'hook') || persona.personalityHook;
  const difficultyLabel = getBotPublicStrengthLabel(persona.engine.level);
  const staggerClass = index < 10 ? `stagger-${index + 1}` : '';

  return (
    <button
      onClick={onSelect}
      className={`group relative rounded-2xl border p-3 text-left transition-all duration-200 animate-card-entrance ${staggerClass} ${
        isSelected
          ? 'border-primary/40 bg-primary/12 shadow-[0_12px_28px_rgba(92,160,26,0.22)] animate-selection-pulse'
          : 'border-surface-hover bg-surface-alt/85 hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg'
      }`}
    >
      {/* Selection glow effect */}
      {isSelected && (
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 opacity-60 blur-sm" />
      )}

      <div className="relative flex items-start gap-3">
        <div className={`shrink-0 transition-all duration-300 ${isSelected ? 'animate-wake-up' : 'group-hover:scale-105'}`}>
          <BotAvatar 
            avatar={persona.avatar} 
            size={60} 
            className={isSelected ? 'animate-breathe' : ''}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-bright transition-colors group-hover:text-primary">{persona.name}</div>
          <div className="text-xs text-text-dim truncate">{persona.title}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {t('bot.level_short', { level: persona.engine.level })}
            </span>
            <span className="rounded-full border border-surface-hover px-2 py-0.5 text-[10px] text-text-dim">
              {difficultyLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Single-line personality hook with fade */}
      <p className="relative mt-3 text-sm font-medium text-text line-clamp-1 italic transition-opacity duration-300">
        "{hook}"
      </p>
    </button>
  );
}

export default memo(BotCard);
