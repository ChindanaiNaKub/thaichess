import { Router, type RequestHandler } from 'express';
import type { AuthUser } from '../database';
import { recordFairPlayEvent } from '../database';
import { getAuthenticatedUser } from '../auth';
import { analyzeGameWithEngine, analyzePositionWithEngine, getBotMoveWithEngine } from '../engineGateway';
import type { GameManager } from '../gameManager';
import { logError, logWarn } from '../logger';
import { deserializeAnalysisPosition } from '../../../shared/engineAdapter';
import type { Move } from '../../../shared/types';
import { AnalyzeGameSchema, AnalyzePositionSchema, BotMoveSchema } from '../../../shared/validation';
import { requireUser } from './authGuards';

export interface AnalysisRouterDeps {
  gameManager: GameManager;
  analysisLimiter: RequestHandler;
  gameReviewLimiter: RequestHandler;
  positionAnalysisLimiter: RequestHandler;
}

async function enforceAnalysisFairPlayPolicy(
  gameManager: GameManager,
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  user?: AuthUser | null,
) {
  const analysisUser = user ?? await getAuthenticatedUser(req);
  if (!analysisUser) return false;

  const activeGameId = gameManager.getBlockingPlayerGame(analysisUser.id);
  if (!activeGameId) return false;

  const room = gameManager.getGame(activeGameId);
  if (!room || room.status !== 'playing' || !room.rated) return false;

  await recordFairPlayEvent({
    userId: analysisUser.id,
    type: 'analysis_blocked',
    gameId: activeGameId,
    metadata: {
      path: req.path,
      method: req.method,
      ip: req.ip,
    },
  });

  logWarn('fair_play_analysis_blocked', {
    userId: analysisUser.id,
    gameId: activeGameId,
    path: req.path,
    ip: req.ip,
  });
  res.status(403).json({ error: 'Fair play restriction: analysis is disabled during active rated games.' });
  return true;
}

export function createAnalysisRouter(deps: AnalysisRouterDeps): Router {
  const { gameManager, analysisLimiter, gameReviewLimiter, positionAnalysisLimiter } = deps;
  const router = Router();

  router.post('/api/analysis/game', analysisLimiter, gameReviewLimiter, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (await enforceAnalysisFairPlayPolicy(gameManager, req, res, user)) return;

    const parseResult = AnalyzeGameSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid analysis request.' });
      return;
    }

    const { analysisId, moves, depth, movetimeMs } = parseResult.data;
    try {
      const analysis = await analyzeGameWithEngine(moves as Move[], { analysisId, depth, movetimeMs });
      res.json({ analysis });
    } catch (error) {
      logError('analysis_game_failed', error, {
        moveCount: moves.length,
        depth: depth ?? null,
        movetimeMs: movetimeMs ?? null,
        ip: req.ip,
      });
      res.status(503).json({ error: 'Analysis failed. Please try again later.' });
    }
  });

  router.post('/api/analysis/game/stream', analysisLimiter, gameReviewLimiter, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (await enforceAnalysisFairPlayPolicy(gameManager, req, res, user)) return;

    const parseResult = AnalyzeGameSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid analysis request.' });
      return;
    }
    const { analysisId, moves, depth, movetimeMs } = parseResult.data;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    const writeEvent = (event: 'progress' | 'result' | 'error', payload: unknown) => {
      if (closed) return;
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const analysis = await analyzeGameWithEngine(
        moves as Move[],
        { analysisId, depth, movetimeMs },
        progress => writeEvent('progress', { progress }),
      );
      writeEvent('result', { analysis });
      res.end();
    } catch (error) {
      logError('analysis_game_stream_failed', error, {
        moveCount: moves.length,
        depth: depth ?? null,
        movetimeMs: movetimeMs ?? null,
        ip: req.ip,
      });
      writeEvent('error', {
        message: 'Analysis failed. Please try again later.',
      });
      res.end();
    }
  });

  router.post('/api/analysis/position', analysisLimiter, positionAnalysisLimiter, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;
    if (await enforceAnalysisFairPlayPolicy(gameManager, req, res, user)) return;

    const parseResult = AnalyzePositionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const positionError = flattened.fieldErrors.position?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = positionError || formError || 'Valid position is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { position, counting, depth, movetimeMs, nodes, multipv } = parseResult.data;
    const snapshot = deserializeAnalysisPosition(position, counting);

    if (!snapshot) {
      res.status(400).json({ error: 'Valid position is required.' });
      return;
    }

    const analysis = await analyzePositionWithEngine(snapshot, {
      depth,
      movetimeMs,
      nodes,
    }, multipv);

    res.json(analysis);
  });

  router.post('/api/bot/move', analysisLimiter, async (req, res) => {
    if (await enforceAnalysisFairPlayPolicy(gameManager, req, res)) return;

    const parseResult = BotMoveSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const positionError = flattened.fieldErrors.position?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = positionError || formError || 'Valid position is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { position, counting, level, botId } = parseResult.data;
    const snapshot = deserializeAnalysisPosition(position, counting);

    if (!snapshot) {
      res.status(400).json({ error: 'Valid position is required.' });
      return;
    }

    try {
      const result = await getBotMoveWithEngine(snapshot, level, botId);
      res.json(result);
    } catch (error) {
      res.status(503).json({
        error: error instanceof Error ? error.message : 'Bot engine is unavailable.',
      });
    }
  });

  return router;
}
