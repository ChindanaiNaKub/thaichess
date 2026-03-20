import fs from 'fs';
import path from 'path';
import { createClient, type Client, type InStatement, type Row } from '@libsql/client';
import type { Move, Board, TimeControl } from '../../shared/types';
import { logError, logInfo } from './logger';

// Compiled to server/dist/server/src — repo data/ is four levels up
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../../data');
const LEGACY_DB_PATH = path.join(DATA_DIR, 'makruk.db');
const DB_PATH = fs.existsSync(LEGACY_DB_PATH)
  ? LEGACY_DB_PATH
  : path.join(DATA_DIR, 'thaichess.db');
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let db: Client;

function getDatabaseConfig() {
  if (TURSO_DATABASE_URL) {
    return {
      client: createClient({
        url: TURSO_DATABASE_URL,
        authToken: TURSO_AUTH_TOKEN,
      }),
      mode: 'turso' as const,
      location: TURSO_DATABASE_URL,
    };
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  return {
    client: createClient({
      url: `file:${DB_PATH}`,
    }),
    mode: 'local' as const,
    location: DB_PATH,
  };
}

async function runSchemaMigration() {
  const statements: InStatement[] = [
    'PRAGMA foreign_keys = ON',
    `
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        white_name TEXT DEFAULT 'Anonymous',
        black_name TEXT DEFAULT 'Anonymous',
        result TEXT,
        result_reason TEXT,
        time_control_initial INTEGER,
        time_control_increment INTEGER,
        moves TEXT,
        final_board TEXT,
        move_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        finished_at INTEGER
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_games_finished_at ON games(finished_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC)',
    `
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT DEFAULT 'bug',
        message TEXT NOT NULL,
        page TEXT,
        user_agent TEXT,
        ip TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `,
  ];

  for (const statement of statements) {
    await db.execute(statement);
  }
}

function rowToSavedGame(row: Row): SavedGame {
  return {
    id: String(row.id),
    white_name: String(row.white_name ?? 'Anonymous'),
    black_name: String(row.black_name ?? 'Anonymous'),
    result: String(row.result ?? ''),
    result_reason: String(row.result_reason ?? ''),
    time_control_initial: Number(row.time_control_initial ?? 0),
    time_control_increment: Number(row.time_control_increment ?? 0),
    moves: String(row.moves ?? '[]'),
    final_board: String(row.final_board ?? '[]'),
    move_count: Number(row.move_count ?? 0),
    created_at: Number(row.created_at ?? 0),
    finished_at: Number(row.finished_at ?? 0),
  };
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
  };
}

export async function initDatabase(): Promise<void> {
  const config = getDatabaseConfig();
  db = config.client;

  await runSchemaMigration();

  logInfo('database_initialized', {
    mode: config.mode,
    location: config.location,
  });
}

export async function saveCompletedGame(data: {
  id: string;
  result: 'white' | 'black' | 'draw';
  resultReason: string;
  timeControl: TimeControl;
  moves: Move[];
  finalBoard: Board;
  moveCount: number;
}): Promise<void> {
  try {
    await db.execute({
      sql: `
        INSERT OR REPLACE INTO games (
          id, result, result_reason, time_control_initial, time_control_increment, moves, final_board, move_count, finished_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
      `,
      args: [
        data.id,
        data.result,
        data.resultReason,
        data.timeControl.initial,
        data.timeControl.increment,
        JSON.stringify(data.moves),
        JSON.stringify(data.finalBoard),
        data.moveCount,
      ],
    });
  } catch (err) {
    logError('database_save_completed_game_failed', err, { gameId: data.id });
  }
}

export interface SavedGame {
  id: string;
  white_name: string;
  black_name: string;
  result: string;
  result_reason: string;
  time_control_initial: number;
  time_control_increment: number;
  moves: string;
  final_board: string;
  move_count: number;
  created_at: number;
  finished_at: number;
}

export async function getRecentGames(limit: number = 20, offset: number = 0): Promise<SavedGame[]> {
  try {
    const result = await db.execute({
      sql: `
        SELECT * FROM games
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [limit, offset],
    });
    return result.rows.map(rowToSavedGame);
  } catch (err) {
    logError('database_get_recent_games_failed', err, { limit, offset });
    return [];
  }
}

export async function getGame(id: string): Promise<SavedGame | null> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM games WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0];
    return row ? rowToSavedGame(row) : null;
  } catch (err) {
    logError('database_get_game_failed', err, { gameId: id });
    return null;
  }
}

export async function getGameCount(): Promise<number> {
  try {
    const result = await db.execute('SELECT COUNT(*) as count FROM games WHERE finished_at IS NOT NULL');
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    logError('database_get_game_count_failed', err);
    return 0;
  }
}

export async function getStats(): Promise<{ totalGames: number; totalMoves: number; whiteWins: number; blackWins: number; draws: number }> {
  try {
    const result = await db.execute(`
      SELECT
        COUNT(*) as totalGames,
        COALESCE(SUM(move_count), 0) as totalMoves,
        COALESCE(SUM(CASE WHEN result = 'white' THEN 1 ELSE 0 END), 0) as whiteWins,
        COALESCE(SUM(CASE WHEN result = 'black' THEN 1 ELSE 0 END), 0) as blackWins,
        COALESCE(SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END), 0) as draws
      FROM games WHERE finished_at IS NOT NULL
    `);
    const row = result.rows[0];
    return {
      totalGames: Number(row?.totalGames ?? 0),
      totalMoves: Number(row?.totalMoves ?? 0),
      whiteWins: Number(row?.whiteWins ?? 0),
      blackWins: Number(row?.blackWins ?? 0),
      draws: Number(row?.draws ?? 0),
    };
  } catch (err) {
    logError('database_get_stats_failed', err);
    return { totalGames: 0, totalMoves: 0, whiteWins: 0, blackWins: 0, draws: 0 };
  }
}

export async function saveFeedback(data: {
  type: string;
  message: string;
  page: string;
  userAgent: string;
  ip: string | undefined;
}): Promise<void> {
  try {
    await db.execute({
      sql: `
        INSERT INTO feedback (type, message, page, user_agent, ip)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [data.type, data.message, data.page, data.userAgent, data.ip || 'unknown'],
    });
  } catch (err) {
    logError('database_save_feedback_failed', err, { type: data.type, page: data.page });
  }
}

export interface SavedFeedback {
  id: number;
  type: string;
  message: string;
  page: string;
  user_agent: string;
  ip: string;
  created_at: number;
}

export async function getFeedback(limit: number = 20, offset: number = 0, type?: string): Promise<SavedFeedback[]> {
  try {
    const result = type && type !== 'all'
      ? await db.execute({
        sql: `
          SELECT id, type, message, page, user_agent, ip, created_at FROM feedback
          WHERE type = ?
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [type, limit, offset],
      })
      : await db.execute({
        sql: `
          SELECT id, type, message, page, user_agent, ip, created_at FROM feedback
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
        sql: 'SELECT COUNT(*) as count FROM feedback WHERE type = ?',
        args: [type],
      })
      : await db.execute('SELECT COUNT(*) as count FROM feedback');
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    logError('database_get_feedback_count_failed', err, { type: type ?? 'all' });
    return 0;
  }
}
