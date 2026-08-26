import { parentPort } from 'node:worker_threads';
import { runLocalBotSearchRequest, type LocalBotSearchRequest } from './localBotSearch';

interface WorkerInboundMessage extends LocalBotSearchRequest {
  id: number;
}

parentPort?.on('message', (message: WorkerInboundMessage) => {
  try {
    const value = runLocalBotSearchRequest(message);
    void Promise.resolve(value).then((resolved) => {
      parentPort?.postMessage({ id: message.id, ok: true, value: resolved });
    }, (error: unknown) => {
      parentPort?.postMessage({
        id: message.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  } catch (error) {
    parentPort?.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
