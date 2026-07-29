import type { GameAnalysis } from '../../../shared/analysis';
import { logError } from '../logger';
import { db } from './connection';

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
