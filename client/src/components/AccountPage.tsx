import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PUZZLES } from '@shared/puzzles';
import Header from './Header';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';
import { usePuzzleProgressSummary } from '../lib/puzzleProgress';
import { puzzleRoute, routes } from '../lib/routes';

function getPublicPuzzleTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}

function formatPuzzleActivityDate(timestamp: number, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp * 1000));
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, logout, updateProfile } = useAuth();
  const { t, lang } = useTranslation();
  const puzzleProgress = usePuzzleProgressSummary();
  const continuePuzzle = puzzleProgress.continuePuzzle;
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, navigate, user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(username);
      setMessage(t('account.profile_updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.update_failed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text-dim">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="about" />
      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <div className="bg-surface-alt border border-surface-hover rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-text-bright">{t('account.title')}</h1>
                <p className="text-text-dim text-sm mt-1">{user.email}</p>
              </div>
              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-surface text-text-bright border border-surface-hover">
                {user.role}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-surface-hover bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.rating')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">{user.rating}</div>
                </div>
                <div className="rounded-xl border border-surface-hover bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.rated_games')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">{user.rated_games}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-surface-hover bg-surface p-4 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.wins')}</div>
                  <div className="mt-2 text-xl font-bold text-primary">{user.wins}</div>
                </div>
                <div className="rounded-xl border border-surface-hover bg-surface p-4 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.losses')}</div>
                  <div className="mt-2 text-xl font-bold text-danger">{user.losses}</div>
                </div>
                <div className="rounded-xl border border-surface-hover bg-surface p-4 text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.draws')}</div>
                  <div className="mt-2 text-xl font-bold text-text-bright">{user.draws}</div>
                </div>
              </div>

              <label className="block">
                <span className="block text-sm text-text-dim mb-2">{t('account.username')}</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('account.username_placeholder')}
                  className="w-full rounded-lg border border-surface-hover bg-surface px-3 py-2 text-text-bright outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold disabled:opacity-60"
              >
                {saving ? t('account.saving') : t('account.save_profile')}
              </button>
            </form>

            {message && <p className="text-sm text-primary mt-4">{message}</p>}
            {error && <p className="text-sm text-danger mt-4">{error}</p>}

            <div className="mt-6 pt-6 border-t border-surface-hover space-y-3">
              <button
                onClick={() => navigate('/leaderboard')}
                className="w-full py-2 rounded-lg border border-surface-hover text-text"
              >
                {t('leaderboard.title')}
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/feedback')}
                  className="w-full py-2 rounded-lg border border-surface-hover text-text"
                >
                  {t('account.open_feedback')}
                </button>
              )}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/', { replace: true });
                }}
                className="w-full py-2 rounded-lg border border-danger/40 text-danger"
              >
                {t('account.sign_out')}
              </button>
            </div>
          </div>

          <aside className="bg-surface-alt border border-surface-hover rounded-2xl p-6 h-fit">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary-light mb-2">{t('account.puzzle_eyebrow')}</p>
                <h2 className="text-2xl font-bold text-text-bright">{t('account.puzzle_title')}</h2>
                <p className="text-text-dim text-sm mt-2">{t('account.puzzle_desc')}</p>
              </div>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-light">
                {t('puzzle.completed', { done: puzzleProgress.completedCount, total: puzzleProgress.totalCount })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-surface-hover bg-surface p-4 text-center">
                <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.puzzle_completed_label')}</div>
                <div className="mt-2 text-xl font-bold text-text-bright">{puzzleProgress.completedCount}</div>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface p-4 text-center">
                <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.puzzle_remaining_label')}</div>
                <div className="mt-2 text-xl font-bold text-text-bright">{Math.max(puzzleProgress.totalCount - puzzleProgress.completedCount, 0)}</div>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface p-4 text-center">
                <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('account.puzzle_focus_label')}</div>
                <div className="mt-2 text-sm font-bold text-text-bright">
                  {puzzleProgress.favoriteTheme ? t(`theme.${puzzleProgress.favoriteTheme}`) : t('account.puzzle_focus_empty')}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-primary-light mb-2">{t('account.puzzle_next_label')}</p>
              {continuePuzzle ? (
                <>
                  <div className="text-lg font-semibold text-text-bright">
                    #{continuePuzzle.id} · {getPublicPuzzleTitle(continuePuzzle.title)}
                  </div>
                  <p className="text-sm text-text-dim mt-2">{continuePuzzle.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                      {t(`puzzle.${continuePuzzle.difficulty}`)}
                    </span>
                    <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                      {t(`theme.${continuePuzzle.theme}`)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!continuePuzzle) return;
                      navigate(puzzleRoute(String(continuePuzzle.id)));
                    }}
                    className="mt-4 w-full py-2.5 rounded-lg bg-primary text-white font-semibold"
                  >
                    {t('account.puzzle_continue')}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold text-text-bright">{t('account.puzzle_all_done')}</div>
                  <p className="text-sm text-text-dim mt-2">{t('account.puzzle_all_done_desc')}</p>
                  <button
                    onClick={() => navigate(routes.lessons)}
                    className="mt-4 w-full py-2.5 rounded-lg border border-surface-hover text-text"
                  >
                    {t('puzzle.all_lessons')}
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-surface-hover bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim mb-2">{t('account.puzzle_last_played_label')}</p>
                {puzzleProgress.lastPlayed ? (
                  <>
                    <div className="font-semibold text-text-bright">
                      #{puzzleProgress.lastPlayed.puzzle.id} · {getPublicPuzzleTitle(puzzleProgress.lastPlayed.puzzle.title)}
                    </div>
                    <p className="text-sm text-text-dim mt-1">
                      {t('account.puzzle_last_played_meta', {
                        date: formatPuzzleActivityDate(puzzleProgress.lastPlayed.lastPlayedAt, lang),
                        status: puzzleProgress.lastPlayed.completedAt === null
                          ? t('account.puzzle_status_in_progress')
                          : t('account.puzzle_status_solved'),
                      })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-text-dim">{t('account.puzzle_last_played_empty')}</p>
                )}
              </div>

              <div className="rounded-xl border border-surface-hover bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim mb-2">{t('account.puzzle_recent_label')}</p>
                {puzzleProgress.recentCompleted.length > 0 ? (
                  <div className="space-y-3">
                    {puzzleProgress.recentCompleted.map((entry) => (
                      <button
                        key={entry.puzzle.id}
                        type="button"
                        onClick={() => navigate(puzzleRoute(String(entry.puzzle.id)))}
                        className="w-full rounded-lg border border-surface-hover bg-surface-alt px-3 py-3 text-left transition-colors hover:bg-surface-hover/60"
                      >
                        <div className="font-medium text-text-bright">
                          #{entry.puzzle.id} · {getPublicPuzzleTitle(entry.puzzle.title)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-dim">
                          <span>{t(`theme.${entry.puzzle.theme}`)}</span>
                          <span>{t('account.puzzle_recent_meta', { date: formatPuzzleActivityDate(entry.completedAt ?? entry.lastPlayedAt, lang) })}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-dim">{t('account.puzzle_recent_empty')}</p>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-text-dim">
              {t('account.puzzle_percent', { percent: puzzleProgress.percentComplete, total: puzzleProgress.totalCount || PUZZLES.length })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
