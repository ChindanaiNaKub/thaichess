import fs from 'fs';
import path from 'path';
import { createClient, type Client, type InStatement, type Row } from '@libsql/client';
import type { GameAnalysis } from '../../shared/analysis';
import { USERNAME_CHANGE_COOLDOWN_SECONDS } from '../../shared/authLimits';
import type { Move, Board, TimeControl, RatingChangeSummary, PieceColor } from '../../shared/types';
import { logError, logInfo, logWarn } from './logger';
import './env';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL?.trim() || undefined;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

let db: Client;
type SqlExecutor = Pick<Client, 'execute'>;
export type FairPlayStatus = 'clear' | 'restricted';
export type FairPlayEventType = 'analysis_blocked' | 'user_reported';
export type FairPlayCaseStatus = 'open' | 'reviewed' | 'restricted' | 'dismissed';
export const INITIAL_USER_RATING = 500;

// Valid tables and columns for schema migrations (prevents SQL injection)
const VALID_MIGRATION_TABLES = new Set([
  'feedback',
  'users',
  'games',
  'puzzle_progress',
  'sessions',
  'login_codes',
  'fair_play_events',
  'fair_play_cases',
  'accounts',
  'auth_sessions',
  'twoFactor',
  'verifications',
]);

// Valid column names for each table (prevents SQL injection)
const VALID_MIGRATION_COLUMNS: Record<string, Set<string>> = {
  feedback: new Set(['visible', 'deleted_at', 'deleted_by', 'moderation_note', 'user_id']),
  users: new Set([
    'fair_play_status', 'rated_restricted_at', 'rated_restriction_note',
    'rating', 'rated_games', 'wins', 'losses', 'draws',
    'name', 'image', 'email_verified', 'twoFactorEnabled', 'username_updated_at',
  ]),
  games: new Set([
    'white_user_id', 'black_user_id', 'rated', 'game_mode', 'game_type',
    'opponent_type', 'opponent_name', 'bot_level', 'bot_color',
    'white_rating_before', 'black_rating_before', 'white_rating_after', 'black_rating_after'
  ]),
  puzzle_progress: new Set(['last_played_at', 'attempts', 'successes', 'failures']),
};

