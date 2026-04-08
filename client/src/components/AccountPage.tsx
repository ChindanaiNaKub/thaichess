import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PUZZLES } from '@shared/puzzlesRuntime';
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

function StatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'primary' | 'danger';
}) {
  const valueClassName = tone === 'primary'
    ? 'text-primary'
    : tone === 'danger'
      ? 'text-danger'
      : 'text-text-bright';

  return (
    <div className="rounded-2xl border border-surface-hover/70 bg-surface/80 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-dim">{label}</div>
      <div className={`mt-3 text-2xl font-bold tracking-tight ${valueClassName}`}>{value}</div>
    </div>
  );
}

function SecondaryAction({
  children,
  danger = false,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className={danger
        ? 'w-full rounded-xl border border-danger/40 px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/8'
        : 'w-full rounded-xl border border-surface-hover/70 bg-surface/70 px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60'}
    >
      {children}
    </button>
  );
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

  const displayName = user.username || user.name || user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active={null} />
      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.82fr)]">
          <section className="rounded-[2rem] border border-surface-hover/60 bg-surface-alt p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-light">
                    {t('account.hero_eyebrow')}
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-bright sm:text-4xl">
                    {t('account.title')}
                  </h1>
                  <p className="mt-2 text-sm text-text">{user.email}</p>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-text-bright/88">
                    {t('account.hero_desc')}
                  </p>
                </div>
                <div className="rounded-2xl border border-surface-hover/70 bg-surface px-4 py-3 text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-light">
                    {t('account.username')}
                  </div>
                  <div className="mt-2 text-lg font-bold text-text-bright">{displayName}</div>
                  <div className="mt-1 text-xs text-text">{user.role}</div>
                </div>
              </div>

              {user.fair_play_status === 'restricted' && (
                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-200">
                  <div className="font-semibold">{t('account.rated_restricted_title')}</div>
                  <p className="mt-1 text-amber-100/90">{t('account.rated_restricted_desc')}</p>
                  {user.rated_restriction_note && (
                    <p className="mt-2 text-xs text-amber-100/80">{user.rated_restriction_note}</p>
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatTile label={t('account.rating')} value={user.rating} />
                <StatTile label={t('account.rated_games')} value={user.rated_games} />
                <StatTile label={t('account.wins')} value={user.wins} tone="primary" />
                <StatTile label={t('account.losses')} value={user.losses} tone="danger" />
                <StatTile label={t('account.draws')} value={user.draws} />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
                <form onSubmit={handleSave} className="rounded-[1.75rem] border border-surface-hover/60 bg-surface/75 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">
                      {t('account.username')}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-text-bright">
                      {t('account.save_profile')}
                    </h2>
                  </div>
                  <label className="mt-5 block">
                    <span className="mb-2 block text-sm font-medium text-text-bright">{t('account.username')}</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('account.username_placeholder')}
                      className="w-full rounded-xl border border-surface-hover bg-surface-alt px-4 py-3 text-text-bright outline-none transition-colors placeholder:text-text-dim/75 focus:border-primary"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-4 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
                  >
                    {saving ? t('account.saving') : t('account.save_profile')}
                  </button>
                  {message && <p className="mt-4 text-sm text-primary">{message}</p>}
                  {error && <p className="mt-4 text-sm text-danger">{error}</p>}
                </form>

                <div className="rounded-[1.75rem] border border-surface-hover/60 bg-surface/55 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-dim">
                    {t('account.actions_title')}
                  </p>
                  <div className="mt-4 space-y-3">
                    <SecondaryAction onClick={() => navigate(routes.leaderboard)}>
                      {t('leaderboard.title')}
                    </SecondaryAction>
                    {user.role === 'admin' && (
                      <>
                        <SecondaryAction onClick={() => navigate(routes.feedback)}>
                          {t('account.open_feedback')}
                        </SecondaryAction>
                        <SecondaryAction onClick={() => navigate(routes.fairPlay)}>
                          {t('account.open_fair_play')}
                        </SecondaryAction>
                      </>
                    )}
                    <SecondaryAction
                      danger
                      onClick={async () => {
                        await logout();
                        navigate(routes.home, { replace: true });
                      }}
                    >
                      {t('account.sign_out')}
                    </SecondaryAction>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="grid gap-5 content-start">
            <section className="rounded-[1.9rem] border border-surface-hover/60 bg-surface-alt/78 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">{t('account.puzzle_eyebrow')}</p>
                  <h2 className="mt-3 text-2xl font-bold text-text-bright">{t('account.puzzle_title')}</h2>
                  <p className="mt-2 text-sm leading-6 text-text-dim">{t('account.puzzle_desc')}</p>
                </div>
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-light">
                  {t('puzzle.completed', { done: puzzleProgress.completedCount, total: puzzleProgress.totalCount })}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <StatTile label={t('account.puzzle_completed_label')} value={puzzleProgress.completedCount} />
                <StatTile
                  label={t('account.puzzle_remaining_label')}
                  value={Math.max(puzzleProgress.totalCount - puzzleProgress.completedCount, 0)}
                />
                <StatTile
                  label={t('account.puzzle_focus_label')}
                  value={puzzleProgress.favoriteTheme ? t(`theme.${puzzleProgress.favoriteTheme}`) : t('account.puzzle_focus_empty')}
                />
              </div>

              <div className="mt-4 text-sm text-text-dim">
                {t('account.puzzle_percent', { percent: puzzleProgress.percentComplete, total: puzzleProgress.totalCount || PUZZLES.length })}
              </div>
            </section>

            <section className="rounded-[1.9rem] border border-primary/20 bg-primary/10 p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">
                {t('account.puzzle_next_label')}
              </p>
              {continuePuzzle ? (
                <>
                  <div className="text-2xl font-bold leading-tight text-text-bright">
                    #{continuePuzzle.id} · {getPublicPuzzleTitle(continuePuzzle.title)}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text">
                    {continuePuzzle.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-surface-hover/70 bg-surface/75 px-3 py-1 text-xs text-text-dim">
                      {t(`puzzle.${continuePuzzle.difficulty}`)}
                    </span>
                    <span className="rounded-full border border-surface-hover/70 bg-surface/75 px-3 py-1 text-xs text-text-dim">
                      {t(`theme.${continuePuzzle.theme}`)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!continuePuzzle) return;
                      navigate(puzzleRoute(String(continuePuzzle.id)));
                    }}
                    className="mt-5 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    {t('account.puzzle_continue')}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-text-bright">{t('account.puzzle_all_done')}</div>
                  <p className="mt-3 text-sm leading-6 text-text-dim">{t('account.puzzle_all_done_desc')}</p>
                  <button
                    type="button"
                    onClick={() => navigate(routes.lessons)}
                    className="mt-5 w-full rounded-xl border border-surface-hover/70 bg-surface/70 py-3.5 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60"
                  >
                    {t('puzzle.all_lessons')}
                  </button>
                </>
              )}
            </section>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
              <section className="rounded-[1.6rem] border border-surface-hover/60 bg-surface-alt/76 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-text-dim">
                  {t('account.puzzle_last_played_label')}
                </p>
                {puzzleProgress.lastPlayed ? (
                  <>
                    <div className="font-semibold text-text-bright">
                      #{puzzleProgress.lastPlayed.puzzle.id} · {getPublicPuzzleTitle(puzzleProgress.lastPlayed.puzzle.title)}
                    </div>
                    <p className="mt-2 text-sm text-text-dim">
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
              </section>

              <section className="rounded-[1.6rem] border border-surface-hover/60 bg-surface-alt/76 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-text-dim">
                  {t('account.puzzle_recent_label')}
                </p>
                {puzzleProgress.recentCompleted.length > 0 ? (
                  <div className="space-y-3">
                    {puzzleProgress.recentCompleted.map((entry) => (
                      <button
                        key={entry.puzzle.id}
                        type="button"
                        onClick={() => navigate(puzzleRoute(String(entry.puzzle.id)))}
                        className="w-full rounded-xl border border-surface-hover/60 bg-surface/65 px-4 py-3 text-left transition-colors hover:bg-surface-hover/60"
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
              </section>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
