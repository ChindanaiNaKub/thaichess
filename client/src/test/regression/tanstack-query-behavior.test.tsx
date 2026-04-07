import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * TANSTACK QUERY BEHAVIOR REGRESSION TESTS
 * 
 * These tests specifically verify that TanStack Query behaves correctly
 * for different game sources and doesn't cause the "Game not found" bug.
 * 
 * The bug occurred because:
 * 1. useQuery was enabled for ALL gameId values (including 'bot', 'local')
 * 2. The query ran immediately on mount, before checking sessionStorage
 * 3. API returned 404 for non-existent 'bot'/'local' game IDs
 * 4. Error state showed "Game not found" instead of checking sessionStorage
 */

// Test component that mimics AnalysisPage's query behavior
function TestAnalysisPage({ gameId }: { gameId: string | undefined }) {
  // This mimics the fixed gameQueryOptions logic
  const inlineSources = ['bot', 'local', 'editor'];
  const isRealGameId = Boolean(gameId && !inlineSources.includes(gameId));

  const { isLoading, isError, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      if (!gameId) throw new Error('No game ID');
      const response = await fetch(`/api/game/${gameId}`);
      if (!response.ok) throw new Error('Game not found');
      return response.json();
    },
    enabled: isRealGameId,
    retry: false,
  });

  return (
    <div data-testid="test-page">
      <div data-testid="game-id">{gameId || 'none'}</div>
      <div data-testid="is-real-game">{isRealGameId ? 'true' : 'false'}</div>
      <div data-testid="query-enabled">{isRealGameId ? 'enabled' : 'disabled'}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{isError ? (error as Error).message : 'no-error'}</div>
    </div>
  );
}

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Regression: TanStack Query Behavior for Game Sources', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'test-game', moves: [] }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithQuery(component: ReactNode) {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  describe('Query Enable Logic (The Core Fix)', () => {
    it('should DISABLE query for "bot" game source', async () => {
      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="bot" />);

      expect(getByTestId('is-real-game').textContent).toBe('false');
      expect(getByTestId('query-enabled').textContent).toBe('disabled');

      // Should NOT call fetch
      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('should DISABLE query for "local" game source', async () => {
      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="local" />);

      expect(getByTestId('is-real-game').textContent).toBe('false');
      expect(getByTestId('query-enabled').textContent).toBe('disabled');

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('should DISABLE query for "editor" game source', async () => {
      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="editor" />);

      expect(getByTestId('is-real-game').textContent).toBe('false');
      expect(getByTestId('query-enabled').textContent).toBe('disabled');

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('should ENABLE query for real game IDs', async () => {
      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="abc123-def456" />);

      expect(getByTestId('is-real-game').textContent).toBe('true');
      expect(getByTestId('query-enabled').textContent).toBe('enabled');

      // Should call fetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/game/abc123-def456');
      });
    });

    it('should ENABLE query for UUID-style game IDs', async () => {
      renderWithQuery(<TestAnalysisPage gameId="6c158623-9e9d-4a3f-b468-f4f563095ae7" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/game/6c158623-9e9d-4a3f-b468-f4f563095ae7');
      });
    });

    it('should DISABLE query for undefined gameId', async () => {
      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId={undefined} />);

      expect(getByTestId('is-real-game').textContent).toBe('false');
      expect(getByTestId('query-enabled').textContent).toBe('disabled');

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('should DISABLE query for empty string gameId', async () => {
      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="" />);

      expect(getByTestId('is-real-game').textContent).toBe('false');
      expect(getByTestId('query-enabled').textContent).toBe('disabled');

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Query Error Handling', () => {
    it('should show error when real game fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Game not found' }),
      });

      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="non-existent-game" />);

      await waitFor(() => {
        expect(getByTestId('error').textContent).toBe('Game not found');
      });
    });

    it('should NOT show error for bot games (query disabled)', async () => {
      mockFetch.mockRejectedValue(new Error('Should not be called'));

      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="bot" />);

      // Wait a bit to ensure no error occurs
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(getByTestId('error').textContent).toBe('no-error');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should NOT show error for local games (query disabled)', async () => {
      mockFetch.mockRejectedValue(new Error('Should not be called'));

      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="local" />);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(getByTestId('error').textContent).toBe('no-error');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Query Loading State', () => {
    it('should NOT show loading for disabled queries', async () => {
      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="bot" />);

      expect(getByTestId('loading').textContent).toBe('not-loading');
    });

    it('should show loading for enabled queries initially', async () => {
      // Delay the fetch to see loading state
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderWithQuery(<TestAnalysisPage gameId="real-game-123" />);

      // Should be loading initially
      expect(getByTestId('loading').textContent).toBe('loading');
    });
  });

  describe('Query Key Stability', () => {
    it('should use consistent query keys for same gameId', async () => {
      const { rerender } = renderWithQuery(<TestAnalysisPage gameId="test-game-123" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/game/test-game-123');
      });

      const callCount = mockFetch.mock.calls.length;

      // Re-render with same gameId should not trigger new fetch
      rerender(
        <QueryClientProvider client={queryClient}>
          <TestAnalysisPage gameId="test-game-123" />
        </QueryClientProvider>
      );

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should still have same call count (cached)
      expect(mockFetch.mock.calls.length).toBe(callCount);
    });
  });
});
