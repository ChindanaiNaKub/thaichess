import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';

interface LeaderboardEntry {
  id: string;
  display_name: string;
  rating: number;
  rated_games: number;
  wins: number;
  losses: number;
  draws: number;
}

function formatRecord(player: LeaderboardEntry): string {
  return `${player.wins}-${player.losses}-${player.draws}`;
}

function getWinRate(player: LeaderboardEntry): string {
  if (player.rated_games === 0) return '0%';
  return `${Math.round((player.wins / player.rated_games) * 100)}%`;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard?limit=50')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load leaderboard (${response.status})`);
        }

        return response.json();
      })
      .then((data) => {
        setPlayers(data.players || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="games" subtitle={t('leaderboard.title')} />

      <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-light">{t('leaderboard.eyebrow')}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-bright mt-2">{t('leaderboard.title')}</h1>
            <p className="text-sm text-text-dim mt-2">{t('leaderboard.desc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-dim text-xs sm:text-sm">{t('leaderboard.count', { count: total })}</span>
            <button
              onClick={() => navigate('/games')}
              className="px-3 py-2 rounded-lg border border-surface-hover bg-surface-alt text-text-bright text-sm font-semibold hover:bg-surface-hover transition-colors"
            >
              {t('leaderboard.view_recent')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-surface-hover bg-surface-alt">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-text-bright text-lg font-semibold">{t('leaderboard.empty')}</p>
            <p className="text-text-dim text-sm mt-2">{t('leaderboard.empty_desc')}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-surface-hover bg-surface-alt overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[80px_1.5fr_120px_120px_140px_100px] gap-3 px-4 py-3 border-b border-surface-hover text-[11px] sm:text-xs uppercase tracking-[0.18em] text-text-dim font-semibold">
              <span>{t('leaderboard.col_rank')}</span>
              <span>{t('leaderboard.col_player')}</span>
              <span className="text-right">{t('leaderboard.col_rating')}</span>
              <span className="hidden sm:block text-right">{t('leaderboard.col_games')}</span>
              <span className="hidden sm:block text-right">{t('leaderboard.col_record')}</span>
              <span className="hidden sm:block text-right">{t('leaderboard.col_winrate')}</span>
            </div>

            <div className="divide-y divide-surface-hover/70">
              {players.map((player, index) => {
                const isCurrentUser = user?.id === player.id;
                const podiumClass = index === 0
                  ? 'bg-[linear-gradient(90deg,rgba(199,162,79,0.18),transparent)]'
                  : index === 1
                    ? 'bg-[linear-gradient(90deg,rgba(148,163,184,0.16),transparent)]'
                    : index === 2
                      ? 'bg-[linear-gradient(90deg,rgba(180,120,85,0.16),transparent)]'
                      : '';

                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-[auto_1fr_auto] sm:grid-cols-[80px_1.5fr_120px_120px_140px_100px] gap-3 px-4 py-4 items-center ${podiumClass} ${isCurrentUser ? 'ring-1 ring-primary/50 ring-inset' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                          index === 1 ? 'bg-slate-300/15 text-slate-200' :
                            index === 2 ? 'bg-orange-500/15 text-orange-300' :
                              'bg-surface text-text-dim'
                      }`}>
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-text-bright truncate">{player.display_name}</span>
                        {isCurrentUser && (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] bg-primary/15 text-primary-light">
                            {t('leaderboard.you')}
                          </span>
                        )}
                      </div>
                      <div className="sm:hidden mt-1 text-xs text-text-dim">
                        {t('leaderboard.mobile_stats', {
                          games: player.rated_games,
                          record: formatRecord(player),
                          winrate: getWinRate(player),
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-text-bright">{player.rating}</div>
                    </div>

                    <div className="hidden sm:block text-right text-text-dim">{player.rated_games}</div>
                    <div className="hidden sm:block text-right text-text-dim">{formatRecord(player)}</div>
                    <div className="hidden sm:block text-right text-text-dim">{getWinRate(player)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
