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
}

export default function MobileBotCarousel({ 
  personas, 
  selectedId, 
  onSelect, 
  t, 
  getBotTranslation 
}: MobileBotCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Update active index based on scroll position
  useEffect(() => {
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
  }, [personas.length]);

  // Desktop drag-to-scroll via listeners (keeps the carousel container non-interactive in JSX)
  useEffect(() => {
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
      // Keep the drag flag set through the click that follows mouseup.
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
  }, [onSelect, personas]);

  // Scroll to selected bot when selection changes
  useEffect(() => {
    const index = personas.findIndex(p => p.id === selectedId);
    if (index >= 0 && scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
      const cardWidth = scrollRef.current.offsetWidth * 0.75;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  }, [selectedId, personas]);

  const handleCardClick = (persona: BotPersona, index: number) => {
    if (isDraggingRef.current) return;
    onSelect(persona.id);
    if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
      const cardWidth = scrollRef.current.offsetWidth * 0.75;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-[12.5%] pb-4 -mx-4 scrollbar-hide cursor-grab active:cursor-grabbing"
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
            <button type="button"
              key={persona.id}
              onClick={() => handleCardClick(persona, index)}
              className={`flex-shrink-0 w-[75vw] max-w-[320px] snap-center rounded-2xl border p-5 text-left transition-[border-color,box-shadow,transform,opacity] duration-300 ${
                isSelected
                  ? 'border-primary/40 bg-primary/12 shadow-[0_12px_28px_rgba(92,160,26,0.22)] scale-100'
                  : 'border-surface-hover bg-surface-alt/85 scale-95 opacity-70'
              }`}
              style={{
                transform: isSelected ? 'scale(1)' : 'scale(0.95)',
              }}
            >
              {/* Card Content */}
              <div className="flex items-center gap-4">
                <BotAvatar 
                  avatar={persona.avatar} 
                  size={72} 
                  className={`shrink-0 transition-[border-color,box-shadow,transform,opacity] duration-300 ${isSelected ? 'animate-breathe scale-110' : ''}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold text-text-bright">{persona.name}</div>
                  <div className="text-sm text-text-dim truncate">{persona.title}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                      {t('bot.level_short', { level: persona.engine.level })}
                    </span>
                    <span className="text-xs text-text-dim">{difficultyLabel}</span>
                  </div>
                </div>
              </div>

              {/* Hook */}
              <p className="mt-4 text-base font-medium text-text line-clamp-2 italic">
                "{hook}"
              </p>
            </button>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-2">
        {personas.map((persona, index) => (
          <button type="button"
            key={persona.id}
            onClick={() => {
              onSelect(persona.id);
              if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
                const cardWidth = scrollRef.current.offsetWidth * 0.75;
                scrollRef.current.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth'
                });
              }
            }}
            className={`w-2 h-2 rounded-full transition-[border-color,box-shadow,transform,opacity] duration-300 ${
              index === activeIndex 
                ? 'bg-primary w-6' 
                : 'bg-surface-hover hover:bg-surface'
            }`}
            aria-label={`Go to ${persona.name}`}
          />
        ))}
      </div>

      {/* Scroll Hints */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none lg:hidden">
        <div className={`text-2xl text-text-dim/30 transition-opacity duration-300 ${activeIndex > 0 ? 'opacity-100' : 'opacity-0'}`}>◀</div>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none lg:hidden">
        <div className={`text-2xl text-text-dim/30 transition-opacity duration-300 ${activeIndex < personas.length - 1 ? 'opacity-100' : 'opacity-0'}`}>▶</div>
      </div>
    </div>
  );
}
