import type { Row } from '@libsql/client';
import { USERNAME_CHANGE_COOLDOWN_SECONDS } from '../../../shared/authLimits';
import { logError, logInfo } from '../logger';
import { db, executeWithTiming, type SqlExecutor, INITIAL_USER_RATING } from './connection';
import { normalizeFairPlayStatus, type FairPlayStatus } from './fairPlay';

export { INITIAL_USER_RATING } from './connection';

function getPublicDisplayName(username: string | null, email: string): string {
  if (username && username.trim().length > 0) {
    return username.trim();
  }

  const localPart = email.split('@')[0]?.trim() || 'player';
  if (localPart.length <= 2) {
    return `${localPart.slice(0, 1)}***`;
  }

  return `${localPart.slice(0, 2)}***`;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  twoFactorEnabled: boolean;
  image: string | null;
  username: string | null;
  username_updated_at?: number | null;
  role: 'user' | 'admin';
  fair_play_status: FairPlayStatus;
  rated_restricted_at: number | null;
  rated_restriction_note: string | null;
  rating: number;
  rated_games: number;
  wins: number;
  losses: number;
  draws: number;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
}

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  rating: number;
  rated_games: number;
  wins: number;
  losses: number;
  draws: number;
}

function rowToAuthUser(row: Row): AuthUser {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email),
    email_verified: Boolean(Number(row.email_verified ?? 0)),
    twoFactorEnabled: Boolean(Number(row.twoFactorEnabled ?? 0)),
    image: row.image === null || row.image === undefined ? null : String(row.image),
    username: row.username === null || row.username === undefined ? null : String(row.username),
    username_updated_at: row.username_updated_at === null || row.username_updated_at === undefined
      ? null
      : Number(row.username_updated_at),
    role: String(row.role ?? 'user') === 'admin' ? 'admin' : 'user',
    fair_play_status: normalizeFairPlayStatus(row.fair_play_status),
    rated_restricted_at: row.rated_restricted_at === null || row.rated_restricted_at === undefined
      ? null
      : Number(row.rated_restricted_at),
    rated_restriction_note: row.rated_restriction_note === null || row.rated_restriction_note === undefined
      ? null
      : String(row.rated_restriction_note),
    rating: Number(row.rating ?? INITIAL_USER_RATING),
    rated_games: Number(row.rated_games ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0),
    created_at: Number(row.created_at ?? 0),
    updated_at: Number(row.updated_at ?? 0),
    last_login_at: row.last_login_at === null || row.last_login_at === undefined ? null : Number(row.last_login_at),
  };
}

function rowToLeaderboardEntry(row: Row): LeaderboardEntry {
  const username = row.username === null || row.username === undefined ? null : String(row.username);
  const email = String(row.email ?? '');

  return {
    id: String(row.id),
    display_name: getPublicDisplayName(username, email),
    rating: Number(row.rating ?? INITIAL_USER_RATING),
    rated_games: Number(row.rated_games ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0),
  };
}


export async function getUserByIdFromExecutor(executor: SqlExecutor, id: string): Promise<AuthUser | null> {
  const result = await executeWithTiming(executor, {
    sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
    args: [id],
  }, 'getUserById');
  const row = result.rows[0];
  return row ? rowToAuthUser(row) : null;
}

export async function getLeaderboard(limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> {
  try {
    const result = await db.execute({
      sql: `
        SELECT id, username, email, rating, rated_games, wins, losses, draws
        FROM users
        WHERE rated_games > 0 AND fair_play_status != 'restricted'
        ORDER BY rating DESC, rated_games DESC, wins DESC, draws DESC, updated_at ASC
        LIMIT ? OFFSET ?
      `,
      args: [limit, offset],
    });

    return result.rows.map(rowToLeaderboardEntry);
  } catch (err) {
    logError('database_get_leaderboard_failed', err, { limit, offset });
    return [];
  }
}

export async function getLeaderboardCount(): Promise<number> {
  try {
    const result = await db.execute('SELECT COUNT(*) as count FROM users WHERE rated_games > 0 AND fair_play_status != \'restricted\'');
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    logError('database_get_leaderboard_count_failed', err);
    return 0;
  }
}

export async function createLoginCode(data: {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: number;
  requestedIp?: string;
}): Promise<void> {
  try {
    await db.execute({
      sql: 'DELETE FROM login_codes WHERE email = ? OR expires_at <= unixepoch() OR consumed_at IS NOT NULL',
      args: [data.email],
    });
    await db.execute({
      sql: `
        INSERT INTO login_codes (id, email, code_hash, expires_at, requested_ip)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [data.id, data.email, data.codeHash, data.expiresAt, data.requestedIp ?? null],
    });
  } catch (err) {
    logError('database_create_login_code_failed', err, { email: data.email });
    throw err;
  }
}

export async function getLoginCodeByEmail(email: string): Promise<{
  id: string;
  email: string;
  code_hash: string;
  expires_at: number;
  attempts: number;
  consumed_at: number | null;
} | null> {
  try {
    const result = await db.execute({
      sql: `
        SELECT id, email, code_hash, expires_at, attempts, consumed_at
        FROM login_codes
        WHERE email = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      args: [email],
    });
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      email: String(row.email),
      code_hash: String(row.code_hash),
      expires_at: Number(row.expires_at),
      attempts: Number(row.attempts ?? 0),
      consumed_at: row.consumed_at === null || row.consumed_at === undefined ? null : Number(row.consumed_at),
    };
  } catch (err) {
    logError('database_get_login_code_failed', err, { email });
    return null;
  }
}

