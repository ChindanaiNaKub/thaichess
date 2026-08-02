import { memo } from 'react';
import { DEFAULT_BOT_PERSONA_ID, type BotPersona } from '@shared/botPersonas';
import { getBotPublicStrengthLabel } from '@shared/botEngine';
import BotAvatar from './BotAvatar';

interface BotCardProps {
  persona: BotPersona;
  isSelected: boolean;
  onSelect: () => void;
  t: (_key: string, _params?: Record<string, string | number>) => string;
  getBotTranslation: (_botId: string, _field: string) => string;
  index?: number;
  recommended?: boolean;
}

function BotCard({
  persona,
  isSelected,
  onSelect,
  t,
  getBotTranslation,
  index = 0,
  recommended = persona.id === DEFAULT_BOT_PERSONA_ID,
}: BotCardProps) {
  const hook = getBotTranslation(persona.id, 'hook') || persona.personalityHook;
  const difficultyLabel = getBotPublicStrengthLabel(persona.engine.level);
  const staggerClass = index < 10 ? `stagger-${index + 1}` : '';

  return (
    <button type="button"
      onClick={onSelect}
      className={`group relative rounded-2xl border p-3 text-left transition-[border-color,background-color,transform] duration-200 animate-card-entrance ${staggerClass} ${
        isSelected
          ? 'border-accent/40 bg-accent/10'
          : 'border-surface-hover bg-surface-alt/85 hover:bg-surface-hover'
      }`}
    >
      <div className="relative flex items-start gap-3">
        <div className="shrink-0">
          <BotAvatar
            avatar={persona.avatar}
            size={60}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-bright transition-colors group-hover:text-accent">{persona.name}</div>
          <div className="text-xs text-text-dim truncate">{persona.title}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-surface px-2 py-0.5 text-[0.7rem] font-semibold text-text-dim border border-surface-hover">
              {t('bot.level_short', { level: persona.engine.level })}
            </span>
            <span className="rounded-full border border-surface-hover px-2 py-0.5 text-[0.7rem] text-text-dim">
              {difficultyLabel}
            </span>
            {recommended && (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.7rem] font-semibold text-accent">
                {t('bot.recommended')}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="relative mt-3 text-sm font-medium text-text line-clamp-1 italic">
        "{hook}"
      </p>
    </button>
  );
}

export default memo(BotCard);
