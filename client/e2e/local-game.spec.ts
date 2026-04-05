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

  test('keeps the page anchored while move history auto-scrolls on tablet layouts', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    const initialScrollY = await page.evaluate(() => window.scrollY);
    const initialBoardTop = await page.getByTestId('board').evaluate((element) => element.getBoundingClientRect().top);

    const repeatableMoves = [
      { from: 'board-square-0-1', to: 'board-square-1-3', piece: 'board-piece-1-3' },
      { from: 'board-square-7-1', to: 'board-square-6-3', piece: 'board-piece-6-3' },
      { from: 'board-square-1-3', to: 'board-square-0-1', piece: 'board-piece-0-1' },
      { from: 'board-square-6-3', to: 'board-square-7-1', piece: 'board-piece-7-1' },
    ];

    for (let cycle = 0; cycle < 8; cycle += 1) {
      for (const move of repeatableMoves) {
        const fromSquare = page.getByTestId(move.from);
        const toSquare = page.getByTestId(move.to);

        await fromSquare.click();
        await expect(fromSquare).toHaveClass(/board-square-selected/);
        await expect(toSquare.locator('.legal-dot, .legal-capture')).toHaveCount(1);
        await toSquare.click();
        await expect(page.getByTestId(move.piece)).toBeVisible();
        await expect(fromSquare).not.toHaveClass(/board-square-selected/);
      }
    }

    const scrollY = await page.evaluate(() => window.scrollY);
    const boardTop = await page.getByTestId('board').evaluate((element) => element.getBoundingClientRect().top);

    expect(scrollY).toBeLessThan(initialScrollY + 40);
    expect(Math.abs(boardTop - initialBoardTop)).toBeLessThan(40);
  });
});
