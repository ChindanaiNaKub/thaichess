import type { Row } from '@libsql/client';
import { logError } from '../logger';
import { db, type SqlExecutor } from './connection';

export type FairPlayStatus = 'clear' | 'restricted';
export type FairPlayEventType = 'analysis_blocked' | 'user_reported';
export type FairPlayCaseStatus = 'open' | 'reviewed' | 'restricted' | 'dismissed';

export function normalizeFairPlayStatus(value: unknown): FairPlayStatus {
  return value === 'restricted' ? 'restricted' : 'clear';
}

export interface FairPlayEventRecord {
  id: number;
  user_id: string;
  type: FairPlayEventType;
  game_id: string | null;
  reporter_user_id: string | null;
  metadata_json: string | null;
  created_at: number;
}

export interface FairPlayCaseRecord {
  id: number;
  user_id: string;
  user_email: string;
  user_username: string | null;
  user_fair_play_status: FairPlayStatus;
  user_rated_restricted_at: number | null;
  status: FairPlayCaseStatus;
  reason: string;
  note: string | null;
  reviewed_by: string | null;
  created_at: number;
  updated_at: number;
  event_count: number;
  latest_event_type: FairPlayEventType | null;
}

function rowToFairPlayEvent(row: Row): FairPlayEventRecord {
  return {
    id: Number(row.id ?? 0),
    user_id: String(row.user_id ?? ''),
    type: String(row.type ?? 'analysis_blocked') === 'user_reported' ? 'user_reported' : 'analysis_blocked',
    game_id: row.game_id === null || row.game_id === undefined ? null : String(row.game_id),
    reporter_user_id: row.reporter_user_id === null || row.reporter_user_id === undefined ? null : String(row.reporter_user_id),
    metadata_json: row.metadata_json === null || row.metadata_json === undefined ? null : String(row.metadata_json),
    created_at: Number(row.created_at ?? 0),
  };
}

function rowToFairPlayCase(row: Row): FairPlayCaseRecord {
  return {
    id: Number(row.id ?? 0),
    user_id: String(row.user_id ?? ''),
    user_email: String(row.user_email ?? ''),
    user_username: row.user_username === null || row.user_username === undefined ? null : String(row.user_username),
    user_fair_play_status: normalizeFairPlayStatus(row.user_fair_play_status),
    user_rated_restricted_at: row.user_rated_restricted_at === null || row.user_rated_restricted_at === undefined
      ? null
      : Number(row.user_rated_restricted_at),
    status: normalizeFairPlayCaseStatus(row.status),
    reason: String(row.reason ?? ''),
    note: row.note === null || row.note === undefined ? null : String(row.note),
    reviewed_by: row.reviewed_by === null || row.reviewed_by === undefined ? null : String(row.reviewed_by),
    created_at: Number(row.created_at ?? 0),
    updated_at: Number(row.updated_at ?? 0),
    event_count: Number(row.event_count ?? 0),
    latest_event_type: row.latest_event_type === 'user_reported'
      ? 'user_reported'
      : row.latest_event_type === 'analysis_blocked'
        ? 'analysis_blocked'
        : null,
  };
}

function normalizeFairPlayCaseStatus(value: unknown): FairPlayCaseStatus {
  if (value === 'reviewed' || value === 'restricted' || value === 'dismissed') {
    return value;
  }
  return 'open';
}

