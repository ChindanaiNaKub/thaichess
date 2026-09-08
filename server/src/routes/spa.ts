import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { shouldServeSpaShell } from '../spa';
import { isKnownAppPath } from '../appRoutes';
import { renderSeoHtml } from '../seoHtml';
import { logWarn } from '../logger';
import { getSiteUrl } from './siteUrl';

export interface SpaRouterDeps {
  clientDist: string;
}

export function createSpaRouter(deps: SpaRouterDeps): Router {
  const { clientDist } = deps;
  const router = Router();

  // SPA fallback (must be mounted last)
  router.get('*', (req, res) => {
    // Never answer asset/file requests with the SPA shell.
    if (!shouldServeSpaShell(req.path)) {
      res.status(404).type('text/plain').send('Not found');
      return;
    }

    // Unknown API paths get a plain JSON 404, not the app shell.
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const indexPath = path.join(clientDist, 'index.html');

    // Unknown application routes are a real 404: the rendered shell carries a
    // noindex "Page Not Found" route (shared/seo.ts fallback), so Google never
    // sees an indexable duplicate of the homepage for garbage URLs.
    const isKnownRoute = isKnownAppPath(req.path);

    try {
      const template = fs.readFileSync(indexPath, 'utf8');
      const html = renderSeoHtml(template, req.path, getSiteUrl(req));
      res.status(isKnownRoute ? 200 : 404);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.type('html').send(html);
    } catch (error) {
      logWarn('spa_fallback_template_read_failed', {
        path: indexPath,
        error: error instanceof Error ? error.message : String(error),
      });
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(indexPath);
    }
  });

  return router;
}

