/**
 * Backfill script: Populate game_positions table for all existing games.
 *
 * Run with: npx tsx server/src/scripts/backfillGamePositions.ts
 *
 * This iterates through all finished games in the database, reconstructs
 * each position from the stored move history, and inserts rows into
 * game_positions for fast opening explorer queries.
 */

import { createClient } from '@libsql/client';
import { getPositionAtPly } from '../../../shared/engine';
import { serializeAnalysisPosition, moveToUci } from '../../../shared/engineAdapter';
import type { Move } from '../../../shared/types';
import '../env';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL?.trim() || undefined;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

function getDatabaseClient() {
  if (TURSO_DATABASE_URL) {
    return createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  }
  return createClient({ url: 'file:data/thaichess.db' });
}

async function backfill() {
  const db = getDatabaseClient();

  console.log('Fetching games without positions...');

  const gamesResult = await db.execute({
    sql: `
      SELECT id, moves, result, white_rating_before, black_rating_before
      FROM games
      WHERE finished_at IS NOT NULL
        AND id NOT IN (SELECT DISTINCT game_id FROM game_positions LIMIT 1)
      ORDER BY finished_at DESC
    `,
    args: [],
  });

  console.log(`Found ${gamesResult.rows.length} games to backfill.`);

  let processed = 0;
  let failed = 0;

  for (const row of gamesResult.rows) {
    const gameId = String(row.id);
    const movesJson = String(row.moves ?? '[]');
    const result = String(row.result ?? 'draw') as 'white' | 'black' | 'draw';
    const whiteRating = row.white_rating_before !== null && row.white_rating_before !== undefined
      ? Number(row.white_rating_before)
      : null;
    const blackRating = row.black_rating_before !== null && row.black_rating_before !== undefined
      ? Number(row.black_rating_before)
      : null;

    try {
      const moves: Move[] = JSON.parse(movesJson);
      if (!Array.isArray(moves) || moves.length === 0) {
        continue;
      }

      const insertSql = `
        INSERT INTO game_positions (game_id, ply, position_hash, move_uci, result, white_rating, black_rating)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      for (let ply = 0; ply <= moves.length; ply += 1) {
        const state = getPositionAtPly(moves, ply - 1);
        const positionHash = serializeAnalysisPosition({
          board: state.board,
          turn: state.turn,
          counting: state.counting,
        }).position;

        const moveUci = ply < moves.length ? moveToUci(moves[ply]) : null;

        await db.execute({
          sql: insertSql,
          args: [gameId, ply, positionHash, moveUci, result, whiteRating, blackRating],
        });
      }

      processed += 1;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed} games...`);
      }
    } catch (err) {
      failed += 1;
      console.error(`Failed to process game ${gameId}:`, err);
    }
  }

  console.log(`\nBackfill complete: ${processed} games processed, ${failed} failures.`);
  await db.close();
}

backfill().catch((err) => {
  console.error('Backfill script failed:', err);
  process.exit(1);
});
