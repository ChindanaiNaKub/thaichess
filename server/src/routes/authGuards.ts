import type express from 'express';
import { clearSessionCookie, getAuthenticatedUser, hasAdminMfaAccess } from '../auth';

export async function requireUser(req: express.Request, res: express.Response) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  return user;
}

export async function requireAdmin(req: express.Request, res: express.Response) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return null;
  }
  return user;
}

export async function requireAdminWithMfa(req: express.Request, res: express.Response) {
  const user = await requireAdmin(req, res);
  if (!user) return null;
  if (!hasAdminMfaAccess(user)) {
    res.status(403).json({ error: 'Admin MFA required.' });
    return null;
  }
  return user;
}
