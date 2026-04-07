import { useMutation } from '@tanstack/react-query';
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
  return useMutation({
    mutationFn: saveLocalGame,
    // No query invalidation needed - this is a "fire and forget" operation
    // The game is already over, we just want to persist it
  });
}
