import Database from 'better-sqlite3';
import path from 'path';
import type { Move, Board, PieceColor, TimeControl } from '../../shared/types';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'makruk.db');

let db: Database.Database;

export function initDatabase(): void {
  const fs = require('fs');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      white_name TEXT DEFAULT 'Anonymous',
      black_name TEXT DEFAULT 'Anonymous',
      result TEXT, -- 'white', 'black', 'draw'
      result_reason TEXT, -- 'checkmate', 'resignation', 'timeout', 'stalemate', 'draw_agreement'
      time_control_initial INTEGER,
      time_control_increment INTEGER,
      moves TEXT, -- JSON array of moves
      final_board TEXT, -- JSON board state
      move_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      finished_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_games_finished_at ON games(finished_at DESC);
    CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'bug',
      message TEXT NOT NULL,
      page TEXT,
      user_agent TEXT,
      ip TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  console.log('Database initialized at', DB_PATH);
}

export function saveCompletedGame(data: {
  id: string;
  result: 'white' | 'black' | 'draw';
  resultReason: string;
  timeControl: TimeControl;
  moves: Move[];
  finalBoard: Board;
  moveCount: number;
}): void {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO games (id, result, result_reason, time_control_initial, time_control_increment, moves, final_board, move_count, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
    `);

    stmt.run(
      data.id,
      data.result,
      data.resultReason,
      data.timeControl.initial,
      data.timeControl.increment,
      JSON.stringify(data.moves),
      JSON.stringify(data.finalBoard),
      data.moveCount,
    );
  } catch (err) {
    console.error('Failed to save game:', err);
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

export function getRecentGames(limit: number = 20, offset: number = 0): SavedGame[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM games
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as SavedGame[];
  } catch (err) {
    console.error('Failed to get recent games:', err);
    return [];
  }
}

export function getGame(id: string): SavedGame | null {
  try {
    const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
    return (stmt.get(id) as SavedGame) || null;
  } catch (err) {
    console.error('Failed to get game:', err);
    return null;
  }
}

export function getGameCount(): number {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM games WHERE finished_at IS NOT NULL');
    const row = stmt.get() as { count: number };
    return row.count;
  } catch (err) {
    return 0;
  }
}

export function getStats(): { totalGames: number; totalMoves: number; whiteWins: number; blackWins: number; draws: number } {
  try {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as totalGames,
        COALESCE(SUM(move_count), 0) as totalMoves,
        COALESCE(SUM(CASE WHEN result = 'white' THEN 1 ELSE 0 END), 0) as whiteWins,
        COALESCE(SUM(CASE WHEN result = 'black' THEN 1 ELSE 0 END), 0) as blackWins,
        COALESCE(SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END), 0) as draws
      FROM games WHERE finished_at IS NOT NULL
    `);
    return stmt.get() as any;
  } catch (err) {
    return { totalGames: 0, totalMoves: 0, whiteWins: 0, blackWins: 0, draws: 0 };
  }
}

export function saveFeedback(data: {
  type: string;
  message: string;
  page: string;
  userAgent: string;
  ip: string | undefined;
}): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO feedback (type, message, page, user_agent, ip)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(data.type, data.message, data.page, data.userAgent, data.ip || 'unknown');
  } catch (err) {
    console.error('Failed to save feedback:', err);
  }
}
