import type { AnalysisProgress, GameAnalysis } from '@shared/analysis';
import type { Move } from '@shared/types';
import { DEFAULT_GAME_ANALYSIS_MOVETIME_MS } from '../lib/analysisCache';
import type { WorkerResponse as BrowserEngineWorkerResponse } from './browserEngineAnalysisWorker';

interface AnalyzeMessage {
  type: 'analyze';
  analysisId?: string | null;
  moves: Move[];
  depth?: number;
  movetimeMs?: number;
}

interface ProgressMessage {
  type: 'progress';
  progress: AnalysisProgress;
}

interface ResultMessage {
  type: 'result';
  analysis: GameAnalysis;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

type WorkerResponse = ProgressMessage | ResultMessage | ErrorMessage;

async function requestBrowserGameAnalysis(payload: AnalyzeMessage): Promise<GameAnalysis> {
  const movetimeMs = payload.movetimeMs ?? DEFAULT_GAME_ANALYSIS_MOVETIME_MS;

  return await new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./browserEngineAnalysisWorker.ts', import.meta.url), { type: 'module' });

    const cleanup = () => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<BrowserEngineWorkerResponse>) => {
      const message = event.data;

      if (message.type === 'game-progress') {
        self.postMessage({ type: 'progress', progress: message.progress } satisfies ProgressMessage);
        return;
      }

      if (message.type === 'game-result') {
        cleanup();
        resolve(message.analysis);
        return;
      }

      if (message.type === 'error') {
        cleanup();
        reject(new Error(message.message));
        return;
      }

      // Ignore single-position result messages on this channel.
    };

    worker.onerror = () => {
      cleanup();
      reject(new Error('Browser game analysis worker failed.'));
    };

    worker.postMessage({
      type: 'browser-game-analysis',
      moves: payload.moves,
      movetimeMs,
    });
  });
}

async function requestGameAnalysisStream(payload: AnalyzeMessage): Promise<GameAnalysis> {
  const response = await fetch('/api/analysis/game/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analysisId: payload.analysisId,
      moves: payload.moves,
      depth: payload.depth,
      movetimeMs: payload.movetimeMs,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: unknown };
    throw new Error(typeof data.error === 'string' ? data.error : 'Streamed analysis request failed');
  }

  if (!response.body) {
    throw new Error('Streamed analysis request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalAnalysis: GameAnalysis | null = null;

  const handleEvent = (eventName: string, data: string) => {
    if (eventName === 'progress') {
      const parsed = JSON.parse(data) as { progress: AnalysisProgress };
      const message: ProgressMessage = { type: 'progress', progress: parsed.progress };
      self.postMessage(message);
      return;
    }

    if (eventName === 'result') {
      const parsed = JSON.parse(data) as { analysis: GameAnalysis };
      finalAnalysis = parsed.analysis;
      return;
    }

    if (eventName === 'error') {
      const parsed = JSON.parse(data) as { message?: string };
      throw new Error(parsed.message || 'Analysis failed');
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const lines = rawEvent.split('\n');
      const eventName = lines.find(line => line.startsWith('event:'))?.slice(6).trim() || 'message';
      const dataParts: string[] = [];
      for (const line of lines) {
        if (line.startsWith('data:')) {
          dataParts.push(line.slice(5).trim());
        }
      }
      const data = dataParts.join('\n');

      if (data) {
        handleEvent(eventName, data);
      }

      separatorIndex = buffer.indexOf('\n\n');
    }

    if (done) break;
  }

  if (!finalAnalysis) {
    throw new Error('Analysis stream ended without a result');
  }

  return finalAnalysis;
}

self.onmessage = async (event: MessageEvent<AnalyzeMessage>) => {
  if (event.data.type !== 'analyze') return;

  try {
    let analysis: GameAnalysis;

    try {
      analysis = await requestBrowserGameAnalysis(event.data);
    } catch {
      try {
        analysis = await requestGameAnalysisStream(event.data);
      } catch {
        const { requestGameAnalysis } = await import('../lib/analysis');
        analysis = await requestGameAnalysis({
          analysisId: event.data.analysisId,
          moves: event.data.moves,
          depth: event.data.depth,
          movetimeMs: event.data.movetimeMs,
        });
      }
    }

    const message: ResultMessage = { type: 'result', analysis };
    self.postMessage(message);
  } catch (error) {
    const message: ErrorMessage = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Analysis failed',
    };
    self.postMessage(message);
  }
};

export type { WorkerResponse };
