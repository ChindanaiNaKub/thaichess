import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Analysis page
 * Encapsulates analysis page interactions for E2E tests
 */
export class AnalysisPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate directly to an analysis URL and wait for page to settle
   */
  async goto(gameId: string): Promise<void> {
    await this.page.goto(`/analysis/${gameId}`, { waitUntil: 'domcontentloaded' });
    // Wait for page to settle (either loading, error, or game view)
    await this.page.waitForSelector('[data-testid="analysis-loading"], [data-testid="analysis-error"], [data-testid="analysis-game-view"]', { timeout: 30000 });
    // Give a small delay for React to render
    await this.page.waitForTimeout(100);
  }

  /**
   * Wait for the analysis game view to be visible
   */
  async waitForGameView(): Promise<void> {
    await this.page.getByTestId('analysis-game-view').waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Wait for the loading state
   */
  async waitForLoading(): Promise<void> {
    await this.page.getByTestId('analysis-loading').waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Check if error state is visible
   */
  async isErrorVisible(): Promise<boolean> {
    const errorElement = this.page.getByTestId('analysis-error');
    return await errorElement.isVisible().catch(() => false);
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    const errorMessage = this.page.getByTestId('analysis-error-message');
    return (await errorMessage.textContent()) ?? '';
  }

  /**
   * Get the error title text
   */
  async getErrorTitle(): Promise<string> {
    const errorTitle = this.page.getByTestId('analysis-error-title');
    return (await errorTitle.textContent()) ?? '';
  }

  /**
   * Click the back home button on error state
   */
  async clickBackHome(): Promise<void> {
    const backButton = this.page.getByTestId('analysis-back-home');
    await backButton.click();
  }

  /**
   * Check if the board is visible (indicates successful load)
   */
  async isBoardVisible(): Promise<boolean> {
    const board = this.page.getByTestId('board');
    return await board.isVisible().catch(() => false);
  }

  /**
   * Refresh the page and wait for it to load
   */
  async refreshAndWait(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    // Wait for either game view or error state
    await this.page.waitForSelector('[data-testid="analysis-game-view"], [data-testid="analysis-error"]', { timeout: 30000 });
  }

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for analysis to complete (when the loading spinner disappears)
   */
  async waitForAnalysisComplete(): Promise<void> {
    // The loading state should disappear and be replaced by game view or error
    await this.page.waitForSelector('[data-testid="analysis-loading"]', { state: 'detached', timeout: 60000 });
  }
}
