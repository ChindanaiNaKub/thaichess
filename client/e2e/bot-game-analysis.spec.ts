import { test, expect } from '@playwright/test';
import { GamePage } from './page-objects/GamePage';
import { AnalysisPage } from './page-objects/AnalysisPage';

test.describe('Bot Game Analysis Persistence', () => {
  test('shows the expired-session state for bot and local analysis routes without saved data', async ({ page }) => {
    test.setTimeout(90_000);

    const analysisPage = new AnalysisPage(page);

    await analysisPage.goto('bot');
    expect(await analysisPage.isErrorVisible()).toBe(true);
    expect(await analysisPage.getErrorMessage()).toMatch(/game data|analysis\.session_expired/i);

    await analysisPage.goto('local');
    expect(await analysisPage.isErrorVisible()).toBe(true);
    expect(await analysisPage.getErrorMessage()).toMatch(/game data|analysis\.session_expired/i);

    await analysisPage.clickBackHome();
    await expect(page).toHaveURL('/');
  });

  test('starts a bot game and reaches an analysis route successfully', async ({ page }) => {
    test.setTimeout(90_000);

    const gamePage = new GamePage(page);

    await gamePage.gotoBot();
    await gamePage.startBotGame();
    expect(await gamePage.board.isVisible()).toBe(true);

    await gamePage.makeMove(2, 4, 3, 4);
    expect(await gamePage.board.isVisible()).toBe(true);

    await page.goto('/analysis/test-game-id');
    await expect(page).toHaveURL('/analysis/test-game-id');
  });
});
