import { useEffect, useState } from 'react';
import type { PieceColor } from '@shared/types';
import { useTranslation } from '../lib/i18n';

interface ClockProps {
  time: number;
  isActive: boolean;
  color: PieceColor;
  playerName: string;
  rating?: number | null;
  avatarUrl?: string | null;
  flag?: string | null;
  status?: 'online' | 'offline' | 'active';
  subtitle?: string | null;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getInitials(name: string, color: PieceColor) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return color === 'white' ? 'W' : 'B';
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export default function Clock({
  time,
  isActive,
  color,
  playerName,
  rating = null,
  avatarUrl = null,
  flag = null,
  status,
  subtitle = null,
}: ClockProps) {
  const { t } = useTranslation();
  const [displayTime, setDisplayTime] = useState(time);

  useEffect(() => {
    setDisplayTime(time);
  }, [time]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const isLow = displayTime < 30000;
  const isCritical = displayTime < 10000;
  const effectiveStatus = status ?? (isActive ? 'active' : 'online');
  const displayName = playerName.trim() || t('common.guest');
  const initials = getInitials(displayName, color);
  const colorLabel = subtitle ?? t(color === 'white' ? 'common.white' : 'common.black');
  const showColorChip = Boolean(subtitle)
    || !displayName.toLocaleLowerCase().includes(colorLabel.toLocaleLowerCase());
  const statusLabel = effectiveStatus === 'offline'
    ? t('game.offline')
    : effectiveStatus === 'active'
      ? t('game.active_now')
      : t('game.online');
  const statusDotClass = effectiveStatus === 'offline'
    ? 'bg-danger shadow-[0_0_0_4px_rgb(148_54_54_/_0.16)]'
    : effectiveStatus === 'active'
      ? 'bg-primary shadow-[0_0_0_4px_rgb(88_168_95_/_0.18)]'
      : 'bg-success shadow-[0_0_0_4px_rgb(72_156_84_/_0.14)]';

  return (
    <div className={`
      w-full rounded-2xl border px-3.5 py-3 sm:px-4
      transition-all duration-200
      ${isActive
        ? isCritical
          ? 'border-danger/35 bg-[linear-gradient(180deg,rgba(120,36,36,0.18),rgba(41,27,24,0.95))] shadow-[0_10px_30px_rgba(80,24,24,0.18)]'
          : 'border-primary/35 bg-[linear-gradient(180deg,rgba(72,108,48,0.18),rgba(34,29,22,0.96))] shadow-[0_10px_28px_rgba(43,72,36,0.16)]'
        : 'border-surface-hover/70 bg-[linear-gradient(180deg,rgba(51,42,32,0.46),rgba(30,26,22,0.96))] shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
      }
    `}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`
            relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border
            ${isActive ? 'border-primary/35 bg-surface-alt' : 'border-surface-hover/70 bg-surface'}
          `}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className={`
                flex h-full w-full items-center justify-center text-sm font-semibold
                ${color === 'white' ? 'bg-[#f2eadb] text-[#5f5245]' : 'bg-[#24282d] text-[#d7d0c3]'}
              `}>
                {initials}
              </div>
            )}
            <span
              className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-surface-alt ${statusDotClass}`}
              aria-label={statusLabel}
              title={statusLabel}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              <div className="truncate text-sm font-semibold text-text-bright sm:text-[15px]">
                {displayName}
              </div>
              {isActive && (
                <span className="hidden rounded-full border border-primary/30 bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light sm:inline-flex">
                  {t('game.to_move')}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-dim">
              {showColorChip && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-hover/70 bg-surface/55 px-2 py-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${color === 'white' ? 'bg-[#f2eadb]' : 'bg-[#22252a]'}`} />
                  {colorLabel}
                </span>
              )}
              {typeof rating === 'number' && (
                <span className="inline-flex items-center rounded-full border border-surface-hover/70 bg-surface/45 px-2 py-1 text-text">
                  {t('leaderboard.col_rating')} {rating}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`
          min-w-[104px] rounded-xl border px-3 py-2 text-right
          ${isCritical
            ? 'border-danger/30 bg-danger/10'
            : isActive
              ? 'border-primary/25 bg-surface/72'
              : 'border-surface-hover/65 bg-surface/55'
          }
        `}>
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-dim">
            {isActive ? t('game.to_move') : statusLabel}
          </div>
          <div className={`
            font-mono text-xl font-bold tabular-nums tracking-tight sm:text-2xl
            ${isCritical ? 'text-danger' : isLow ? 'text-accent' : 'text-text-bright'}
            ${isActive && isCritical ? 'animate-pulse' : ''}
          `}>
            {formatTime(displayTime)}
          </div>
        </div>
      </div>
    </div>
  );
}
