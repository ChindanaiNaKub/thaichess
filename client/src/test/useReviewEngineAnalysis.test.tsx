import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialBoard } from '@shared/engine';
import { useReviewEngineAnalysis } from '../hooks/useReviewEngineAnalysis';

const { requestPositionAnalysisMock, requestBrowserPositionAnalysisMock } = vi.hoisted(() => ({
  requestPositionAnalysisMock: vi.fn(),
  requestBrowserPositionAnalysisMock: vi.fn(),
}));

vi.mock('../lib/analysis', () => ({
  requestPositionAnalysis: (...args: unknown[]) => requestPositionAnalysisMock(...args),
}));

vi.mock('../lib/browserEngineAnalysis', () => ({
  requestBrowserPositionAnalysis: (...args: unknown[]) => requestBrowserPositionAnalysisMock(...args),
}));

const snapshot = {
  board: createInitialBoard(),
  turn: 'white' as const,
  counting: null,
};

const serverAnalysis = {
  evaluation: 12,
  mate: null,
  bestMove: { from: { row: 0, col: 1 }, to: { row: 1, col: 3 } },
  principalVariation: ['b1d2'],
  stats: { source: 'service' as const, depth: 4 },
};

const browserAnalysis = {
  evaluation: -8,
  mate: null,
  bestMove: { from: { row: 0, col: 2 }, to: { row: 1, col: 2 } },
  principalVariation: ['c1c2'],
  stats: { source: 'local' as const, depth: 3 },
};

describe('useReviewEngineAnalysis', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    requestPositionAnalysisMock.mockReset();
    requestBrowserPositionAnalysisMock.mockReset();
    requestPositionAnalysisMock.mockResolvedValue(serverAnalysis);
    requestBrowserPositionAnalysisMock.mockResolvedValue(browserAnalysis);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses server analysis by default', async () => {
    const { result } = renderHook(() => useReviewEngineAnalysis({
      enabled: true,
      snapshot,
    }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
      await Promise.resolve();
    });

    expect(result.current.analysis).toEqual(serverAnalysis);
    expect(requestBrowserPositionAnalysisMock).not.toHaveBeenCalled();
    expect(requestPositionAnalysisMock).toHaveBeenCalledTimes(1);
  });

  it('uses browser analysis first and falls back to the server when the browser engine fails', async () => {
    requestBrowserPositionAnalysisMock.mockRejectedValue(new Error('browser unavailable'));

    const { result } = renderHook(() => useReviewEngineAnalysis({
      enabled: true,
      snapshot,
      engineSource: 'browser-with-server-fallback',
    }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
      await Promise.resolve();
    });

    expect(result.current.analysis).toEqual(serverAnalysis);
    expect(requestBrowserPositionAnalysisMock).toHaveBeenCalledTimes(1);
    expect(requestPositionAnalysisMock).toHaveBeenCalledTimes(1);
  });

  it('does not use server fallback when fallback is disabled', async () => {
    requestBrowserPositionAnalysisMock.mockRejectedValue(new Error('browser unavailable'));

    const { result } = renderHook(() => useReviewEngineAnalysis({
      enabled: true,
      snapshot,
      engineSource: 'browser-with-server-fallback',
      serverFallbackEnabled: false,
    }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
      await Promise.resolve();
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.error).toBe('browser unavailable');
    expect(requestBrowserPositionAnalysisMock).toHaveBeenCalledTimes(1);
    expect(requestPositionAnalysisMock).not.toHaveBeenCalled();
  });
});
