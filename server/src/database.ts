import fs from 'fs';
import path from 'path';
import { createClient, type Client, type InStatement, type Row } from '@libsql/client';
import type { Move, Board, TimeControl, RatingChangeSummary } from '../../shared/types';
import { logError, logInfo } from './logger';
import './env';

// Compiled to server/dist/server/src — repo data/ is four levels up
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../../data');
const LEGACY_DB_PATH = path.join(DATA_DIR, 'makruk.db');
const DB_PATH = fs.existsSync(LEGACY_DB_PATH)
  ? LEGACY_DB_PATH
  : path.join(DATA_DIR, 'thaichess.db');
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL?.trim() || undefined;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

let db: Client;
type SqlExecutor = Pick<Client, 'execute'>;

async function ensureColumn(table: string, column: string, definition: string) {
  const result = await db.execute(`PRAGMA table_info(${table})`);
  const hasColumn = result.rows.some((row) => String(row.name) === column);

  if (!hasColumn) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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
        white_user_id TEXT,
        black_user_id TEXT,
        result TEXT,
        result_reason TEXT,
        rated INTEGER NOT NULL DEFAULT 0,
        game_mode TEXT NOT NULL DEFAULT 'private',
        white_rating_before INTEGER,
        black_rating_before INTEGER,
        white_rating_after INTEGER,
        black_rating_after INTEGER,
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
    `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        username TEXT UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        rating INTEGER NOT NULL DEFAULT 1500,
        rated_games INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        draws INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        last_login_at INTEGER
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        last_seen_at INTEGER DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
    `
      CREATE TABLE IF NOT EXISTS puzzle_progress (
        user_id TEXT NOT NULL,
        puzzle_id INTEGER NOT NULL,
        completed_at INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (user_id, puzzle_id)
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_puzzle_progress_user_id ON puzzle_progress(user_id, completed_at DESC)',
    `
      CREATE TABLE IF NOT EXISTS login_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        consumed_at INTEGER,
        requested_ip TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_codes(email)',
    'CREATE INDEX IF NOT EXISTS idx_login_codes_expires_at ON login_codes(expires_at)',
  ];

  for (const statement of statements) {
    await db.execute(statement);
  }

  await ensureColumn('feedback', 'visible', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('feedback', 'deleted_at', 'INTEGER');
  await ensureColumn('feedback', 'deleted_by', 'TEXT');
  await ensureColumn('feedback', 'moderation_note', 'TEXT');
  await ensureColumn('feedback', 'user_id', 'TEXT');
  await ensureColumn('users', 'rating', 'INTEGER NOT NULL DEFAULT 1500');
  await ensureColumn('users', 'rated_games', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'wins', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'losses', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'draws', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('games', 'white_user_id', 'TEXT');
  await ensureColumn('games', 'black_user_id', 'TEXT');
  await ensureColumn('games', 'rated', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('games', 'game_mode', "TEXT NOT NULL DEFAULT 'private'");
  await ensureColumn('games', 'white_rating_before', 'INTEGER');
  await ensureColumn('games', 'black_rating_before', 'INTEGER');
  await ensureColumn('games', 'white_rating_after', 'INTEGER');
  await ensureColumn('games', 'black_rating_after', 'INTEGER');
}

function rowToSavedGame(row: Row): SavedGame {
  return {
    id: String(row.id),
    white_name: String(row.white_name ?? 'Anonymous'),
    black_name: String(row.black_name ?? 'Anonymous'),
    white_user_id: row.white_user_id === null || row.white_user_id === undefined ? null : String(row.white_user_id),
    black_user_id: row.black_user_id === null || row.black_user_id === undefined ? null : String(row.black_user_id),
    result: String(row.result ?? ''),
    result_reason: String(row.result_reason ?? ''),
    rated: Number(row.rated ?? 0),
    game_mode: String(row.game_mode ?? 'private'),
    white_rating_before: row.white_rating_before === null || row.white_rating_before === undefined ? null : Number(row.white_rating_before),
    black_rating_before: row.black_rating_before === null || row.black_rating_before === undefined ? null : Number(row.black_rating_before),
    white_rating_after: row.white_rating_after === null || row.white_rating_after === undefined ? null : Number(row.white_rating_after),
    black_rating_after: row.black_rating_after === null || row.black_rating_after === undefined ? null : Number(row.black_rating_after),
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
    visible: Number(row.visible ?? 1),
    deleted_at: row.deleted_at === null || row.deleted_at === undefined ? null : Number(row.deleted_at),
    deleted_by: row.deleted_by === null || row.deleted_by === undefined ? null : String(row.deleted_by),
    moderation_note: row.moderation_note === null || row.moderation_note === undefined ? null : String(row.moderation_note),
    user_id: row.user_id === null || row.user_id === undefined ? null : String(row.user_id),
  };
}

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  role: 'user' | 'admin';
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
    email: String(row.email),
    username: row.username === null || row.username === undefined ? null : String(row.username),
    role: String(row.role ?? 'user') === 'admin' ? 'admin' : 'user',
    rating: Number(row.rating ?? 1500),
    rated_games: Number(row.rated_games ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0),
    created_at: Number(row.created_at ?? 0),
    updated_at: Number(row.updated_at ?? 0),
    last_login_at: row.last_login_at === null || row.last_login_at === undefined ? null : Number(row.last_login_at),
  };
}

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

function rowToLeaderboardEntry(row: Row): LeaderboardEntry {
  const username = row.username === null || row.username === undefined ? null : String(row.username);
  const email = String(row.email ?? '');

  return {
    id: String(row.id),
    display_name: getPublicDisplayName(username, email),
    rating: Number(row.rating ?? 1500),
    rated_games: Number(row.rated_games ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0),
  };
}

async function getUserByIdFromExecutor(executor: SqlExecutor, id: string): Promise<AuthUser | null> {
  const result = await executor.execute({
    sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToAuthUser(row) : null;
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
  whiteUserId?: string | null;
  blackUserId?: string | null;
  rated?: boolean;
  gameMode?: string;
  whiteRatingBefore?: number | null;
  blackRatingBefore?: number | null;
  whiteRatingAfter?: number | null;
  blackRatingAfter?: number | null;
}): Promise<{ ratingChange: RatingChangeSummary | null }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let transaction: Awaited<ReturnType<Client['transaction']>> | null = null;

    try {
      transaction = await db.transaction('write');
      const shouldRate = Boolean(data.rated && data.whiteUserId && data.blackUserId);
      let whiteRatingBefore = data.whiteRatingBefore ?? null;
      let blackRatingBefore = data.blackRatingBefore ?? null;
      let whiteRatingAfter = data.whiteRatingAfter ?? null;
      let blackRatingAfter = data.blackRatingAfter ?? null;

      const existingResult = await transaction.execute({
        sql: `
          SELECT white_rating_before, black_rating_before, white_rating_after, black_rating_after
          FROM games
          WHERE id = ?
          LIMIT 1
        `,
        args: [data.id],
      });
      const existingRow = existingResult.rows[0];
      if (existingRow) {
        await transaction.commit();
        if (existingRow.white_rating_after !== null && existingRow.black_rating_after !== null) {
          return {
            ratingChange: {
              whiteBefore: Number(existingRow.white_rating_before ?? existingRow.white_rating_after),
              blackBefore: Number(existingRow.black_rating_before ?? existingRow.black_rating_after),
              whiteAfter: Number(existingRow.white_rating_after),
              blackAfter: Number(existingRow.black_rating_after),
            },
          };
        }

        return { ratingChange: null };
      }

      if (shouldRate) {
        const [whiteUser, blackUser] = await Promise.all([
          getUserByIdFromExecutor(transaction, data.whiteUserId!),
          getUserByIdFromExecutor(transaction, data.blackUserId!),
        ]);

        if (whiteUser && blackUser) {
          whiteRatingBefore = whiteUser.rating;
          blackRatingBefore = blackUser.rating;

          const ratingUpdate = calculateEloUpdate(whiteUser.rating, blackUser.rating, data.result);
          whiteRatingAfter = ratingUpdate.whiteAfter;
          blackRatingAfter = ratingUpdate.blackAfter;

          await transaction.execute({
            sql: `
              UPDATE users
              SET rating = ?, rated_games = rated_games + 1, wins = wins + ?, losses = losses + ?, draws = draws + ?, updated_at = unixepoch()
              WHERE id = ?
            `,
            args: [
              whiteRatingAfter,
              data.result === 'white' ? 1 : 0,
              data.result === 'black' ? 1 : 0,
              data.result === 'draw' ? 1 : 0,
              data.whiteUserId!,
            ],
          });

          await transaction.execute({
            sql: `
              UPDATE users
              SET rating = ?, rated_games = rated_games + 1, wins = wins + ?, losses = losses + ?, draws = draws + ?, updated_at = unixepoch()
              WHERE id = ?
            `,
            args: [
              blackRatingAfter,
              data.result === 'black' ? 1 : 0,
              data.result === 'white' ? 1 : 0,
              data.result === 'draw' ? 1 : 0,
              data.blackUserId!,
            ],
          });
        }
      }

      const appliedRatedGame = shouldRate
        && whiteRatingBefore !== null
        && blackRatingBefore !== null
        && whiteRatingAfter !== null
        && blackRatingAfter !== null;

      await transaction.execute({
        sql: `
          INSERT OR REPLACE INTO games (
            id, white_user_id, black_user_id, result, result_reason, rated, game_mode, white_rating_before, black_rating_before,
            white_rating_after, black_rating_after, time_control_initial, time_control_increment, moves, final_board, move_count, finished_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
        `,
        args: [
          data.id,
          data.whiteUserId ?? null,
          data.blackUserId ?? null,
          data.result,
          data.resultReason,
          appliedRatedGame ? 1 : 0,
          data.gameMode ?? 'private',
          whiteRatingBefore,
          blackRatingBefore,
          whiteRatingAfter,
          blackRatingAfter,
          data.timeControl.initial,
          data.timeControl.increment,
          JSON.stringify(data.moves),
          JSON.stringify(data.finalBoard),
          data.moveCount,
        ],
      });

      await transaction.commit();

      return appliedRatedGame
        ? {
          ratingChange: {
            whiteBefore: whiteRatingBefore!,
            blackBefore: blackRatingBefore!,
            whiteAfter: whiteRatingAfter!,
            blackAfter: blackRatingAfter!,
          },
        }
        : { ratingChange: null };
    } catch (err) {
      if (transaction && !transaction.closed) {
        await transaction.rollback().catch(() => undefined);
      }
      if (isSqliteBusyError(err) && attempt < 2) {
        await new Promise<void>((resolve) => setImmediate(resolve));
        continue;
      }
      if (isSqliteBusyError(err)) {
        const existingResult = await db.execute({
          sql: `
            SELECT white_rating_before, black_rating_before, white_rating_after, black_rating_after
            FROM games
            WHERE id = ?
            LIMIT 1
          `,
          args: [data.id],
        });
        const existingRow = existingResult.rows[0];
        if (existingRow) {
          if (existingRow.white_rating_after !== null && existingRow.black_rating_after !== null) {
            return {
              ratingChange: {
                whiteBefore: Number(existingRow.white_rating_before ?? existingRow.white_rating_after),
                blackBefore: Number(existingRow.black_rating_before ?? existingRow.black_rating_after),
                whiteAfter: Number(existingRow.white_rating_after),
                blackAfter: Number(existingRow.black_rating_after),
              },
            };
          }

          return { ratingChange: null };
        }
      }
      logError('database_save_completed_game_failed', err, { gameId: data.id, attempt: attempt + 1 });
      return { ratingChange: null };
    } finally {
      transaction?.close();
    }
  }

  return { ratingChange: null };
}

function calculateEloUpdate(
  whiteRating: number,
  blackRating: number,
  result: 'white' | 'black' | 'draw',
  kFactor: number = 24,
) {
  const expectedWhite = 1 / (1 + 10 ** ((blackRating - whiteRating) / 400));
  const whiteScore = result === 'white' ? 1 : result === 'draw' ? 0.5 : 0;
  const whiteDelta = Math.round(kFactor * (whiteScore - expectedWhite));
  const blackDelta = -whiteDelta;

  return {
    whiteAfter: whiteRating + whiteDelta,
    blackAfter: blackRating + blackDelta,
  };
}

function isSqliteBusyError(error: unknown) {
  return error instanceof Error && error.message.includes('SQLITE_BUSY');
}

export interface SavedGame {
  id: string;
  white_name: string;
  black_name: string;
  white_user_id: string | null;
  black_user_id: string | null;
  result: string;
  result_reason: string;
  rated: number;
  game_mode: string;
  white_rating_before: number | null;
  black_rating_before: number | null;
  white_rating_after: number | null;
  black_rating_after: number | null;
  time_control_initial: number;
  time_control_increment: number;
  moves: string;
  final_board: string;
  move_count: number;
  created_at: number;
  finished_at: number;
}

export type RecentGamesFilter = 'all' | 'rated' | 'casual';

function getRecentGamesWhereClause(filter: RecentGamesFilter): string {
  if (filter === 'rated') return 'finished_at IS NOT NULL AND rated = 1';
  if (filter === 'casual') return 'finished_at IS NOT NULL AND rated = 0';
  return 'finished_at IS NOT NULL';
}

function getRecentGamesOrderByClause(): string {
  return `
    CASE
      WHEN move_count = 0 THEN 1
      WHEN result_reason = 'draw_agreement' THEN 1
      WHEN result_reason IN ('timeout', 'resignation') AND move_count <= 1 THEN 1
      ELSE 0
    END ASC,
    finished_at DESC
  `;
}

export async function getRecentGames(limit: number = 20, offset: number = 0, filter: RecentGamesFilter = 'all'): Promise<SavedGame[]> {
  try {
    const whereClause = getRecentGamesWhereClause(filter);
    const orderByClause = getRecentGamesOrderByClause();
    const result = await db.execute({
      sql: `
        SELECT * FROM games
        WHERE ${whereClause}
        ORDER BY ${orderByClause}
        LIMIT ? OFFSET ?
      `,
      args: [limit, offset],
    });
    return result.rows.map(rowToSavedGame);
  } catch (err) {
    logError('database_get_recent_games_failed', err, { limit, offset, filter });
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

export async function getGameCount(filter: RecentGamesFilter = 'all'): Promise<number> {
  try {
    const whereClause = getRecentGamesWhereClause(filter);
    const result = await db.execute(`SELECT COUNT(*) as count FROM games WHERE ${whereClause}`);
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    logError('database_get_game_count_failed', err, { filter });
    return 0;
  }
}

export async function getLeaderboard(limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> {
  try {
    const result = await db.execute({
      sql: `
        SELECT id, username, email, rating, rated_games, wins, losses, draws
        FROM users
        WHERE rated_games > 0
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
    const result = await db.execute('SELECT COUNT(*) as count FROM users WHERE rated_games > 0');
    return Number(result.rows[0]?.count ?? 0);
  } catch (err) {
    logError('database_get_leaderboard_count_failed', err);
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
  try {
    await db.execute({
      sql: `
        INSERT INTO users (id, email, role, last_login_at)
        VALUES (?, ?, ?, unixepoch())
        ON CONFLICT(email) DO UPDATE SET
          role = excluded.role,
          updated_at = unixepoch(),
          last_login_at = unixepoch()
      `,
      args: [data.id, data.email, data.role],
    });
    return await getUserByEmail(data.email);
  } catch (err) {
    logError('database_upsert_user_failed', err, { email: data.email });
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
      sql: 'UPDATE users SET username = ?, updated_at = unixepoch() WHERE id = ?',
      args: [username, userId],
    });
    return await getUserById(userId);
  } catch (err) {
    logError('database_update_username_failed', err, { userId });
    return null;
  }
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

export async function getCompletedPuzzleIdsForUser(userId: string): Promise<number[]> {
  try {
    const result = await db.execute({
      sql: `
        SELECT puzzle_id
        FROM puzzle_progress
        WHERE user_id = ?
        ORDER BY completed_at ASC, puzzle_id ASC
      `,
      args: [userId],
    });

    return normalizePuzzleIds(result.rows.map(row => Number(row.puzzle_id)));
  } catch (err) {
    logError('database_get_completed_puzzle_ids_failed', err, { userId });
    return [];
  }
}

export async function markPuzzleCompleted(userId: string, puzzleId: number): Promise<number[]> {
  try {
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO puzzle_progress (user_id, puzzle_id, completed_at)
        VALUES (?, ?, unixepoch())
      `,
      args: [userId, puzzleId],
    });

    return await getCompletedPuzzleIdsForUser(userId);
  } catch (err) {
    logError('database_mark_puzzle_completed_failed', err, { userId, puzzleId });
    return await getCompletedPuzzleIdsForUser(userId);
  }
}

export async function mergeCompletedPuzzles(userId: string, puzzleIds: number[]): Promise<number[]> {
  const normalizedPuzzleIds = normalizePuzzleIds(puzzleIds);
  if (!normalizedPuzzleIds.length) {
    return await getCompletedPuzzleIdsForUser(userId);
  }

  try {
    for (const puzzleId of normalizedPuzzleIds) {
      await db.execute({
        sql: `
          INSERT OR IGNORE INTO puzzle_progress (user_id, puzzle_id, completed_at)
          VALUES (?, ?, unixepoch())
        `,
        args: [userId, puzzleId],
      });
    }

    return await getCompletedPuzzleIdsForUser(userId);
  } catch (err) {
    logError('database_merge_completed_puzzles_failed', err, { userId, puzzleCount: normalizedPuzzleIds.length });
    return await getCompletedPuzzleIdsForUser(userId);
  }
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

export async function getUserBySessionTokenHash(tokenHash: string): Promise<AuthUser | null> {
  try {
    const result = await db.execute({
      sql: `
        SELECT users.*
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ? AND sessions.expires_at > unixepoch()
        LIMIT 1
      `,
      args: [tokenHash],
    });
    const row = result.rows[0];
    if (!row) return null;

    await db.execute({
      sql: 'UPDATE sessions SET last_seen_at = unixepoch() WHERE token_hash = ?',
      args: [tokenHash],
    });

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
