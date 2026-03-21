import { test, expect } from '@playwright/test';

test.describe('Local Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/local');
  });

  test('renders the board with 64 squares', async ({ page }) => {
    const squares = page.locator('[data-testid^="board-square-"]');
    await expect(squares).toHaveCount(64);
  });

  test('renders 32 pieces on initial board', async ({ page }) => {
    const pieces = page.locator('[data-testid^="board-piece-"]');
    await expect(pieces).toHaveCount(32);
  });

  test('selects a piece on click', async ({ page }) => {
    const sourceSquare = page.getByTestId('board-square-2-4');

    await sourceSquare.click();

    await expect(sourceSquare).toHaveClass(/board-square-selected/);
  });

  test('shows legal moves after selecting piece', async ({ page }) => {
    const sourceSquare = page.getByTestId('board-square-2-4');
    const destinationSquare = page.getByTestId('board-square-3-4');

    await sourceSquare.click();

    await expect(destinationSquare.locator('.legal-dot')).toHaveCount(1);
  });

  test('makes a move by clicking destination square', async ({ page }) => {
    const sourceSquare = page.getByTestId('board-square-2-4');
    const destinationSquare = page.getByTestId('board-square-3-4');

    await sourceSquare.click();
    await destinationSquare.click();

    await expect(page.getByTestId('board-piece-3-4')).toBeVisible();
    await expect(page.locator('[data-testid^="board-piece-"]')).toHaveCount(32);
  });

  test('highlights last move', async ({ page }) => {
    const sourceSquare = page.getByTestId('board-square-2-4');
    const destinationSquare = page.getByTestId('board-square-3-4');

    await sourceSquare.click();
    await destinationSquare.click();

    await expect(sourceSquare).toHaveClass(/board-square-lastmove/);
    await expect(destinationSquare).toHaveClass(/board-square-lastmove/);
  });

  test('prevents context menu on board', async ({ page }) => {
    const board = page.getByTestId('board');
    await board.click({ button: 'right' });
    await expect(board).toBeVisible();
  });
});
