import { useEffect, useRef, useState, useCallback } from 'react';
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
const REVIEW_ENGINE_DEBOUNCE_MS = 800; // Increased from 120ms to 800ms to avoid rate limits
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 2000; // Start with 2 second delay for retries

// Simple request deduplication cache
const requestCache = new Map<string, Promise<PositionAnalysisResult>>();

function getCacheKey(snapshot: AnalysisPositionSnapshot, options: { movetimeMs: number; multipv: number }): string {
  const position = JSON.stringify(snapshot.board) + snapshot.turn + JSON.stringify(snapshot.counting);
  return `${position}:${options.movetimeMs}:${options.multipv}`;
}

export function useReviewEngineAnalysis(
  options: UseReviewEngineAnalysisOptions,
): UseReviewEngineAnalysisResult {
  const { enabled, snapshot } = options;
  const requestIdRef = useRef(0);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const [analysis, setAnalysis] = useState<PositionAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const performAnalysis = useCallback(async (
    requestId: number,
    controller: AbortController,
    attemptNumber: number,
  ): Promise<void> => {
    if (!snapshot) return;

    const cacheKey = getCacheKey(snapshot, { movetimeMs: REVIEW_ENGINE_MOVETIME_MS, multipv: 3 });

    // Check if there's already an in-flight request for this position
    let analysisPromise = requestCache.get(cacheKey);

    if (!analysisPromise) {
      // Create new request
      analysisPromise = requestPositionAnalysis(snapshot, {
        movetimeMs: REVIEW_ENGINE_MOVETIME_MS,
        multipv: 3,
        signal: controller.signal,
      });

      requestCache.set(cacheKey, analysisPromise);

      // Clean up cache after request completes (success or failure)
      analysisPromise
        .then(() => {
          setTimeout(() => requestCache.delete(cacheKey), 100);
        })
        .catch(() => {
          setTimeout(() => requestCache.delete(cacheKey), 100);
        });
    }

    try {
      const result = await analysisPromise;

      // Only update state if this is still the current request
      if (requestIdRef.current !== requestId) return;

      setAnalysis(result);
      setError(null);
      retryCountRef.current = 0;
    } catch (requestError) {
      // Only update state if this is still the current request and not aborted
      if (controller.signal.aborted || requestIdRef.current !== requestId) return;

      // Check if it's a rate limit error (429)
      const errorMessage = requestError instanceof Error ? requestError.message : 'Engine analysis failed';
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('Too Many Requests');

      if (isRateLimitError && attemptNumber < MAX_RETRIES) {
        // Exponential backoff for rate limit errors
        const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attemptNumber);
        retryCountRef.current = attemptNumber + 1;

        retryTimeoutRef.current = window.setTimeout(() => {
          if (requestIdRef.current === requestId) {
            performAnalysis(requestId, controller, attemptNumber + 1);
          }
        }, delay);

        return;
      }

      setAnalysis(null);
      setError(isRateLimitError
        ? 'Analysis rate limit reached. Please wait a moment and try again.'
        : errorMessage,
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setAnalyzing(false);
      }
    }
  }, [snapshot]);

  useEffect(() => {
    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (!enabled || !snapshot) {
      setAnalysis(null);
      setAnalyzing(false);
      setError(null);
      retryCountRef.current = 0;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      setAnalyzing(true);
      setError(null);
      retryCountRef.current = 0;

      performAnalysis(requestId, controller, 0);
    }, REVIEW_ENGINE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, snapshot, performAnalysis]);

  return {
    analysis,
    analyzing,
    error,
  };
}
