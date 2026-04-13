import type { AnalysisProgress, GameAnalysis } from '@shared/analysis';
import type { Move } from '@shared/types';
import { requestGameAnalysis } from '../lib/analysis';

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

  if (!response.ok || !response.body) {
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
      const data = lines
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
        .join('\n');

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
      analysis = await requestGameAnalysisStream(event.data);
    } catch {
      try {
        analysis = await requestGameAnalysis({
          analysisId: event.data.analysisId,
          moves: event.data.moves,
          depth: event.data.depth,
          movetimeMs: event.data.movetimeMs,
        });
      } catch (requestError) {
        throw requestError instanceof Error ? requestError : new Error('Analysis request failed');
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
