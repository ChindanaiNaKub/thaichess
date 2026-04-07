import { useMutation } from '@tanstack/react-query';
import type { PieceColor, Move, Board } from '@shared/types';

export interface BotGameResult {
  id: string;
  playerColor: PieceColor;
  playerName: string;
  level: number;
  botId: string;
  result: PieceColor | 'draw';
  resultReason: string;
  timeControl: { initial: number; increment: number };
  moves: Move[];
  finalBoard: Board;
  moveCount: number;
}

// API function for saving bot game result
async function saveBotGame(result: BotGameResult): Promise<void> {
  const response = await fetch('/api/games/bot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error('Failed to save bot game');
  }
}

// Mutation hook for saving bot game
export function useSaveBotGameMutation() {
  return useMutation({
    mutationFn: saveBotGame,
    // No query invalidation needed - this is a "fire and forget" operation
    // The game is already over, we just want to persist it
  });
}
