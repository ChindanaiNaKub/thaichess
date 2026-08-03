import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../lib/i18n';
import { mapGameplayErrorMessage } from '../lib/gameplayErrors';
import { routes, savedGameAnalysisRoute } from '../lib/routes';
import { gamesQueryOptions, type GamesFilter, type GameEntry } from '../queries/games';
import Header from './Header';
import Footer from './Footer';

function formatTimeControl(initial: number, increment: number): string {
  const mins = Math.floor(initial / 60);
  return increment > 0 ? `${mins}+${increment}` : `${mins}+0`;
}

function formatResult(result: string, _reason: string): { text: string; color: string } {
  if (result === 'draw') return { text: '½-½', color: 'text-text-dim' };
  if (result === 'white') return { text: '1-0', color: 'text-text-bright' };
  return { text: '0-1', color: 'text-text-bright' };
}

function formatPlayerLabel(
  name: string,
  rating: number | null | undefined,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const displayName = name.trim() || t('common.anonymous');
  return typeof rating === 'number' ? `${displayName} (${rating})` : displayName;
}

function getEmptyHistoryCopy(filter: GamesFilter, t: ReturnType<typeof useTranslation>['t']) {
  if (filter === 'bot') {
    return { title: t('games.empty_bot'), desc: t('games.empty_bot_desc') };
  }
  if (filter === 'rated') {
    return { title: t('games.empty_rated'), desc: t('games.empty_rated_desc') };
  }
  if (filter === 'casual') {
    return { title: t('games.empty_casual'), desc: t('games.empty_casual_desc') };
  }
  return { title: t('games.empty'), desc: t('games.empty_desc') };
}

function isBotGame(game: GameEntry): boolean {
  return game.game_type === 'bot' || game.game_mode === 'bot' || game.opponent_type === 'bot';
}

function getParticipantLabel(
  game: GameEntry,
  color: 'white' | 'black',
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const isBot = isBotGame(game) && game.opponent_name && (
    (color === 'white' ? game.white_name : game.black_name).trim() === game.opponent_name.trim()
  );
  const rating = isBotGame(game)
    ? null
    : color === 'white'
      ? game.white_rating_before ?? game.white_rating_after ?? null
      : game.black_rating_before ?? game.black_rating_after ?? null;
  const label = formatPlayerLabel(
    color === 'white' ? game.white_name : game.black_name,
    rating,
    t,
  );

  return isBot ? `${label} (${t('games.bot_badge')})` : label;
}

function formatReasonLabel(reason: string, t: ReturnType<typeof useTranslation>['t']): string {
  const keyMap: Record<string, string> = {
    checkmate: 'games.reason_checkmate',
    resignation: 'games.reason_resignation',
    timeout: 'games.reason_timeout',
    stalemate: 'games.reason_stalemate',
    draw_agreement: 'games.reason_agreement',
    insufficient_material: 'games.reason_material',
    counting_rule: 'games.reason_counting',
    draw: 'games.reason_draw',
  };
  return keyMap[reason] ? t(keyMap[reason]) : t('games.reason_unknown');
}

function formatTimeAgoLabel(
  timestamp: number,
  t: ReturnType<typeof useTranslation>['t'],
  lang: ReturnType<typeof useTranslation>['lang'],
): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return t('time.just_now');
  if (seconds < 3600) return t('time.min_ago', { n: Math.floor(seconds / 60) });
  if (seconds < 86400) return t('time.hour_ago', { n: Math.floor(seconds / 3600) });
  if (seconds < 604800) return t('time.day_ago', { n: Math.floor(seconds / 86400) });
  return new Date(timestamp * 1000).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US');
}

function isLowSignalGame(game: GameEntry): boolean {
  if (game.move_count === 0) return true;
  if (game.result_reason === 'draw_agreement') return true;
  if ((game.result_reason === 'timeout' || game.result_reason === 'resignation') && game.move_count <= 1) {
    return true;
  }
  return false;
}

