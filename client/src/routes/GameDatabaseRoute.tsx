import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../lib/i18n';
import { routes, savedGameAnalysisRoute } from '../lib/routes';
import { gameSearchQueryOptions, type GameEntry, type GameSearchParams } from '../queries/games';
import Header from '../components/Header';
import Footer from '../components/Footer';

function formatTimeControl(initial: number, increment: number): string {
  const mins = Math.floor(initial / 60);
  return increment > 0 ? `${mins}+${increment}` : `${mins}+0`;
}

function formatResult(result: string): { text: string; color: string } {
  if (result === 'draw') return { text: '½-½', color: 'text-accent' };
  if (result === 'white') return { text: '1-0', color: 'text-text-bright' };
  return { text: '0-1', color: 'text-text-bright' };
}

function formatPlayerLabel(name: string, rating: number | null | undefined): string {
  const displayName = name.trim() || 'Anonymous';
  return typeof rating === 'number' ? `${displayName} (${rating})` : displayName;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

function GameRow({ game, onClick }: { game: GameEntry; onClick: () => void }) {
  const result = formatResult(game.result);
  const isBot = game.game_type === 'bot' || game.game_mode === 'bot';

  return (
    <tr
      className="border-b border-surface-hover/50 cursor-pointer hover:bg-surface-hover/30 transition-colors"
      onClick={onClick}
    >
      <td className="px-3 sm:px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-text-bright text-xs truncate block max-w-[100px] sm:max-w-[140px]">{game.id}</span>
          <span className="text-text-bright text-xs sm:text-sm truncate block max-w-[220px] sm:max-w-[340px]">
            {formatPlayerLabel(game.white_name, game.white_rating_before ?? game.white_rating_after)} vs {formatPlayerLabel(game.black_name, game.black_rating_before ?? game.black_rating_after)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {isBot ? (
              <span className="inline-flex w-fit rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                Bot
              </span>
            ) : (
              <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                game.rated
                  ? 'bg-primary/15 text-primary-light'
                  : 'bg-surface text-text-dim border border-surface-hover'
              }`}>
                {game.rated ? 'Rated' : 'Casual'}
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
          <span className="text-text-dim text-xs">{game.result_reason}</span>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-3 text-text-dim hidden md:table-cell">{game.move_count}</td>
      <td className="px-3 sm:px-4 py-3 text-text-dim text-right text-xs whitespace-nowrap">
        {formatTimeAgo(game.finished_at)}
      </td>
      <td className="px-3 sm:px-4 py-3 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="ui-btn-primary px-2.5 py-1 text-xs"
        >
          Analyze
        </button>
      </td>
    </tr>
  );
}

export default function GameDatabaseRoute() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  void t; // i18n hook used for future translations
  const [page, setPage] = useState(0);
  const limit = 20;

  const [searchParams, setSearchParams] = useState<GameSearchParams>({});
  const [pendingParams, setPendingParams] = useState<GameSearchParams>({});

  const handleSearch = useCallback(() => {
    setSearchParams(pendingParams);
    setPage(0);
  }, [pendingParams]);

  const handleReset = useCallback(() => {
    setPendingParams({});
    setSearchParams({});
    setPage(0);
  }, []);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery(gameSearchQueryOptions({ ...searchParams, page, limit }));

  const games = data?.games ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="games" />

      <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <div className="ui-card mb-4 px-4 py-4 sm:mb-6 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="ui-title text-xl sm:text-2xl">Game Database</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(routes.openingExplorer)}
                  className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm"
                >
                  Opening Explorer
                </button>
                <button
                  onClick={() => navigate(routes.leaderboard)}
                  className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm"
                >
                  Leaderboard
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-text-dim mb-1">Player</label>
                <input
                  type="text"
                  value={pendingParams.player ?? ''}
                  onChange={(e) => setPendingParams(p => ({ ...p, player: e.target.value || undefined }))}
                  placeholder="Search player name..."
                  className="w-full rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-text-dim mb-1">Min Rating</label>
                <input
                  type="number"
                  value={pendingParams.minRating ?? ''}
                  onChange={(e) => setPendingParams(p => ({ ...p, minRating: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                  placeholder="500"
                  className="w-full rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-text-dim mb-1">Max Rating</label>
                <input
                  type="number"
                  value={pendingParams.maxRating ?? ''}
                  onChange={(e) => setPendingParams(p => ({ ...p, maxRating: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                  placeholder="3000"
                  className="w-full rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-text-dim mb-1">Result</label>
                <select
                  value={pendingParams.result ?? ''}
                  onChange={(e) => setPendingParams(p => ({ ...p, result: (e.target.value as 'white' | 'black' | 'draw') || undefined }))}
                  className="w-full rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm text-text-bright focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Any</option>
                  <option value="white">White wins</option>
                  <option value="black">Black wins</option>
                  <option value="draw">Draw</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-text-dim mb-1">Type</label>
                <select
                  value={pendingParams.rated === true ? 'rated' : pendingParams.rated === false ? 'casual' : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPendingParams(p => ({
                      ...p,
                      rated: val === 'rated' ? true : val === 'casual' ? false : undefined,
                    }));
                  }}
                  className="w-full rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm text-text-bright focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Any</option>
                  <option value="rated">Rated</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-text-dim mb-1">Mode</label>
                <select
                  value={pendingParams.gameMode ?? ''}
                  onChange={(e) => setPendingParams(p => ({ ...p, gameMode: e.target.value || undefined }))}
                  className="w-full rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm text-text-bright focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Any</option>
                  <option value="quick_play">Quick Play</option>
                  <option value="private">Private</option>
                  <option value="bot">Bot</option>
                  <option value="local">Local</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleSearch} className="ui-btn-primary px-4 py-2 text-sm">
                Search
              </button>
              <button onClick={handleReset} className="ui-btn-secondary px-4 py-2 text-sm">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="ui-card mb-4 px-4 py-3 flex items-center justify-between">
          <span className="text-text-dim text-sm">{total} games found</span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-text-dim text-xs px-2 py-1">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="ui-card rounded-2xl border-danger/30 bg-danger/10 px-6 py-10 text-center">
            <p className="text-danger">{error?.message || 'Failed to load games'}</p>
            <button onClick={() => window.location.reload()} className="ui-btn-primary mt-4 px-4 py-2">
              Retry
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="ui-card rounded-2xl px-6 py-10 text-center sm:px-10 sm:py-12">
            <div className="text-4xl mb-4">♟</div>
            <p className="text-text-bright text-lg sm:text-xl font-semibold mb-2">No games found</p>
            <p className="text-text-dim text-sm sm:text-base mb-6 max-w-md mx-auto">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="ui-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover/30 text-text-dim text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Players</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold hidden sm:table-cell">Time</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Result</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold hidden md:table-cell">Moves</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold text-right">Date</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <GameRow
                    key={game.id}
                    game={game}
                    onClick={() => navigate(savedGameAnalysisRoute(game.id))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
