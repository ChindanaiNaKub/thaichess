import type { GameState } from '@shared/types';
import type { WorkerResponse } from '../workers/botWorker';

export async function requestLocalBotMove(
  state: Pick<GameState, 'board' | 'turn' | 'counting'>,
  level: number,
): Promise<{ from: { row: number; col: number }; to: { row: number; col: number } } | null> {
  return await new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/botWorker.ts', import.meta.url), { type: 'module' });

    const cleanup = () => {
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
      reject(new Error('Local bot worker failed'));
    };

    worker.postMessage({
      type: 'bot-move',
      state,
      level,
    });
  });
}
