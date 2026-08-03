import { test, expect } from '@playwright/test';
import { GamePage } from './page-objects/GamePage';

/**
 * Regression coverage for long bot games: clock ticks must not leave the board
 * stuck in "premove" while it is actually the player's turn.
 */
test.describe('Bot Game Play Flow', () => {
  test('keeps player turns playable across several plies without a stuck premove', async ({ page }) => {
    test.setTimeout(120_000);

    const gamePage = new GamePage(page);

    await gamePage.gotoBot();
    await gamePage.selectFastBot();
    await gamePage.startBotGame();

    await expect(gamePage.board).toBeVisible();
    await gamePage.waitForPlayablePlayerTurn();

    const whitePawnAdvances = [
      { from: [2, 4] as const, to: [3, 4] as const },
      { from: [2, 3] as const, to: [3, 3] as const },
      { from: [2, 5] as const, to: [3, 5] as const },
      { from: [2, 2] as const, to: [3, 2] as const },
      { from: [2, 6] as const, to: [3, 6] as const },
    ];

    for (let i = 0; i < whitePawnAdvances.length; i += 1) {
      const move = whitePawnAdvances[i];
      const moveCountBefore = await gamePage.getMoveCount();

      await gamePage.waitForPlayablePlayerTurn();
      await expect(page.getByTestId('game-premove-chip')).toHaveCount(0);

      await gamePage.makeMove(move.from[0], move.from[1], move.to[0], move.to[1]);
      await gamePage.waitForMoveCountAtLeast(moveCountBefore + 1);

      // Bot should answer; player must regain a real turn (not a stuck premove).
      await gamePage.waitForMoveCountAtLeast(moveCountBefore + 2);
      await gamePage.waitForPlayablePlayerTurn();
      await expect(page.getByTestId('game-premove-chip')).toHaveCount(0);
    }

    expect(await gamePage.getMoveCount()).toBeGreaterThanOrEqual(10);
  });

  test('does not show a premove chip immediately after the player moves', async ({ page }) => {
    test.setTimeout(90_000);

    const gamePage = new GamePage(page);

    await gamePage.gotoBot();
    await gamePage.selectFastBot();
    await gamePage.startBotGame();
    await gamePage.waitForPlayablePlayerTurn();

    await gamePage.makeMove(2, 4, 3, 4);
    await expect(page.getByTestId('game-premove-chip')).toHaveCount(0);

    await gamePage.waitForMoveCountAtLeast(2);
    await gamePage.waitForPlayablePlayerTurn();
    await expect(page.getByTestId('game-premove-chip')).toHaveCount(0);
  });
});
