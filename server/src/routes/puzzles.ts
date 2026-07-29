import { Router, type RequestHandler } from 'express';
import {
  getCompletedPuzzleIdsForUser,
  getPuzzleProgressForUser,
  markPuzzlePlayed,
  markPuzzleCompleted,
  markPuzzleAttempt,
  mergeCompletedPuzzles,
  mergePuzzleProgress,
  type PuzzleProgressRecord,
} from '../database';
import {
  PuzzleVisitSchema,
  PuzzleCompleteSchema,
  PuzzleAttemptSchema,
  PuzzleSyncSchema,
} from '../../../shared/validation';
import { requireUser } from './authGuards';

export interface PuzzlesRouterDeps {
  requireTrustedWriteOriginMiddleware: RequestHandler;
}

export function createPuzzlesRouter(deps: PuzzlesRouterDeps): Router {
  const { requireTrustedWriteOriginMiddleware } = deps;
  const router = Router();

  router.get('/api/puzzle-progress', async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const progressRecords = await getPuzzleProgressForUser(user.id);
    const completedPuzzleIds = await getCompletedPuzzleIdsForUser(user.id);
    res.json({ completedPuzzleIds, progressRecords });
  });

  router.post('/api/puzzle-progress/visit', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const parseResult = PuzzleVisitSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const puzzleIdError = flattened.fieldErrors.puzzleId?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = puzzleIdError || formError || 'Valid puzzleId is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { puzzleId } = parseResult.data;

    const progressRecords = await markPuzzlePlayed(user.id, puzzleId);
    const completedPuzzleIds = progressRecords
      .filter(record => record.completedAt !== null)
      .map(record => record.puzzleId);
    res.json({ ok: true, completedPuzzleIds, progressRecords });
  });

  router.post('/api/puzzle-progress/complete', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const parseResult = PuzzleCompleteSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const puzzleIdError = flattened.fieldErrors.puzzleId?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = puzzleIdError || formError || 'Valid puzzleId is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { puzzleId } = parseResult.data;

    const progressRecords = await markPuzzleCompleted(user.id, puzzleId);
    const completedPuzzleIds = progressRecords
      .filter(record => record.completedAt !== null)
      .map(record => record.puzzleId);
    res.json({ ok: true, completedPuzzleIds, progressRecords });
  });

  router.post('/api/puzzle-progress/attempt', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const parseResult = PuzzleAttemptSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const puzzleIdError = flattened.fieldErrors.puzzleId?.[0];
      const succeededError = flattened.fieldErrors.succeeded?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = puzzleIdError || succeededError || formError || 'Valid puzzleId and succeeded status are required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { puzzleId, succeeded } = parseResult.data;

    const progressRecords = await markPuzzleAttempt(user.id, puzzleId, succeeded);
    const completedPuzzleIds = progressRecords
      .filter(record => record.completedAt !== null)
      .map(record => record.puzzleId);
    res.json({ ok: true, completedPuzzleIds, progressRecords });
  });

  router.post('/api/puzzle-progress/sync', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const parseResult = PuzzleSyncSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const progressRecordsError = flattened.fieldErrors.progressRecords?.[0];
      const completedPuzzleIdsError = flattened.fieldErrors.completedPuzzleIds?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = progressRecordsError || completedPuzzleIdsError || formError || 'progressRecords or completedPuzzleIds is required.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { progressRecords: rawProgressRecords, completedPuzzleIds: rawPuzzleIds } = parseResult.data;

    let progressRecords: PuzzleProgressRecord[];
    if (rawProgressRecords) {
      progressRecords = await mergePuzzleProgress(
        user.id,
        rawProgressRecords.map((value) => ({
          puzzleId: value.puzzleId,
          lastPlayedAt: value.lastPlayedAt,
          completedAt: value.completedAt ?? null,
          attempts: value.attempts,
          successes: value.successes,
          failures: value.failures,
        })),
      );
    } else if (rawPuzzleIds) {
      await mergeCompletedPuzzles(user.id, rawPuzzleIds);
      progressRecords = await getPuzzleProgressForUser(user.id);
    } else {
      // Should not happen due to schema validation, but handle gracefully
      res.status(400).json({ error: 'progressRecords or completedPuzzleIds is required.' });
      return;
    }

    const completedPuzzleIds = progressRecords
      .filter(record => record.completedAt !== null)
      .map(record => record.puzzleId);
    res.json({ ok: true, completedPuzzleIds, progressRecords });
  });

  return router;
}
