import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Game pages (BotGame and LocalGame)
 * Encapsulates common game interactions for E2E tests
 */
export class GamePage {
  readonly page: Page;
  readonly board: Locator;
  readonly visibleStartBotButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.board = page.getByTestId('board');
    this.visibleStartBotButton = page.locator('[data-testid="start-game-button"]:visible').first();
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
    await this.visibleStartBotButton.waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Start a bot game with the default bot
   */
  async startBotGame(): Promise<void> {
    await this.visibleStartBotButton.click();
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
   * Prefer the weakest Learning-band bot when the roster is open.
   * Always target :visible controls — desktop and mobile duplicate the roster chrome.
   */
  async selectFastBot(): Promise<void> {
    await this.visibleStartBotButton.waitFor({ state: 'visible' });

    await this.page
      .getByRole('button', { name: /change opponent|เปลี่ยนคู่|bot\.change_opponent/i })
      .locator('visible=true')
      .first()
      .click();

    const showAll = this.page
      .getByRole('button', { name: /show all|ดูทั้งหมด|bot\.show_all_bots/i })
      .locator('visible=true')
      .first();
    if (await showAll.isVisible().catch(() => false)) {
      await showAll.click();
    }

    const learningTab = this.page
      .getByRole('tab', { name: /Learning|เรียนรู้|bot\.band_learning/i })
      .locator('visible=true')
      .first();
    if (await learningTab.isVisible().catch(() => false)) {
      await learningTab.click();
    }

    await this.page
      .getByRole('button', { name: /Saman Noi/i })
      .locator('visible=true')
      .first()
      .click();
  }

  /**
   * Wait until the player can move and no premove chip is shown.
   */
  async waitForPlayablePlayerTurn(timeout = 45_000): Promise<void> {
    await expect(this.page.getByTestId('game-status-row')).toContainText(/Your turn|ตาคุณ|bot\.your_turn/i, {
      timeout,
    });
    await expect(this.page.getByTestId('game-premove-chip')).toHaveCount(0);
  }

  /**
   * Read the numeric move count from the board chrome.
   */
  async getMoveCount(): Promise<number> {
    const text = await this.page.getByTestId('game-move-count').innerText();
    const match = text.match(/(\d+)\s*$/);
    return match ? Number(match[1]) : 0;
  }

  /**
   * Wait until move history length reaches at least `count`.
   */
  async waitForMoveCountAtLeast(count: number, timeout = 45_000): Promise<void> {
    await expect
      .poll(async () => this.getMoveCount(), { timeout })
      .toBeGreaterThanOrEqual(count);
  }
}
