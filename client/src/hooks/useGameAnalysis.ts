import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisProgress, GameAnalysis } from '@shared/analysis';
import type { Move } from '@shared/types';
import { DEFAULT_GAME_ANALYSIS_MOVETIME_MS, getGameAnalysisCacheKey, readCachedGameAnalysis, writeCachedGameAnalysis } from '../lib/analysisCache';
import type { WorkerResponse } from '../workers/analysisWorker';

interface UseGameAnalysisOptions {
  enabled: boolean;
  analysisId?: string | null;
  moves: Move[];
  movetimeMs?: number;
  depth?: number;
}

interface UseGameAnalysisResult {
  analysis: GameAnalysis | null;
  analyzing: boolean;
  progress: AnalysisProgress | null;
  error: string | null;
}

export function useGameAnalysis(options: UseGameAnalysisOptions): UseGameAnalysisResult {
  const {
    enabled,
    analysisId,
    moves,
    movetimeMs = DEFAULT_GAME_ANALYSIS_MOVETIME_MS,
    depth = 2,
  } = options;
  const workerRef = useRef<Worker | null>(null);
  const runKeyRef = useRef<string | null>(null);
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => (
    getGameAnalysisCacheKey({
      analysisId,
      moves,
      movetimeMs,
    })
  ), [analysisId, movetimeMs, moves]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || moves.length === 0) {
      workerRef.current?.terminate();
      workerRef.current = null;
      runKeyRef.current = null;
      setAnalysis(null);
      setAnalyzing(false);
      setProgress(null);
      setError(null);
      return;
    }

    if (runKeyRef.current === cacheKey && analysis) {
      return;
    }

    const cached = readCachedGameAnalysis(cacheKey);
    if (cached) {
      runKeyRef.current = cacheKey;
      setAnalysis(cached);
      setAnalyzing(false);
      setProgress(null);
      setError(null);
      return;
    }

    runKeyRef.current = cacheKey;
    setAnalysis(null);
    setAnalyzing(true);
    setProgress(null);
    setError(null);

    workerRef.current?.terminate();
    const worker = new Worker(new URL('../workers/analysisWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === 'progress') {
        setProgress({ ...message.progress });
        return;
      }

      if (message.type === 'result') {
        writeCachedGameAnalysis(cacheKey, message.analysis);
        setAnalysis(message.analysis);
        setAnalyzing(false);
        setProgress(null);
        setError(null);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        return;
      }

      setAnalyzing(false);
      setProgress(null);
      setError(message.message || 'Analysis failed');
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };

    worker.postMessage({
      type: 'analyze',
      moves,
      movetimeMs,
      depth,
    });

    return () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, [analysis, cacheKey, depth, enabled, movetimeMs, moves]);

  return {
    analysis,
    analyzing,
    progress,
    error,
  };
}
