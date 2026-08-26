import { Worker } from 'node:worker_threads';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logWarn } from './logger';
import type { LocalBotSearchRequest } from './localBotSearch';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_POOL_SIZE = 2;
const REQUEST_TIMEOUT_MS = 5000;

let workers: Worker[] = [];
let nextWorkerIndex = 0;
const pending = new Map<number, PendingRequest>();
let nextRequestId = 1;
let unavailable = false;

function configuredPoolSize(): number {
  const raw = Number(process.env.BOT_SEARCH_WORKERS);
  if (Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  return DEFAULT_POOL_SIZE;
}

export function isBotSearchPoolEnabled(): boolean {
  return !unavailable && configuredPoolSize() > 0;
}

function resolveWorkerModulePath(): string | null {
  try {
    // Compiled build runs as CommonJS (__dirname = dist/server/src).
    // Under ESM-style dev loaders __dirname may be absent — the pool then
    // stays disabled and callers fall back to the inline search.
    if (typeof __dirname === 'undefined') return null;

    const jsPath = join(__dirname, 'botSearchWorker.js');
    if (existsSync(jsPath)) return jsPath;

    const tsPath = join(__dirname, 'botSearchWorker.ts');
    if (existsSync(tsPath)) return tsPath;
  } catch {
    return null;
  }
  return null;
}

function markUnavailable(reason: string): void {
  if (!unavailable) {
    unavailable = true;
    logWarn('bot_search_pool_disabled', { reason });
  }
  for (const [, entry] of pending) {
    clearTimeout(entry.timer);
    entry.reject(new Error('bot search pool unavailable'));
  }
  pending.clear();
  for (const worker of workers.splice(0)) {
    void worker.terminate().catch(() => undefined);
  }
}

function spawnWorkers(): boolean {
  const size = configuredPoolSize();
  const modulePath = resolveWorkerModulePath();

  if (size <= 0 || !modulePath) {
    markUnavailable(size <= 0 ? 'disabled' : 'worker_module_missing');
    return false;
  }

  try {
    for (let index = 0; index < size; index += 1) {
      const worker = new Worker(modulePath);
      worker.unref();

      worker.on('message', (payload: { id: number; ok: boolean; value?: unknown; error?: string }) => {
        const entry = pending.get(payload.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        pending.delete(payload.id);
        if (payload.ok) entry.resolve(payload.value);
        else entry.reject(new Error(payload.error || 'bot search worker failed'));
      });
      worker.on('error', () => {
        markUnavailable('worker_error');
      });
      worker.on('exit', (code) => {
        if (code !== 0) markUnavailable(`worker_exit_${code}`);
      });

      workers.push(worker);
    }
    return true;
  } catch (error) {
    markUnavailable(error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Runs a local bot search off the Node main thread. Rejects when the pool is
 * disabled or the request fails/times out — callers fall back to the
 * synchronous search so behavior is preserved.
 */
export function runLocalBotSearchInWorker<T>(
  request: LocalBotSearchRequest,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  if (!isBotSearchPoolEnabled()) {
    return Promise.reject(new Error('bot search pool disabled'));
  }
  if (workers.length === 0 && !spawnWorkers()) {
    return Promise.reject(new Error('bot search pool unavailable'));
  }

  const id = nextRequestId;
  nextRequestId += 1;
  const worker = workers[nextWorkerIndex % workers.length]!;
  nextWorkerIndex += 1;

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('bot search worker timeout'));
    }, Math.max(1, timeoutMs));

    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timer,
    });

    worker.postMessage({ ...request, id });
  });
}
