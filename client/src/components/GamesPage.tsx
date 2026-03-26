import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { routes, savedGameAnalysisRoute } from '../lib/routes';
import Header from './Header';

interface GameEntry {
  id: string;
  result: string;
  result_reason: string;
  rated?: number;
  game_mode?: string;
  time_control_initial: number;
  time_control_increment: number;
  move_count: number;
  finished_at: number;
}

function formatTimeControl(initial: number, increment: number): string {
  const mins = Math.floor(initial / 60);
  return increment > 0 ? `${mins}+${increment}` : `${mins}+0`;
}

function formatResult(result: string, reason: string): { text: string; color: string } {
  if (result === 'draw') return { text: '½-½', color: 'text-accent' };
  if (result === 'white') return { text: '1-0', color: 'text-text-bright' };
  return { text: '0-1', color: 'text-text-bright' };
}

export default function GamesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [games, setGames] = useState<GameEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = 20;

  function formatReason(reason: string): string {
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

  function timeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return t('time.just_now');
    if (seconds < 3600) return t('time.min_ago', { n: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('time.hour_ago', { n: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('time.day_ago', { n: Math.floor(seconds / 86400) });
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/games/recent?page=${page}&limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        setGames(data.games || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="games" />

      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-text-bright">{t('games.title')}</h2>
            <button
              onClick={() => navigate(routes.leaderboard)}
              className="px-3 py-1.5 rounded-lg border border-surface-hover bg-surface-alt text-text-bright text-xs sm:text-sm font-semibold hover:bg-surface-hover transition-colors"
            >
              {t('games.view_leaderboard')}
            </button>
          </div>
          <span className="text-text-dim text-xs sm:text-sm">{t('games.count', { count: total })}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-4xl mb-4">♟</div>
            <p className="text-text-dim text-base sm:text-lg mb-2">{t('games.empty')}</p>
            <p className="text-text-dim text-sm mb-6">{t('games.empty_desc')}</p>
            <button
              onClick={() => navigate(routes.home)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              {t('games.start')}
            </button>
          </div>
        ) : (
          <>
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
                  {games.map(game => {
                    const result = formatResult(game.result, game.result_reason);
                    return (
                      <tr
                        key={game.id}
                        className="border-b border-surface-hover/50 hover:bg-surface-hover/30 cursor-pointer transition-colors"
                        onClick={() => navigate(savedGameAnalysisRoute(game.id))}
                      >
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-text-bright text-xs truncate block max-w-[100px] sm:max-w-[140px]">{game.id}</span>
                            <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              game.rated
                                ? 'bg-primary/15 text-primary-light'
                                : 'bg-surface text-text-dim border border-surface-hover'
                            }`}>
                              {game.rated ? t('game.rated') : t('game.casual')}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-text-dim hidden sm:table-cell">
                          {formatTimeControl(game.time_control_initial, game.time_control_increment)}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5">
                            <span className={`font-bold ${result.color}`}>{result.text}</span>
                            <span className="text-text-dim text-xs">{formatReason(game.result_reason)}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-text-dim hidden md:table-cell">{game.move_count}</td>
                        <td className="px-3 sm:px-4 py-3 text-text-dim text-right text-xs whitespace-nowrap">
                          {timeAgo(game.finished_at)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(savedGameAnalysisRoute(game.id)); }}
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs rounded transition-colors"
                            title={t('analysis.analyze')}
                          >
                            🔍
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
