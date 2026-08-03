import React, { useRef, useState, useEffect } from 'react';
import type { BotPersona } from '@shared/botPersonas';
import { getBotPublicStrengthLabel } from '@shared/botEngine';
import BotAvatar from './BotAvatar';

interface MobileBotCarouselProps {
  personas: readonly BotPersona[];
  selectedId: string;
  onSelect: (_id: string) => void;
  t: (_key: string, _params?: Record<string, string | number>) => string;
  getBotTranslation: (_botId: string, _field: string) => string;
  /** Carousel for featured (≤5); list for the full roster. */
  layout?: 'carousel' | 'list';
}

export default function MobileBotCarousel({
  personas,
  selectedId,
  onSelect,
  t,
  getBotTranslation,
  layout = 'carousel',
}: MobileBotCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (layout !== 'carousel') return;

    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollPos = scrollRef.current.scrollLeft;
        const cardWidth = scrollRef.current.offsetWidth * 0.75;
        const newIndex = Math.round(scrollPos / cardWidth);
        if (newIndex >= 0 && newIndex < personas.length) {
          setActiveIndex(newIndex);
        }
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [layout, personas.length]);

  useEffect(() => {
    if (layout !== 'carousel') return;

    const el = scrollRef.current;
    if (!el) return;

    let startX = 0;
    let startScrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      startX = e.pageX - el.offsetLeft;
      startScrollLeft = el.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = startScrollLeft - walk;
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      if (typeof el.scrollTo === 'function') {
        const cardWidth = el.offsetWidth * 0.75;
        const targetIndex = Math.round(el.scrollLeft / cardWidth);
        const clampedIndex = Math.max(0, Math.min(targetIndex, personas.length - 1));
        el.scrollTo({
          left: clampedIndex * cardWidth,
          behavior: 'smooth',
        });
        onSelect(personas[clampedIndex].id);
      }
      window.setTimeout(() => {
        isDraggingRef.current = false;
      }, 0);
    };

    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [layout, onSelect, personas]);

  useEffect(() => {
    if (layout !== 'carousel') return;

    const index = personas.findIndex((p) => p.id === selectedId);
    if (index >= 0 && scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
      const cardWidth = scrollRef.current.offsetWidth * 0.75;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    }
  }, [layout, selectedId, personas]);

  if (layout === 'list') {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? personas.filter((persona) => {
        const hook = (getBotTranslation(persona.id, 'hook') || persona.personalityHook).toLowerCase();
        return (
          persona.name.toLowerCase().includes(normalized)
          || persona.title.toLowerCase().includes(normalized)
          || hook.includes(normalized)
        );
      })
      : personas;

    return (
      <div className="px-4">
        <label className="sr-only" htmlFor="mobile-bot-search">{t('bot.search_bots')}</label>
        <input
          id="mobile-bot-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('bot.search_bots_placeholder')}
          className="mb-3 w-full rounded-xl border border-surface-hover bg-surface px-3 py-3 text-base text-text-bright outline-none placeholder:text-text-dim/75 focus:border-primary"
        />
        <div
          className="max-h-[min(40vh,20rem)] space-y-2 overflow-y-auto overscroll-contain pr-1"
          role="listbox"
          aria-label={t('bot.roster')}
        >
          {filtered.map((persona) => {
            const isSelected = persona.id === selectedId;
            const difficultyLabel = getBotPublicStrengthLabel(persona.engine.level);

            return (
              <button
                type="button"
                key={persona.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(persona.id)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-primary/35 bg-primary/10'
                    : 'border-surface-hover bg-surface-alt/85 hover:bg-surface-hover/60'
                }`}
              >
                <BotAvatar avatar={persona.avatar} size={44} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-text-bright">{persona.name}</div>
                  <div className="truncate text-xs text-text-dim">{persona.title}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[0.7rem] font-semibold text-text-dim">
                    {t('bot.level_short', { level: persona.engine.level })}
                  </div>
                  <div className="text-[0.7rem] text-text-dim">{difficultyLabel}</div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-text-dim">{t('bot.search_empty')}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const handleCardClick = (persona: BotPersona, index: number) => {
    if (isDraggingRef.current) return;
    onSelect(persona.id);
    if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
      const cardWidth = scrollRef.current.offsetWidth * 0.75;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-[12.5%] pb-4 -mx-4 scrollbar-hide active:cursor-grabbing"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {personas.map((persona, index) => {
          const isSelected = persona.id === selectedId;
          const hook = getBotTranslation(persona.id, 'hook') || persona.personalityHook;
          const difficultyLabel = getBotPublicStrengthLabel(persona.engine.level);

          return (
            <button
              type="button"
              key={persona.id}
              onClick={() => handleCardClick(persona, index)}
              className={`w-[75vw] max-w-[320px] flex-shrink-0 snap-center rounded-2xl border p-5 text-left transition-[border-color,background-color,opacity] duration-200 ${
                isSelected
                  ? 'border-primary/35 bg-primary/10 opacity-100'
                  : 'border-surface-hover bg-surface-alt/85 opacity-70'
              }`}
            >
              <div className="flex items-center gap-4">
                <BotAvatar avatar={persona.avatar} size={72} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold text-text-bright">{persona.name}</div>
                  <div className="truncate text-sm text-text-dim">{persona.title}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs font-semibold text-text-dim">
                      {t('bot.level_short', { level: persona.engine.level })}
                    </span>
                    <span className="text-xs text-text-dim">{difficultyLabel}</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 line-clamp-2 text-base font-medium italic text-text">
                "{hook}"
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {personas.map((persona, index) => (
          <button
            type="button"
            key={persona.id}
            onClick={() => {
              onSelect(persona.id);
              if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
                const cardWidth = scrollRef.current.offsetWidth * 0.75;
                scrollRef.current.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth',
                });
              }
            }}
            className={`h-2 rounded-full transition-[width,background-color] duration-200 ${
              index === activeIndex
                ? 'w-6 bg-accent'
                : 'w-2 bg-surface-hover hover:bg-surface'
            }`}
            aria-label={t('bot.carousel_go_to', { name: persona.name })}
          />
        ))}
      </div>
    </div>
  );
}
