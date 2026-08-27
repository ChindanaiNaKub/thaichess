import type { GameState } from '@shared/types';
import type { WorkerResponse } from '../workers/browserEngineBotWorker';

const BROWSER_ENGINE_MIN_LEVEL = 1;

const availabilityCache = {
  checked: false,
  available: false,
};

/** Extra allowance for the first move, which pays module load + engine UCI handshake. */
const COLD_START_HEADROOM_MS = 1500;

type BotMove = { from: { row: number; col: number }; to: { row: number; col: number } };

interface BrowserEngineTierConfig {
  movetimeMs: number;
  /** UCI Skill Level, 0 (weakest) to 20 (full strength). */
  skillLevel: number;
}

// Tiers 1-7: weak opponents — strength comes from skill level, so movetime is
// near-instant (~100ms). Tiers 8-12: full-strength engine (skill 20) with real
// movetimes, unchanged.
const BROWSER_ENGINE_TIER_CONFIG: Record<number, BrowserEngineTierConfig> = {
  1: { movetimeMs: 100, skillLevel: 0 },
  2: { movetimeMs: 100, skillLevel: 0 },
  3: { movetimeMs: 100, skillLevel: 1 },
  4: { movetimeMs: 100, skillLevel: 2 },
  5: { movetimeMs: 100, skillLevel: 4 },
  6: { movetimeMs: 100, skillLevel: 7 },
  7: { movetimeMs: 100, skillLevel: 10 },
  8: { movetimeMs: 850, skillLevel: 20 },
  9: { movetimeMs: 1200, skillLevel: 20 },
  10: { movetimeMs: 1600, skillLevel: 20 },
  11: { movetimeMs: 2100, skillLevel: 20 },
  12: { movetimeMs: 2400, skillLevel: 20 },
};

function getBrowserEngineTierConfig(level: number): BrowserEngineTierConfig {
  return BROWSER_ENGINE_TIER_CONFIG[level] ?? BROWSER_ENGINE_TIER_CONFIG[12];
}

export function getBrowserEngineDeadlineMs(level: number): number {
  return getBrowserEngineTierConfig(level).movetimeMs + 900;
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

// The engine worker is kept alive across moves so only the first move pays the
// boot cost (module load + UCI handshake, up to ~1.8s). Requests are serialized:
// one shared engine session can only run one search at a time.
let engineWorker: Worker | null = null;
let engineWarmed = false;
let engineQueue: Promise<unknown> = Promise.resolve();

function getEngineWorker(): Worker {
  if (!engineWorker) {
    engineWorker = new Worker(new URL('../workers/browserEngineBotWorker.ts', import.meta.url), { type: 'module' });
  }
  return engineWorker;
}

function dropEngineWorker(): void {
  engineWorker?.terminate();
  engineWorker = null;
  engineWarmed = false;
}

function requestMove(
  worker: Worker,
  state: Pick<GameState, 'board' | 'turn' | 'counting'>,
  level: number,
): Promise<BotMove | null> {
  const { movetimeMs, skillLevel } = getBrowserEngineTierConfig(level);
  const deadlineMs = getBrowserEngineDeadlineMs(level) + (engineWarmed ? 0 : COLD_START_HEADROOM_MS);
  let resolve!: (move: BotMove | null) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<BotMove | null>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const timeout = setTimeout(() => {
    cleanup();
    // A hung engine would wedge the serialized queue — drop it so the next move
    // starts from a clean worker.
    dropEngineWorker();
    reject(new Error('Browser engine bot timed out.'));
  }, deadlineMs);

  const cleanup = () => {
    clearTimeout(timeout);
    worker.onmessage = null;
    worker.onerror = null;
  };

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    cleanup();

    if (event.data.type === 'result') {
      engineWarmed = true;
      resolve(event.data.move);
      return;
    }

    reject(new Error(event.data.message));
  };

  worker.onerror = () => {
    cleanup();
    dropEngineWorker();
    reject(new Error('Browser engine worker failed.'));
  };

  worker.postMessage({ type: 'browser-engine-bot-move', state, movetimeMs, skillLevel });
  return promise;
}

export async function requestBrowserEngineBotMove(
  state: Pick<GameState, 'board' | 'turn' | 'counting'>,
  level: number,
): Promise<BotMove | null> {
  if (level < BROWSER_ENGINE_MIN_LEVEL) return null;
  if (!(await hasBrowserEngineAsset())) return null;

  const worker = getEngineWorker();
  const run = engineQueue.then(() => requestMove(worker, state, level));
  engineQueue = run.catch(() => undefined);
  return run;
}