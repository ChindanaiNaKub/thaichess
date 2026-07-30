import { serializeAnalysisPosition, uciToMove, type AnalysisPositionSnapshot, type PositionAnalysisResult } from '@shared/engineAdapter';
import type { WorkerResponse } from '../workers/browserEngineAnalysisWorker';

interface BrowserPositionAnalysisOptions {
  movetimeMs?: number;
  signal?: AbortSignal;
}

const ENGINE_ASSET_URL = '/engines/fairy-stockfish.js';
const DEFAULT_BROWSER_ANALYSIS_MOVETIME_MS = 700;

const availabilityCache = {
  checked: false,
  available: false,
};

function parseNumberAfter(tokens: string[], name: string): number | undefined {
  const index = tokens.indexOf(name);
  if (index < 0) return undefined;

  const value = Number.parseInt(tokens[index + 1] ?? '', 10);
  return Number.isFinite(value) ? value : undefined;
}

function parsePrincipalVariation(tokens: string[]): string[] {
  const index = tokens.indexOf('pv');
  if (index < 0) return [];

  return tokens.slice(index + 1).filter((token) => /^[a-h][1-8][a-h][1-8][a-z]?$/.test(token));
}

export function parseBrowserEngineAnalysisLines(lines: string[]): PositionAnalysisResult {
  let evaluation = 0;
  let mate: number | null = null;
  let bestMove = null as PositionAnalysisResult['bestMove'];
  let principalVariation: string[] = [];
  let depth: number | undefined;
  let selDepth: number | undefined;
  let nodes: number | undefined;
  let nps: number | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const tokens = line.split(/\s+/);

    if (line.startsWith('info ')) {
      const scoreIndex = tokens.indexOf('score');
      if (scoreIndex >= 0) {
        const scoreType = tokens[scoreIndex + 1];
        const scoreValue = Number.parseInt(tokens[scoreIndex + 2] ?? '', 10);

        if (Number.isFinite(scoreValue)) {
          if (scoreType === 'cp') {
            evaluation = scoreValue;
            mate = null;
          } else if (scoreType === 'mate') {
            evaluation = 0;
            mate = scoreValue;
          }
        }
      }

      depth = parseNumberAfter(tokens, 'depth') ?? depth;
      selDepth = parseNumberAfter(tokens, 'seldepth') ?? selDepth;
      nodes = parseNumberAfter(tokens, 'nodes') ?? nodes;
      nps = parseNumberAfter(tokens, 'nps') ?? nps;

      const pv = parsePrincipalVariation(tokens);
      if (pv.length > 0) {
        principalVariation = pv;
      }
    }

    if (line.startsWith('bestmove ')) {
      const move = uciToMove(tokens[1] ?? '');
      bestMove = move;
    }
  }

  return {
    evaluation,
    mate,
    bestMove,
    principalVariation,
    stats: {
      source: 'local',
      depth,
      selDepth,
      nodes,
      nps,
    },
  };
}

async function hasBrowserEngineAsset(): Promise<boolean> {
  if (availabilityCache.checked) return availabilityCache.available;

  availabilityCache.checked = true;
  try {
    const response = await fetch(ENGINE_ASSET_URL, {
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

export async function requestBrowserPositionAnalysis(
  snapshot: AnalysisPositionSnapshot,
  options: BrowserPositionAnalysisOptions = {},
): Promise<PositionAnalysisResult> {
  if (!(await hasBrowserEngineAsset())) {
    throw new Error('Browser engine asset is unavailable.');
  }

  const serialized = serializeAnalysisPosition(snapshot);
  const movetimeMs = options.movetimeMs ?? DEFAULT_BROWSER_ANALYSIS_MOVETIME_MS;

  return await new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/browserEngineAnalysisWorker.ts', import.meta.url), { type: 'module' });
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Browser engine analysis timed out.'));
    }, Math.max(1000, movetimeMs + 1200));

    const cleanup = () => {
      window.clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };

    const abort = () => {
      cleanup();
      reject(new DOMException('Browser engine analysis aborted.', 'AbortError'));
    };

    if (options.signal?.aborted) {
      abort();
      return;
    }

    options.signal?.addEventListener('abort', abort, { once: true });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      cleanup();

      if (event.data.type === 'result') {
        resolve(event.data.analysis);
        return;
      }

      if (event.data.type === 'error') {
        reject(new Error(event.data.message));
        return;
      }

      reject(new Error('Unexpected browser engine analysis response.'));
    };

    worker.onerror = () => {
      cleanup();
      reject(new Error('Browser engine analysis worker failed.'));
    };

    worker.postMessage({
      type: 'browser-position-analysis',
      position: serialized.position,
      movetimeMs,
    });
  });
}
