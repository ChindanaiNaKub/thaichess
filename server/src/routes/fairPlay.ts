import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getGame as getDbGame,
  recordFairPlayEvent,
  getFairPlayCases,
  getFairPlayCaseCount,
  dismissFairPlayCase,
  restrictUserForFairPlay,
  clearFairPlayRestriction,
  getUserById,
  type FairPlayCaseStatus,
} from '../database';
import type { GameManager } from '../gameManager';
import { FairPlayCaseActionSchema, ReportFairPlaySchema } from '../../../shared/validation';
import { requireAdminWithMfa, requireUser } from './authGuards';

export interface FairPlayRouterDeps {
  gameManager: GameManager;
  requireTrustedWriteOriginMiddleware: RequestHandler;
}

function isValidFairPlayCaseStatus(value: unknown): value is FairPlayCaseStatus {
  return value === 'open' || value === 'reviewed' || value === 'restricted' || value === 'dismissed';
}

async function resolveFairPlayReportTarget(
  gameManager: GameManager,
  gameId: string,
  reporterUserId: string,
) {
  const liveRoom = gameManager.getGame(gameId);
  if (liveRoom && liveRoom.status === 'finished' && liveRoom.rated) {
    if (liveRoom.whiteUserId === reporterUserId && liveRoom.blackUserId) {
      return liveRoom.blackUserId;
    }
    if (liveRoom.blackUserId === reporterUserId && liveRoom.whiteUserId) {
      return liveRoom.whiteUserId;
    }
    return null;
  }

  const savedGame = await getDbGame(gameId);
  if (!savedGame || savedGame.rated !== 1) return null;
  if (savedGame.white_user_id === reporterUserId && savedGame.black_user_id) {
    return savedGame.black_user_id;
  }
  if (savedGame.black_user_id === reporterUserId && savedGame.white_user_id) {
    return savedGame.white_user_id;
  }
  return null;
}

export function createFairPlayRouter(deps: FairPlayRouterDeps): Router {
  const { gameManager, requireTrustedWriteOriginMiddleware } = deps;
  const router = Router();

  const fairPlayReportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many fair-play reports. Please try again later.' },
  });

  router.get('/api/fair-play/cases', async (req, res) => {
    const admin = await requireAdminWithMfa(req, res);
    if (!admin) return;

    const page = parseInt(req.query.page as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const rawStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
    const status = rawStatus === 'all'
      ? 'all'
      : isValidFairPlayCaseStatus(rawStatus)
        ? rawStatus
        : 'open';

    const [cases, total] = await Promise.all([
      getFairPlayCases(limit, page * limit, status),
      getFairPlayCaseCount(status),
    ]);
    res.json({ cases, total, page, limit, status });
  });

  router.post('/api/fair-play/report', requireTrustedWriteOriginMiddleware, fairPlayReportLimiter, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const parseResult = ReportFairPlaySchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const gameIdError = flattened.fieldErrors.gameId?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = gameIdError || formError || 'Valid gameId is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { gameId, message } = parseResult.data;

    const targetUserId = await resolveFairPlayReportTarget(gameManager, gameId, user.id);
    if (!targetUserId) {
      res.status(400).json({ error: 'Only finished rated games against a signed-in opponent can be reported.' });
      return;
    }

    const result = await recordFairPlayEvent({
      userId: targetUserId,
      type: 'user_reported',
      gameId,
      reporterUserId: user.id,
      metadata: {
        message: message || null,
      },
    });
    if (!result.event) {
      res.status(500).json({ error: 'Failed to submit fair-play report.' });
      return;
    }

    res.json({ ok: true });
  });

  router.post('/api/fair-play/cases/:id/restrict', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const admin = await requireAdminWithMfa(req, res);
    if (!admin) return;

    const caseId = Number(req.params.id);
    if (!Number.isInteger(caseId) || caseId <= 0) {
      res.status(400).json({ error: 'Invalid case ID.' });
      return;
    }

    const parseResult = FairPlayCaseActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const noteError = flattened.fieldErrors.note?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = noteError || formError || 'Invalid request.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { note } = parseResult.data;
    const ok = await restrictUserForFairPlay(caseId, admin.id, note);
    if (!ok) {
      res.status(500).json({ error: 'Failed to restrict player.' });
      return;
    }

    res.json({ ok: true });
  });

  router.post('/api/fair-play/cases/:id/dismiss', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const admin = await requireAdminWithMfa(req, res);
    if (!admin) return;

    const caseId = Number(req.params.id);
    if (!Number.isInteger(caseId) || caseId <= 0) {
      res.status(400).json({ error: 'Invalid case ID.' });
      return;
    }

    const parseResult = FairPlayCaseActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const noteError = flattened.fieldErrors.note?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = noteError || formError || 'Invalid request.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { note } = parseResult.data;
    const ok = await dismissFairPlayCase(caseId, admin.id, note);
    if (!ok) {
      res.status(500).json({ error: 'Failed to dismiss case.' });
      return;
    }

    res.json({ ok: true });
  });

  router.post('/api/fair-play/users/:id/clear', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const admin = await requireAdminWithMfa(req, res);
    if (!admin) return;

    const userId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID.' });
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }

    const parseResult = FairPlayCaseActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const noteError = flattened.fieldErrors.note?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = noteError || formError || 'Invalid request.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { note } = parseResult.data;
    const ok = await clearFairPlayRestriction(user.id, admin.id, note);
    if (!ok) {
      res.status(500).json({ error: 'Failed to clear restriction.' });
      return;
    }

    res.json({ ok: true });
  });

  return router;
}
