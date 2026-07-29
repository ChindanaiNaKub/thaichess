import type { Row } from '@libsql/client';
import { logError } from '../logger';
import { db } from './connection';

export interface PuzzleProgressRecord {
  puzzleId: number;
  lastPlayedAt: number;
  completedAt: number | null;
  attempts: number;
  successes: number;
  failures: number;
}

function normalizePuzzleIds(puzzleIds: number[]): number[] {
  return Array.from(
    new Set(
      puzzleIds
        .map(puzzleId => Number(puzzleId))
        .filter(puzzleId => Number.isInteger(puzzleId) && puzzleId > 0),
    ),
  ).sort((a, b) => a - b);
}

function rowToPuzzleProgressRecord(row: Row): PuzzleProgressRecord {
  return {
    puzzleId: Number(row.puzzle_id),
    lastPlayedAt: Number(row.last_played_at ?? row.completed_at ?? 0),
    completedAt: row.completed_at === null || row.completed_at === undefined ? null : Number(row.completed_at),
    attempts: Number(row.attempts ?? 0),
    successes: Number(row.successes ?? (row.completed_at === null || row.completed_at === undefined ? 0 : 1)),
    failures: Number(row.failures ?? 0),
  };
}

function normalizePuzzleProgressRecords(records: PuzzleProgressRecord[]): PuzzleProgressRecord[] {
  const deduped = new Map<number, PuzzleProgressRecord>();

  for (const record of records) {
    const puzzleId = Number(record.puzzleId);
    if (!Number.isInteger(puzzleId) || puzzleId <= 0) continue;

    const lastPlayedAt = Number(record.lastPlayedAt);
    const completedAt = record.completedAt === null || record.completedAt === undefined
      ? null
      : Number(record.completedAt);
    const attempts = Math.max(0, Number(record.attempts ?? 0));
    const successes = Math.max(0, Number(record.successes ?? (completedAt ? 1 : 0)));
    const failures = Math.max(0, Number(record.failures ?? 0));
    const existing = deduped.get(puzzleId);

    if (!existing) {
      deduped.set(puzzleId, {
        puzzleId,
        lastPlayedAt: Number.isFinite(lastPlayedAt) && lastPlayedAt > 0 ? lastPlayedAt : 0,
        completedAt: Number.isFinite(completedAt ?? NaN) && (completedAt ?? 0) > 0 ? completedAt : null,
        attempts,
        successes,
        failures,
      });
      continue;
    }

      deduped.set(puzzleId, {
        puzzleId,
        lastPlayedAt: Math.max(
          existing.lastPlayedAt,
          Number.isFinite(lastPlayedAt) && lastPlayedAt > 0 ? lastPlayedAt : 0,
      ),
        completedAt: existing.completedAt === null
          ? (Number.isFinite(completedAt ?? NaN) && (completedAt ?? 0) > 0 ? completedAt : null)
          : completedAt === null
            ? existing.completedAt
            : Math.max(existing.completedAt, completedAt),
        attempts: existing.attempts + attempts,
        successes: existing.successes + successes,
        failures: existing.failures + failures,
      });
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (b.lastPlayedAt !== a.lastPlayedAt) return b.lastPlayedAt - a.lastPlayedAt;
    return a.puzzleId - b.puzzleId;
  });
}

export async function getPuzzleProgressForUser(userId: string): Promise<PuzzleProgressRecord[]> {
  try {
    const result = await db.execute({
      sql: `
        SELECT puzzle_id, last_played_at, completed_at, attempts, successes, failures
        FROM puzzle_progress
        WHERE user_id = ?
        ORDER BY last_played_at DESC, puzzle_id ASC
      `,
      args: [userId],
    });

    return result.rows.map(rowToPuzzleProgressRecord);
  } catch (err) {
    logError('database_get_puzzle_progress_failed', err, { userId });
    return [];
  }
}

export async function getCompletedPuzzleIdsForUser(userId: string): Promise<number[]> {
  try {
    const progressRecords = await getPuzzleProgressForUser(userId);
    return normalizePuzzleIds(
      progressRecords
        .filter(record => record.completedAt !== null)
        .map(record => record.puzzleId),
    );
  } catch (err) {
    logError('database_get_completed_puzzle_ids_failed', err, { userId });
    return [];
  }
}

export async function markPuzzlePlayed(userId: string, puzzleId: number): Promise<PuzzleProgressRecord[]> {
  try {
    await db.execute({
      sql: `
        INSERT INTO puzzle_progress (user_id, puzzle_id, last_played_at, completed_at, attempts, successes, failures)
        VALUES (?, ?, unixepoch(), NULL, 0, 0, 0)
        ON CONFLICT(user_id, puzzle_id) DO UPDATE SET
          last_played_at = unixepoch()
      `,
      args: [userId, puzzleId],
    });

    return await getPuzzleProgressForUser(userId);
  } catch (err) {
    logError('database_mark_puzzle_played_failed', err, { userId, puzzleId });
    return await getPuzzleProgressForUser(userId);
  }
}

