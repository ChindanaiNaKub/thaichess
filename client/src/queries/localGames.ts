import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Move, Board } from '@shared/types';

export interface LocalGameResult {
  id: string;
  whiteName?: string;
  blackName?: string;
  result: 'white' | 'black' | 'draw';
  resultReason: string;
  timeControl: { initial: number; increment: number };
  moves: Move[];
  finalBoard: Board;
  moveCount: number;
}

// API function for saving local game result
async function saveLocalGame(result: LocalGameResult): Promise<void> {
  const response = await fetch('/api/games/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error('Failed to save local game');
  }
}

// Mutation hook for saving local game
export function useSaveLocalGameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveLocalGame,
    onSuccess: () => {
      // Local games are persisted into the shared history/stats surfaces.
      void queryClient.invalidateQueries({ queryKey: ['games'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      void queryClient.invalidateQueries({ queryKey: ['openings'] });
    },
  });
}
