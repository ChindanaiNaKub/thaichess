import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Game pages (BotGame and LocalGame)
 * Encapsulates common game interactions for E2E tests
 */
export class GamePage {
  readonly page: Page;
  readonly board: Locator;

  constructor(page: Page) {
    this.page = page;
    this.board = page.getByTestId('board');
  }

  /**
   * Navigate to local game page
   */
  async gotoLocal(): Promise<void> {
    await this.page.goto('/local', { waitUntil: 'domcontentloaded' });
    await this.waitForBoard();
  }

  /**
   * Navigate to bot game page
   */
  async gotoBot(): Promise<void> {
    await this.page.goto('/bot', { waitUntil: 'domcontentloaded' });
    // Wait for bot selection screen - look for "Play vs Computer" text
    await this.page.waitForSelector('text=Play vs Computer', { timeout: 10000 });
  }

  /**
   * Start a bot game with the default bot
   */
  async startBotGame(): Promise<void> {
    // Click the start game button on bot setup page
    const startButton = this.page.getByRole('button', { name: /start game/i });
    await startButton.click();
    await this.waitForBoard();
  }

  /**
   * Wait for the board to be visible
   */
  async waitForBoard(): Promise<void> {
    await this.board.waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Get a specific board square
   */
  getSquare(row: number, col: number): Locator {
    return this.page.getByTestId(`board-square-${row}-${col}`);
  }

  /**
   * Get a piece at a specific position
   */
  getPiece(row: number, col: number): Locator {
    return this.page.getByTestId(`board-piece-${row}-${col}`);
  }

  /**
   * Make a move by clicking from one square to another
   */
  async makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    const fromSquare = this.getSquare(fromRow, fromCol);
    const toSquare = this.getSquare(toRow, toCol);
    const movedPiece = this.getPiece(toRow, toCol);

    await fromSquare.click();
    await toSquare.click();
    await expect(movedPiece).toBeVisible();
  }

  /**
   * Make the first few moves to quickly get a game with history
   * White pawn: 2,4 -> 3,4
   * Black pawn: 7,1 -> 6,3
   */
  async makeOpeningMoves(): Promise<void> {
    // White pawn move (e2-e3 equivalent in Makruk)
    await this.makeMove(2, 4, 3, 4);

    // Black pawn move (b7-b5 equivalent in Makruk)
    await this.makeMove(7, 1, 6, 3);
  }

  /**
   * Click the Analyze Game button in the game over panel
   * Waits for the button to appear (game must be over or in review mode)
   */
  async clickAnalyzeGame(): Promise<void> {
    // First wait for the analyze button to appear with a longer timeout
    const analyzeButton = this.page.getByTestId('analyze-game-button');
    await analyzeButton.waitFor({ state: 'visible', timeout: 10000 });
    await analyzeButton.click();
  }

  /**
   * Check if the analyze button is visible
   */
  async isAnalyzeButtonVisible(): Promise<boolean> {
    const analyzeButton = this.page.getByTestId('analyze-game-button');
    return await analyzeButton.isVisible().catch(() => false);
  }

  /**
   * Check if the game over panel is visible
   */
  async isGameOverVisible(): Promise<boolean> {
    const analyzeButton = this.page.getByTestId('analyze-game-button');
    return await analyzeButton.isVisible().catch(() => false);
  }
}
