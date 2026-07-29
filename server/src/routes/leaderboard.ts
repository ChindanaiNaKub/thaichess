import { Router } from 'express';
import {
  getLeaderboard,
  getLeaderboardCount,
  getStats,
  getDatabaseStats,
} from '../database';
import type { MonitoringStore } from '../monitoring';
import { logError } from '../logger';
import { normalizeLeaderboardLimit, normalizeLeaderboardPage } from '../leaderboardPagination';

export type StartupState = 'starting' | 'ready' | 'error';

export interface LeaderboardRouterDeps {
  monitoring: MonitoringStore;
  getStartupState: () => StartupState;
  getStartupError: () => string | null;
}

export function createLeaderboardRouter(deps: LeaderboardRouterDeps): Router {
  const { monitoring, getStartupState, getStartupError } = deps;
  const router = Router();

  router.get('/api/leaderboard', async (req, res) => {
    const page = normalizeLeaderboardPage(req.query.page as string | undefined);
    const limit = normalizeLeaderboardLimit(req.query.limit as string | undefined);
    const [players, total] = await Promise.all([
      getLeaderboard(limit, page * limit),
      getLeaderboardCount(),
    ]);
    res.json({ players, total, page, limit });
  });

  router.get('/api/stats', async (_req, res) => {
    const stats = await getStats();
    res.json(stats);
  });

  router.get('/api/metrics', (_req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(monitoring.getPrometheusMetrics());
  });

  // Single health check — previously duplicated in index.ts; keep the live handler
  // (database connectivity check). The unreachable second handler was removed.
  router.get('/api/health', async (_req, res) => {
    const health = {
      status: 'ok' as 'ok' | 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      startupState: getStartupState(),
      startupError: getStartupError(),
      dependencies: {
        database: 'unknown' as 'ok' | 'error',
      },
      databaseStats: getDatabaseStats(),
    };

    try {
      // Check database connectivity
      await getStats();
      health.dependencies.database = 'ok';
    } catch (error) {
      health.dependencies.database = 'error';
      health.status = 'error';
      logError('health_check_database_failed', error);
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  return router;
}
