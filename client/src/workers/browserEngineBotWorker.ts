import { serializeAnalysisPosition, uciToMove } from '@shared/engineAdapter';
import type { GameState } from '@shared/types';

interface BrowserEngineBotMoveMessage {
  type: 'browser-engine-bot-move';
  state: Pick<GameState, 'board' | 'turn' | 'counting'>;
  movetimeMs: number;
  skillLevel: number;
}

interface BrowserEngineBotResultMessage {
  type: 'result';
  move: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
  depth?: number;
  nodes?: number;
}

interface BrowserEngineBotErrorMessage {
  type: 'error';
  message: string;
}

type WorkerResponse = BrowserEngineBotResultMessage | BrowserEngineBotErrorMessage;

const ENGINE_WORKER_URL = '/engines/fairy-stockfish.js';
const ENGINE_READY_TIMEOUT_MS = 1800;

let engineWorker: Worker | null = null;
let engineReady: Promise<void> | null = null;

function normalizeEngineFen(position: string): string {
  const parts = position.trim().split(/\s+/);
  if (!parts[0]) return position.trim();

  const board = parts[0].replaceAll('F', 'M').replaceAll('f', 'm');
  if (parts.length >= 4) return [board, ...parts.slice(1)].join(' ');
  if (parts.length === 2) return `${board} ${parts[1]} - - 0 1`;
  return [board, ...parts.slice(1)].join(' ');
}

function postEngine(command: string): void {
  engineWorker?.postMessage(command);
}

async function ensureEngineWorker(): Promise<void> {
  if (engineReady) return engineReady;

  engineReady = new Promise((resolve, reject) => {
    const worker = new Worker(ENGINE_WORKER_URL);
    engineWorker = worker;
    let ready = false;
    const timer = setTimeout(() => {
      if (ready) return;
      worker.terminate();
      engineWorker = null;
      engineReady = null;
      reject(new Error('Browser engine did not become ready in time.'));
    }, ENGINE_READY_TIMEOUT_MS);

    worker.onerror = () => {
      clearTimeout(timer);
      engineWorker = null;
      engineReady = null;
      reject(new Error('Browser engine asset is unavailable.'));
    };

    worker.onmessage = (event: MessageEvent<string>) => {
      const line = String(event.data);
      if (line.includes('uciok')) {
        postEngine('setoption name UCI_Variant value makruk');
        postEngine('isready');
      }
      if (line.includes('readyok')) {
        ready = true;
        clearTimeout(timer);
        resolve();
      }
    };

    postEngine('uci');
  });

  return engineReady;
}

function runEngineSearch(
  position: string,
  movetimeMs: number,
  skillLevel: number,
): Promise<BrowserEngineBotResultMessage> {
  return new Promise((resolve, reject) => {
    if (!engineWorker) {
      reject(new Error('Browser engine is not initialized.'));
      return;
    }

    let depth: number | undefined;
    let nodes: number | undefined;
    const timeout = setTimeout(() => {
      postEngine('stop');
    }, Math.max(250, movetimeMs + 700));

    const previousHandler = engineWorker.onmessage;
    engineWorker.onmessage = (event: MessageEvent<string>) => {
      const line = String(event.data).trim();

      if (line.startsWith('info ')) {
        const depthMatch = line.match(/\bdepth\s+(\d+)/);
        const nodesMatch = line.match(/\bnodes\s+(\d+)/);
        if (depthMatch) depth = Number.parseInt(depthMatch[1], 10);
        if (nodesMatch) nodes = Number.parseInt(nodesMatch[1], 10);
      }

      if (!line.startsWith('bestmove ')) return;

      clearTimeout(timeout);
      engineWorker!.onmessage = previousHandler;
      const bestMove = line.split(/\s+/)[1];
      const move = bestMove && bestMove !== '(none)' ? uciToMove(bestMove) : null;
      resolve({ type: 'result', move, depth, nodes });
    };

    postEngine('ucinewgame');
    postEngine(`setoption name Skill Level value ${Math.max(0, Math.min(20, Math.round(skillLevel)))}`);
    postEngine(`position fen ${normalizeEngineFen(position)}`);
    postEngine(`go movetime ${Math.max(50, Math.round(movetimeMs))}`);
  });
}

self.onmessage = async (event: MessageEvent<BrowserEngineBotMoveMessage>) => {
  if (event.data.type !== 'browser-engine-bot-move') return;

  try {
    await ensureEngineWorker();
    const serialized = serializeAnalysisPosition(event.data.state);
    const result = await runEngineSearch(serialized.position, event.data.movetimeMs, event.data.skillLevel);
    self.postMessage(result satisfies WorkerResponse);
  } catch (error) {
    const response: BrowserEngineBotErrorMessage = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Browser engine bot failed.',
    };
    self.postMessage(response);
  }
};

export type { WorkerResponse };
