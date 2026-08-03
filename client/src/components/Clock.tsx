import { useEffect, useState } from 'react';
import type { BotAvatarDefinition } from '@shared/botPersonas';
import type { PieceColor, PieceType } from '@shared/types';
import { useTranslation } from '../lib/i18n';
import BotAvatar from './BotAvatar';
import InlineCapturedSummary from './InlineCapturedSummary';
import { CLOCK_CRITICAL_MS } from './gamePageHelpers';

const EMPTY_CAPTURED_PIECES: Array<{ type: PieceType; count: number; capturedColor: PieceColor }> = [];

/** Visible latency chip kicks in here — healthy ping stays on the avatar title only. */
const LATENCY_DEGRADED_MS = 150;
/** Stronger wash when connection is clearly struggling. */
const LATENCY_POOR_MS = 300;

interface ClockProps {
  time: number;
  isActive: boolean;
  color: PieceColor;
  playerName: string;
  rating?: number | null;
  avatarUrl?: string | null;
  botAvatar?: BotAvatarDefinition | null;
  flag?: string | null;
  status?: 'online' | 'offline' | 'active' | 'idle' | 'away' | 'disconnected' | 'reconnecting';
  latencyMs?: number | null;
  subtitle?: string | null;
  capturedPieces?: Array<{ type: PieceType; count: number; capturedColor: PieceColor }>;
  materialDelta?: number | null;
  showTimer?: boolean;
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
  botAvatar = null,
  flag = null,
  status,
  latencyMs = null,
  subtitle = null,
  capturedPieces = EMPTY_CAPTURED_PIECES,
  materialDelta = null,
  showTimer = true,
}: ClockProps) {
  const { t } = useTranslation();
  const [sync, setSync] = useState(() => ({ time, syncedAt: Date.now() }));
  const [prevTime, setPrevTime] = useState(time);
  if (prevTime !== time) {
    setPrevTime(time);
    setSync({ time, syncedAt: Date.now() });
  }
  const [tick, setTick] = useState(0);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarFailed = failedAvatarUrl === (avatarUrl ?? null);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTick((current) => current + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  void tick;
  const displayTime = isActive
    ? Math.max(0, sync.time - (Date.now() - sync.syncedAt))
    : time;

  const isLow = displayTime < 30000;
  const isCritical = displayTime < CLOCK_CRITICAL_MS;
  const effectiveStatus = status ?? (isActive ? 'active' : 'online');
  const displayName = playerName.trim() || t('common.guest');
  const initials = getInitials(displayName, color);
  const colorLabel = subtitle ?? t(color === 'white' ? 'common.white' : 'common.black');
  // Timer eyebrow already carries color / to-move — color chips only when there is no timer.
  const showColorChip = !showTimer && (
    Boolean(subtitle)
    || !displayName.toLocaleLowerCase().includes(colorLabel.toLocaleLowerCase())
  );
  const showRatingChip = typeof rating === 'number' && !isActive;
  // Text chips only for problem presence; idle/online/active stay on the avatar title/dot.
  const showStatusChip = effectiveStatus === 'offline'
    || effectiveStatus === 'disconnected'
    || effectiveStatus === 'reconnecting'
    || effectiveStatus === 'away';
  const statusLabel = effectiveStatus === 'offline' || effectiveStatus === 'disconnected'
    ? t('game.offline')
    : effectiveStatus === 'reconnecting'
      ? t('conn.reconnecting')
      : effectiveStatus === 'away'
        ? t('game.away')
        : effectiveStatus === 'idle'
          ? t('game.idle')
          : effectiveStatus === 'active'
            ? t('game.active_now')
            : t('game.online');
  const statusDotClass = effectiveStatus === 'offline' || effectiveStatus === 'disconnected'
    ? 'bg-danger'
    : effectiveStatus === 'reconnecting'
      ? 'bg-primary-light'
      : effectiveStatus === 'away' || effectiveStatus === 'idle'
        ? 'bg-text-dim/70'
        : effectiveStatus === 'active'
          ? 'bg-text-bright/70'
          : 'bg-success';
  const pingLabel = latencyMs === null
    ? null
    : `${latencyMs}ms`;
  const pingTitle = latencyMs === null
    ? t('game.ping_unknown')
    : t('game.ping_value', { ms: latencyMs });
  const showLatencyChip = latencyMs !== null && latencyMs >= LATENCY_DEGRADED_MS;
  const latencyPoor = latencyMs !== null && latencyMs >= LATENCY_POOR_MS;
  const latencyChipLabel = showLatencyChip
    ? t('game.ping_degraded', { ms: latencyMs })
    : null;

  const avatarStatusTitle = pingLabel
    ? `${statusLabel} · ${pingTitle}`
    : statusLabel;
  const showMetaRow = showLatencyChip
    || (!isCritical && (showColorChip || showRatingChip || showStatusChip));

  return (
    <div className={`
      w-full rounded-2xl border px-3.5 py-3 sm:px-4 lg:px-2.5
      transition-[background-color,border-color,color] duration-200
      ${showTimer ? 'lg:py-1.5' : 'py-2.5 lg:py-2'}
      ${isActive
        ? isCritical
          ? 'border-danger/40 bg-danger/10'
          : 'border-gold/40 bg-gold/10'
        : 'border-surface-hover/70 bg-surface-alt/80'
      }
    `}>
      <div className={`flex w-full min-w-0 gap-3 ${showTimer ? 'items-center justify-between' : 'items-start justify-between'}`}>
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-2">
          {botAvatar ? (
            <div className="relative shrink-0 lg:origin-left lg:scale-[0.92]">
              <BotAvatar avatar={botAvatar} size={40} />
              <span
                className={`absolute bottom-1 left-1 z-30 h-2.5 w-2.5 rounded-full border border-surface-alt ${statusDotClass}`}
                aria-label={avatarStatusTitle}
                title={avatarStatusTitle}
              />
            </div>
          ) : (
            <div className={`
              relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border lg:h-8 lg:w-8
              ${isActive ? 'border-gold/40 bg-surface-alt' : 'border-surface-hover/70 bg-surface'}
            `}>
              {avatarUrl && !avatarFailed ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setFailedAvatarUrl(avatarUrl)} />
              ) : (
                <div className={`
                  flex h-full w-full items-center justify-center text-sm font-semibold lg:text-xs
                  ${color === 'white' ? 'bg-[#f2eadb] text-[#5f5245]' : 'bg-[#24282d] text-[#d7d0c3]'}
                `}>
                  {initials}
                </div>
              )}
              <span
                className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-surface-alt ${statusDotClass}`}
                aria-label={avatarStatusTitle}
                title={avatarStatusTitle}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2 lg:gap-1.5">
              {flag && <span className="shrink-0 text-sm leading-none">{flag}</span>}
              <div className="min-w-0 truncate text-sm font-semibold text-text-bright">
                {displayName}
              </div>
              <InlineCapturedSummary
                capturedPieces={capturedPieces}
                materialDelta={materialDelta}
              />
            </div>
            {showMetaRow && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-text-dim lg:mt-0 lg:gap-1">
                {showColorChip && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-hover/70 bg-surface/55 px-2 py-1 lg:px-1.25 lg:py-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${color === 'white' ? 'bg-[#f2eadb]' : 'bg-[#22252a]'}`} />
                    {colorLabel}
                  </span>
                )}
                {showRatingChip && (
                  <span className="inline-flex items-center rounded-full border border-surface-hover/70 bg-surface/45 px-2 py-1 text-text lg:px-1.25 lg:py-0.5">
                    {t('leaderboard.col_rating')} {rating}
                  </span>
                )}
                {showStatusChip && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-surface-hover/70 bg-surface/45 px-2 py-1 text-text lg:px-1.25 lg:py-0.5"
                    title={avatarStatusTitle}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
                    {statusLabel}
                  </span>
                )}
                {showLatencyChip && latencyChipLabel ? (
                  <span
                    data-testid="clock-latency-chip"
                    className={`inline-flex items-center rounded-full border px-2 py-1 font-mono normal-case tracking-normal lg:px-1.25 lg:py-0.5 ${
                      latencyPoor
                        ? 'border-danger/35 bg-danger/10 text-danger'
                        : 'border-surface-hover/80 bg-surface-alt/90 text-text-dim'
                    }`}
                    title={pingTitle}
                  >
                    {latencyChipLabel}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {showTimer && (
          <div className={`
            min-w-[104px] shrink-0 rounded-xl border px-3 py-2 text-right lg:min-w-[84px] lg:px-2 lg:py-1
            ${isCritical || isLow
              ? 'border-danger/30 bg-danger/10'
              : isActive
                ? 'border-gold/30 bg-gold/10'
                : 'border-surface-hover/65 bg-surface/55'
            }
          `}>
            <div className="mb-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-dim">
              {isActive ? t('game.to_move') : colorLabel}
            </div>
            <div className={`
              font-mono text-xl font-bold tabular-nums tracking-tight sm:text-2xl
              ${isCritical || isLow ? 'text-danger' : 'text-text-bright'}
              ${isActive && isCritical ? 'animate-pulse' : ''}
            `}>
              {formatTime(displayTime)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
