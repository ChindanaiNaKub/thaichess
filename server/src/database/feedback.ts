import type { Row } from '@libsql/client';
import { logError } from '../logger';
import { db } from './connection';

export interface SavedFeedback {
  id: number;
  type: string;
  message: string;
  page: string;
  user_agent: string;
  ip: string;
  created_at: number;
  visible?: number;
  deleted_at?: number | null;
  deleted_by?: string | null;
  moderation_note?: string | null;
  user_id?: string | null;
}

function rowToSavedFeedback(row: Row): SavedFeedback {
  return {
    id: Number(row.id ?? 0),
    type: String(row.type ?? 'bug'),
    message: String(row.message ?? ''),
    page: String(row.page ?? ''),
    user_agent: String(row.user_agent ?? ''),
    ip: String(row.ip ?? ''),
    created_at: Number(row.created_at ?? 0),
    visible: Number(row.visible ?? 1),
    deleted_at: row.deleted_at === null || row.deleted_at === undefined ? null : Number(row.deleted_at),
    deleted_by: row.deleted_by === null || row.deleted_by === undefined ? null : String(row.deleted_by),
    moderation_note: row.moderation_note === null || row.moderation_note === undefined ? null : String(row.moderation_note),
    user_id: row.user_id === null || row.user_id === undefined ? null : String(row.user_id),
  };
}

export async function saveFeedback(data: {
  type: string;
  message: string;
  page: string;
  userAgent: string;
  ip: string | undefined;
  userId?: string | null;
}): Promise<void> {
  try {
    await db.execute({
      sql: `
        INSERT INTO feedback (type, message, page, user_agent, ip, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [data.type, data.message, data.page, data.userAgent, data.ip || 'unknown', data.userId ?? null],
    });
  } catch (err) {
    logError('database_save_feedback_failed', err, { type: data.type, page: data.page });
  }
}

export async function getFeedback(limit: number = 20, offset: number = 0, type?: string): Promise<SavedFeedback[]> {
  try {
    const result = type && type !== 'all'
      ? await db.execute({
        sql: `
          SELECT id, type, message, page, user_agent, ip, created_at, visible, deleted_at, deleted_by, moderation_note, user_id
          FROM feedback
          WHERE visible = 1 AND type = ?
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [type, limit, offset],
      })
      : await db.execute({
        sql: `
          SELECT id, type, message, page, user_agent, ip, created_at, visible, deleted_at, deleted_by, moderation_note, user_id
          FROM feedback
          WHERE visible = 1
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [limit, offset],
      });

    return result.rows.map(rowToSavedFeedback);
  } catch (err) {
    logError('database_get_feedback_failed', err, { limit, offset, type: type ?? 'all' });
    return [];
  }
}

export async function getFeedbackCount(type?: string): Promise<number> {
  try {
    const result = type && type !== 'all'
      ? await db.execute({
        sql: 'SELECT COUNT(*) as count FROM feedback WHERE visible = 1 AND type = ?',
        args: [type],
      })
      : await db.execute('SELECT COUNT(*) as count FROM feedback WHERE visible = 1');
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    logError('database_get_feedback_count_failed', err, { type: type ?? 'all' });
    return 0;
  }
}

export async function getFeedbackForAdmin(limit: number = 20, offset: number = 0, type?: string): Promise<SavedFeedback[]> {
  try {
    const result = type && type !== 'all'
      ? await db.execute({
        sql: `
          SELECT id, type, message, page, user_agent, ip, created_at, visible, deleted_at, deleted_by, moderation_note, user_id
          FROM feedback
          WHERE visible = 1 AND type = ?
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [type, limit, offset],
      })
      : await db.execute({
        sql: `
          SELECT id, type, message, page, user_agent, ip, created_at, visible, deleted_at, deleted_by, moderation_note, user_id
          FROM feedback
          WHERE visible = 1
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [limit, offset],
      });

    return result.rows.map(rowToSavedFeedback);
  } catch (err) {
    logError('database_get_feedback_admin_failed', err, { limit, offset, type: type ?? 'all' });
    return [];
  }
}

export async function moderateFeedback(feedbackId: number, actorUserId: string, note?: string): Promise<boolean> {
  try {
    await db.execute({
      sql: `
        UPDATE feedback
        SET visible = 0,
            deleted_at = unixepoch(),
            deleted_by = ?,
            moderation_note = ?
        WHERE id = ? AND visible = 1
      `,
      args: [actorUserId, note ?? null, feedbackId],
    });
    return true;
  } catch (err) {
    logError('database_moderate_feedback_failed', err, { feedbackId, actorUserId });
    return false;
  }
}
