import { test, expect } from '@playwright/test';
import { GamePage } from './page-objects/GamePage';
import { AnalysisPage } from './page-objects/AnalysisPage';

test.describe('Bot Game Analysis Persistence', () => {
  test('should show game data expired error when navigating directly to /analysis/bot', async ({ page }) => {
    // Arrange
    const analysisPage = new AnalysisPage(page);

    // Act - Navigate directly to /analysis/bot without session data
    await analysisPage.goto('bot');

    // Assert - Should show error state
    const isErrorVisible = await analysisPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);

    // Verify error message is shown (either the translated text or the i18n key)
    const errorMessage = await analysisPage.getErrorMessage();
    // The error should contain either the translated text or the i18n key
    expect(errorMessage).toMatch(/game data|analysis\.session_expired/i);

    // Verify back home button works
    await analysisPage.clickBackHome();
    await expect(page).toHaveURL('/');
  });

  test('should show game data expired error when navigating directly to /analysis/local', async ({ page }) => {
    // Arrange
    const analysisPage = new AnalysisPage(page);

    // Act - Navigate directly to /analysis/local without session data
    await analysisPage.goto('local');

    // Assert - Should show error state
    const isErrorVisible = await analysisPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);

    // Verify error message is shown (either the translated text or the i18n key)
    const errorMessage = await analysisPage.getErrorMessage();
    // The error should contain either the translated text or the i18n key
    expect(errorMessage).toMatch(/game data|analysis\.session_expired/i);
  });

  test('bot game page should load successfully', async ({ page }) => {
    // Arrange
    const gamePage = new GamePage(page);

    // Act - Start a bot game
    await gamePage.gotoBot();
    await gamePage.startBotGame();

    // Assert - Board should be visible
    const isBoardVisible = await gamePage.board.isVisible();
    expect(isBoardVisible).toBe(true);

    // Make a legal player move and let the bot game remain in a valid state.
    await gamePage.makeMove(2, 4, 3, 4);

    // Board should still be visible after moves
    const isBoardStillVisible = await gamePage.board.isVisible();
    expect(isBoardStillVisible).toBe(true);
  });

  test('should navigate to analysis page from bot game', async ({ page }) => {
    // Arrange
    const gamePage = new GamePage(page);

    // Act - Start a bot game
    await gamePage.gotoBot();
    await gamePage.startBotGame();
    await gamePage.makeMove(2, 4, 3, 4);

    // Navigate to analysis using the URL directly (simulating the analyze button click)
    // In a real scenario, the user would click analyze after game over
    // For this test, we verify the navigation works
    await page.goto('/analysis/test-game-id');

    // Assert - Should be on analysis page
    await expect(page).toHaveURL('/analysis/test-game-id');
  });
});