export async function markLoginCodeAttempt(id: string): Promise<void> {
  try {
    await db.execute({
      sql: 'UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?',
      args: [id],
    });
  } catch (err) {
    logError('database_mark_login_code_attempt_failed', err, { id });
  }
}

export async function consumeLoginCode(id: string): Promise<void> {
  try {
    await db.execute({
      sql: 'UPDATE login_codes SET consumed_at = unixepoch() WHERE id = ?',
      args: [id],
    });
  } catch (err) {
    logError('database_consume_login_code_failed', err, { id });
  }
}

export async function upsertUserByEmail(data: {
  id: string;
  email: string;
  role: 'user' | 'admin';
}): Promise<AuthUser | null> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const fallbackName = normalizedEmail.split('@')[0]?.trim() || 'player';

  try {
    await db.execute({
      sql: `
        INSERT INTO users (id, name, email, email_verified, role, rating, last_login_at)
        VALUES (?, ?, ?, 1, ?, ?, unixepoch())
        ON CONFLICT(email) DO UPDATE SET
          updated_at = unixepoch(),
          email_verified = 1,
          last_login_at = unixepoch()
      `,
      args: [data.id, fallbackName, normalizedEmail, data.role, INITIAL_USER_RATING],
    });
    return await getUserByEmail(normalizedEmail);
  } catch (err) {
    logError('database_upsert_user_failed', err, { email: normalizedEmail });
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
      args: [email],
    });
    const row = result.rows[0];
    return row ? rowToAuthUser(row) : null;
  } catch (err) {
    logError('database_get_user_by_email_failed', err, { email });
    return null;
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
      args: [id],
    });
    const row = result.rows[0];
    return row ? rowToAuthUser(row) : null;
  } catch (err) {
    logError('database_get_user_by_id_failed', err, { id });
    return null;
  }
}

export async function updateUsername(userId: string, username: string): Promise<AuthUser | null> {
  try {
    await db.execute({
      sql: 'UPDATE users SET username = ?, username_updated_at = unixepoch(), updated_at = unixepoch() WHERE id = ?',
      args: [username, userId],
    });
    return await getUserById(userId);
  } catch (err) {
    logError('database_update_username_failed', err, { userId });
    return null;
  }
}

export function getUsernameChangeCooldown(
  user: Pick<AuthUser, 'username' | 'username_updated_at'>,
  nextUsername: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const currentUsername = user.username?.trim() ?? '';
  if (!currentUsername || currentUsername === nextUsername.trim()) {
    return null;
  }

  const lastUpdatedAt = user.username_updated_at ?? null;
  if (!lastUpdatedAt) {
    return null;
  }

  const nextAllowedAt = lastUpdatedAt + USERNAME_CHANGE_COOLDOWN_SECONDS;
  if (nowSeconds >= nextAllowedAt) {
    return null;
  }

  return {
    nextAllowedAt,
    retryAfterSeconds: nextAllowedAt - nowSeconds,
  };
}