// Valid SQLite type definitions (prevents SQL injection in column definitions)
const VALID_SQLITE_TYPE_PATTERN = /^(INTEGER|TEXT|REAL|BLOB|NUMERIC)(\s+NOT\s+NULL)?(\s+DEFAULT\s+([^'"\s;]+|'[^']*'))?$/i;

async function ensureColumn(table: string, column: string, definition: string) {
  // Validate table name against whitelist
  if (!VALID_MIGRATION_TABLES.has(table)) {
    logError('ensureColumn_invalid_table', new Error(`Invalid table: ${table}`), { table, column });
    throw new Error(`Invalid table name: ${table}`);
  }

  // Validate column name against whitelist for this table
  const validColumns = VALID_MIGRATION_COLUMNS[table];
  if (!validColumns || !validColumns.has(column)) {
    logError('ensureColumn_invalid_column', new Error(`Invalid column: ${column} for table ${table}`), { table, column });
    throw new Error(`Invalid column name: ${column} for table: ${table}`);
  }

  // Validate column definition syntax (prevents SQL injection)
  if (!VALID_SQLITE_TYPE_PATTERN.test(definition.trim())) {
    logError('ensureColumn_invalid_definition', new Error(`Invalid definition: ${definition}`), { table, column, definition });
    throw new Error(`Invalid column definition: ${definition}`);
  }

  // Use parameterized query for PRAGMA (table name is safe due to whitelist)
  const result = await db.execute({
    sql: `PRAGMA table_info(${table})`,
    args: [],
  });
  const hasColumn = result.rows.some((row) => String(row.name) === column);

  if (!hasColumn) {
    // Both table and column are validated, definition is sanitized
    // This is safe because we've whitelisted all inputs
    await db.execute({
      sql: `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
      args: [],
    });
    logInfo('ensureColumn_added', { table, column, definition });
  }
}

function findWorkspaceRoot(startDir: string): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { workspaces?: unknown };
        if (Array.isArray(parsed.workspaces) && parsed.workspaces.includes('server')) {
          return currentDir;
        }
      } catch {
        // Ignore malformed package.json candidates and keep walking upward.
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }
    currentDir = parentDir;
  }
}

const WORKSPACE_ROOT = findWorkspaceRoot(__dirname);
const DEFAULT_DATA_DIR = path.join(WORKSPACE_ROOT, 'data');
const LEGACY_DEV_DATA_DIR = path.resolve(__dirname, '../../../../data');

function copyFileIfMissing(sourcePath: string, targetPath: string) {
  if (!fs.existsSync(sourcePath) || fs.existsSync(targetPath)) return false;

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  return true;
}

function resolveLocalDatabasePath() {
  const configuredDataDir = process.env.DATA_DIR?.trim();
  const dataDir = configuredDataDir || DEFAULT_DATA_DIR;
  const legacyDbPath = path.join(dataDir, 'makruk.db');
  const dbPath = path.join(dataDir, 'thaichess.db');

  if (!configuredDataDir && LEGACY_DEV_DATA_DIR !== dataDir) {
    const migratedLegacyDb = copyFileIfMissing(
      path.join(LEGACY_DEV_DATA_DIR, 'makruk.db'),
      legacyDbPath,
    );
    const migratedCurrentDb = copyFileIfMissing(
      path.join(LEGACY_DEV_DATA_DIR, 'thaichess.db'),
      dbPath,
    );

    if (migratedLegacyDb || migratedCurrentDb) {
      logWarn('database_legacy_path_migrated', {
        source: LEGACY_DEV_DATA_DIR,
        target: dataDir,
        migratedFiles: [
          migratedLegacyDb ? 'makruk.db' : null,
          migratedCurrentDb ? 'thaichess.db' : null,
        ].filter(Boolean),
      });
    }
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return {
    dataDir,
    legacyDbPath,
    dbPath,
    activePath: fs.existsSync(legacyDbPath) ? legacyDbPath : dbPath,
  };
}

export function getLibsqlConnectionOptions() {
  if (TURSO_DATABASE_URL) {
    return {
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN || undefined,
    };
  }

  const localDatabase = resolveLocalDatabasePath();

  return {
    url: `file:${localDatabase.activePath}`,
  };
}

export function getDatabaseConfig() {
  const clientOptions = getLibsqlConnectionOptions();

  if (TURSO_DATABASE_URL) {
    return {
      client: createClient(clientOptions),
      mode: 'turso' as const,
      location: TURSO_DATABASE_URL,
    };
  }

  const localDatabase = resolveLocalDatabasePath();

  return {
    client: createClient(clientOptions),
    mode: 'local' as const,
    location: localDatabase.activePath,
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
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        email_verified INTEGER NOT NULL DEFAULT 0,
        twoFactorEnabled INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        username TEXT UNIQUE,
        username_updated_at INTEGER,
        role TEXT NOT NULL DEFAULT 'user',
        fair_play_status TEXT NOT NULL DEFAULT 'clear',
        rated_restricted_at INTEGER,
        rated_restriction_note TEXT,
        rating INTEGER NOT NULL DEFAULT ${INITIAL_USER_RATING},
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
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        access_token_expires_at INTEGER,
        refresh_token_expires_at INTEGER,
        scope TEXT,
        id_token TEXT,
        password TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account ON accounts(provider_id, account_id)',
    `
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)',
    `
      CREATE TABLE IF NOT EXISTS twoFactor (
        id TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        backupCodes TEXT NOT NULL,
        userId TEXT NOT NULL UNIQUE
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_twoFactor_userId ON twoFactor(userId)',
    `
      CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier)',
    'CREATE INDEX IF NOT EXISTS idx_verifications_expires_at ON verifications(expires_at)',
    `
      CREATE TABLE IF NOT EXISTS fair_play_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        game_id TEXT,
        reporter_user_id TEXT,
        metadata_json TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_fair_play_events_user_id ON fair_play_events(user_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fair_play_events_game_id ON fair_play_events(game_id, created_at DESC)',
    `
      CREATE TABLE IF NOT EXISTS fair_play_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        reason TEXT NOT NULL,
        note TEXT,
        reviewed_by TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_fair_play_cases_user_id ON fair_play_cases(user_id, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fair_play_cases_status ON fair_play_cases(status, updated_at DESC)',
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
    `
      CREATE TABLE IF NOT EXISTS game_analyses (
        cache_key TEXT PRIMARY KEY,
        game_id TEXT,
        moves_hash TEXT NOT NULL,
        movetime_ms INTEGER,
        depth INTEGER,
        engine_label TEXT NOT NULL,
        engine_source TEXT NOT NULL,
        analysis_json TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `,
    'CREATE INDEX IF NOT EXISTS idx_game_analyses_game_id ON game_analyses(game_id, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_game_analyses_moves_hash ON game_analyses(moves_hash, updated_at DESC)',
  ];

  for (const statement of statements) {
    await db.execute(statement);
  }

  await ensureColumn('feedback', 'visible', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('feedback', 'deleted_at', 'INTEGER');
  await ensureColumn('feedback', 'deleted_by', 'TEXT');
  await ensureColumn('feedback', 'moderation_note', 'TEXT');
  await ensureColumn('feedback', 'user_id', 'TEXT');
  await ensureColumn('users', 'fair_play_status', "TEXT NOT NULL DEFAULT 'clear'");
  await ensureColumn('users', 'rated_restricted_at', 'INTEGER');
  await ensureColumn('users', 'rated_restriction_note', 'TEXT');
  await ensureColumn('users', 'rating', `INTEGER NOT NULL DEFAULT ${INITIAL_USER_RATING}`);
  await ensureColumn('users', 'rated_games', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'wins', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'losses', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'draws', 'INTEGER NOT NULL DEFAULT 0');
  await db.execute(`
    CREATE TRIGGER IF NOT EXISTS set_initial_user_rating_after_insert
    AFTER INSERT ON users
    FOR EACH ROW
    WHEN NEW.rating = 1500
      AND NEW.rated_games = 0
      AND NEW.wins = 0
      AND NEW.losses = 0
      AND NEW.draws = 0
    BEGIN
      UPDATE users SET rating = ${INITIAL_USER_RATING} WHERE id = NEW.id;
    END
  `);
  await ensureColumn('users', 'name', 'TEXT');
  await ensureColumn('users', 'image', 'TEXT');
  await ensureColumn('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'twoFactorEnabled', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'username_updated_at', 'INTEGER');
  await ensureColumn('games', 'white_user_id', 'TEXT');
  await ensureColumn('games', 'black_user_id', 'TEXT');
  await ensureColumn('games', 'rated', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('games', 'game_mode', "TEXT NOT NULL DEFAULT 'private'");
  await ensureColumn('games', 'game_type', "TEXT NOT NULL DEFAULT 'human'");
  await ensureColumn('games', 'opponent_type', 'TEXT');
  await ensureColumn('games', 'opponent_name', 'TEXT');
  await ensureColumn('games', 'bot_level', 'INTEGER');
  await ensureColumn('games', 'bot_color', 'TEXT');
  await ensureColumn('games', 'white_rating_before', 'INTEGER');
  await ensureColumn('games', 'black_rating_before', 'INTEGER');
  await ensureColumn('games', 'white_rating_after', 'INTEGER');
  await ensureColumn('games', 'black_rating_after', 'INTEGER');
  await ensureColumn('puzzle_progress', 'last_played_at', 'INTEGER');
  await ensureColumn('puzzle_progress', 'attempts', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('puzzle_progress', 'successes', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('puzzle_progress', 'failures', 'INTEGER NOT NULL DEFAULT 0');

  await db.execute(`
    UPDATE users
    SET name = COALESCE(
          NULLIF(TRIM(name), ''),
          NULLIF(TRIM(username), ''),
          CASE
            WHEN instr(email, '@') > 1 THEN substr(email, 1, instr(email, '@') - 1)
            ELSE email
          END
        )
    WHERE name IS NULL OR TRIM(name) = ''
  `);
  await db.execute(`
    UPDATE users
    SET email_verified = 1
    WHERE email_verified = 0
      AND email IS NOT NULL
      AND email != ''
  `);
  await db.execute(`
    UPDATE puzzle_progress
    SET last_played_at = COALESCE(last_played_at, completed_at, unixepoch())
    WHERE last_played_at IS NULL
  `);
  await db.execute(`
    UPDATE puzzle_progress
    SET attempts = COALESCE(attempts, 0),
        successes = COALESCE(successes, CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END),
        failures = COALESCE(failures, 0)
  `);
}

function rowToSavedGame(row: Row): SavedGame {
  const rawGameMode = String(row.game_mode ?? 'private');
  const rawOpponentType = row.opponent_type === null || row.opponent_type === undefined ? null : String(row.opponent_type);
  const normalizedGameType = String(row.game_type ?? 'human') === 'bot'
    || rawOpponentType === 'bot'
    || rawGameMode === 'bot'
    ? 'bot'
    : 'human';

  return {
    id: String(row.id),
    white_name: String(row.white_name ?? 'Anonymous'),
    black_name: String(row.black_name ?? 'Anonymous'),
    white_user_id: row.white_user_id === null || row.white_user_id === undefined ? null : String(row.white_user_id),
    black_user_id: row.black_user_id === null || row.black_user_id === undefined ? null : String(row.black_user_id),
    result: String(row.result ?? ''),
    result_reason: String(row.result_reason ?? ''),
    rated: Number(row.rated ?? 0),
    game_mode: rawGameMode,
    game_type: normalizedGameType,
    opponent_type: rawOpponentType,
    opponent_name: row.opponent_name === null || row.opponent_name === undefined ? null : String(row.opponent_name),
    bot_level: row.bot_level === null || row.bot_level === undefined ? null : Number(row.bot_level),
    bot_color: row.bot_color === 'black' ? 'black' : row.bot_color === 'white' ? 'white' : null,
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

export interface PuzzleProgressRecord {
  puzzleId: number;
  lastPlayedAt: number;
  completedAt: number | null;
  attempts: number;
  successes: number;
  failures: number;
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

function normalizeFairPlayStatus(value: unknown): FairPlayStatus {
  return value === 'restricted' ? 'restricted' : 'clear';
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
    rating: Number(row.rating ?? INITIAL_USER_RATING),
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
  whiteName?: string | null;
  blackName?: string | null;
  whiteUserId?: string | null;
  blackUserId?: string | null;
  rated?: boolean;
  gameMode?: string;
  gameType?: 'human' | 'bot';
  opponentType?: 'human' | 'bot' | null;
  opponentName?: string | null;
  botLevel?: number | null;
  botColor?: PieceColor | null;
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
            id, white_name, black_name, white_user_id, black_user_id, result, result_reason, rated, game_mode, game_type,
            opponent_type, opponent_name, bot_level, bot_color, white_rating_before, black_rating_before,
            white_rating_after, black_rating_after, time_control_initial, time_control_increment, moves, final_board, move_count, finished_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
        `,
        args: [
          data.id,
          data.whiteName?.trim() || 'Anonymous',
          data.blackName?.trim() || 'Anonymous',
          data.whiteUserId ?? null,
          data.blackUserId ?? null,
          data.result,
          data.resultReason,
          appliedRatedGame ? 1 : 0,
          data.gameMode ?? 'private',
          data.gameType ?? 'human',
          data.opponentType ?? null,
          data.opponentName?.trim() || null,
          data.botLevel ?? null,
          data.botColor ?? null,
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
  game_type: 'human' | 'bot';
  opponent_type: string | null;
  opponent_name: string | null;
  bot_level: number | null;
  bot_color: PieceColor | null;
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

export type RecentGamesFilter = 'all' | 'rated' | 'casual' | 'bot';

function getNormalizedGameTypeSql(): string {
  return `
    CASE
      WHEN COALESCE(game_type, '') = 'bot' OR COALESCE(opponent_type, '') = 'bot' OR COALESCE(game_mode, '') = 'bot' THEN 'bot'
      ELSE 'human'
    END
  `;
}

function getRecentGamesWhereClause(filter: RecentGamesFilter): string {
  const normalizedGameTypeSql = getNormalizedGameTypeSql();
  if (filter === 'rated') return `finished_at IS NOT NULL AND (${normalizedGameTypeSql}) = 'human' AND rated = 1`;
  if (filter === 'casual') return `finished_at IS NOT NULL AND (${normalizedGameTypeSql}) = 'human' AND rated = 0`;
  if (filter === 'bot') return `finished_at IS NOT NULL AND (${normalizedGameTypeSql}) = 'bot'`;
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

export interface GameAnalysisCacheRecord {
  cacheKey: string;
  gameId: string | null;
  movesHash: string;
  analysis: GameAnalysis;
  updatedAt: number;
}

export async function getCachedGameAnalysis(cacheKey: string): Promise<GameAnalysisCacheRecord | null> {
  try {
    const result = await db.execute({
      sql: `
        SELECT cache_key, game_id, moves_hash, analysis_json, updated_at
        FROM game_analyses
        WHERE cache_key = ?
        LIMIT 1
      `,
      args: [cacheKey],
    });
    const row = result.rows[0];
    if (!row) return null;

    return {
      cacheKey: String(row.cache_key),
      gameId: row.game_id === null || row.game_id === undefined ? null : String(row.game_id),
      movesHash: String(row.moves_hash),
      analysis: JSON.parse(String(row.analysis_json)) as GameAnalysis,
      updatedAt: Number(row.updated_at ?? 0),
    };
  } catch (err) {
    logError('database_get_cached_game_analysis_failed', err, { cacheKey });
    return null;
  }
}

export async function saveCachedGameAnalysis(data: {
  cacheKey: string;
  gameId?: string | null;
  movesHash: string;
  movetimeMs?: number | null;
  depth?: number | null;
  analysis: GameAnalysis;
}): Promise<void> {
  try {
    await db.execute({
      sql: `
        INSERT INTO game_analyses (
          cache_key, game_id, moves_hash, movetime_ms, depth, engine_label, engine_source, analysis_json, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
        ON CONFLICT(cache_key) DO UPDATE SET
          game_id = excluded.game_id,
          moves_hash = excluded.moves_hash,
          movetime_ms = excluded.movetime_ms,
          depth = excluded.depth,
          engine_label = excluded.engine_label,
          engine_source = excluded.engine_source,
          analysis_json = excluded.analysis_json,
          updated_at = unixepoch()
      `,
      args: [
        data.cacheKey,
        data.gameId ?? null,
        data.movesHash,
        data.movetimeMs ?? null,
        data.depth ?? null,
        data.analysis.engine?.label ?? 'unknown',
        data.analysis.engine?.source ?? 'local',
        JSON.stringify(data.analysis),
      ],
    });
  } catch (err) {
    logError('database_save_cached_game_analysis_failed', err, {
      cacheKey: data.cacheKey,
      gameId: data.gameId ?? null,
      movesHash: data.movesHash,
    });
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

export interface BotPerformanceStats {
  gamesCount: number;
  winRate: number;
  highestBotLevelDefeated: number | null;
}

function isHumanWinAgainstBot(result: string, botColor: PieceColor | null) {
  if (botColor === 'white') return result === 'black';
  if (botColor === 'black') return result === 'white';
  return false;
}

function parseBotLevel(opponentName: string | null | undefined) {
  if (!opponentName) return null;
  const match = opponentName.match(/(?:lv\.?|level)\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export async function getBotPerformanceStats(): Promise<BotPerformanceStats> {
  try {
    const normalizedGameTypeSql = getNormalizedGameTypeSql();
    const result = await db.execute({
      sql: `
        SELECT result, opponent_name, bot_level, bot_color
        FROM games
        WHERE finished_at IS NOT NULL AND (${normalizedGameTypeSql}) = 'bot'
      `,
    });

    const rows = result.rows.map(row => ({
      result: String(row.result ?? ''),
      opponentName: row.opponent_name === null || row.opponent_name === undefined ? null : String(row.opponent_name),
      botLevel: row.bot_level === null || row.bot_level === undefined ? null : Number(row.bot_level),
      botColor: row.bot_color === 'black' ? 'black' as const : row.bot_color === 'white' ? 'white' as const : null,
    }));

    const wins = rows.filter(row => isHumanWinAgainstBot(row.result, row.botColor)).length;
    const highestBotLevelDefeated = rows.reduce<number | null>((highest, row) => {
      if (!isHumanWinAgainstBot(row.result, row.botColor)) return highest;
      const level = row.botLevel ?? parseBotLevel(row.opponentName);
      if (level === null) return highest;
      return highest === null ? level : Math.max(highest, level);
    }, null);

    return {
      gamesCount: rows.length,
      winRate: rows.length > 0 ? Number(((wins / rows.length) * 100).toFixed(1)) : 0,
      highestBotLevelDefeated,
    };
  } catch (err) {
    logError('database_get_bot_performance_stats_failed', err);
    return {
      gamesCount: 0,
      winRate: 0,
      highestBotLevelDefeated: null,
    };
  }
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
