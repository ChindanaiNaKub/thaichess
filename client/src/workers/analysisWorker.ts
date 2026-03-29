import { analyzeGame, type AnalysisProgress, type GameAnalysis } from '@shared/analysis';
import type { Move } from '@shared/types';
import { requestGameAnalysis } from '../lib/analysis';

interface AnalyzeMessage {
  type: 'analyze';
  moves: Move[];
  depth: number;
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

self.onmessage = async (event: MessageEvent<AnalyzeMessage>) => {
  if (event.data.type !== 'analyze') return;

  try {
    let analysis: GameAnalysis;

    try {
      analysis = await requestGameAnalysis({
        moves: event.data.moves,
        depth: event.data.depth,
      });
    } catch {
      analysis = analyzeGame(event.data.moves, event.data.depth, (progress) => {
        const message: ProgressMessage = { type: 'progress', progress };
        self.postMessage(message);
      });
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
