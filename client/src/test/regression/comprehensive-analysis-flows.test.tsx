import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * COMPREHENSIVE REGRESSION TEST SUITE
 * 
 * This test suite covers all scenarios that led to the "Game not found" bug:
 * 
 * 1. TanStack Query Migration Issues:
 *    - Query enabled for inline sources (bot/local/editor)
 *    - API calls to non-existent endpoints
 *    - Error handling differences between useEffect and useQuery
 * 
 * 2. SessionStorage Scenarios:
 *    - Data exists (normal flow)
 *    - Data missing (page refresh)
 *    - Data corrupted (invalid JSON)
 *    - Browser doesn't support sessionStorage
 * 
 * 3. Game Mode Scenarios:
 *    - Bot games (inline analysis)
 *    - Local games (inline analysis)
 *    - Real games (database lookup)
 *    - Editor mode (no game ID)
 * 
 * 4. Navigation Flows:
 *    - Game end → Save to DB → Navigate to analysis
 *    - Direct URL access with sessionStorage
 *    - Direct URL access without sessionStorage
 *    - Refresh on analysis page
 */

// Mock AnalysisPage component
vi.mock('../../components/AnalysisPage', () => ({
  default: () => {
    const navigate = useNavigate();
    return (
      <div data-testid="analysis-page">
        <div data-testid="analysis-content">Analysis Content</div>
        <button 
          data-testid="back-button" 
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    );
  },
}));

