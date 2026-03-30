import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { routes, savedGameAnalysisRoute } from '../lib/routes';
import Header from './Header';

interface GameEntry {
  id: string;
  white_name: string;
  black_name: string;
  result: string;
  result_reason: string;
  rated?: number;
  game_mode?: string;
  game_type?: 'human' | 'bot';
  opponent_type?: string | null;
  opponent_name?: string | null;
  bot_level?: number | null;
  white_rating_before?: number | null;
  black_rating_before?: number | null;
  white_rating_after?: number | null;
  black_rating_after?: number | null;
  time_control_initial: number;
  time_control_increment: number;
  move_count: number;
  finished_at: number;
}

interface BotPerformanceStats {
  gamesCount: number;
  winRate: number;
  highestBotLevelDefeated: number | null;
}

type GamesFilter = 'all' | 'rated' | 'casual' | 'bot';

function formatTimeControl(initial: number, increment: number): string {
  const mins = Math.floor(initial / 60);
  return increment > 0 ? `${mins}+${increment}` : `${mins}+0`;
}

function formatResult(result: string, reason: string): { text: string; color: string } {
  if (result === 'draw') return { text: '½-½', color: 'text-accent' };
  if (result === 'white') return { text: '1-0', color: 'text-text-bright' };
  return { text: '0-1', color: 'text-text-bright' };
}

function formatPlayerLabel(name: string, rating: number | null | undefined): string {
  const displayName = name.trim() || 'Anonymous';
  return typeof rating === 'number' ? `${displayName} (${rating})` : displayName;
}

function isBotGame(game: GameEntry): boolean {
  return game.game_type === 'bot' || game.game_mode === 'bot' || game.opponent_type === 'bot';
}

function getParticipantLabel(game: GameEntry, color: 'white' | 'black'): string {
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
  );

  return isBot ? `🤖 ${label}` : label;
}

function formatReasonLabel(reason: string, t: ReturnType<typeof useTranslation>['t']): string {
  const keyMap: Record<string, string> = {
    checkmate: 'games.reason_checkmate',
    resignation: 'games.reason_resignation',
    timeout: 'games.reason_timeout',
    stalemate: 'games.reason_stalemate',
    draw_agreement: 'games.reason_agreement',
    counting_rule: 'games.reason_counting',
    draw: 'games.reason_draw',
  };
  return keyMap[reason] ? t(keyMap[reason]) : reason;
}

