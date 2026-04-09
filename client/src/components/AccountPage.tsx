import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PUZZLES } from '@shared/puzzlesRuntime';
import Header from './Header';
import { useAuth } from '../lib/auth';
import { authClient } from '../lib/authClient';
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

function formatSessionDate(value: string | Date, lang: string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
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
  const { user, loading, logout, refreshUser, updateProfile } = useAuth();
  const { t, lang } = useTranslation();
  const betterAuthSession = authClient.useSession();
  const puzzleProgress = usePuzzleProgressSummary();
  const continuePuzzle = puzzleProgress.continuePuzzle;
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [adminSetupUri, setAdminSetupUri] = useState('');
  const [adminSetupCode, setAdminSetupCode] = useState('');
  const [pendingAdminBackupCodes, setPendingAdminBackupCodes] = useState<string[]>([]);
  const [revealedAdminBackupCodes, setRevealedAdminBackupCodes] = useState<string[]>([]);
  const [adminSecurityError, setAdminSecurityError] = useState('');
  const [adminSecurityMessage, setAdminSecurityMessage] = useState('');
  const [adminEnabling, setAdminEnabling] = useState(false);
  const [adminVerifying, setAdminVerifying] = useState(false);
  const [sessions, setSessions] = useState<Array<{
    token: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    createdAt: string | Date;
    expiresAt: string | Date;
  }>>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

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
  const adminMfaEnabled = user.twoFactorEnabled || revealedAdminBackupCodes.length > 0;
  const currentSessionToken = betterAuthSession.data?.session.token ?? null;

  async function handleAdminMfaSetup() {
    setAdminEnabling(true);
    setAdminSecurityError('');
    setAdminSecurityMessage('');

    try {
      const response = await authClient.twoFactor.enable({ issuer: 'ThaiChess' });
      if (response.error) {
        throw response.error;
      }

      setAdminSetupUri(response.data?.totpURI ?? '');
      setPendingAdminBackupCodes(response.data?.backupCodes ?? []);
      setAdminSecurityMessage('Authenticator setup started. Scan the URI and verify one code to finish enabling admin MFA.');
    } catch (setupError) {
      setAdminSecurityError(setupError instanceof Error ? setupError.message : 'Failed to start admin MFA setup.');
    } finally {
      setAdminEnabling(false);
    }
  }

  async function handleAdminMfaVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminVerifying(true);
    setAdminSecurityError('');
    setAdminSecurityMessage('');

    try {
      const response = await authClient.twoFactor.verifyTotp({ code: adminSetupCode });
      if (response.error) {
        throw response.error;
      }

      await refreshUser();
      setRevealedAdminBackupCodes(pendingAdminBackupCodes);
      setPendingAdminBackupCodes([]);
      setAdminSetupUri('');
      setAdminSecurityMessage('Admin MFA is now enabled. Save your backup codes before leaving this page.');
      setAdminSetupCode('');
    } catch (verifyError) {
      setAdminSecurityError(verifyError instanceof Error ? verifyError.message : 'Failed to verify admin MFA.');
    } finally {
      setAdminVerifying(false);
    }
  }

  async function handleLoadSessions() {
    setSessionsLoading(true);
    setSessionsError('');

    try {
      const response = await authClient.listSessions();
      if (response.error) {
        throw response.error;
      }

      setSessions(response.data ?? []);
      setSessionsLoaded(true);
    } catch (sessionError) {
      setSessionsError(sessionError instanceof Error ? sessionError.message : 'Failed to load active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleRevokeSession(token: string) {
    setSessionsError('');

    try {
      const response = await authClient.revokeSession({ token });
      if (response.error) {
        throw response.error;
      }

      setSessions((current) => current.filter((session) => session.token !== token));
    } catch (sessionError) {
      setSessionsError(sessionError instanceof Error ? sessionError.message : 'Failed to revoke the selected session.');
    }
  }

  async function handleRevokeOtherSessions() {
    setSessionsError('');

    try {
      const response = await authClient.revokeOtherSessions();
      if (response.error) {
        throw response.error;
      }

      setSessions((current) => current.filter((session) => session.token === currentSessionToken));
    } catch (sessionError) {
      setSessionsError(sessionError instanceof Error ? sessionError.message : 'Failed to revoke other sessions.');
    }
  }

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
                    {user.role === 'admin' && user.twoFactorEnabled && (
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

              {user.role === 'admin' && (
                <section className="mt-6 rounded-[1.75rem] border border-primary/20 bg-primary/10 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">
                    Admin security
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-text-bright">Two-factor authentication</h2>
                  <p className="mt-2 text-sm leading-6 text-text-dim">
                    Two-factor authentication is required before admin tools can be used.
                  </p>
                  <p className="mt-4 text-sm font-medium text-text-bright">
                    Status: {adminMfaEnabled ? 'Enabled' : 'Not enabled'}
                  </p>

                  {!adminMfaEnabled ? (
                    <div className="mt-4 space-y-4">
                      <button
                        type="button"
                        onClick={() => void handleAdminMfaSetup()}
                        disabled={adminEnabling}
                        className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
                      >
                        {adminEnabling ? 'Preparing...' : 'Set up admin MFA'}
                      </button>

                      {adminSetupUri ? (
                        <div className="space-y-4 rounded-2xl border border-surface-hover/60 bg-surface/70 p-4">
                          <p className="text-sm text-text-dim">
                            Add this account to your authenticator app, then enter the first code below.
                          </p>
                          <code className="block overflow-x-auto rounded-xl bg-surface px-3 py-3 text-xs text-text-bright">
                            {adminSetupUri}
                          </code>
                          <form className="space-y-3" onSubmit={handleAdminMfaVerify}>
                            <label className="block">
                              <span className="mb-2 block text-sm font-medium text-text-bright">Authenticator code</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={adminSetupCode}
                                onChange={(event) => setAdminSetupCode(event.target.value)}
                                className="w-full rounded-xl border border-surface-hover bg-surface px-4 py-3 text-text-bright outline-none transition-colors focus:border-primary"
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={adminVerifying || adminSetupCode.trim().length === 0}
                              className="rounded-xl border border-surface-hover/70 bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 disabled:opacity-60"
                            >
                              {adminVerifying ? 'Verifying...' : 'Verify admin MFA'}
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {revealedAdminBackupCodes.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-surface-hover/60 bg-surface/70 p-4">
                      <p className="text-sm font-medium text-text-bright">Backup codes</p>
                      <ul className="mt-3 grid gap-2 text-sm text-text-bright sm:grid-cols-2">
                        {revealedAdminBackupCodes.map((backupCode) => (
                          <li key={backupCode} className="rounded-xl bg-surface px-3 py-2 font-mono">
                            {backupCode}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {adminSecurityMessage ? <p className="mt-4 text-sm text-primary">{adminSecurityMessage}</p> : null}
                  {adminSecurityError ? <p className="mt-4 text-sm text-danger">{adminSecurityError}</p> : null}
                </section>
              )}
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-dim">
                      Sessions
                    </p>
                    <p className="text-sm text-text-dim">
                      Review active devices and sign out sessions you no longer trust.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLoadSessions()}
                    disabled={sessionsLoading}
                    className="rounded-xl border border-surface-hover/70 bg-surface px-3 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 disabled:opacity-60"
                  >
                    {sessionsLoading ? 'Loading...' : sessionsLoaded ? 'Refresh sessions' : 'Show active sessions'}
                  </button>
                </div>

                {sessionsLoaded ? (
                  <div className="mt-4 space-y-3">
                    {sessions.map((session) => {
                      const isCurrent = session.token === currentSessionToken;
                      return (
                        <div key={session.token} className="rounded-xl border border-surface-hover/60 bg-surface/65 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-text-bright">
                                {isCurrent ? 'Current device' : 'Other device'}
                              </p>
                              <p className="mt-1 text-sm text-text-dim">
                                {session.userAgent || 'Unknown device'}
                              </p>
                              <p className="mt-1 text-xs text-text-dim">
                                Last active until {formatSessionDate(session.expiresAt, lang)}
                              </p>
                            </div>
                            {!isCurrent ? (
                              <button
                                type="button"
                                onClick={() => void handleRevokeSession(session.token)}
                                className="rounded-xl border border-danger/30 px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/8"
                              >
                                Sign out device
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {sessionsLoaded && sessions.some((session) => session.token !== currentSessionToken) ? (
                  <button
                    type="button"
                    onClick={() => void handleRevokeOtherSessions()}
                    className="mt-4 rounded-xl border border-surface-hover/70 bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60"
                  >
                    Sign out other devices
                  </button>
                ) : null}

                {sessionsError ? <p className="mt-4 text-sm text-danger">{sessionsError}</p> : null}
              </section>

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

              {/* Account Deletion Section */}
              <DeleteAccountSection />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Account Deletion Component
function DeleteAccountSection() {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);

  const isThai = lang === 'th';

  async function handleDeleteAccount() {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/user', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      setDeleted(true);
      // Clear auth state and redirect
      setTimeout(async () => {
        await logout();
        navigate(routes.home);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : isThai ? 'ไม่สามารถลบบัญชีได้' : 'Could not delete account');
    } finally {
      setDeleting(false);
    }
  }

  if (deleted) {
    return (
      <section className="rounded-[1.6rem] border border-danger/30 bg-danger/5 p-5">
        <p className="text-sm font-medium text-danger">
          {isThai ? 'บัญชีของคุณถูกลบแล้ว กำลังพากลับไปหน้าแรก...' : 'Your account has been deleted. Redirecting to home...'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-danger/30 bg-danger/5 p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-danger">
        {isThai ? 'ลบบัญชี' : 'Delete Account'}
      </p>
      <p className="mb-4 text-sm text-text-dim">
        {isThai
          ? 'การลบบัญชีจะลบข้อมูลทั้งหมดของคุณอย่างถาวร การกระทำนี้ไม่สามารถยกเลิกได้'
          : 'Deleting your account will permanently remove all your data. This action cannot be undone.'}
      </p>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="w-full rounded-xl border border-danger/40 px-4 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          {isThai ? 'ลบบัญชีของฉัน' : 'Delete My Account'}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-danger">
            {isThai
              ? 'คุณแน่ใจหรือไม่? บัญชี เรตติ้ง และประวัติเกมทั้งหมดจะถูกลบอย่างถาวร'
              : 'Are you sure? Your account, ratings, and all game history will be permanently deleted.'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className="flex-1 rounded-xl border border-surface-hover/70 bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 disabled:opacity-60"
            >
              {isThai ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-danger-bright disabled:opacity-60"
            >
              {deleting ? (isThai ? 'กำลังลบ...' : 'Deleting...') : (isThai ? 'ใช่ ลบบัญชี' : 'Yes, Delete Account')}
            </button>
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