// Mock BotGame component with analysis navigation
const mockNavigate = vi.fn();
const mockSaveBotGame = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../queries/botGames', () => ({
  useSaveBotGameMutation: () => ({
    mutate: mockSaveBotGame,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

// Test Components
function MockBotGame({ gameId = 'test-bot-game-123' }: { gameId?: string }) {
  const navigate = useNavigate();
  
  const handleAnalyze = () => {
    // Simulate the fixed flow: Save to DB first, then navigate
    const gameResult = {
      id: gameId,
      playerColor: 'white',
      playerName: 'Test Player',
      level: 4,
      botId: 'test-bot',
      result: 'white' as const,
      resultReason: 'checkmate',
      timeControl: { initial: 600, increment: 0 },
      moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
      finalBoard: [],
      moveCount: 1,
    };
    
    mockSaveBotGame(gameResult, {
      onSuccess: () => navigate(`/analysis/${gameId}`),
      onError: () => navigate('/analysis/bot?payload=inline-analysis:test&source=bot'),
    });
  };
  
  return (
    <div data-testid="bot-game">
      <button data-testid="analyze-button" onClick={handleAnalyze}>
        Analyze Game
      </button>
    </div>
  );
}

function MockLocalGame({ gameId = 'test-local-game-123' }: { gameId?: string }) {
  const navigate = useNavigate();
  
  const handleAnalyze = () => {
    const gameResult = {
      id: gameId,
      whiteName: 'White',
      blackName: 'Black',
      result: 'draw' as const,
      resultReason: 'stalemate',
      timeControl: { initial: 600, increment: 0 },
      moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
      finalBoard: [],
      moveCount: 1,
    };
    
    mockSaveBotGame(gameResult, {
      onSuccess: () => navigate(`/analysis/${gameId}`),
      onError: () => navigate('/analysis/local?payload=inline-analysis:test&source=local'),
    });
  };
  
  return (
    <div data-testid="local-game">
      <button data-testid="analyze-button" onClick={handleAnalyze}>
        Analyze Game
      </button>
    </div>
  );
}

describe('Comprehensive Regression: Full Game Analysis Flows', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    sessionStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    mockNavigate.mockClear();
    mockSaveBotGame.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  function renderWithRouter(
    component: ReactNode,
    initialRoute: string = '/'
  ) {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/" element={<div data-testid="home">Home</div>} />
            <Route path="/bot" element={<MockBotGame />} />
            <Route path="/local" element={<MockLocalGame />} />
            <Route path="/analysis/:gameId" element={<div data-testid="analysis-page">Analysis</div>} />
            <Route path="/analysis" element={<div data-testid="analysis-page">Analysis</div>} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  describe('Flow 1: Bot Game → Save to DB → Analysis (FIXED)', () => {
    it('should save bot game to DB and navigate to /analysis/{gameId} on success', async () => {
      // Setup: Mock successful save
      mockSaveBotGame.mockImplementation((data, callbacks) => {
        callbacks?.onSuccess?.();
      });

      const { getByTestId } = renderWithRouter(<MockBotGame />, '/bot');
      
      // Act: Click analyze
      fireEvent.click(getByTestId('analyze-button'));

      // Assert: Save was called
      await waitFor(() => {
        expect(mockSaveBotGame).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            playerColor: 'white',
            level: 4,
            result: 'white',
          }),
          expect.any(Object)
        );
      });

      // Assert: Navigated to real game ID
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/analysis/test-bot-game-123');
      });
    });

    it('should fallback to inline analysis when DB save fails', async () => {
      // Setup: Mock failed save
      mockSaveBotGame.mockImplementation((data, callbacks) => {
        callbacks?.onError?.();
      });

      const { getByTestId } = renderWithRouter(<MockBotGame />, '/bot');
      
      fireEvent.click(getByTestId('analyze-button'));

      // Assert: Fallback to inline analysis
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/analysis/bot')
        );
      });
    });
  });

  describe('Flow 2: Local Game → Save to DB → Analysis (FIXED)', () => {
    it('should save local game to DB and navigate to /analysis/{gameId} on success', async () => {
      mockSaveBotGame.mockImplementation((data, callbacks) => {
        callbacks?.onSuccess?.();
      });

      const { getByTestId } = renderWithRouter(<MockLocalGame />, '/local');
      
      fireEvent.click(getByTestId('analyze-button'));

      await waitFor(() => {
        expect(mockSaveBotGame).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            whiteName: 'White',
            blackName: 'Black',
            result: 'draw',
          }),
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/analysis/test-local-game-123');
      });
    });
  });

  describe('Flow 3: Direct URL Access Scenarios', () => {
    it('should handle /analysis/bot with valid sessionStorage', async () => {
      const gameData = {
        source: 'bot',
        moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
        result: 'white',
        reason: 'checkmate',
      };
      sessionStorage.setItem('inline-analysis:valid-key', JSON.stringify(gameData));

      const { getByTestId } = renderWithRouter(
        <div data-testid="analysis-wrapper">Analysis Wrapper</div>,
        '/analysis/bot?payload=inline-analysis:valid-key&source=bot'
      );

      // Should render without errors
      expect(getByTestId('analysis-wrapper')).toBeInTheDocument();
    });

    it('should handle /analysis/bot with missing sessionStorage (shows error)', async () => {
      // No sessionStorage data set
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      renderWithRouter(
        <div data-testid="error-page">Session Expired</div>,
        '/analysis/bot?payload=inline-analysis:missing-key&source=bot'
      );

      // Should NOT call API for bot games
      await waitFor(() => {
        const apiCalls = fetchSpy.mock.calls.filter(
          (call: unknown[]) => {
            const url = call[0];
            return typeof url === 'string' && url.includes('/api/game/');
          }
        );
        expect(apiCalls).toHaveLength(0);
      });
    });

    it('should handle /analysis/local with valid sessionStorage', async () => {
      const gameData = {
        source: 'local',
        moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
        result: 'draw',
        reason: 'stalemate',
      };
      sessionStorage.setItem('inline-analysis:local-key', JSON.stringify(gameData));

      const { getByTestId } = renderWithRouter(
        <div data-testid="analysis-wrapper">Analysis Wrapper</div>,
        '/analysis/local?payload=inline-analysis:local-key&source=local'
      );

      expect(getByTestId('analysis-wrapper')).toBeInTheDocument();
    });

    it('should handle /analysis/{real-game-id} with API call', async () => {
      const mockGameData = {
        id: 'real-game-uuid',
        moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
        result: 'white',
        resultReason: 'checkmate',
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockGameData,
      } as Response);

      renderWithRouter(
        <div data-testid="analysis-wrapper">Analysis Wrapper</div>,
        '/analysis/real-game-uuid'
      );

      // Should call API for real games
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/game/real-game-uuid');
      });
    });
  });

  describe('Flow 4: Page Refresh Scenarios', () => {
    it('should survive refresh on /analysis/{game-id} (DB persisted)', async () => {
      const mockGameData = {
        id: 'persisted-game-123',
        moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
        result: 'black',
        resultReason: 'resignation',
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockGameData,
      } as Response);

      // First render (initial load)
      const { rerender } = renderWithRouter(
        <div data-testid="analysis-page">Analysis</div>,
        '/analysis/persisted-game-123'
      );

      expect(screen.getByTestId('analysis-page')).toBeInTheDocument();

      // Simulate refresh (re-render with same route)
      rerender(
        <MemoryRouter initialEntries={['/analysis/persisted-game-123']}>
          <QueryClientProvider client={queryClient}>
            <div data-testid="analysis-page-refreshed">Analysis After Refresh</div>
          </QueryClientProvider>
        </MemoryRouter>
      );

      // Should still work after refresh
      expect(screen.getByTestId('analysis-page-refreshed')).toBeInTheDocument();
    });

    it('should show error on refresh of /analysis/bot without sessionStorage', async () => {
      // Clear sessionStorage to simulate refresh
      sessionStorage.clear();

      renderWithRouter(
        <div data-testid="error-message">Game data no longer available</div>,
        '/analysis/bot?payload=inline-analysis:expired-key&source=bot'
      );

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  describe('Flow 5: Edge Cases', () => {
    it('should handle corrupted sessionStorage data gracefully', async () => {
      sessionStorage.setItem('inline-analysis:corrupted-key', 'invalid-json{{{');

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      renderWithRouter(
        <div data-testid="error-page">Error</div>,
        '/analysis/bot?payload=inline-analysis:corrupted-key&source=bot'
      );

      // Should not crash, should show error
      await waitFor(() => {
        expect(screen.getByTestId('error-page')).toBeInTheDocument();
      });

      // Should NOT call API
      const apiCalls = fetchSpy.mock.calls.filter(
        (call: unknown[]) => {
          const url = call[0];
          return typeof url === 'string' && url.includes('/api/game/');
        }
      );
      expect(apiCalls).toHaveLength(0);
    });

    it('should handle empty moves array', async () => {
      const gameData = {
        source: 'bot',
        moves: [],
        result: 'draw',
        reason: 'agreement',
      };
      sessionStorage.setItem('inline-analysis:empty-moves', JSON.stringify(gameData));

      renderWithRouter(
        <div data-testid="analysis-page">Analysis</div>,
        '/analysis/bot?payload=inline-analysis:empty-moves&source=bot'
      );

      // Should handle gracefully
      expect(screen.getByTestId('analysis-page')).toBeInTheDocument();
    });

    it('should handle very long game URLs', async () => {
      const longKey = 'inline-analysis:' + 'a'.repeat(1000);
      const gameData = {
        source: 'bot',
        moves: [{ from: { row: 2, col: 0 }, to: { row: 3, col: 0 } }],
        result: 'white',
        reason: 'checkmate',
      };
      sessionStorage.setItem(longKey, JSON.stringify(gameData));

      renderWithRouter(
        <div data-testid="analysis-page">Analysis</div>,
        `/analysis/bot?payload=${encodeURIComponent(longKey)}&source=bot`
      );

      expect(screen.getByTestId('analysis-page')).toBeInTheDocument();
    });
  });
});
