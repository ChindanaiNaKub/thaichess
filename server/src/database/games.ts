import type { Client, Row } from '@libsql/client';
import type { Move, Board, TimeControl, RatingChangeSummary, PieceColor } from '../../../shared/types';
import { logError } from '../logger';
import { db, isSqliteBusyError } from './connection';
import { getUserByIdFromExecutor } from './auth';

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

      await saveGamePositions(
        transaction,
        data.id,
        data.moves,
        data.result,
        whiteRatingBefore,
        blackRatingBefore,
      );

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

async function saveGamePositions(
  transaction: Awaited<ReturnType<Client['transaction']>>,
  gameId: string,
  moves: Move[],
  result: 'white' | 'black' | 'draw',
  whiteRating: number | null,
  blackRating: number | null,
) {
  try {
    // Delete existing positions for this game to handle replays
    await transaction.execute({
      sql: 'DELETE FROM game_positions WHERE game_id = ?',
      args: [gameId],
    });

    const { getPositionAtPly } = await import('../../../shared/engine');
    const { analysisPositionHash, moveToUci } = await import('../../../shared/engineAdapter');

    const insertSql = `
      INSERT INTO game_positions (game_id, ply, position_hash, move_uci, result, white_rating, black_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

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
        args: [
          gameId,
          ply,
          positionHash,
          moveUci,
          result,
          whiteRating,
          blackRating,
        ],
      });
    }
  } catch (err) {
    logError('database_save_game_positions_failed', err, { gameId });
    // Non-fatal: don't fail the whole transaction
  }
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

export interface GameSearchParams {
  player?: string;
  minRating?: number;
  maxRating?: number;
  result?: 'white' | 'black' | 'draw';
  gameMode?: string;
  rated?: boolean;
  fromDate?: number; // unix epoch seconds
  toDate?: number;
  limit?: number;
  offset?: number;
}

export interface GameSearchResult {
  games: SavedGame[];
  total: number;
}

export async function searchGames(params: GameSearchParams): Promise<GameSearchResult> {
  const conditions: string[] = ['finished_at IS NOT NULL'];
  const args: (string | number)[] = [];

  const playerQuery = params.player?.trim() ?? '';
  if (playerQuery.length >= 2) {
    // Leading-wildcard LIKE cannot use B-tree name indexes; min length limits abuse cost.
    const playerPattern = `%${playerQuery}%`;
    conditions.push('(white_name LIKE ? OR black_name LIKE ?)');
    args.push(playerPattern, playerPattern);
  }

  if (typeof params.minRating === 'number') {
    conditions.push('(white_rating_before >= ? OR black_rating_before >= ?)');
    args.push(params.minRating, params.minRating);
  }

  if (typeof params.maxRating === 'number') {
    conditions.push('(white_rating_before <= ? OR black_rating_before <= ?)');
    args.push(params.maxRating, params.maxRating);
  }

  if (params.result) {
    conditions.push('result = ?');
    args.push(params.result);
  }

  if (params.gameMode) {
    conditions.push('game_mode = ?');
    args.push(params.gameMode);
  }

  if (typeof params.rated === 'boolean') {
    conditions.push('rated = ?');
    args.push(params.rated ? 1 : 0);
  }

  if (typeof params.fromDate === 'number') {
    conditions.push('finished_at >= ?');
    args.push(params.fromDate);
  }

  if (typeof params.toDate === 'number') {
    conditions.push('finished_at <= ?');
    args.push(params.toDate);
  }

  const whereClause = conditions.join(' AND ');
  const limit = Math.min(params.limit ?? 20, 50);
  const offset = params.offset ?? 0;

  try {
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM games WHERE ${whereClause}`,
      args,
    });
    const total = Number(countResult.rows[0]?.total ?? 0);

    const result = await db.execute({
      sql: `
        SELECT * FROM games
        WHERE ${whereClause}
        ORDER BY finished_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    });

    return {
      games: result.rows.map(rowToSavedGame),
      total,
    };
  } catch (err) {
    logError('database_search_games_failed', err, { params });
    return { games: [], total: 0 };
  }
}

export interface OpeningMoveStat {
  moveUci: string;
  totalGames: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  avgWhiteRating: number | null;
  avgBlackRating: number | null;
}

export interface OpeningStatsResult {
  positionHash: string;
  totalGames: number;
  moves: OpeningMoveStat[];
}

export async function getOpeningStats(positionHash: string): Promise<OpeningStatsResult> {
  try {
    const totalResult = await db.execute({
      sql: 'SELECT COUNT(DISTINCT game_id) as total FROM game_positions WHERE position_hash = ?',
      args: [positionHash],
    });
    const totalGames = Number(totalResult.rows[0]?.total ?? 0);

    if (totalGames === 0) {
      return { positionHash, totalGames: 0, moves: [] };
    }

    const movesResult = await db.execute({
      sql: `
        SELECT
          move_uci,
          COUNT(*) as total,
          SUM(CASE WHEN result = 'white' THEN 1 ELSE 0 END) as white_wins,
          SUM(CASE WHEN result = 'black' THEN 1 ELSE 0 END) as black_wins,
          SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
          AVG(white_rating) as avg_white_rating,
          AVG(black_rating) as avg_black_rating
        FROM game_positions
        WHERE position_hash = ? AND move_uci IS NOT NULL
        GROUP BY move_uci
        ORDER BY total DESC
      `,
      args: [positionHash],
    });

    const moves: OpeningMoveStat[] = movesResult.rows.map((row) => ({
      moveUci: String(row.move_uci ?? ''),
      totalGames: Number(row.total ?? 0),
      whiteWins: Number(row.white_wins ?? 0),
      blackWins: Number(row.black_wins ?? 0),
      draws: Number(row.draws ?? 0),
      avgWhiteRating: row.avg_white_rating !== null && row.avg_white_rating !== undefined
        ? Math.round(Number(row.avg_white_rating))
        : null,
      avgBlackRating: row.avg_black_rating !== null && row.avg_black_rating !== undefined
        ? Math.round(Number(row.avg_black_rating))
        : null,
    }));

    return { positionHash, totalGames, moves };
  } catch (err) {
    logError('database_get_opening_stats_failed', err, { positionHash });
    return { positionHash, totalGames: 0, moves: [] };
  }
}

export async function getPositionGames(
  positionHash: string,
  moveUci?: string,
  limit: number = 20,
  offset: number = 0,
): Promise<{ games: SavedGame[]; total: number }> {
  try {
    const moveCondition = moveUci ? 'AND move_uci = ?' : '';
    const countArgs = moveUci ? [positionHash, moveUci] : [positionHash];
    const limitArgs = moveUci ? [positionHash, moveUci, limit, offset] : [positionHash, limit, offset];

    const countResult = await db.execute({
      sql: `
        SELECT COUNT(DISTINCT gp.game_id) as total
        FROM game_positions gp
        WHERE gp.position_hash = ? ${moveCondition}
      `,
      args: countArgs,
    });
    const total = Number(countResult.rows[0]?.total ?? 0);

    const result = await db.execute({
      sql: `
        SELECT g.* FROM games g
        INNER JOIN game_positions gp ON g.id = gp.game_id
        WHERE gp.position_hash = ? ${moveCondition}
        GROUP BY g.id
        ORDER BY g.finished_at DESC
        LIMIT ? OFFSET ?
      `,
      args: limitArgs,
    });

    return {
      games: result.rows.map(rowToSavedGame),
      total,
    };
  } catch (err) {
    logError('database_get_position_games_failed', err, { positionHash, moveUci });
    return { games: [], total: 0 };
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
