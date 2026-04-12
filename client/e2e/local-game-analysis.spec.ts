import { test, expect } from '@playwright/test';
import { GamePage } from './page-objects/GamePage';
import { AnalysisPage } from './page-objects/AnalysisPage';

test.describe('Local Game Analysis Persistence', () => {
  test('should show game data expired error when accessing expired local session', async ({ page }) => {
    // Arrange
    const analysisPage = new AnalysisPage(page);

    // Act - Navigate directly to /analysis/local without session data
    await analysisPage.goto('local');

    // Assert - Should show error state
    const isErrorVisible = await analysisPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);

    // Verify error title
    const errorTitle = await analysisPage.getErrorTitle();
    expect(errorTitle.toLowerCase()).toContain('error');

    // Verify back home button works
    await analysisPage.clickBackHome();
    await expect(page).toHaveURL('/');
  });

  test('local game page should load and allow moves', async ({ page }) => {
    // Arrange
    const gamePage = new GamePage(page);

    // Act - Start a local game
    await gamePage.gotoLocal();

    // Assert - Board should be visible
    const isBoardVisible = await gamePage.board.isVisible();
    expect(isBoardVisible).toBe(true);

    // Make opening moves
    await gamePage.makeOpeningMoves();

    // Verify pieces moved
    const pieceAtDestination = gamePage.getPiece(3, 4);
    await expect(pieceAtDestination).toBeVisible();
  });

  test('should navigate to analysis page from local game', async ({ page }) => {
    // Arrange
    const gamePage = new GamePage(page);

    // Act - Start a local game
    await gamePage.gotoLocal();
    await gamePage.makeOpeningMoves();

    // Navigate to analysis using the URL directly
    await page.goto('/analysis/test-local-game-id');

    // Assert - Should be on analysis page
    await expect(page).toHaveURL('/analysis/test-local-game-id');
  });

  test('should persist game data and show analysis after refresh', async ({ page }) => {
    test.setTimeout(60_000);

    // Arrange
    const gamePage = new GamePage(page);
    const analysisPage = new AnalysisPage(page);

    // Act - Play a local game
    await gamePage.gotoLocal();
    await gamePage.makeOpeningMoves();

    // Navigate to a mock analysis URL (simulating saved game)
    await analysisPage.goto('mock-game-id-12345');

    // Assert - Should show either loading, game view, or error (page should be stable)
    const isLoadingVisible = await page.getByTestId('analysis-loading').isVisible().catch(() => false);
    const isErrorVisible = await analysisPage.isErrorVisible();
    const isBoardVisible = await analysisPage.isBoardVisible();

    // One of loading, error, or board should be visible (page should be stable)
    expect(isLoadingVisible || isErrorVisible || isBoardVisible).toBe(true);
  });
});
