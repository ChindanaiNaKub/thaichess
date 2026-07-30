import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getGame as getDbGame,
  getRecentGames,
  getGameCount,
  getBotPerformanceStats,
  searchGames,
  getOpeningStats,
  getPositionGames,
  saveCompletedGame,
  type RecentGamesFilter,
} from '../database';
import { getAuthenticatedUser } from '../auth';
import type { GameManager } from '../gameManager';
import { logError } from '../logger';
import { getBotPersonaById } from '../../../shared/botPersonas';
import type { PieceColor } from '../../../shared/types';
import {
  GameSearchSchema,
  OpeningGamesSchema,
  OpeningStatsSchema,
  SaveBotGameSchema,
  SaveLocalGameSchema,
} from '../../../shared/validation';

export interface GamesRouterDeps {
  gameManager: GameManager;
}

/** Dedicated limits for heavy public SQL (on top of the global /api/ 60/min limiter). */
const GAME_SEARCH_RATE_LIMIT = { windowMs: 60 * 1000, max: 20 } as const;
const OPENINGS_RATE_LIMIT = { windowMs: 60 * 1000, max: 30 } as const;

function getSignedInDisplayName(user: Awaited<ReturnType<typeof getAuthenticatedUser>>) {
  if (!user) return null;
  const username = user.username?.trim();
  if (username) return username;
  const emailPrefix = user.email.split('@')[0]?.trim();
  return emailPrefix || null;
}

function normalizeBotGamePlayerName(
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>,
  rawPlayerName: unknown,
) {
  const signedInDisplayName = getSignedInDisplayName(user);
  if (signedInDisplayName) return signedInDisplayName;
  if (typeof rawPlayerName === 'string' && rawPlayerName.trim()) return rawPlayerName.trim();
  return 'Anonymous';
}

function buildBotName(level: number, botId?: string) {
  if (botId) {
    return getBotPersonaById(botId).name;
  }

  return `Makruk Bot Lv.${level}`;
}