async function getOpenFairPlayCaseForUser(executor: SqlExecutor, userId: string): Promise<{ id: number } | null> {
  const result = await executor.execute({
    sql: `
      SELECT id
      FROM fair_play_cases
      WHERE user_id = ? AND status = 'open'
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    args: [userId],
  });

  const row = result.rows[0];
  return row ? { id: Number(row.id ?? 0) } : null;
}

async function ensureOpenFairPlayCase(
  executor: SqlExecutor,
  userId: string,
  reason: string,
  note?: string | null,
): Promise<number | null> {
  const existing = await getOpenFairPlayCaseForUser(executor, userId);
  if (existing) {
    await executor.execute({
      sql: `
        UPDATE fair_play_cases
        SET updated_at = unixepoch(),
            note = COALESCE(?, note)
        WHERE id = ?
      `,
      args: [note ?? null, existing.id],
    });
    return existing.id;
  }

  const inserted = await executor.execute({
    sql: `
      INSERT INTO fair_play_cases (user_id, status, reason, note, updated_at)
      VALUES (?, 'open', ?, ?, unixepoch())
      RETURNING id
    `,
    args: [userId, reason, note ?? null],
  });

  const row = inserted.rows[0];
  return row ? Number(row.id ?? 0) : null;
}

export async function recordFairPlayEvent(data: {
  userId: string;
  type: FairPlayEventType;
  gameId?: string | null;
  reporterUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<{ event: FairPlayEventRecord | null; caseId: number | null }> {
  try {
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;
    const insertResult = await db.execute({
      sql: `
        INSERT INTO fair_play_events (user_id, type, game_id, reporter_user_id, metadata_json)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id, user_id, type, game_id, reporter_user_id, metadata_json, created_at
      `,
      args: [data.userId, data.type, data.gameId ?? null, data.reporterUserId ?? null, metadataJson],
    });

    const eventRow = insertResult.rows[0];
    const fairPlayEvent = eventRow ? rowToFairPlayEvent(eventRow) : null;
    const caseId = await ensureOpenFairPlayCase(
      db,
      data.userId,
      data.type === 'user_reported' ? 'player report received' : 'analysis blocked during active rated game',
      null,
    );

    return { event: fairPlayEvent, caseId };
  } catch (err) {
    logError('database_record_fair_play_event_failed', err, {
      userId: data.userId,
      type: data.type,
      gameId: data.gameId ?? null,
    });
    return { event: null, caseId: null };
  }
}

export async function getFairPlayCases(
  limit: number = 20,
  offset: number = 0,
  status?: 'all' | FairPlayCaseStatus,
): Promise<FairPlayCaseRecord[]> {
  try {
    const filters = status && status !== 'all'
      ? {
        sql: `
          SELECT
            c.id,
            c.user_id,
            u.email AS user_email,
            u.username AS user_username,
            u.fair_play_status AS user_fair_play_status,
            u.rated_restricted_at AS user_rated_restricted_at,
            c.status,
            c.reason,
            c.note,
            c.reviewed_by,
            c.created_at,
            c.updated_at,
            COALESCE(event_counts.event_count, 0) AS event_count,
            latest_events.type AS latest_event_type
          FROM fair_play_cases c
          JOIN users u ON u.id = c.user_id
          LEFT JOIN (
            SELECT user_id, COUNT(*) AS event_count
            FROM fair_play_events
            GROUP BY user_id
          ) AS event_counts ON event_counts.user_id = c.user_id
          LEFT JOIN fair_play_events AS latest_events ON latest_events.id = (
            SELECT e.id
            FROM fair_play_events e
            WHERE e.user_id = c.user_id
            ORDER BY e.created_at DESC, e.id DESC
            LIMIT 1
          )
          WHERE c.status = ?
          ORDER BY c.updated_at DESC, c.id DESC
          LIMIT ? OFFSET ?
        `,
        args: [status, limit, offset],
      }
      : {
        sql: `
          SELECT
            c.id,
            c.user_id,
            u.email AS user_email,
            u.username AS user_username,
            u.fair_play_status AS user_fair_play_status,
            u.rated_restricted_at AS user_rated_restricted_at,
            c.status,
            c.reason,
            c.note,
            c.reviewed_by,
            c.created_at,
            c.updated_at,
            COALESCE(event_counts.event_count, 0) AS event_count,
            latest_events.type AS latest_event_type
          FROM fair_play_cases c
          JOIN users u ON u.id = c.user_id
          LEFT JOIN (
            SELECT user_id, COUNT(*) AS event_count
            FROM fair_play_events
            GROUP BY user_id
          ) AS event_counts ON event_counts.user_id = c.user_id
          LEFT JOIN fair_play_events AS latest_events ON latest_events.id = (
            SELECT e.id
            FROM fair_play_events e
            WHERE e.user_id = c.user_id
            ORDER BY e.created_at DESC, e.id DESC
            LIMIT 1
          )
          ORDER BY c.updated_at DESC, c.id DESC
          LIMIT ? OFFSET ?
        `,
        args: [limit, offset],
      };

    const result = await db.execute(filters);
    return result.rows.map(rowToFairPlayCase);
  } catch (err) {
    logError('database_get_fair_play_cases_failed', err, { limit, offset, status: status ?? 'all' });
    return [];
  }
}

export async function getFairPlayCaseCount(status?: 'all' | FairPlayCaseStatus): Promise<number> {
  try {
    const result = status && status !== 'all'
      ? await db.execute({
        sql: 'SELECT COUNT(*) as count FROM fair_play_cases WHERE status = ?',
        args: [status],
      })
      : await db.execute('SELECT COUNT(*) as count FROM fair_play_cases');

    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    logError('database_get_fair_play_case_count_failed', err, { status: status ?? 'all' });
    return 0;
  }
}

export async function dismissFairPlayCase(caseId: number, actorUserId: string, note?: string): Promise<boolean> {
  try {
    await db.execute({
      sql: `
        UPDATE fair_play_cases
        SET status = 'dismissed',
            note = COALESCE(?, note),
            reviewed_by = ?,
            updated_at = unixepoch()
        WHERE id = ?
      `,
      args: [note ?? null, actorUserId, caseId],
    });
    return true;
  } catch (err) {
    logError('database_dismiss_fair_play_case_failed', err, { caseId, actorUserId });
    return false;
  }
}

export async function restrictUserForFairPlay(caseId: number, actorUserId: string, note?: string): Promise<boolean> {
  try {
    const caseResult = await db.execute({
      sql: 'SELECT user_id FROM fair_play_cases WHERE id = ? LIMIT 1',
      args: [caseId],
    });
    const userId = caseResult.rows[0]?.user_id;
    if (!userId) {
      return false;
    }

    await db.execute({
      sql: `
        UPDATE users
        SET fair_play_status = 'restricted',
            rated_restricted_at = unixepoch(),
            rated_restriction_note = ?,
            updated_at = unixepoch()
        WHERE id = ?
      `,
      args: [note ?? null, String(userId)],
    });
    await db.execute({
      sql: `
        UPDATE fair_play_cases
        SET status = 'restricted',
            note = COALESCE(?, note),
            reviewed_by = ?,
            updated_at = unixepoch()
        WHERE id = ?
      `,
      args: [note ?? null, actorUserId, caseId],
    });
    return true;
  } catch (err) {
    logError('database_restrict_user_fair_play_failed', err, { caseId, actorUserId });
    return false;
  }
}

export async function clearFairPlayRestriction(userId: string, actorUserId: string, note?: string): Promise<boolean> {
  try {
    await db.execute({
      sql: `
        UPDATE users
        SET fair_play_status = 'clear',
            rated_restricted_at = NULL,
            rated_restriction_note = NULL,
            updated_at = unixepoch()
        WHERE id = ?
      `,
      args: [userId],
    });
    await db.execute({
      sql: `
        UPDATE fair_play_cases
        SET status = CASE WHEN status = 'restricted' THEN 'reviewed' ELSE status END,
            note = COALESCE(?, note),
            reviewed_by = ?,
            updated_at = unixepoch()
        WHERE user_id = ? AND status IN ('open', 'restricted')
      `,
      args: [note ?? null, actorUserId, userId],
    });
    return true;
  } catch (err) {
    logError('database_clear_fair_play_restriction_failed', err, { userId, actorUserId });
    return false;
  }
}
