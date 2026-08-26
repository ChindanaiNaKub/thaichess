import fs from 'fs';
import path from 'path';
import { createClient, type Client, type InStatement } from '@libsql/client';
import { logError, logInfo, logWarn } from '../logger';
import '../env';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL?.trim() || undefined;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;
export let db: Client;
export type SqlExecutor = Pick<Client, 'execute'>;

export const INITIAL_USER_RATING = 500;

const SLOW_QUERY_THRESHOLD_MS = 100;
let totalQueries = 0;
let slowQueries = 0;

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
  twoFactor: new Set(['verified', 'failedVerificationCount', 'lockedUntil']),
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

  try {
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
  } catch (error) {
    // If table doesn't exist yet, skip this migration step
    // The table will be created in the main migration
    if (error instanceof Error && error.message.includes('no such table')) {
      logInfo('ensureColumn_skipped_table_not_exists', { table });
      return;
    }
    throw error;
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

const WORKSPACE_ROOT = findWorkspaceRoot(process.cwd());
const DEFAULT_DATA_DIR = path.join(WORKSPACE_ROOT, 'data');
// Legacy path from older layouts: data/ sitting beside the repo root.
const LEGACY_DEV_DATA_DIR = path.resolve(WORKSPACE_ROOT, '..', 'data');

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

/**
 * Production must use durable Turso/libSQL. Local `file:` SQLite is fine for
 * development and tests, but accounts/ratings/saved Games cannot rely on
 * ephemeral disk in production (ADR-0001 follow-up).
 */
export function assertProductionUsesDurableDatabase(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if ((env.NODE_ENV || '').trim() !== 'production') {
    return;
  }

  if (env.ALLOW_PRODUCTION_LOCAL_DB_FOR_SMOKE === '1') {
    return;
  }

  const tursoUrl = env.TURSO_DATABASE_URL?.trim() || '';
  if (!tursoUrl) {
    throw new Error(
      'Production requires TURSO_DATABASE_URL (durable Turso/libSQL). Local file SQLite is not allowed when NODE_ENV=production.',
    );
  }

  if (tursoUrl.startsWith('file:')) {
    throw new Error(
      'Production TURSO_DATABASE_URL must be a remote Turso/libSQL URL, not a local file: database.',
    );
  }
}

async function runSchemaMigration() {
  // First pass: Create all tables
  const tableStatements: InStatement[] = [
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
    `
      CREATE TABLE IF NOT EXISTS twoFactor (
        id TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        backupCodes TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0,
        failedVerificationCount INTEGER NOT NULL DEFAULT 0,
        lockedUntil INTEGER,
        userId TEXT NOT NULL UNIQUE
      )
    `,
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
    `
      CREATE TABLE IF NOT EXISTS puzzle_progress (
        user_id TEXT NOT NULL,
        puzzle_id INTEGER NOT NULL,
        completed_at INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (user_id, puzzle_id)
      )
    `,
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
    `
      CREATE TABLE IF NOT EXISTS game_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        ply INTEGER NOT NULL,
        position_hash TEXT NOT NULL,
        move_uci TEXT,
        result TEXT NOT NULL,
        white_rating INTEGER,
        black_rating INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `,
  ];

  for (const statement of tableStatements) {
    await db.execute(statement);
  }

  // Second pass: Create all indexes after tables exist
  const indexStatements: InStatement[] = [
    'CREATE INDEX IF NOT EXISTS idx_games_finished_at ON games(finished_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_games_white_user_id ON games(white_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_games_black_user_id ON games(black_user_id)',
    // B-tree name indexes help equality/prefix lookups. Leading-wildcard LIKE '%x%' still scans;
    // keep player search to >= 2 chars and consider FTS later if scrape cost grows.
    'CREATE INDEX IF NOT EXISTS idx_games_white_name ON games(white_name)',
    'CREATE INDEX IF NOT EXISTS idx_games_black_name ON games(black_name)',
    'CREATE INDEX IF NOT EXISTS idx_games_game_mode ON games(game_mode)',
    'CREATE INDEX IF NOT EXISTS idx_games_rated ON games(rated)',
    'CREATE INDEX IF NOT EXISTS idx_games_user_games ON games(white_user_id, finished_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC)',
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account ON accounts(provider_id, account_id)',
    'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_twoFactor_userId ON twoFactor(userId)',
    'CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier)',
    'CREATE INDEX IF NOT EXISTS idx_verifications_expires_at ON verifications(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_fair_play_events_user_id ON fair_play_events(user_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fair_play_events_game_id ON fair_play_events(game_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fair_play_cases_user_id ON fair_play_cases(user_id, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_fair_play_cases_status ON fair_play_cases(status, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_puzzle_progress_user_id ON puzzle_progress(user_id, completed_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_codes(email)',
    'CREATE INDEX IF NOT EXISTS idx_login_codes_expires_at ON login_codes(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_game_analyses_game_id ON game_analyses(game_id, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_game_analyses_moves_hash ON game_analyses(moves_hash, updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_game_positions_hash ON game_positions(position_hash)',
    'CREATE INDEX IF NOT EXISTS idx_game_positions_game ON game_positions(game_id, ply)',
    'CREATE INDEX IF NOT EXISTS idx_game_positions_move ON game_positions(position_hash, move_uci)',
  ];

  for (const statement of indexStatements) {
    try {
      await db.execute(statement);
    } catch (error) {
      // Skip indexes that fail (table might not exist yet in some edge cases)
      if (error instanceof Error && error.message.includes('no such table')) {
        continue;
      }
      throw error;
    }
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

  try {
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
  } catch (error) {
    // Skip if table doesn't exist (fresh database)
    if (error instanceof Error && error.message.includes('no such table')) {
      logInfo('migration_trigger_skipped_table_not_exists');
    } else {
      throw error;
    }
  }

  await ensureColumn('users', 'name', 'TEXT');
  await ensureColumn('users', 'image', 'TEXT');
  await ensureColumn('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'twoFactorEnabled', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('twoFactor', 'verified', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('twoFactor', 'failedVerificationCount', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('twoFactor', 'lockedUntil', 'INTEGER');
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

  try {
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
  } catch (error) {
    // Skip if table doesn't exist or has no data (fresh database)
    if (error instanceof Error && error.message.includes('no such table')) {
      logInfo('migration_update_users_name_skipped');
    } else {
      throw error;
    }
  }

  try {
    await db.execute(`
      UPDATE users
      SET email_verified = 1
      WHERE email_verified = 0
        AND email IS NOT NULL
        AND email != ''
    `);
  } catch (error) {
    // Skip if table doesn't exist or has no data (fresh database)
    if (error instanceof Error && error.message.includes('no such table')) {
      logInfo('migration_update_users_email_verified_skipped');
    } else {
      throw error;
    }
  }

  try {
    await db.execute(`
      UPDATE puzzle_progress
      SET last_played_at = COALESCE(last_played_at, completed_at, unixepoch())
      WHERE last_played_at IS NULL
    `);
  } catch (error) {
    // Skip if table doesn't exist or has no data (fresh database)
    if (error instanceof Error && error.message.includes('no such table')) {
      logInfo('migration_update_puzzle_progress_last_played_skipped');
    } else {
      throw error;
    }
  }

  try {
    await db.execute(`
      UPDATE puzzle_progress
      SET attempts = COALESCE(attempts, 0),
          successes = COALESCE(successes, CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END),
          failures = COALESCE(failures, 0)
    `);
  } catch (error) {
    // Skip if table doesn't exist or has no data (fresh database)
    if (error instanceof Error && error.message.includes('no such table')) {
      logInfo('migration_update_puzzle_progress_attempts_skipped');
    } else {
      throw error;
    }
  }
}

export async function executeWithTiming(
  executor: SqlExecutor,
  statement: InStatement,
  context?: string
): Promise<ReturnType<SqlExecutor['execute']>> {
  const startTime = Date.now();
  totalQueries += 1;

  try {
    const result = await executor.execute(statement);
    const duration = Date.now() - startTime;

    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      slowQueries += 1;
      const sqlPreview = typeof statement === 'string'
        ? statement.slice(0, 100)
        : statement.sql?.slice(0, 100) || 'unknown';
      logWarn('slow_query', {
        durationMs: duration,
        sql: sqlPreview,
        context: context || 'unknown',
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('query_failed', error, {
      durationMs: duration,
      context: context || 'unknown',
    });
    throw error;
  }
}

export async function initDatabase(): Promise<void> {
  assertProductionUsesDurableDatabase();
  const config = getDatabaseConfig();
  db = config.client;

  await runSchemaMigration();

  logInfo('database_initialized', {
    mode: config.mode,
    location: config.location,
  });
}

export function getDatabaseStats() {
  return {
    totalQueries,
    slowQueries,
    slowQueryThresholdMs: SLOW_QUERY_THRESHOLD_MS,
  };
}

// Minimal connectivity probe for /api/health — avoids a full-table aggregate.
export async function pingDatabase(): Promise<void> {
  await db.execute('SELECT 1');
}


/**
 * LibSQL Connection Management Notes:
 *
 * Local SQLite:
 * - No connection pooling needed (SQLite handles concurrent access via file locks)
 * - Single client instance is sufficient
 *
 * Turso (remote LibSQL):
 * - @libsql/client manages HTTP connections internally
 * - No explicit connection pooling configuration required
 * - Client handles connection reuse automatically
 *
 * Conclusion: No additional connection pooling implementation needed at this time.
 * The current single client instance is appropriate for both local and Turso deployments.
 */

export function isSqliteBusyError(error: unknown) {
  return error instanceof Error && error.message.includes('SQLITE_BUSY');
}
