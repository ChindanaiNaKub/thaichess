import fs from 'node:fs';
import express from 'express';
import { Readable } from 'node:stream';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { requireTrustedWriteOrigin } from '../security';

type MockResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  finished: boolean;
  setHeader: (name: string, value: string) => void;
  getHeader: (name: string) => string | undefined;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  end: (payload?: unknown) => void;
};

function createApp() {
  const app = express();
  app.use(requireTrustedWriteOrigin(['https://good.example']));

  app.get('/write', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/write', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

function createRequest(method: string, headers: Record<string, string | undefined> = {}) {
  const req = new Readable({
    read() {
      this.push(null);
    },
  }) as Readable & {
    method: string;
    url: string;
    originalUrl: string;
    headers: Record<string, string | undefined>;
    get: (name: string) => string | undefined;
  };

  req.method = method;
  req.url = '/write';
  req.originalUrl = '/write';
  req.headers = headers;
  req.get = (name: string) => req.headers[name.toLowerCase()];

  return req;
}

function createResponse(): { response: MockResponse; done: Promise<void> } {
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const response: MockResponse = {
    statusCode: 200,
    headers: {},
    body: undefined,
    finished: false,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.setHeader('content-type', 'application/json; charset=utf-8');
      this.body = payload;
      this.end();
      return this;
    },
    end(payload) {
      this.finished = true;
      if (typeof payload === 'string') {
        this.body = payload;
      } else if (Buffer.isBuffer(payload)) {
        this.body = payload.toString('utf8');
      } else if (payload !== undefined) {
        this.body = payload;
      }
      resolveDone();
    },
  };

  return { response, done };
}

async function dispatch(app: express.Express, method: string, headers: Record<string, string | undefined> = {}) {
  const req = createRequest(method, headers);
  const { response, done } = createResponse();

  app.handle(req as never, response as never);
  await done;

  return response;
}

describe('trusted write origin middleware', () => {
  const app = createApp();

  it('allows a POST from a trusted origin', async () => {
    const response = await dispatch(app, 'POST', {
      origin: 'https://good.example/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('rejects a POST from an untrusted origin', async () => {
    const response = await dispatch(app, 'POST', {
      origin: 'https://evil.example',
    });

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Untrusted origin.' });
  });

  it('rejects a POST from an untrusted origin even if the referer is trusted', async () => {
    const response = await dispatch(app, 'POST', {
      origin: 'https://evil.example',
      referer: 'https://good.example/settings/',
    });

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Untrusted origin.' });
  });

  it('rejects a POST with a malformed origin even if the referer is trusted', async () => {
    const response = await dispatch(app, 'POST', {
      origin: 'null',
      referer: 'https://good.example/settings/',
    });

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Untrusted origin.' });
  });

  it('rejects a POST without an origin header', async () => {
    const response = await dispatch(app, 'POST');

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Untrusted origin.' });
  });

  it('allows a POST without origin when the referer is trusted', async () => {
    const response = await dispatch(app, 'POST', {
      referer: 'https://good.example/settings/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('rejects a POST without origin when the referer is untrusted', async () => {
    const response = await dispatch(app, 'POST', {
      referer: 'https://evil.example/settings/',
    });

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Untrusted origin.' });
  });

  it('allows safe methods without enforcing the origin check', async () => {
    const response = await dispatch(app, 'GET');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('pins the accepted trusted-write route scope in index.ts', () => {
    const indexSource = fs.readFileSync(path.resolve(import.meta.dirname, '../index.ts'), 'utf8');
    const protectedRoutes = [...indexSource.matchAll(
      /app\.(post|patch|delete)\('([^']+)',\s*requireTrustedWriteOriginMiddleware/g,
    )].map(([, method, routePath]) => `${method.toUpperCase()} ${routePath}`);

    expect(protectedRoutes).toEqual([
      'POST /api/auth/logout',
      'PATCH /api/auth/profile',
      'POST /api/fair-play/report',
      'POST /api/fair-play/cases/:id/restrict',
      'POST /api/fair-play/cases/:id/dismiss',
      'POST /api/fair-play/users/:id/clear',
      'POST /api/puzzle-progress/visit',
      'POST /api/puzzle-progress/complete',
      'POST /api/puzzle-progress/attempt',
      'POST /api/puzzle-progress/sync',
      'DELETE /api/feedback/:id',
    ]);
  });
});
