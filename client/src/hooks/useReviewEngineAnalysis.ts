import { useEffect, useRef, useState } from 'react';
import type { AnalysisPositionSnapshot, PositionAnalysisResult } from '@shared/engineAdapter';
import { requestPositionAnalysis } from '../lib/analysis';

interface UseReviewEngineAnalysisOptions {
  enabled: boolean;
  snapshot: AnalysisPositionSnapshot | null;
}

interface UseReviewEngineAnalysisResult {
  analysis: PositionAnalysisResult | null;
  analyzing: boolean;
  error: string | null;
}

const REVIEW_ENGINE_MOVETIME_MS = 700;
const REVIEW_ENGINE_DEBOUNCE_MS = 120;

export function useReviewEngineAnalysis(
  options: UseReviewEngineAnalysisOptions,
): UseReviewEngineAnalysisResult {
  const { enabled, snapshot } = options;
  const requestIdRef = useRef(0);
  const [analysis, setAnalysis] = useState<PositionAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !snapshot) {
      setAnalysis(null);
      setAnalyzing(false);
      setError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAnalyzing(true);
      setError(null);

      try {
        const result = await requestPositionAnalysis(snapshot, {
          movetimeMs: REVIEW_ENGINE_MOVETIME_MS,
          multipv: 3,
          signal: controller.signal,
        });

        if (requestIdRef.current !== requestId) return;
        setAnalysis(result);
      } catch (requestError) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) return;
        setAnalysis(null);
        setError(requestError instanceof Error ? requestError.message : 'Engine analysis failed');
      } finally {
        if (requestIdRef.current === requestId) {
          setAnalyzing(false);
        }
      }
    }, REVIEW_ENGINE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, snapshot]);

  return {
    analysis,
    analyzing,
    error,
  };
}
