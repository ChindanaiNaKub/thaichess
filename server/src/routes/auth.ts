import { Router, type RequestHandler } from 'express';
import {
  updateUsername,
  getUsernameChangeCooldown,
  deleteUser,
} from '../database';
import { clearSessionCookie, getAuthenticatedUser, logoutRequest } from '../auth';
import { betterAuthHandler } from '../betterAuth';
import { logError } from '../logger';
import { UpdateProfileSchema } from '../../../shared/validation';
import { requireUser } from './authGuards';

export interface AuthRouterDeps {
  requireTrustedWriteOriginMiddleware: RequestHandler;
}

export function createAuthRouter(deps: AuthRouterDeps): Router {
  const { requireTrustedWriteOriginMiddleware } = deps;
  const router = Router();

  router.get('/api/auth/me', async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      clearSessionCookie(res);
      res.json({ user: null });
      return;
    }

    res.json({ user });
  });

  router.post('/api/auth/logout', requireTrustedWriteOriginMiddleware, async (req, res) => {
    await logoutRequest(req, res);
    res.json({ ok: true });
  });

  router.patch('/api/auth/profile', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    const parseResult = UpdateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const usernameError = flattened.fieldErrors.username?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = usernameError || formError || 'Invalid username.';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { username } = parseResult.data;
    const currentUsername = user.username?.trim() ?? '';
    if (currentUsername === username) {
      res.json({ ok: true, user });
      return;
    }

    const cooldown = getUsernameChangeCooldown(user, username);
    if (cooldown) {
      res.setHeader('Retry-After', String(cooldown.retryAfterSeconds));
      res.status(429).json({
        error: 'You can change your username once every 7 days.',
        code: 'USERNAME_CHANGE_COOLDOWN',
        nextAllowedAt: cooldown.nextAllowedAt,
        retryAfterSeconds: cooldown.retryAfterSeconds,
      });
      return;
    }

    const updated = await updateUsername(user.id, username);
    if (!updated) {
      res.status(400).json({ error: 'Username is unavailable.' });
      return;
    }

    res.json({ ok: true, user: updated });
  });

  router.delete('/api/auth/user', requireTrustedWriteOriginMiddleware, async (req, res) => {
    const user = await requireUser(req, res);
    if (!user) return;

    try {
      // Delete user from database
      const deleted = await deleteUser(user.id);

      if (!deleted) {
        res.status(500).json({ error: 'Failed to delete account' });
        return;
      }

      // Clear session cookie
      clearSessionCookie(res);

      res.json({ ok: true, message: 'Account deleted successfully' });
    } catch (error) {
      logError('delete_user_failed', error, { userId: user.id });
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  router.all('/api/auth/*', betterAuthHandler);

  return router;
}
