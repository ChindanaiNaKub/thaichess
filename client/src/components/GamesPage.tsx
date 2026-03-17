import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PieceSVG from './PieceSVG';

interface GameEntry {
  id: string;
  result: string;
  result_reason: string;
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

function formatReason(reason: string): string {
  const map: Record<string, string> = {
    checkmate: 'Checkmate',
    resignation: 'Resignation',
    timeout: 'Timeout',
    stalemate: 'Stalemate',
    draw_agreement: 'Agreement',
    draw: 'Draw',
  };
  return map[reason] || reason;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

export default function GamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = 20;

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
      <header className="bg-surface-alt border-b border-surface-hover">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PieceSVG type="K" color="white" size={36} />
            <h1 className="text-xl font-bold text-text-bright tracking-tight">Makruk</h1>
          </button>
          <nav className="flex items-center gap-4 text-sm">
            <button onClick={() => navigate('/')} className="text-text-dim hover:text-text-bright transition-colors">Play</button>
            <span className="text-primary font-medium">Games</span>
            <button onClick={() => navigate('/about')} className="text-text-dim hover:text-text-bright transition-colors">About</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-bright">Recent Games</h2>
          <span className="text-text-dim text-sm">{total} game{total !== 1 ? 's' : ''} played</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">♟</div>
            <p className="text-text-dim text-lg mb-2">No games yet</p>
            <p className="text-text-dim text-sm mb-6">Be the first to play!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors"
            >
              Start Playing
            </button>
          </div>
        ) : (
          <>
            <div className="bg-surface-alt rounded-xl border border-surface-hover overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-hover text-text-dim text-left">
                    <th className="px-4 py-3 font-medium">Game</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Time</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Moves</th>
                    <th className="px-4 py-3 font-medium text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => {
                    const result = formatResult(game.result, game.result_reason);
                    return (
                      <tr
                        key={game.id}
                        className="border-b border-surface-hover/50 hover:bg-surface-hover/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/game/${game.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-text-bright text-xs">{game.id}</span>
                        </td>
                        <td className="px-4 py-3 text-text-dim hidden sm:table-cell">
                          {formatTimeControl(game.time_control_initial, game.time_control_increment)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${result.color}`}>{result.text}</span>
                          <span className="text-text-dim text-xs ml-2">{formatReason(game.result_reason)}</span>
                        </td>
                        <td className="px-4 py-3 text-text-dim hidden sm:table-cell">{game.move_count}</td>
                        <td className="px-4 py-3 text-text-dim text-right text-xs">
                          {timeAgo(game.finished_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 bg-surface-alt border border-surface-hover rounded text-sm disabled:opacity-30 hover:bg-surface-hover transition-colors text-text"
                >
                  ← Prev
                </button>
                <span className="text-text-dim text-sm px-3">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 bg-surface-alt border border-surface-hover rounded text-sm disabled:opacity-30 hover:bg-surface-hover transition-colors text-text"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-surface-alt border-t border-surface-hover py-4 text-center text-text-dim text-sm">
        Makruk Online — Free & Open Source
      </footer>
    </div>
  );
}