function formatTimeAgoLabel(timestamp: number, t: ReturnType<typeof useTranslation>['t']): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return t('time.just_now');
  if (seconds < 3600) return t('time.min_ago', { n: Math.floor(seconds / 60) });
  if (seconds < 86400) return t('time.hour_ago', { n: Math.floor(seconds / 3600) });
  if (seconds < 604800) return t('time.day_ago', { n: Math.floor(seconds / 86400) });
  return new Date(timestamp * 1000).toLocaleDateString();
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
          <span className="font-mono text-text-bright text-xs truncate block max-w-[100px] sm:max-w-[140px]">{game.id}</span>
          <span className="text-text-bright text-xs sm:text-sm truncate block max-w-[220px] sm:max-w-[340px]">
            {getParticipantLabel(game, 'white')} vs {getParticipantLabel(game, 'black')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {botGame ? (
              <span className="inline-flex w-fit rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                {t('games.bot_badge')}
              </span>
            ) : (
              <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                game.rated
                  ? 'bg-primary/15 text-primary-light'
                  : 'bg-surface text-text-dim border border-surface-hover'
              }`}>
                {game.rated ? t('game.rated') : t('game.casual')}
              </span>
            )}
            {subdued && (
              <span className="inline-flex w-fit rounded-full border border-surface-hover bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
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
        {formatTimeAgoLabel(game.finished_at, t)}
      </td>
      <td className="px-3 sm:px-4 py-3 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(savedGameAnalysisRoute(game.id)); }}
          className="px-2.5 py-1 rounded-md border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary-light text-xs font-semibold transition-colors"
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
  const { t } = useTranslation();
  const [games, setGames] = useState<GameEntry[]>([]);
  const [botStats, setBotStats] = useState<BotPerformanceStats>({
    gamesCount: 0,
    winRate: 0,
    highestBotLevelDefeated: null,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<GamesFilter>('all');
  const [loading, setLoading] = useState(true);

  const limit = 20;

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/games/recent?page=${page}&limit=${limit}&filter=${filter}`)
      .then(r => r.json())
      .then(data => {
        setGames(data.games || []);
        setTotal(data.total || 0);
        setBotStats(data.botStats || {
          gamesCount: 0,
          winRate: 0,
          highestBotLevelDefeated: null,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, filter]);

  const totalPages = Math.ceil(total / limit);
  const highlightedGames = games.filter(game => !isLowSignalGame(game));
  const lowSignalGames = games.filter(isLowSignalGame);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="games" />

      <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <div className="rounded-2xl border border-surface-hover bg-surface-alt/80 px-4 py-4 sm:px-5 sm:py-5 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-text-bright">{t('games.title')}</h2>
                <button
                  onClick={() => navigate(routes.leaderboard)}
                  className="px-3 py-1.5 rounded-lg border border-surface-hover bg-surface text-text-bright text-xs sm:text-sm font-semibold hover:bg-surface-hover transition-colors"
                >
                  {t('games.view_leaderboard')}
                </button>
              </div>
              <span className="text-text-dim text-xs sm:text-sm">{t('games.count', { count: total })}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'rated', 'casual', 'bot'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  type="button"
                  onClick={() => setFilter(filterOption)}
                  className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                    filter === filterOption
                      ? 'bg-primary text-white'
                      : 'border border-surface-hover bg-surface text-text-dim hover:bg-surface-hover'
                  }`}
                >
                  {t(`games.filter_${filterOption}`)}
                </button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-surface-hover bg-surface/65 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('games.bot_games')}</div>
                <div className="mt-1 text-lg font-semibold text-text-bright">{botStats.gamesCount}</div>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface/65 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('games.bot_win_rate')}</div>
                <div className="mt-1 text-lg font-semibold text-text-bright">{botStats.winRate}%</div>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface/65 px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('games.bot_highest_level')}</div>
                <div className="mt-1 text-lg font-semibold text-text-bright">
                  {botStats.highestBotLevelDefeated ? `Lv.${botStats.highestBotLevelDefeated}` : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-surface-hover bg-surface-alt px-6 py-10 sm:px-10 sm:py-12 text-center">
            <div className="text-4xl mb-4">♟</div>
            <p className="text-text-bright text-lg sm:text-xl font-semibold mb-2">{t('games.empty')}</p>
            <p className="text-text-dim text-sm sm:text-base mb-6 max-w-md mx-auto">{t('games.empty_desc')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(routes.quickPlay)}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                {t('home.find_opponent')}
              </button>
              <button
                onClick={() => navigate(routes.puzzles)}
                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-surface hover:bg-surface-hover text-text-bright font-semibold rounded-lg border border-surface-hover transition-colors text-sm sm:text-base"
              >
                {t('nav.puzzles')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {highlightedGames.length > 0 ? (
              <div className="mb-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold text-text-bright">{t('games.featured_title')}</p>
                <p className="mt-1 text-xs sm:text-sm text-text-dim">{t('games.featured_desc')}</p>
              </div>
            ) : (
              <div className="mb-3 rounded-2xl border border-surface-hover bg-surface-alt px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold text-text-bright">{t('games.no_featured_title')}</p>
                <p className="mt-1 text-xs sm:text-sm text-text-dim">{t('games.no_featured_desc')}</p>
              </div>
            )}

            <div className="bg-surface-alt rounded-xl border border-surface-hover overflow-x-auto">
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
                  {highlightedGames.map(game => renderGameRow(game, navigate, t))}
                </tbody>
              </table>
            </div>

            {lowSignalGames.length > 0 && (
              <div className="mt-4 rounded-xl border border-surface-hover bg-surface-alt/70">
                <div className="border-b border-surface-hover px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold text-text-bright">{t('games.low_signal_title')}</p>
                  <p className="mt-1 text-xs sm:text-sm text-text-dim">{t('games.low_signal_desc')}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] text-sm">
                    <tbody>
                      {lowSignalGames.map(game => renderGameRow(game, navigate, t, true))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 bg-surface-alt border border-surface-hover rounded text-sm disabled:opacity-30 hover:bg-surface-hover transition-colors text-text"
                >
                  ← {t('games.prev')}
                </button>
                <span className="text-text-dim text-xs sm:text-sm px-3">
                  {t('games.page', { current: page + 1, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 bg-surface-alt border border-surface-hover rounded text-sm disabled:opacity-30 hover:bg-surface-hover transition-colors text-text"
                >
                  {t('games.next')} →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-surface-alt border-t border-surface-hover py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6">
            {/* Play */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.play')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/quick-play" className="hover:text-primary transition-colors">{t('home.quick_play')}</a></li>
                <li><a href="/local" className="hover:text-primary transition-colors">{t('home.play_local')}</a></li>
                <li><a href="/bot" className="hover:text-primary transition-colors">{t('home.play_bot')}</a></li>
              </ul>
            </div>
            {/* Puzzles */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.puzzles')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/puzzles" className="hover:text-primary transition-colors">{t('puzzle.title')}</a></li>
              </ul>
            </div>
            {/* About */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('nav.about')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="/games" className="hover:text-primary transition-colors">{t('games.title')}</a></li>
                <li><a href="/leaderboard" className="hover:text-primary transition-colors">{t('leaderboard.title')}</a></li>
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">{t('footer.github')}</a></li>
              </ul>
            </div>
            {/* Community */}
            <div>
              <h4 className="text-text-bright font-semibold mb-3 text-sm">{t('footer.community')}</h4>
              <ul className="space-y-2 text-text-dim text-xs">
                <li><a href="https://github.com/ChindanaiNaKub/thaichess" target="_blank" rel="noopener" className="hover:text-primary transition-colors">{t('footer.star_github')}</a></li>
                <li><a href="/feedback" className="hover:text-primary transition-colors">{t('feedback.button')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-hover text-center">
            <p className="text-text-dim text-xs">{t('footer.tagline')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
