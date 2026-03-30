import type { GameState } from '@shared/types';
import { createInitialGameState } from '@shared/engine';
import { getBotMoveForLevel } from '@shared/botEngine';

interface BotMoveMessage {
  type: 'bot-move';
  state: Pick<GameState, 'board' | 'turn' | 'counting'>;
  level: number;
  botId?: string;
}

interface BotMoveResultMessage {
  type: 'result';
  move: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
}

interface BotMoveErrorMessage {
  type: 'error';
  message: string;
}

type WorkerResponse = BotMoveResultMessage | BotMoveErrorMessage;

self.onmessage = (event: MessageEvent<BotMoveMessage>) => {
  if (event.data.type !== 'bot-move') return;

  try {
    const base = createInitialGameState(0, 0);
    const state: GameState = {
      ...base,
      board: event.data.state.board.map(row => row.map(cell => (cell ? { ...cell } : null))),
      turn: event.data.state.turn,
      counting: event.data.state.counting ? { ...event.data.state.counting } : null,
    };

    const move = getBotMoveForLevel(state, event.data.level, { botId: event.data.botId });
    const response: BotMoveResultMessage = { type: 'result', move };
    self.postMessage(response);
  } catch (error) {
    const response: BotMoveErrorMessage = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Local bot move failed',
    };
    self.postMessage(response);
  }
};

export type { WorkerResponse };
