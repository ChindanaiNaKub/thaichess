import { Router } from 'express';
import type { MonitoringStore } from '../monitoring';
import { logError, logInfo } from '../logger';
import { ClientDebugSchema, ClientErrorSchema } from '../../../shared/validation';

export interface ClientTelemetryRouterDeps {
  monitoring: MonitoringStore;
}

export function createClientTelemetryRouter(deps: ClientTelemetryRouterDeps): Router {
  const { monitoring } = deps;
  const router = Router();

  router.post('/api/client-errors', (req, res) => {
    const parseResult = ClientErrorSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const messageError = flattened.fieldErrors.message?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = messageError || formError || 'Invalid client error payload';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { source, message, stack, componentStack, url, userAgent } = parseResult.data;

    monitoring.increment('clientErrors');
    logError('client_error', new Error(message), {
      source: source || 'unknown',
      stack: stack || undefined,
      componentStack: componentStack || undefined,
      url: url || undefined,
      userAgent: userAgent || req.headers['user-agent'],
      ip: req.ip,
    });

    res.status(204).end();
  });

  router.post('/api/client-debug', (req, res) => {
    const parseResult = ClientDebugSchema.safeParse(req.body);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      const entriesError = flattened.fieldErrors.entries?.[0];
      const formError = flattened.formErrors[0];
      const errorMessage = entriesError || formError || 'Invalid client debug payload';
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { entries, url, userAgent } = parseResult.data;

    for (const entry of entries) {
      logInfo('client_debug', {
        eventName: entry.event,
        clientTs: entry.ts,
        path: entry.path,
        detail: entry.detail,
        url: url || undefined,
        userAgent: userAgent || req.headers['user-agent'],
        ip: req.ip,
      });
    }

    res.status(204).end();
  });

  return router;
}
