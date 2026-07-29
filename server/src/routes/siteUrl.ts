import type express from 'express';
import fs from 'fs';
import path from 'path';

export function findWorkspaceRoot(startDir: string): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { workspaces?: unknown };
        if (Array.isArray(parsed.workspaces) && parsed.workspaces.includes('server') && parsed.workspaces.includes('client')) {
          return currentDir;
        }
      } catch {
        // Ignore malformed package.json candidates and keep walking upward.
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }
    currentDir = parentDir;
  }
}

export function getSiteUrl(req?: express.Request): string {
  const configuredUrl = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (req) {
    return `${req.protocol}://${req.get('host')}`;
  }

  return 'https://thaichess.dev';
}
