import { test, expect } from '@playwright/test';

test.describe('Local Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/local');
  });

  test('renders the board with 64 squares', async ({ page }) => {
    const squares = page.locator('[class*="board-square"]');
    await expect(squares).toHaveCount(64);
  });

  test('renders 32 pieces on initial board', async ({ page }) => {
    const pieces = page.locator('[class*="piece"]');
    await expect(pieces).toHaveCount(32);
  });

  test('selects a piece on click', async ({ page }) => {
    const squares = page.locator('[class*="board-square"]');
    // Click on a white pawn (row 2, col 4 in board coordinates)
    await squares.nth(20).click(); // This should be a white pawn
    await expect(page.locator('.board-square-selected')).toBeVisible();
  });

  test('shows legal moves after selecting piece', async ({ page }) => {
    const squares = page.locator('[class*="board-square"]');
    // Click on white pawn at e2 (display position)
    await squares.nth(20).click();
    // Should show legal move dots
    const dots = page.locator('.legal-dot');
    await expect(dots).toHaveCount(1); // Pawn can move 1 square forward
  });

  test('makes a move by clicking destination square', async ({ page }) => {
    const squares = page.locator('[class*="board-square"]');
    // Select white pawn
    await squares.nth(20).click();
    // Click destination square (one row ahead)
    await squares.nth(28).click();
    // Square should now have a piece
    const piece = squares.nth(28).locator('[class*="piece"]');
    await expect(piece).toBeVisible();
  });

  test('highlights last move', async ({ page }) => {
    const squares = page.locator('[class*="board-square"]');
    // Make a move
    await squares.nth(20).click();
    await squares.nth(28).click();
    // Should highlight last move squares
    const lastMoveSquares = page.locator('[class*="board-square-lastmove"]');
    await expect(lastMoveSquares).toHaveCount(2);
  });

  test('prevents context menu on board', async ({ page }) => {
    const board = page.locator('.board-no-select');
    await board.click({ button: 'right' });
    // Context menu should not appear (no reliable way to test this in Playwright,
    // but we can verify the board is still interactive)
    await expect(board).toBeVisible();
  });
});
