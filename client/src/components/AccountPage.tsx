import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { USERNAME_CHANGE_COOLDOWN_SECONDS } from '@shared/authLimits';
import { PUZZLES } from '@shared/puzzlesRuntime';
import Header from './Header';
import { useAuth, type ApiError } from '../lib/auth';
import { authClient } from '../lib/authClient';
import { useTranslation } from '../lib/i18n';
import { AccountSecondaryAction } from './AccountSecondaryAction';
import { DeleteAccountSection } from './DeleteAccountSection';
import { usePuzzleProgressSummary } from '../lib/puzzleProgress';
import { puzzleRoute, routes } from '../lib/routes';

const puzzleActivityDateFormatters = {
  th: new Intl.DateTimeFormat('th-TH', { month: 'short', day: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }),
} as const;

const sessionDateFormatters = {
  th: new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
  en: new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
} as const;

const usernameCooldownDateFormatters = {
  th: new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
  en: new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
} as const;

function getPublicPuzzleTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}

function formatPuzzleActivityDate(timestamp: number, lang: string): string {
  return (lang === 'th' ? puzzleActivityDateFormatters.th : puzzleActivityDateFormatters.en)
    .format(new Date(timestamp * 1000));
}

function formatSessionDate(value: string | Date, lang: string): string {
  const date = value instanceof Date ? value : new Date(value);
  return (lang === 'th' ? sessionDateFormatters.th : sessionDateFormatters.en).format(date);
}

function formatUsernameCooldownDate(timestamp: number, lang: string): string {
  return (lang === 'th' ? usernameCooldownDateFormatters.th : usernameCooldownDateFormatters.en)
    .format(new Date(timestamp * 1000));
}

function getProfileErrorMessage(error: unknown, t: (key: string, params?: Record<string, string | number>) => string, lang: string) {
  const apiError = error as Partial<ApiError>;

  if (apiError.code === 'USERNAME_CHANGE_COOLDOWN' && typeof apiError.nextAllowedAt === 'number') {
    return t('account.username_cooldown_until', {
      date: formatUsernameCooldownDate(apiError.nextAllowedAt, lang),
    });
  }

  if (typeof apiError.status === 'number' && apiError.status >= 500) {
    return t('account.profile_server_error');
  }

  return t('account.update_failed');
}





export default function AccountPage() {
  return useAccountPageScreen();
}

