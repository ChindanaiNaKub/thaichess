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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Snap to nearest card
    if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
      const cardWidth = scrollRef.current.offsetWidth * 0.75;
      const targetIndex = Math.round(scrollRef.current.scrollLeft / cardWidth);
      const clampedIndex = Math.max(0, Math.min(targetIndex, personas.length - 1));
      scrollRef.current.scrollTo({
        left: clampedIndex * cardWidth,
        behavior: 'smooth'
      });
      onSelect(personas[clampedIndex].id);
    }
  };

  const handleCardClick = (persona: BotPersona, index: number) => {
    if (!isDragging) {
      onSelect(persona.id);
      if (scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
        const cardWidth = scrollRef.current.offsetWidth * 0.75;
        scrollRef.current.scrollTo({
          left: index * cardWidth,
          behavior: 'smooth'
        });
      }
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {personas.map((persona, index) => {
          const isSelected = persona.id === selectedId;
          const hook = getBotTranslation(persona.id, 'hook') || persona.personalityHook;
          const difficultyLabel = getBotPublicStrengthLabel(persona.engine.level);

          return (
            <button
              key={persona.id}
              onClick={() => handleCardClick(persona, index)}
              className={`flex-shrink-0 w-[75vw] max-w-[320px] snap-center rounded-2xl border p-5 text-left transition-all duration-300 ${
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
                  className={`shrink-0 transition-all duration-300 ${isSelected ? 'animate-breathe scale-110' : ''}`}
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
          <button
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
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