export async function markPuzzleCompleted(userId: string, puzzleId: number): Promise<PuzzleProgressRecord[]> {
  try {
    await db.execute({
      sql: `
        INSERT INTO puzzle_progress (user_id, puzzle_id, last_played_at, completed_at, attempts, successes, failures)
        VALUES (?, ?, unixepoch(), unixepoch(), 1, 1, 0)
        ON CONFLICT(user_id, puzzle_id) DO UPDATE SET
          last_played_at = unixepoch(),
          completed_at = unixepoch(),
          attempts = COALESCE(puzzle_progress.attempts, 0) + 1,
          successes = COALESCE(puzzle_progress.successes, 0) + 1
      `,
      args: [userId, puzzleId],
    });

    return await getPuzzleProgressForUser(userId);
  } catch (err) {
    logError('database_mark_puzzle_completed_failed', err, { userId, puzzleId });
    return await getPuzzleProgressForUser(userId);
  }
}

export async function markPuzzleAttempt(userId: string, puzzleId: number, succeeded: boolean): Promise<PuzzleProgressRecord[]> {
  if (succeeded) {
    return await markPuzzleCompleted(userId, puzzleId);
  }

  try {
    await db.execute({
      sql: `
        INSERT INTO puzzle_progress (user_id, puzzle_id, last_played_at, completed_at, attempts, successes, failures)
        VALUES (?, ?, unixepoch(), NULL, 1, 0, 1)
        ON CONFLICT(user_id, puzzle_id) DO UPDATE SET
          last_played_at = unixepoch(),
          attempts = COALESCE(puzzle_progress.attempts, 0) + 1,
          failures = COALESCE(puzzle_progress.failures, 0) + 1
      `,
      args: [userId, puzzleId],
    });

    return await getPuzzleProgressForUser(userId);
  } catch (err) {
    logError('database_mark_puzzle_attempt_failed', err, { userId, puzzleId, succeeded });
    return await getPuzzleProgressForUser(userId);
  }
}

export async function mergePuzzleProgress(userId: string, records: PuzzleProgressRecord[]): Promise<PuzzleProgressRecord[]> {
  const normalizedRecords = normalizePuzzleProgressRecords(records);
  if (!normalizedRecords.length) {
    return await getPuzzleProgressForUser(userId);
  }

  try {
    for (const record of normalizedRecords) {
      await db.execute({
        sql: `
          INSERT INTO puzzle_progress (user_id, puzzle_id, last_played_at, completed_at, attempts, successes, failures)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, puzzle_id) DO UPDATE SET
            last_played_at = CASE
              WHEN excluded.last_played_at > COALESCE(puzzle_progress.last_played_at, 0)
                THEN excluded.last_played_at
              ELSE puzzle_progress.last_played_at
            END,
            completed_at = CASE
              WHEN excluded.completed_at IS NULL THEN puzzle_progress.completed_at
              WHEN puzzle_progress.completed_at IS NULL THEN excluded.completed_at
              WHEN excluded.completed_at > puzzle_progress.completed_at THEN excluded.completed_at
              ELSE puzzle_progress.completed_at
            END,
            attempts = COALESCE(puzzle_progress.attempts, 0) + COALESCE(excluded.attempts, 0),
            successes = COALESCE(puzzle_progress.successes, 0) + COALESCE(excluded.successes, 0),
            failures = COALESCE(puzzle_progress.failures, 0) + COALESCE(excluded.failures, 0)
        `,
        args: [
          userId,
          record.puzzleId,
          record.lastPlayedAt,
          record.completedAt,
          record.attempts,
          record.successes,
          record.failures,
        ],
      });
    }

    return await getPuzzleProgressForUser(userId);
  } catch (err) {
    logError('database_merge_puzzle_progress_failed', err, { userId, puzzleCount: normalizedRecords.length });
    return await getPuzzleProgressForUser(userId);
  }
}

export async function mergeCompletedPuzzles(userId: string, puzzleIds: number[]): Promise<number[]> {
  const timestamp = Math.floor(Date.now() / 1000);
  const records = normalizePuzzleIds(puzzleIds).map((puzzleId) => ({
    puzzleId,
    lastPlayedAt: timestamp,
    completedAt: timestamp,
    attempts: 1,
    successes: 1,
    failures: 0,
  }));

  try {
    const mergedRecords = await mergePuzzleProgress(userId, records);
    return normalizePuzzleIds(
      mergedRecords
        .filter(record => record.completedAt !== null)
        .map(record => record.puzzleId),
    );
  } catch (err) {
    logError('database_merge_completed_puzzles_failed', err, { userId, puzzleCount: puzzleIds.length });
    return await getCompletedPuzzleIdsForUser(userId);
  }
}
