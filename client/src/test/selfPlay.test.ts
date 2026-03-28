import { describe, expect, it } from 'vitest';

import { playSelfPlayGame } from '@shared/selfPlay';

describe('selfPlay', () => {
  it('produces deterministic games for the same seed and options', () => {
    const options = {
      whiteDifficulty: 'hard' as const,
      blackDifficulty: 'hard' as const,
      openingRandomPlies: 4,
      maxPlies: 4,
      seed: 12345,
    };

    const first = playSelfPlayGame(options);
    const second = playSelfPlayGame(options);

    expect(second).toEqual(first);
    expect(first.moveCount).toBe(first.moves.length);
    expect(first.moveCount).toBeGreaterThan(0);
  });

  it('stops at the configured ply cap when the game does not finish sooner', () => {
    const game = playSelfPlayGame({
      whiteDifficulty: 'hard',
      blackDifficulty: 'hard',
      openingRandomPlies: 4,
      maxPlies: 1,
      seed: 9,
    });

    expect(game.moveCount).toBe(1);
    expect(game.result).toBe('draw');
    expect(game.resultReason).toBe('max_plies');
  });
});
