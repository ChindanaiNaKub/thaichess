import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import {
  saveFeedback,
  getFeedbackCount,
  getFeedbackForAdmin,
  moderateFeedback,
} from '../database';
import { getAuthenticatedUser } from '../auth';
import { logInfo } from '../logger';
import { FairPlayCaseActionSchema, SubmitFeedbackSchema } from '../../../shared/validation';
import { requireAdminWithMfa } from './authGuards';

export interface FeedbackRouterDeps {
  requireTrustedWriteOriginMiddleware: RequestHandler;
}

export function createFeedbackRouter(deps: FeedbackRouterDeps): Router {
  const { requireTrustedWriteOriginMiddleware } = deps;
  const router = Router();

  const feedbackLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Too many feedback submissions. Please try again later.' },
  });

  router.get('/api/feedback', async (req, res) => {
    const admin = await requireAdminWithMfa(req, res);
    if (!admin) return;

    const page = parseInt(req.query.page as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const type = (req.query.type as string) || undefined;
    const [feedback, total] = await Promise.all([
      getFeedbackForAdmin(limit, page * limit, type),
      getFeedbackCount(type),
    ]);
    res.json({ feedback, total, page, limit });
  });

  router.post('/api/feedback', feedbackLimiter, async (req, res) => {
    const parseResult = SubmitFeedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const messageError = flattened.fieldErrors.message?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = messageError || formError || 'Invalid feedback';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { type, message, page, userAgent } = parseResult.data;

    const feedback = {
      type,
      message,
      page: page || 'unknown',
      userAgent: userAgent || req.headers['user-agent'] || 'unknown',
      ip: req.ip,
      userId: (await getAuthenticatedUser(req))?.id ?? null,
      timestamp: new Date().toISOString(),
    };
    logInfo('feedback_received', { feedback });
    await saveFeedback(feedback);
    res.json({ ok: true });
  });

  router.delete('/api/feedback/:id', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const admin = await requireAdminWithMfa(req, res);
    if (!admin) return;

    const feedbackId = Number(req.params.id);
    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      res.status(400).json({ error: 'Invalid feedback ID.' });
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
    const ok = await moderateFeedback(feedbackId, admin.id, note);
    if (!ok) {
      res.status(500).json({ error: 'Failed to moderate feedback.' });
      return;
    }

    res.json({ ok: true });
  });

  return router;
}
