import { queryOptions } from '@tanstack/react-query';
import type { Move } from '@shared/types';

export interface GameAnalysisData {
  id: string;
  moves: Move[];
  result: string;
  resultReason: string;
  moveCount: number;
}

export interface GameApiResponse {
  id: string;
  moves: Move[];
  result?: string;
  status?: string;
  resultReason?: string;
  moveCount?: number;
}

// API function
async function fetchGame(gameId: string): Promise<GameApiResponse> {
  const response = await fetch(`/api/game/${gameId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch game');
  }

  return response.json();
}

// Query options factory
export function gameQueryOptions(gameId: string | undefined) {
  // Inline analysis sources that don't exist in the database
  const inlineSources = ['bot', 'local', 'editor'];
  const isRealGameId = Boolean(gameId && !inlineSources.includes(gameId));

  return queryOptions({
    queryKey: ['game', gameId],
    queryFn: () => {
      if (!gameId) throw new Error('Game ID is required');
      return fetchGame(gameId);
    },
    enabled: isRealGameId,
    staleTime: 1000 * 60 * 5, // Game data stays fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
}
