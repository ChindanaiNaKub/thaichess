import { useEffect } from 'react';
import type { GameState } from '@shared/types';
import { resolveMakrukTimeoutOutcome } from '@shared/makrukRules';

const BOT_CLOCK_TICK_MS = 500;

export function useBotClock({
  running,
  gameOver,
  onTick,
}: {
  running: boolean;
  gameOver: boolean;
  onTick: (updater: (prev: GameState) => GameState) => void;
}) {
  useEffect(() => {
    if (!running || gameOver) return;
    const interval = setInterval(() => {
      onTick((prev) => {
        if (prev.gameOver) return prev;
        const now = Date.now();
        const elapsed = now - prev.lastMoveTime;
        if (elapsed <= 0) return prev;
        if (prev.turn === 'white') {
          const whiteTime = Math.max(0, prev.whiteTime - elapsed);
          if (whiteTime === 0) {
            const timeoutOutcome = resolveMakrukTimeoutOutcome(prev.board, 'white');
            return { ...prev, whiteTime: 0, lastMoveTime: now, gameOver: true, isDraw: timeoutOutcome.isDraw, winner: timeoutOutcome.winner, resultReason: 'timeout', counting: null };
          }
          return { ...prev, whiteTime, lastMoveTime: now };
        }
        const blackTime = Math.max(0, prev.blackTime - elapsed);
        if (blackTime === 0) {
          const timeoutOutcome = resolveMakrukTimeoutOutcome(prev.board, 'black');
          return { ...prev, blackTime: 0, lastMoveTime: now, gameOver: true, isDraw: timeoutOutcome.isDraw, winner: timeoutOutcome.winner, resultReason: 'timeout', counting: null };
        }
        return { ...prev, blackTime, lastMoveTime: now };
      });
    }, BOT_CLOCK_TICK_MS);
    return () => clearInterval(interval);
  }, [running, gameOver, onTick]);
}
