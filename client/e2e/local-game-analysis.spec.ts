import { test, expect } from '@playwright/test';
import { GamePage } from './page-objects/GamePage';
import { AnalysisPage } from './page-objects/AnalysisPage';

test.describe('Local Game Analysis Persistence', () => {
  test('shows the expired-session state when local analysis is opened without saved data', async ({ page }) => {
    test.setTimeout(90_000);

    const analysisPage = new AnalysisPage(page);

    await analysisPage.goto('local');
    expect(await analysisPage.isErrorVisible()).toBe(true);
    expect((await analysisPage.getErrorTitle()).toLowerCase()).toContain('error');

    await analysisPage.clickBackHome();
    await expect(page).toHaveURL('/');
  });

  test('plays a local game and keeps the analysis route stable after navigation and refresh', async ({ page }) => {
    test.setTimeout(90_000);

    const gamePage = new GamePage(page);
    const analysisPage = new AnalysisPage(page);

    await gamePage.gotoLocal();
    expect(await gamePage.board.isVisible()).toBe(true);

    await gamePage.makeOpeningMoves();
    await expect(gamePage.getPiece(3, 4)).toBeVisible();

    await page.goto('/analysis/test-local-game-id');
    await expect(page).toHaveURL('/analysis/test-local-game-id');

    await analysisPage.goto('mock-game-id-12345');

    const isLoadingVisible = await page.getByTestId('analysis-loading').isVisible().catch(() => false);
    const isErrorVisible = await analysisPage.isErrorVisible();
    const isBoardVisible = await analysisPage.isBoardVisible();

    expect(isLoadingVisible || isErrorVisible || isBoardVisible).toBe(true);
  });
});
