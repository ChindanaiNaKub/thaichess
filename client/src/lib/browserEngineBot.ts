import type { GameState } from '@shared/types';
import type { WorkerResponse } from '../workers/browserEngineBotWorker';

const BROWSER_ENGINE_MIN_LEVEL = 8;
const availabilityCache = {
  checked: false,
  available: false,
};

function getBrowserEngineMovetimeMs(level: number): number {
  if (level >= 12) return 2400;
  if (level >= 11) return 2100;
  if (level >= 10) return 1600;
  if (level >= 9) return 1200;
  return 850;
}

export function getBrowserEngineDeadlineMs(level: number): number {
  return getBrowserEngineMovetimeMs(level) + 900;
}

async function hasBrowserEngineAsset(): Promise<boolean> {
  if (availabilityCache.checked) return availabilityCache.available;

  availabilityCache.checked = true;
  try {
    const response = await fetch('/engines/fairy-stockfish.js', {
      method: 'HEAD',
      cache: 'force-cache',
    });
    const contentType = response.headers.get('content-type') ?? '';
    availabilityCache.available = response.ok
      && (
        contentType.includes('javascript')
        || contentType.includes('application/wasm')
        || contentType.includes('text/plain')
      );
  } catch {
    availabilityCache.available = false;
  }

  return availabilityCache.available;
}

export async function requestBrowserEngineBotMove(
  state: Pick<GameState, 'board' | 'turn' | 'counting'>,
  level: number,
): Promise<{ from: { row: number; col: number }; to: { row: number; col: number } } | null> {
  if (level < BROWSER_ENGINE_MIN_LEVEL) return null;
  if (!(await hasBrowserEngineAsset())) return null;

  return await new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/browserEngineBotWorker.ts', import.meta.url), { type: 'module' });
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Browser engine bot timed out.'));
    }, getBrowserEngineDeadlineMs(level));

    const cleanup = () => {
      clearTimeout(timeout);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      cleanup();

      if (event.data.type === 'result') {
        resolve(event.data.move);
        return;
      }

      reject(new Error(event.data.message));
    };

    worker.onerror = () => {
      cleanup();
      reject(new Error('Browser engine worker failed.'));
    };

    worker.postMessage({
      type: 'browser-engine-bot-move',
      state,
      movetimeMs: getBrowserEngineMovetimeMs(level),
    });
  });
}