function renderGameRow(
  game: GameEntry,
  navigate: ReturnType<typeof useNavigate>,
  t: ReturnType<typeof useTranslation>['t'],
  lang: ReturnType<typeof useTranslation>['lang'],
  subdued: boolean = false,
) {
  const result = formatResult(game.result, game.result_reason);
  const botGame = isBotGame(game);

  return (
    <tr
      key={game.id}
      className={`border-b border-surface-hover/50 transition-colors ${
        subdued
          ? 'cursor-pointer opacity-70 hover:bg-surface-hover/20 hover:opacity-100'
          : 'cursor-pointer hover:bg-surface-hover/30'
      }`}
      onClick={() => navigate(savedGameAnalysisRoute(game.id))}
    >
      <td className="px-3 sm:px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="block max-w-[220px] truncate text-sm font-semibold text-text-bright sm:max-w-[340px] sm:text-base">
            {getParticipantLabel(game, 'white', t)} vs {getParticipantLabel(game, 'black', t)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {botGame ? (
              <span className="inline-flex w-fit rounded-full border border-surface-hover bg-surface px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">
                {t('games.bot_badge')}
              </span>
            ) : (
              <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
                game.rated
                  ? 'border border-primary/25 bg-primary/10 text-primary-light'
                  : 'border border-surface-hover bg-surface text-text-dim'
              }`}>
                {game.rated ? t('game.rated') : t('game.casual')}
              </span>
            )}
            {subdued && (
              <span className="inline-flex w-fit rounded-full border border-surface-hover bg-surface px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">
                {t('games.low_signal_badge')}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-3 text-text-dim hidden sm:table-cell">
        {formatTimeControl(game.time_control_initial, game.time_control_increment)}
      </td>
      <td className="px-3 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5">
          <span className={`font-bold ${result.color}`}>{result.text}</span>
          <span className="text-text-dim text-xs">{formatReasonLabel(game.result_reason, t)}</span>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-3 text-text-dim hidden md:table-cell">{game.move_count}</td>
      <td className="px-3 sm:px-4 py-3 text-text-dim text-right text-xs whitespace-nowrap">
        {formatTimeAgoLabel(game.finished_at, t, lang)}
      </td>
      <td className="px-3 sm:px-4 py-3 text-right">
        <button type="button"
          onClick={(e) => { e.stopPropagation(); navigate(savedGameAnalysisRoute(game.id)); }}
          className="ui-btn-secondary px-2.5 py-1 text-xs"
          title={t('analysis.analyze')}
        >
          {t('analysis.view')}
        </button>
      </td>
    </tr>
  );
}

export default function GamesPage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<GamesFilter>('all');
  const [showTools, setShowTools] = useState(false);
  const limit = 20;

  const handleFilterChange = (newFilter: GamesFilter) => {
    setFilter(newFilter);
    setPage(0);
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(gamesQueryOptions(page, limit, filter));

  const games = data?.games ?? [];
  const total = data?.total ?? 0;
  const emptyCopy = getEmptyHistoryCopy(filter, t);
  const botStats = data?.botStats ?? {
    gamesCount: 0,
    winRate: 0,
    highestBotLevelDefeated: null,
  };

  const totalPages = Math.ceil(total / limit);
  const highlightedGames = games.filter((game: GameEntry) => !isLowSignalGame(game));
  const lowSignalGames = games.filter((game: GameEntry) => isLowSignalGame(game));

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="games" />

      <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <div className="mb-4 space-y-4 sm:mb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="ui-title text-xl sm:text-2xl">{t('games.title')}</h1>
              <p className="mt-1 text-xs text-text-dim sm:text-sm">{t('games.count', { count: total })}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTools((current) => !current)}
              className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm"
              aria-expanded={showTools}
            >
              {showTools ? t('games.hide_tools') : t('games.more_tools')}
            </button>
          </div>

          {showTools && (
            <div className="flex flex-wrap gap-2">
              <button type="button"
                onClick={() => navigate(routes.gameDatabase)}
                className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm"
              >
                {t('nav.database')}
              </button>
              <button type="button"
                onClick={() => navigate(routes.openingExplorer)}
                className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm"
              >
                {t('nav.openings')}
              </button>
              <button type="button"
                onClick={() => navigate(routes.leaderboard)}
                className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm"
              >
                {t('games.view_leaderboard')}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(['all', 'rated', 'casual', 'bot'] as const).map((filterOption) => (
              <button
                key={filterOption}
                type="button"
                onClick={() => handleFilterChange(filterOption)}
                className={`ui-choice px-3 py-1.5 text-xs sm:text-sm font-semibold ${
                  filter === filterOption
                    ? 'ui-choice-selected'
                    : 'text-text-dim hover:text-text-bright'
                }`}
              >
                {t(`games.filter_${filterOption}`)}
              </button>
            ))}
          </div>

          {filter === 'bot' && (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-surface-hover/70 bg-surface/55 px-3 py-3">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('games.bot_games')}</div>
                <div className="mt-1 text-lg font-semibold text-text-bright">{botStats.gamesCount}</div>
              </div>
              <div className="rounded-xl border border-surface-hover/70 bg-surface/55 px-3 py-3">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('games.bot_win_rate')}</div>
                <div className="mt-1 text-lg font-semibold text-text-bright">{botStats.winRate}%</div>
              </div>
              <div className="rounded-xl border border-surface-hover/70 bg-surface/55 px-3 py-3">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('games.bot_highest_level')}</div>
                <div className="mt-1 text-lg font-semibold text-text-bright">
                  {botStats.highestBotLevelDefeated ? `Lv.${botStats.highestBotLevelDefeated}` : '-'}
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="ui-card rounded-2xl border-danger/30 bg-danger/10 px-6 py-10 text-center">
            <p className="text-danger">{mapGameplayErrorMessage(error, t, 'games.load_failed')}</p>
            <button type="button"
              onClick={() => { void refetch(); }}
              disabled={isFetching}
              className="button-accent-contrast mt-4 rounded-lg px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isFetching ? t('common.sending') : t('common.retry')}
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-surface-hover/70 bg-surface-alt/70 px-6 py-10 text-center sm:px-10 sm:py-12">
            <p className="mb-2 text-lg font-semibold text-text-bright sm:text-xl">{emptyCopy.title}</p>
            <p className="mx-auto mb-6 max-w-md text-sm text-text-dim sm:text-base">{emptyCopy.desc}</p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {filter === 'bot' ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(routes.bot)}
                    className="button-accent-contrast w-full rounded-lg px-5 py-2.5 text-sm font-bold sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                  >
                    {t('games.empty_play_bot')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(routes.quickPlay)}
                    className="ui-btn-secondary w-full px-5 py-2.5 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                  >
                    {t('games.empty_find')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(routes.quickPlay)}
                    className="button-accent-contrast w-full rounded-lg px-5 py-2.5 text-sm font-bold sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                  >
                    {t('games.empty_find')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(filter === 'rated' || filter === 'casual' ? routes.bot : routes.puzzles)}
                    className="ui-btn-secondary w-full px-5 py-2.5 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                  >
                    {filter === 'rated' || filter === 'casual' ? t('games.empty_play_bot') : t('nav.puzzles')}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {highlightedGames.length > 0 ? (
              <div className="mb-3 rounded-xl border border-surface-hover/70 bg-surface/45 px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold text-text-bright">{t('games.featured_title')}</p>
                <p className="mt-1 text-xs sm:text-sm text-text-dim">{t('games.featured_desc')}</p>
              </div>
            ) : (
              <div className="mb-3 rounded-xl border border-surface-hover/70 bg-surface/45 px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold text-text-bright">{t('games.no_featured_title')}</p>
                <p className="mt-1 text-xs sm:text-sm text-text-dim">{t('games.no_featured_desc')}</p>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-surface-hover/70 bg-surface-alt/70">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-surface-hover text-text-dim text-left">
                    <th className="px-3 sm:px-4 py-3 font-medium">{t('games.col_game')}</th>
                    <th className="px-3 sm:px-4 py-3 font-medium hidden sm:table-cell">{t('games.col_time')}</th>
                    <th className="px-3 sm:px-4 py-3 font-medium">{t('games.col_result')}</th>
                    <th className="px-3 sm:px-4 py-3 font-medium hidden md:table-cell">{t('games.col_moves')}</th>
                    <th className="px-3 sm:px-4 py-3 font-medium text-right">{t('games.col_when')}</th>
                    <th className="px-3 sm:px-4 py-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {highlightedGames.map((game: GameEntry) => renderGameRow(game, navigate, t, lang))}
                </tbody>
              </table>
            </div>

            {lowSignalGames.length > 0 && (
              <div className="mt-4 rounded-xl border border-surface-hover/70 bg-surface/45">
                <div className="border-b border-surface-hover px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold text-text-bright">{t('games.low_signal_title')}</p>
                  <p className="mt-1 text-xs sm:text-sm text-text-dim">{t('games.low_signal_desc')}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] text-sm">
                    <tbody>
                      {lowSignalGames.map((game: GameEntry) => renderGameRow(game, navigate, t, lang, true))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <button type="button"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="ui-btn-secondary px-3 py-1.5 text-sm text-text disabled:opacity-30"
                >
                  ← {t('games.prev')}
                </button>
                <span className="text-text-dim text-xs sm:text-sm px-3">
                  {t('games.page', { current: page + 1, total: totalPages })}
                </span>
                <button type="button"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="ui-btn-secondary px-3 py-1.5 text-sm text-text disabled:opacity-30"
                >
                  {t('games.next')} →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