function useAccountPageScreen() {
  const navigate = useNavigate();
  const { user, loading, authError, logout, refreshUser, updateProfile } = useAuth();
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
  const [showHistory, setShowHistory] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showAdminMfa, setShowAdminMfa] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    if (!loading && !user && !authError) {
      navigate('/login', { replace: true });
    }
  }, [authError, loading, navigate, user]);

  const normalizedUsername = username.trim();
  const currentUsername = user?.username?.trim() ?? '';
  const nowSeconds = Math.floor(Date.now() / 1000);
  const usernameCooldownEndsAt = user?.username_updated_at && currentUsername
    ? user.username_updated_at + USERNAME_CHANGE_COOLDOWN_SECONDS
    : null;
  const usernameCooldownActive = Boolean(
    usernameCooldownEndsAt
    && nowSeconds < usernameCooldownEndsAt
    && normalizedUsername !== currentUsername,
  );
  const usernameCooldownMessage = usernameCooldownEndsAt && nowSeconds < usernameCooldownEndsAt
    ? t('account.username_cooldown_until', {
      date: formatUsernameCooldownDate(usernameCooldownEndsAt, lang),
    })
    : '';

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (usernameCooldownActive) {
        setError(usernameCooldownMessage);
        return;
      }
      await updateProfile(username);
      setMessage(t('account.profile_updated'));
    } catch (err) {
      setError(getProfileErrorMessage(err, t, lang));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text-dim">
        {t('common.loading')}
      </div>
    );
  }

  if (!user && authError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-light">
            {t('auth.session_check_title')}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-text-bright">
            {t('auth.session_check_failed')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-text">
            {t('auth.session_check_desc')}
          </p>
          <button
            type="button"
            onClick={() => { void refreshUser(); }}
            className="button-accent-contrast mt-6 rounded-xl px-5 py-3 text-sm font-bold"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text-dim">
        {t('common.loading')}
      </div>
    );
  }

  const displayName = user.username || user.name || user.email.split('@')[0];
  const adminMfaEnabled = user.twoFactorEnabled || revealedAdminBackupCodes.length > 0;
  const currentSessionToken = betterAuthSession.data?.session.token ?? null;
  const underStress = user.fair_play_status === 'restricted' || Boolean(authError);
  const showDetails = !underStress || showAccountDetails;

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
      setAdminSecurityMessage(t('account.admin_security_setup_started'));
    } catch {
      setAdminSecurityError(t('account.admin_security_setup_failed'));
    } finally {
      setAdminEnabling(false);
    }
  }

  async function handleAdminMfaVerify(event: FormEvent<HTMLFormElement>) {
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
      setAdminSecurityMessage(t('account.admin_security_enabled_msg'));
      setAdminSetupCode('');
    } catch {
      setAdminSecurityError(t('account.admin_security_verify_failed'));
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
    } catch {
      setSessionsError(t('account.sessions_load_failed'));
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
    } catch {
      setSessionsError(t('account.session_revoke_failed'));
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
    } catch {
      setSessionsError(t('account.sessions_revoke_others_failed'));
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active={null} />
      <main id="main-content" className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-10">
          {(user.fair_play_status === 'restricted' || authError) && (
            <div className="space-y-3">
              {user.fair_play_status === 'restricted' && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-4 text-sm text-danger">
                  <div className="font-semibold">{t('account.rated_restricted_title')}</div>
                  <p className="mt-1 text-danger/90">{t('account.rated_restricted_desc')}</p>
                  {user.rated_restriction_note && (
                    <p className="mt-2 text-xs text-danger/80">{user.rated_restriction_note}</p>
                  )}
                </div>
              )}
              {authError && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-4 text-sm text-danger">
                  <div className="font-semibold">{t('auth.session_check_failed')}</div>
                  <p className="mt-1 text-danger/90">{t('auth.session_check_desc')}</p>
                  <button
                    type="button"
                    onClick={() => { void refreshUser(); }}
                    className="button-accent-contrast mt-3 rounded-lg px-4 py-2 text-sm font-bold"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              )}
            </div>
          )}

          <section className="space-y-6">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-text-bright sm:text-4xl">
                {t('account.title')}
              </h1>
              <p className="text-sm text-text">
                <span className="font-semibold text-text-bright">{displayName}</span>
                <span className="text-text-dim"> · {user.email}</span>
              </p>
              {!underStress && (
                <p className="max-w-xl text-sm leading-6 text-text-dim">
                  {t('account.hero_desc')}
                </p>
              )}
            </header>

            {underStress && (
              <div className="max-w-sm space-y-2">
                {user.fair_play_status === 'restricted' && (
                  <AccountSecondaryAction onClick={() => navigate(routes.feedback)}>
                    {t('account.open_feedback')}
                  </AccountSecondaryAction>
                )}
                {user.role === 'admin' && user.twoFactorEnabled && (
                  <AccountSecondaryAction onClick={() => navigate(routes.fairPlay)}>
                    {t('account.open_fair_play')}
                  </AccountSecondaryAction>
                )}
                <AccountSecondaryAction
                  danger
                  onClick={async () => {
                    await logout();
                    navigate(routes.home, { replace: true });
                  }}
                >
                  {t('account.sign_out')}
                </AccountSecondaryAction>
                <button
                  type="button"
                  aria-expanded={showAccountDetails}
                  onClick={() => setShowAccountDetails((current) => !current)}
                  className="w-full rounded-xl border border-surface-hover bg-surface-alt px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                >
                  {showAccountDetails ? t('account.hide_details') : t('account.show_details')}
                </button>
              </div>
            )}

            {showDetails && (
              <>
            <div className="grid grid-cols-3 gap-3 border-y border-surface-hover/70 py-4">
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('account.rating')}</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-text-bright">{user.rating}</div>
              </div>
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('account.rated_games')}</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-text-bright">{user.rated_games}</div>
              </div>
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-dim">{t('account.record')}</div>
                <div className="mt-2 flex items-baseline gap-1.5 text-2xl font-bold tracking-tight">
                  <span className="text-primary" aria-label={t('account.wins')}>{user.wins}</span>
                  <span className="text-text-dim/50" aria-hidden="true">/</span>
                  <span className="text-danger" aria-label={t('account.losses')}>{user.losses}</span>
                  <span className="text-text-dim/50" aria-hidden="true">/</span>
                  <span className="text-text-bright" aria-label={t('account.draws')}>{user.draws}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="text-lg font-bold text-text-bright">
                {t('account.save_profile')}
              </h2>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-bright">{t('account.username')}</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('account.username_placeholder')}
                  className="w-full rounded-xl border border-surface-hover bg-surface-alt px-4 py-3 text-text-bright outline-none transition-colors placeholder:text-text-dim/75 focus:border-accent"
                />
              </label>
              {usernameCooldownMessage && (
                <p className="text-xs leading-5 text-text">
                  {usernameCooldownMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={saving || usernameCooldownActive}
                className="button-accent-contrast rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
              >
                {saving ? t('account.saving') : t('account.save_profile')}
              </button>
              {message && <p className="text-sm text-success">{message}</p>}
              {error && <p className="text-sm text-danger">{error}</p>}
            </form>

            {!underStress && (
            <div className="max-w-sm space-y-2">
              <AccountSecondaryAction onClick={() => navigate(routes.leaderboard)}>
                {t('leaderboard.title')}
              </AccountSecondaryAction>
              {user.role === 'admin' && user.twoFactorEnabled && (
                <>
                  <AccountSecondaryAction onClick={() => navigate(routes.feedback)}>
                    {t('account.open_feedback')}
                  </AccountSecondaryAction>
                  <AccountSecondaryAction onClick={() => navigate(routes.fairPlay)}>
                    {t('account.open_fair_play')}
                  </AccountSecondaryAction>
                </>
              )}
              <AccountSecondaryAction
                danger
                onClick={async () => {
                  await logout();
                  navigate(routes.home, { replace: true });
                }}
              >
                {t('account.sign_out')}
              </AccountSecondaryAction>
            </div>
            )}
              </>
            )}
          </section>

          {showDetails && (
          <>
          <section className="space-y-5 border-t border-surface-hover/70 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-text-bright">{t('account.puzzle_title')}</h2>
                <p className="mt-1 text-sm text-text-dim">
                  {t('account.puzzle_percent', {
                    percent: puzzleProgress.percentComplete,
                    total: puzzleProgress.totalCount || PUZZLES.length,
                  })}
                </p>
              </div>
              <span className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-xs font-semibold text-text-dim">
                {t('puzzle.completed', { done: puzzleProgress.completedCount, total: puzzleProgress.totalCount })}
              </span>
            </div>

            <div className="rounded-xl border border-surface-hover/70 bg-surface/55 p-5">
              <h3 className="text-sm font-semibold text-text-dim">
                {t('account.puzzle_next_label')}
              </h3>
              {continuePuzzle ? (
                <>
                  <div className="mt-2 text-xl font-bold leading-tight text-text-bright">
                    #{continuePuzzle.id} · {getPublicPuzzleTitle(continuePuzzle.title)}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text">
                    {continuePuzzle.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
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
                    className="ui-btn-secondary mt-4 w-full rounded-xl py-3.5 text-sm font-semibold sm:w-auto sm:px-8"
                  >
                    {t('account.puzzle_continue')}
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-2 text-xl font-bold text-text-bright">{t('account.puzzle_all_done')}</div>
                  <p className="mt-2 text-sm leading-6 text-text-dim">{t('account.puzzle_all_done_desc')}</p>
                  <button
                    type="button"
                    onClick={() => navigate(routes.lessons)}
                    className="mt-4 w-full rounded-xl border border-surface-hover/70 bg-surface/70 py-3.5 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 sm:w-auto sm:px-8"
                  >
                    {t('puzzle.all_lessons')}
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowHistory((current) => !current)}
              className="text-sm font-semibold text-text-dim underline-offset-2 transition-colors hover:text-text-bright hover:underline"
              aria-expanded={showHistory}
            >
              {showHistory ? t('account.hide_history') : t('account.show_history')}
            </button>

            {showHistory && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-text-bright">{t('account.puzzle_last_played_label')}</h3>
                  {puzzleProgress.lastPlayed ? (
                    <>
                      <div className="mt-2 font-semibold text-text-bright">
                        #{puzzleProgress.lastPlayed.puzzle.id} · {getPublicPuzzleTitle(puzzleProgress.lastPlayed.puzzle.title)}
                      </div>
                      <p className="mt-1 text-sm text-text-dim">
                        {t('account.puzzle_last_played_meta', {
                          date: formatPuzzleActivityDate(puzzleProgress.lastPlayed.lastPlayedAt, lang),
                          status: puzzleProgress.lastPlayed.completedAt === null
                            ? t('account.puzzle_status_in_progress')
                            : t('account.puzzle_status_solved'),
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-text-dim">{t('account.puzzle_last_played_empty')}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-bright">{t('account.puzzle_recent_label')}</h3>
                  {puzzleProgress.recentCompleted.length > 0 ? (
                    <div className="mt-3 space-y-2">
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
                    <p className="mt-2 text-sm text-text-dim">{t('account.puzzle_recent_empty')}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-surface-hover/70 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-bright">{t('account.section_security')}</h2>
              <button
                type="button"
                onClick={() => {
                  const next = !showSecurity;
                  setShowSecurity(next);
                  if (!next) {
                    setShowAdminMfa(false);
                  } else if (!sessionsLoaded && !sessionsLoading) {
                    void handleLoadSessions();
                  }
                }}
                className="rounded-xl border border-surface-hover bg-surface-alt px-4 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                aria-expanded={showSecurity}
              >
                {showSecurity ? t('account.hide_security') : t('account.show_security')}
              </button>
            </div>

            {showSecurity && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-text-bright">{t('account.sessions_title')}</h3>
                      <p className="mt-1 text-sm text-text-dim">{t('account.sessions_desc')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleLoadSessions()}
                      disabled={sessionsLoading}
                      className="rounded-xl border border-surface-hover/70 bg-surface px-3 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 disabled:opacity-60"
                    >
                      {sessionsLoading
                        ? t('account.sessions_loading')
                        : sessionsLoaded
                          ? t('account.sessions_refresh')
                          : t('account.sessions_show')}
                    </button>
                  </div>

                  {sessionsLoaded ? (
                    <div className="space-y-3">
                      {sessions.map((session) => {
                        const isCurrent = session.token === currentSessionToken;
                        return (
                          <div key={session.token} className="rounded-xl border border-surface-hover/60 bg-surface/65 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-text-bright">
                                  {isCurrent ? t('account.session_current') : t('account.session_other')}
                                </p>
                                <p className="mt-1 text-sm text-text-dim">
                                  {session.userAgent || t('account.session_unknown_device')}
                                </p>
                                <p className="mt-1 text-xs text-text-dim">
                                  {t('account.session_expires', { date: formatSessionDate(session.expiresAt, lang) })}
                                </p>
                              </div>
                              {!isCurrent ? (
                                <button
                                  type="button"
                                  onClick={() => void handleRevokeSession(session.token)}
                                  className="rounded-xl border border-danger/30 px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/8"
                                >
                                  {t('account.session_sign_out_device')}
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
                      className="rounded-xl border border-surface-hover/70 bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60"
                    >
                      {t('account.session_sign_out_others')}
                    </button>
                  ) : null}

                  {sessionsError ? <p className="text-sm text-danger">{sessionsError}</p> : null}
                </div>

                {user.role === 'admin' && (
                  <div className="rounded-xl border border-surface-hover/60 bg-surface-alt/70 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-text-bright">{t('account.admin_security_title')}</h3>
                        <p className="mt-1 text-sm text-text-dim">
                          {t('account.admin_security_status', {
                            status: adminMfaEnabled
                              ? t('account.admin_security_enabled')
                              : t('account.admin_security_disabled'),
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAdminMfa((current) => !current)}
                        className="rounded-xl border border-surface-hover bg-surface px-3 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60"
                        aria-expanded={showAdminMfa}
                      >
                        {showAdminMfa ? t('account.hide_admin_security') : t('account.show_admin_security')}
                      </button>
                    </div>

                    {showAdminMfa && (
                      <div className="mt-4 space-y-4 border-t border-surface-hover/60 pt-4">
                        <p className="text-sm leading-6 text-text-dim">
                          {t('account.admin_security_desc')}
                        </p>

                        {!adminMfaEnabled ? (
                          <div className="space-y-4">
                            <button
                              type="button"
                              onClick={() => void handleAdminMfaSetup()}
                              disabled={adminEnabling}
                              className="rounded-xl border border-surface-hover bg-surface-alt px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover disabled:opacity-60"
                            >
                              {adminEnabling ? t('account.admin_security_preparing') : t('account.admin_security_setup')}
                            </button>

                            {adminSetupUri ? (
                              <div className="space-y-4 rounded-xl border border-surface-hover/60 bg-surface/70 p-4">
                                <p className="text-sm text-text-dim">
                                  {t('account.admin_security_uri_help')}
                                </p>
                                <code className="block overflow-x-auto rounded-xl bg-surface px-3 py-3 text-xs text-text-bright">
                                  {adminSetupUri}
                                </code>
                                <form className="space-y-3" onSubmit={handleAdminMfaVerify}>
                                  <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-text-bright">{t('account.admin_security_code')}</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      autoComplete="one-time-code"
                                      value={adminSetupCode}
                                      onChange={(event) => setAdminSetupCode(event.target.value)}
                                      className="w-full rounded-xl border border-surface-hover bg-surface px-4 py-3 text-text-bright outline-none transition-colors focus:border-accent"
                                    />
                                  </label>
                                  <button
                                    type="submit"
                                    disabled={adminVerifying || adminSetupCode.trim().length === 0}
                                    className="rounded-xl border border-surface-hover/70 bg-surface px-4 py-3 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover/60 disabled:opacity-60"
                                  >
                                    {adminVerifying ? t('account.admin_security_verifying') : t('account.admin_security_verify')}
                                  </button>
                                </form>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {revealedAdminBackupCodes.length > 0 ? (
                          <div className="rounded-xl border border-surface-hover/60 bg-surface/70 p-4">
                            <p className="text-sm font-medium text-text-bright">{t('account.admin_security_backup')}</p>
                            <ul className="mt-3 grid gap-2 text-sm text-text-bright sm:grid-cols-2">
                              {revealedAdminBackupCodes.map((backupCode) => (
                                <li key={backupCode} className="rounded-xl bg-surface px-3 py-2 font-mono">
                                  {backupCode}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {adminSecurityMessage ? <p className="text-sm text-success">{adminSecurityMessage}</p> : null}
                        {adminSecurityError ? <p className="text-sm text-danger">{adminSecurityError}</p> : null}
                      </div>
                    )}
                  </div>
                )}

                <DeleteAccountSection />
              </div>
            )}
          </section>
          </>
          )}
        </div>
      </main>
    </div>
  );
}