export async function createSession(data: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: number;
}): Promise<void> {
  try {
    await db.execute({
      sql: 'DELETE FROM sessions WHERE user_id = ? OR expires_at <= unixepoch()',
      args: [data.userId],
    });
    await db.execute({
      sql: `
        INSERT INTO sessions (id, user_id, token_hash, expires_at)
        VALUES (?, ?, ?, ?)
      `,
      args: [data.id, data.userId, data.tokenHash, data.expiresAt],
    });
  } catch (err) {
    logError('database_create_session_failed', err, { userId: data.userId });
    throw err;
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM sessions WHERE expires_at <= unixepoch()',
      args: [],
    });
    const deletedCount = result.rows.length > 0 ? result.rows.length : 0;
    logInfo('cleanup_expired_sessions', { deletedCount });
    return deletedCount;
  } catch (err) {
    logError('cleanup_expired_sessions_failed', err);
    return 0;
  }
}

export async function cleanupExpiredLoginCodes(): Promise<number> {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM login_codes WHERE expires_at <= unixepoch()',
      args: [],
    });
    const deletedCount = result.rows.length > 0 ? result.rows.length : 0;
    logInfo('cleanup_expired_login_codes', { deletedCount });
    return deletedCount;
  } catch (err) {
    logError('cleanup_expired_login_codes_failed', err);
    return 0;
  }
}

export async function cleanupExpiredVerifications(): Promise<number> {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM verifications WHERE expires_at <= unixepoch()',
      args: [],
    });
    const deletedCount = result.rows.length > 0 ? result.rows.length : 0;
    logInfo('cleanup_expired_verifications', { deletedCount });
    return deletedCount;
  } catch (err) {
    logError('cleanup_expired_verifications_failed', err);
    return 0;
  }
}

export async function cleanupExpiredAuthSessions(): Promise<number> {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM auth_sessions WHERE expires_at <= unixepoch()',
      args: [],
    });
    const deletedCount = result.rows.length > 0 ? result.rows.length : 0;
    logInfo('cleanup_expired_auth_sessions', { deletedCount });
    return deletedCount;
  } catch (err) {
    logError('cleanup_expired_auth_sessions_failed', err);
    return 0;
  }
}

export async function runAllCleanupJobs(): Promise<void> {
  const results = await Promise.all([
    cleanupExpiredSessions(),
    cleanupExpiredLoginCodes(),
    cleanupExpiredVerifications(),
    cleanupExpiredAuthSessions(),
  ]);

  const totalDeleted = results.reduce((sum, count) => sum + count, 0);
  if (totalDeleted > 0) {
    logInfo('cleanup_jobs_completed', {
      sessionsDeleted: results[0],
      loginCodesDeleted: results[1],
      verificationsDeleted: results[2],
      authSessionsDeleted: results[3],
      totalDeleted,
    });
  }
}

// Only refresh last_seen_at when it is older than this — the common path
// becomes a single SELECT instead of SELECT + UPDATE (2× RTT per request).
const SESSION_LAST_SEEN_UPDATE_INTERVAL_SEC = 60;

export async function getUserBySessionTokenHash(tokenHash: string): Promise<AuthUser | null> {
  try {
    const result = await db.execute({
      sql: `
        SELECT users.*, sessions.last_seen_at AS session_last_seen_at
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > unixepoch()
        LIMIT 1
      `,
      args: [tokenHash],
    });
    const row = result.rows[0];
    if (!row) return null;

    const lastSeenAtSec = Number(row.session_last_seen_at ?? 0);
    if (!Number.isFinite(lastSeenAtSec) || Math.floor(Date.now() / 1000) - lastSeenAtSec >= SESSION_LAST_SEEN_UPDATE_INTERVAL_SEC) {
      await db.execute({
        sql: 'UPDATE sessions SET last_seen_at = unixepoch() WHERE token_hash = ?',
        args: [tokenHash],
      });
    }

    return rowToAuthUser(row);
  } catch (err) {
    logError('database_get_user_by_session_failed', err);
    return null;
  }
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  try {
    await db.execute({
      sql: 'DELETE FROM sessions WHERE token_hash = ?',
      args: [tokenHash],
    });
  } catch (err) {
    logError('database_delete_session_failed', err);
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // Delete user from all related tables first
    await db.execute({
      sql: 'DELETE FROM sessions WHERE user_id = ?',
      args: [userId],
    });
    await db.execute({
      sql: 'DELETE FROM puzzle_progress WHERE user_id = ?',
      args: [userId],
    });
    await db.execute({
      sql: 'DELETE FROM games WHERE white_user_id = ? OR black_user_id = ?',
      args: [userId, userId],
    });
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [userId],
    });
    return true;
  } catch (err) {
    logError('database_delete_user_failed', err);
    return false;
  }
}