export function createGamesRouter(deps: GamesRouterDeps): Router {
  const { gameManager } = deps;
  const router = Router();

  const gameSearchLimiter = rateLimit({
    ...GAME_SEARCH_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many game search requests. Please try again later.' },
  });

  const openingsLimiter = rateLimit({
    ...OPENINGS_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many opening explorer requests. Please try again later.' },
  });

  router.get('/api/game/:id', async (req, res) => {
    // Check live games first
    const room = gameManager.getGame(req.params.id);
    if (room) {
      res.json({
        id: room.id,
        status: room.status,
        hasWhite: !!room.white,
        hasBlack: !!room.black,
        timeControl: room.timeControl,
        result: room.gameState.winner || (room.gameState.gameOver ? 'draw' : null),
        resultReason: room.gameState.resultReason || '',
        moves: room.gameState.moveHistory,
        finalBoard: room.gameState.board,
        moveCount: room.gameState.moveCount,
        createdAt: Math.floor(room.createdAt / 1000),
        finishedAt: room.status === 'finished' ? Math.floor(Date.now() / 1000) : null,
      });
      return;
    }
    // Check database for completed games
    const saved = await getDbGame(req.params.id);
    if (saved) {
      try {
        const moves = JSON.parse(saved.moves);
        const finalBoard = JSON.parse(saved.final_board);
        res.json({
          id: saved.id,
          status: 'finished',
          result: saved.result,
          resultReason: saved.result_reason,
          timeControl: { initial: saved.time_control_initial, increment: saved.time_control_increment },
          moves,
          finalBoard,
          moveCount: saved.move_count,
          createdAt: saved.created_at,
          finishedAt: saved.finished_at,
        });
      } catch (err) {
        logError('game_data_parse_failed', err, { gameId: req.params.id });
        res.status(500).json({ error: 'Failed to parse game data' });
      }
      return;
    }
    res.status(404).json({ error: 'Game not found' });
  });

  router.post('/api/games/bot', async (req, res) => {
    const parseResult = SaveBotGameSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      // Get first field error
      const fieldErrors = Object.values(flattened.fieldErrors);
      const firstFieldError = fieldErrors.find(err => err && err.length > 0)?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = firstFieldError || formError || 'Valid bot game payload is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const {
      id,
      result,
      resultReason,
      playerColor,
      level,
      botId,
      moves,
      finalBoard,
      moveCount,
      timeControl,
      playerName: rawPlayerName,
    } = parseResult.data;

    const user = await getAuthenticatedUser(req);
    const playerName = normalizeBotGamePlayerName(user, rawPlayerName);
    const botColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
    const botName = buildBotName(level, botId);

    await saveCompletedGame({
      id,
      result,
      resultReason,
      whiteName: playerColor === 'white' ? playerName : botName,
      blackName: playerColor === 'black' ? playerName : botName,
      whiteUserId: playerColor === 'white' ? user?.id ?? null : null,
      blackUserId: playerColor === 'black' ? user?.id ?? null : null,
      rated: false,
      gameMode: 'bot',
      gameType: 'bot',
      opponentType: 'bot',
      opponentName: botName,
      botLevel: level,
      botColor,
      timeControl,
      moves,
      finalBoard,
      moveCount: moveCount ?? moves.length,
    });

    res.json({
      ok: true,
      id,
      opponentName: botName,
      gameType: 'bot',
    });
  });

  router.post('/api/games/local', async (req, res) => {
    const parseResult = SaveLocalGameSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const fieldErrors = Object.values(flattened.fieldErrors);
      const firstFieldError = fieldErrors.find(err => err && err.length > 0)?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = firstFieldError || formError || 'Valid local game payload is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const {
      id,
      result,
      resultReason,
      whiteName,
      blackName,
      moves,
      finalBoard,
      moveCount,
      timeControl,
    } = parseResult.data;

    await saveCompletedGame({
      id,
      result,
      resultReason,
      whiteName: whiteName || 'White',
      blackName: blackName || 'Black',
      whiteUserId: null,
      blackUserId: null,
      rated: false,
      gameMode: 'private',
      gameType: 'human',
      opponentType: null,
      opponentName: null,
      timeControl,
      moves,
      finalBoard,
      moveCount: moveCount ?? moves.length,
    });

    res.json({
      ok: true,
      id,
      gameType: 'local',
    });
  });

  router.get('/api/games/recent', async (_req, res) => {
    const page = parseInt(_req.query.page as string) || 0;
    const limit = Math.min(parseInt(_req.query.limit as string) || 20, 50);
    const filter = _req.query.filter === 'rated' || _req.query.filter === 'casual' || _req.query.filter === 'bot'
      ? _req.query.filter as RecentGamesFilter
      : 'all';
    const [games, total, botStats] = await Promise.all([
      getRecentGames(limit, page * limit, filter),
      getGameCount(filter),
      getBotPerformanceStats(),
    ]);
    res.json({ games, total, page, limit, filter, botStats });
  });

  router.get('/api/games/search', gameSearchLimiter, async (req, res) => {
    const parseResult = GameSearchSchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid game search query',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      page,
      limit,
      player,
      minRating,
      maxRating,
      result,
      gameMode,
      rated,
      fromDate,
      toDate,
    } = parseResult.data;

    const { games, total } = await searchGames({
      player,
      minRating,
      maxRating,
      result,
      gameMode,
      rated,
      fromDate,
      toDate,
      limit,
      offset: page * limit,
    });

    res.json({ games, total, page, limit });
  });

  router.get('/api/openings/stats', openingsLimiter, async (req, res) => {
    const parseResult = OpeningStatsSchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid opening stats query',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { position } = parseResult.data;
    const stats = await getOpeningStats(position);
    res.json(stats);
  });

  router.get('/api/openings/games', openingsLimiter, async (req, res) => {
    const parseResult = OpeningGamesSchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid opening games query',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { position, move: moveUci, page, limit } = parseResult.data;
    const { games, total } = await getPositionGames(position, moveUci, limit, page * limit);
    res.json({ games, total, page, limit, position, move: moveUci ?? null });
  });

  router.get('/api/live-games', (req, res) => {
    const rawLimit = parseInt(String(req.query.limit ?? '12'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 40) : 12;
    const status = req.query.status === 'live' ? 'live' : 'all';
    const games = gameManager.getPublicLiveGames({ status, limit });

    res.json({
      games,
      total: games.length,
      status,
    });
  });

  return router;
}
