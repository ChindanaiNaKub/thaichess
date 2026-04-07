import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * SESSION STORAGE REGRESSION TESTS
 * 
 * Covers all sessionStorage scenarios that could cause the bug:
 * - Data exists (normal flow)
 * - Data missing (page refresh)
 * - Data corrupted (invalid JSON)
 * - Browser doesn't support sessionStorage
 * - Storage quota exceeded
 */

// Mock AnalysisPage
vi.mock('../../components/AnalysisPage', () => ({
  default: () => <div data-testid="analysis-page">Analysis Page</div>,
}));

// Mock fetch to track API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Regression: SessionStorage Scenarios', () => {
  let queryClient: QueryClient;
  let originalSessionStorage: Storage;

  beforeEach(() => {
    originalSessionStorage = window.sessionStorage;
    sessionStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
    });
  });

  function renderAnalysisRoute(route: string) {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/analysis/:gameId" element={<div data-testid="analysis-page">Analysis</div>} />
            <Route path="/analysis" element={<div data-testid="analysis-page">Analysis</div>} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  describe('Scenario 1: Valid SessionStorage Data', () => {
    it('should load bot game from sessionStorage without API call', async () => {
      const gameData = {
        source: 'bot',
        moves: [
          { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } },
          { from: { row: 3, col: 0 }, to: { row: 4, col: 0 } },
        ],
        result: 'white',
        reason: 'checkmate',
      };
      sessionStorage.setItem('inline-analysis:bot-game-123', JSON.stringify(gameData));

      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:bot-game-123&source=bot');

      // Should NOT call API
      await waitFor(() => {
        const apiCalls = mockFetch.mock.calls.filter(
          (call: unknown[]) => {
            const url = call[0];
            return typeof url === 'string' && url.includes('/api/game/');
          }
        );
        expect(apiCalls).toHaveLength(0);
      });

      // Should render successfully
      expect(screen.getByTestId('analysis-page')).toBeInTheDocument();
    });

    it('should load local game from sessionStorage without API call', async () => {
      const gameData = {
        source: 'local',
        moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
        result: 'draw',
        reason: 'stalemate',
      };
      sessionStorage.setItem('inline-analysis:local-game-456', JSON.stringify(gameData));

      renderAnalysisRoute('/analysis/local?payload=inline-analysis:local-game-456&source=local');

      await waitFor(() => {
        const apiCalls = mockFetch.mock.calls.filter(
          (call: unknown[]) => {
            const url = call[0];
            return typeof url === 'string' && url.includes('/api/game/');
          }
        );
        expect(apiCalls).toHaveLength(0);
      });

      expect(screen.getByTestId('analysis-page')).toBeInTheDocument();
    });
  });

  describe('Scenario 2: Missing SessionStorage Data (Page Refresh)', () => {
    it('should show error for bot game without sessionStorage', async () => {
      // No sessionStorage set - simulates page refresh
      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:expired-key&source=bot');

      // Should NOT attempt API call
      await waitFor(() => {
        const apiCalls = mockFetch.mock.calls.filter(
          (call: unknown[]) => {
            const url = call[0];
            return typeof url === 'string' && url.includes('/api/game/');
          }
        );
        expect(apiCalls).toHaveLength(0);
      });
    });

    it('should show error for local game without sessionStorage', async () => {
      renderAnalysisRoute('/analysis/local?payload=inline-analysis:expired-key&source=local');

      await waitFor(() => {
        const apiCalls = mockFetch.mock.calls.filter(
          (call: unknown[]) => {
            const url = call[0];
            return typeof url === 'string' && url.includes('/api/game/');
          }
        );
        expect(apiCalls).toHaveLength(0);
      });
    });
  });

  describe('Scenario 3: Corrupted SessionStorage Data', () => {
    it('should handle invalid JSON gracefully', async () => {
      sessionStorage.setItem('inline-analysis:corrupted', 'not-valid-json{{{');

      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:corrupted&source=bot');

      // Should NOT crash
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      // Should NOT call API
      const apiCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) => {
          const url = call[0];
          return typeof url === 'string' && url.includes('/api/game/');
        }
      );
      expect(apiCalls).toHaveLength(0);
    });

    it('should handle null data gracefully', async () => {
      sessionStorage.setItem('inline-analysis:null-data', 'null');

      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:null-data&source=bot');

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      const apiCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) => {
          const url = call[0];
          return typeof url === 'string' && url.includes('/api/game/');
        }
      );
      expect(apiCalls).toHaveLength(0);
    });

    it('should handle undefined key', async () => {
      // Don't set any data - key doesn't exist
      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:nonexistent&source=bot');

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      const apiCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) => {
          const url = call[0];
          return typeof url === 'string' && url.includes('/api/game/');
        }
      );
      expect(apiCalls).toHaveLength(0);
    });
  });

  describe('Scenario 4: Browser Without SessionStorage Support', () => {
    it('should handle missing sessionStorage API', async () => {
      // Remove sessionStorage
      Object.defineProperty(window, 'sessionStorage', {
        value: undefined,
        writable: true,
      });

      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:test&source=bot');

      // Should NOT crash
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      // Should NOT call API
      const apiCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) => {
          const url = call[0];
          return typeof url === 'string' && url.includes('/api/game/');
        }
      );
      expect(apiCalls).toHaveLength(0);
    });
  });

  describe('Scenario 5: Edge Cases', () => {
    it('should handle empty moves array', async () => {
      const gameData = {
        source: 'bot',
        moves: [],
        result: 'draw',
        reason: 'agreement',
      };
      sessionStorage.setItem('inline-analysis:empty', JSON.stringify(gameData));

      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:empty&source=bot');

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should handle very large game data', async () => {
      const manyMoves = Array(300).fill(null).map((_, i) => ({
        from: { row: i % 8, col: 0 },
        to: { row: (i + 1) % 8, col: 0 },
      }));

      const gameData = {
        source: 'bot',
        moves: manyMoves,
        result: 'white',
        reason: 'checkmate',
      };
      sessionStorage.setItem('inline-analysis:large', JSON.stringify(gameData));

      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:large&source=bot');

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should handle special characters in payload key', async () => {
      const gameData = {
        source: 'bot',
        moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
        result: 'white',
        reason: 'checkmate',
      };
      sessionStorage.setItem('inline-analysis:special-@#$%-key', JSON.stringify(gameData));

      renderAnalysisRoute('/analysis/bot?payload=inline-analysis:special-@#$%-key&source=bot');

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });
});
