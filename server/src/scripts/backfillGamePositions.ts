/**
 * Backfill script: Populate game_positions table for all existing games.
 *
 * Run with: npx tsx server/src/scripts/backfillGamePositions.ts
 *
 * This iterates through finished games that have no game_positions rows yet,
 * reconstructs each position from move history, and inserts rows for Opening
 * Explorer queries. Position hashes include Makruk counting state when active
 * (see analysisPositionHash in shared/engineAdapter.ts).
 *
 * Safe re-runs:
 * - Selection uses NOT EXISTS, so games that already have any positions are skipped.
 * - Each game is written in a transaction that DELETE-then-INSERT, so a re-run
 *   after a partial failure (or after changing hash format) can recover by first
 *   deleting that game's rows, then re-running this script.
 *
 * Recovery after a failed mid-game run or hash-format change:
 *   DELETE FROM game_positions WHERE game_id = '<id>';  -- or truncate if full re-backfill
 *   npx tsx server/src/scripts/backfillGamePositions.ts
 *
 * Dry-run note: set BACKFILL_DRY_RUN=1 to only print how many games would be processed.
 * Full rebuild (e.g. after position_hash format change): set BACKFILL_FORCE=1 to
 * re-process every finished game (delete+insert), not only games missing positions.
 */

import path from 'node:path';
import { createClient } from '@libsql/client';
import { getPositionAtPly } from '../../../shared/engine';
import { analysisPositionHash, moveToUci } from '../../../shared/engineAdapter';
import type { Move } from '../../../shared/types';
import '../env';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL?.trim() || undefined;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;
const DRY_RUN = process.env.BACKFILL_DRY_RUN === '1';
const FORCE = process.env.BACKFILL_FORCE === '1';

/** Games finished but not yet present in game_positions (no LIMIT on the subquery). */
export const GAMES_NEEDING_POSITIONS_SQL = `
  SELECT id, moves, result, white_rating_before, black_rating_before
  FROM games
  WHERE finished_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM game_positions gp WHERE gp.game_id = games.id
    )
  ORDER BY finished_at DESC
`;

/** All finished games — used with BACKFILL_FORCE=1 for full hash rebuilds. */
export const ALL_FINISHED_GAMES_SQL = `
  SELECT id, moves, result, white_rating_before, black_rating_before
  FROM games
  WHERE finished_at IS NOT NULL
  ORDER BY finished_at DESC
`;

function getDatabaseClient() {
  if (TURSO_DATABASE_URL) {
    return createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  }
  return createClient({ url: 'file:data/thaichess.db' });
}

async function backfill() {
  const db = getDatabaseClient();

  console.log(FORCE
    ? 'Fetching all finished games (BACKFILL_FORCE=1)...'
    : 'Fetching games without positions...');

  const gamesResult = await db.execute({
    sql: FORCE ? ALL_FINISHED_GAMES_SQL : GAMES_NEEDING_POSITIONS_SQL,
    args: [],
  });

  console.log(`Found ${gamesResult.rows.length} games to backfill.`);

  if (DRY_RUN) {
    console.log('BACKFILL_DRY_RUN=1 — exiting without writes.');
    await db.close();
    return;
  }

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

      const transaction = await db.transaction('write');
      try {
        // Idempotent: clear any partial rows before inserting full ply set
        await transaction.execute({
          sql: 'DELETE FROM game_positions WHERE game_id = ?',
          args: [gameId],
        });

        for (let ply = 0; ply <= moves.length; ply += 1) {
          const state = getPositionAtPly(moves, ply - 1);
          const positionHash = analysisPositionHash({
            board: state.board,
            turn: state.turn,
            counting: state.counting,
          });

          const moveUci = ply < moves.length ? moveToUci(moves[ply]) : null;

          await transaction.execute({
            sql: insertSql,
            args: [gameId, ply, positionHash, moveUci, result, whiteRating, blackRating],
          });
        }

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
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

const isDirectExecution = (process.argv[1] ? path.parse(process.argv[1]).name : '') === 'backfillGamePositions';

if (isDirectExecution) {
  backfill().catch((err) => {
    console.error('Backfill script failed:', err);
    process.exit(1);
  });
}
