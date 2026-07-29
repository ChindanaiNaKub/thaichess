import { Router } from 'express';
import { getIndexablePaths } from '../../../shared/seo';
import { getSiteUrl } from './siteUrl';

export function createSeoRouter(): Router {
  const router = Router();

  // Serve crawl files before static assets so stale public copies cannot shadow them.
  router.get('/robots.txt', (req, res) => {
    const siteUrl = getSiteUrl(req);
    res.type('text/plain').send([
      'User-agent: *',
      'Allow: /',
      '',
      '# Block non-indexable dynamic routes',
      'Disallow: /game/',
      'Disallow: /spectate/',
      'Disallow: /analysis/',
      'Disallow: /feedback',
      'Disallow: /login',
      'Disallow: /account',
      'Disallow: /settings/',
      '',
      '# Block API and internal paths',
      'Disallow: /api/',
      'Disallow: /internal/',
      'Disallow: /admin/',
      '',
      `# Sitemap location`,
      `Sitemap: ${siteUrl}/sitemap.xml`,
    ].join('\n'));
  });

  router.get('/sitemap.xml', (req, res) => {
    const siteUrl = getSiteUrl(req);
    const lastmod = new Date().toISOString().slice(0, 10);
    const urls = getIndexablePaths()
      .map((pathname) => [
        '  <url>',
        `    <loc>${siteUrl}${pathname}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        pathname === '/' ? '    <priority>1.0</priority>' : '    <priority>0.8</priority>',
        '  </url>',
      ].join('\n'))
      .join('\n');

    res.type('application/xml').send([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      urls,
      '</urlset>',
    ].join('\n'));
  });

  return router;
}
