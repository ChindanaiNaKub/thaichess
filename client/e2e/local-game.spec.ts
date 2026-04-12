import { test, expect } from '@playwright/test';

async function gotoLocalGame(page: import('@playwright/test').Page) {
  await page.goto('/local', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('board')).toBeVisible({ timeout: 30000 });
}

test.describe('Local Game', () => {
  test('renders the initial board and pieces', async ({ page }) => {
    await gotoLocalGame(page);

    await expect(page.locator('[data-testid^="board-square-"]')).toHaveCount(64);
    await expect(page.locator('[data-testid^="board-piece-"]')).toHaveCount(32);
  });

  test('supports selecting, previewing, moving, and highlighting a move', async ({ page }) => {
    await gotoLocalGame(page);

    const sourceSquare = page.getByTestId('board-square-2-4');
    const destinationSquare = page.getByTestId('board-square-3-4');

    await sourceSquare.click();
    await expect(sourceSquare).toHaveClass(/board-square-selected/);
    await expect(destinationSquare.locator('.legal-dot')).toHaveCount(1);

    await destinationSquare.click();

    await expect(page.getByTestId('board-piece-3-4')).toBeVisible();
    await expect(page.locator('[data-testid^="board-piece-"]')).toHaveCount(32);
    await expect(sourceSquare).toHaveClass(/board-square-lastmove/);
    await expect(destinationSquare).toHaveClass(/board-square-lastmove/);
  });

  test('prevents the board context menu', async ({ page }) => {
    await gotoLocalGame(page);

    const board = page.getByTestId('board');
    await board.click({ button: 'right' });
    await expect(board).toBeVisible();
  });

  test('keeps the page anchored while move history auto-scrolls on tablet layouts', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 820, height: 1180 });
    await gotoLocalGame(page);

    const initialScrollY = await page.evaluate(() => window.scrollY);
    const initialBoardTop = await page.getByTestId('board').evaluate((element) => element.getBoundingClientRect().top);

    const repeatableMoves = [
      { from: 'board-square-0-1', to: 'board-square-1-3', piece: 'board-piece-1-3' },
      { from: 'board-square-7-1', to: 'board-square-6-3', piece: 'board-piece-6-3' },
      { from: 'board-square-1-3', to: 'board-square-0-1', piece: 'board-piece-0-1' },
      { from: 'board-square-6-3', to: 'board-square-7-1', piece: 'board-piece-7-1' },
    ];

    for (let cycle = 0; cycle < 6; cycle += 1) {
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
