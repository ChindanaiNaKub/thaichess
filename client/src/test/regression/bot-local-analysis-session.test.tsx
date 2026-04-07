import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import AnalysisPage from '../../components/AnalysisPage';

/**
 * REGRESSION TEST: Bot/Local Game Analysis Session Expiration
 *
 * Bug: When refreshing the analysis page after playing a bot/local game,
 *      users saw "Game not found" error because sessionStorage data was lost
 *      and the code tried to fetch non-existent game IDs from the API.
 *
 * Root cause: TanStack Query migration moved API fetch outside the conditional
 *             logic flow. The query ran for 'bot'/'local' game IDs which don't
 *             exist in the database.
 *
 * Fixed: 2026-04-07 - Added inline source detection to prevent API calls for
 *        'bot'/'local' sources, and added proper error message for missing
 *        session data.
 */

// Mock dependencies
vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'analysis.session_expired': 'Game data no longer available. Please play again.',
        'analysis.game_not_found': 'Game not found',
        'analysis.loading': 'Loading...',
        'game.error': 'Error',
        'common.back_home': 'Back to Home',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('../../lib/reviewCopy', () => ({
  useReviewCopy: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../components/BoardErrorBoundary', () => ({
  BoardErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../../components/Board', () => ({
  default: () => <div data-testid="board">Board</div>,
}));

vi.mock('../../components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../components/PostGameReviewPanel', () => ({
  default: () => <div data-testid="review-panel">Review Panel</div>,
}));

describe('Regression: Bot/Local Game Analysis Session Expiration', () => {
  let queryClient: QueryClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: 0,
        },
      },
    });
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Game not found' }),
    } as Response);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  function renderAnalysisPage(initialRoute: string) {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/analysis/:gameId" element={<AnalysisPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  it('should NOT attempt to fetch bot games from API (they use sessionStorage)', async () => {
    // Navigate to bot analysis without sessionStorage data (simulates refresh)
    renderAnalysisPage('/analysis/bot?payload=inline-analysis:missing-key&source=bot');

    // Wait for component to settle
    await waitFor(() => {
      // Should NOT call fetch for bot games
      const gameFetchCalls = fetchSpy.mock.calls.filter(
        ([url]: [string, ...unknown[]]) => typeof url === 'string' && url.includes('/api/game/')
      );
      expect(gameFetchCalls).toHaveLength(0);
    });

    // Should show session expired message
    expect(screen.getByText(/Game data no longer available/i)).toBeInTheDocument();
  });

  it('should NOT attempt to fetch local games from API', async () => {
    renderAnalysisPage('/analysis/local?payload=inline-analysis:missing-key&source=local');

    await waitFor(() => {
      const gameFetchCalls = fetchSpy.mock.calls.filter(
        ([url]: [string, ...unknown[]]) => typeof url === 'string' && url.includes('/api/game/')
      );
      expect(gameFetchCalls).toHaveLength(0);
    });

    expect(screen.getByText(/Game data no longer available/i)).toBeInTheDocument();
  });

  it('should still fetch real games from API', async () => {
    const mockGameData = {
      id: 'real-game-123',
      moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
      result: 'white',
      resultReason: 'checkmate',
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockGameData,
    } as Response);

    renderAnalysisPage('/analysis/real-game-123');

    // Should fetch real games from API
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/game/real-game-123');
    });

    // Should NOT show session expired message
    expect(screen.queryByText(/Game data no longer available/i)).not.toBeInTheDocument();
  });

  it('should work when sessionStorage data exists for bot games', async () => {
    const gameData = {
      source: 'bot',
      moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
      result: 'white',
      reason: 'checkmate',
    };
    sessionStorage.setItem('inline-analysis:test-key', JSON.stringify(gameData));

    renderAnalysisPage('/analysis/bot?payload=inline-analysis:test-key&source=bot');

    // Should NOT call API when sessionStorage has data
    await waitFor(() => {
      const gameFetchCalls = fetchSpy.mock.calls.filter(
        ([url]: [string, ...unknown[]]) => typeof url === 'string' && url.includes('/api/game/')
      );
      expect(gameFetchCalls).toHaveLength(0);
    });

    // Should NOT show error
    expect(screen.queryByText(/Game not found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Game data no longer available/i)).not.toBeInTheDocument();
  });

  it('should work when sessionStorage data exists for local games', async () => {
    const gameData = {
      source: 'local',
      moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
      result: 'draw',
      reason: 'stalemate',
    };
    sessionStorage.setItem('inline-analysis:local-key', JSON.stringify(gameData));

    renderAnalysisPage('/analysis/local?payload=inline-analysis:local-key&source=local');

    await waitFor(() => {
      const gameFetchCalls = fetchSpy.mock.calls.filter(
        ([url]: [string, ...unknown[]]) => typeof url === 'string' && url.includes('/api/game/')
      );
      expect(gameFetchCalls).toHaveLength(0);
    });

    expect(screen.queryByText(/Game not found/i)).not.toBeInTheDocument();
  });

  it('should show generic "Game not found" only for real games that fail to fetch', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Game not found' }),
    } as Response);

    renderAnalysisPage('/analysis/non-existent-game-id');

    await waitFor(() => {
      expect(screen.getByText(/Game not found/i)).toBeInTheDocument();
    });

    // Should NOT show session expired message for real games
    expect(screen.queryByText(/Game data no longer available/i)).not.toBeInTheDocument();
  });
});
