import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { shouldServeSpaShell } from '../spa';
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

    const indexPath = path.join(clientDist, 'index.html');

    try {
      const template = fs.readFileSync(indexPath, 'utf8');
      const html = renderSeoHtml(template, req.path, getSiteUrl(req));
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
