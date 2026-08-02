import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { PublicLiveGameSummary } from '@shared/types';
import { routes, spectatorGameRoute } from '../lib/routes';
import { useTranslation } from '../lib/i18n';

interface LiveGamesPanelProps {
  games: PublicLiveGameSummary[];
  loading?: boolean;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDesc: string;
  compact?: boolean;
  showViewAll?: boolean;
  viewAllLabel?: string;
  onViewAll?: () => void;
  /** When true, skip the section heading (page already has one). */
  omitSectionChrome?: boolean;
  /** Show Find/Bot accelerators in the empty state (full Live page). */
  showEmptyPlayActions?: boolean;
}

function formatTimeControl(initial: number, increment: number) {
  const minutes = initial / 60;
  const base = Number.isInteger(minutes) ? minutes.toString() : (Math.round(minutes * 10) / 10).toString();
  return `${base}+${increment}`;
}

function formatUpdatedLabel(lastMoveAt: number, t: ReturnType<typeof useTranslation>['t']) {
  const minutes = Math.floor((Date.now() - lastMoveAt) / 60000);
  return minutes <= 0 ? t('live.just_now') : t('live.updated', { n: minutes });
}

function formatModeLabel(game: PublicLiveGameSummary, t: ReturnType<typeof useTranslation>['t']) {
  if (game.gameMode === 'quick_play') {
    return game.rated ? t('live.mode_rated') : t('live.mode_casual');
  }
  if (game.gameMode === 'private') {
    return game.rated ? t('live.mode_private_rated') : t('live.mode_private');
  }
  if (game.gameMode === 'bot') {
    return t('games.bot_badge');
  }
  return game.rated ? t('game.rated') : t('game.casual');
}

function MetaChip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'live' | 'primary' }) {
  const toneClass = tone === 'live' || tone === 'primary'
    ? 'border-primary/25 bg-primary/10 text-primary-light'
    : 'border-surface-hover bg-surface text-text-dim';

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
      {children}
    </span>
  );
}

function formatPlayerLabel(name: string | null, rating: number | null, fallback: string) {
  const displayName = name?.trim() || fallback;
  return typeof rating === 'number' ? `${displayName} (${rating})` : displayName;
}

export default function LiveGamesPanel({
  games,
  loading = false,
  title,
  description,
  emptyTitle,
  emptyDesc,
  compact = false,
  showViewAll = false,
  viewAllLabel,
  onViewAll,
  omitSectionChrome = false,
  showEmptyPlayActions = false,
}: LiveGamesPanelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className={omitSectionChrome ? undefined : 'ui-card p-5 sm:p-6'}>
      {!omitSectionChrome && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-bright">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-dim">{description}</p>
          </div>
          {showViewAll && onViewAll && viewAllLabel && (
            <button
              type="button"
              onClick={onViewAll}
              className="ui-btn-secondary inline-flex items-center justify-center px-4 py-2 text-sm"
            >
              {viewAllLabel}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12" role="status" aria-label={t('common.loading')}>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : games.length === 0 ? (
        <div className={`${omitSectionChrome ? '' : 'mt-5 '}rounded-xl border border-dashed border-surface-hover/80 px-5 py-8 text-center`}>
          <p className="text-lg font-semibold text-text-bright">{emptyTitle}</p>
          <p className="mt-2 text-sm text-text-dim">{emptyDesc}</p>
          {showEmptyPlayActions ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(routes.quickPlay)}
                className="button-accent-contrast w-full rounded-lg px-5 py-2.5 text-sm font-bold sm:w-auto sm:px-6 sm:py-3"
              >
                {t('live.empty_find')}
              </button>
              <button
                type="button"
                onClick={() => navigate(routes.bot)}
                className="ui-btn-secondary w-full px-5 py-2.5 text-sm sm:w-auto sm:px-6 sm:py-3"
              >
                {t('live.empty_bot')}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className={`${omitSectionChrome ? '' : 'mt-5 '}divide-y divide-surface-hover/70 border-y border-surface-hover/70`}>
          {games.map((game) => (
            <li
              key={game.id}
              className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${compact ? 'sm:gap-4' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-bright">
                  <span>{formatPlayerLabel(game.whitePlayerName, game.whiteRating, t('common.white'))}</span>
                  <span className="mx-2 font-normal text-text-dim">vs</span>
                  <span>{formatPlayerLabel(game.blackPlayerName, game.blackRating, t('common.black'))}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <MetaChip tone={game.status === 'playing' ? 'live' : 'neutral'}>
                    {game.status === 'playing' ? t('live.card_live') : t('live.card_finished')}
                  </MetaChip>
                  <MetaChip>{formatModeLabel(game, t)}</MetaChip>
                  <MetaChip>
                    {formatTimeControl(game.timeControl.initial, game.timeControl.increment)}
                  </MetaChip>
                </div>
                <p className="mt-1.5 text-xs text-text-dim">
                  {t('live.moves', { count: game.moveCount })}
                  {' · '}
                  {t('live.watchers', { count: game.spectatorCount })}
                  {' · '}
                  {formatUpdatedLabel(game.lastMoveAt, t)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(spectatorGameRoute(game.id))}
                className="ui-btn-secondary shrink-0 rounded-[0.6rem] px-4 py-2 text-sm font-semibold"
              >
                {compact ? t('live.watch') : t('live.view_spectator')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
