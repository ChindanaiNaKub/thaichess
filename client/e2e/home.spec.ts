import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('#main-content').getByRole('button', { name: /find opponent/i })).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('has correct title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/ThaiChess/);
    await expect(page.getByRole('heading', { name: /play makruk instantly/i })).toBeVisible();
  });

  test('reveals the private game setup on demand', async ({ page }) => {
    const main = page.locator('#main-content');
    const createPrivateButton = main.getByRole('button', { name: /create a private game/i });

    await expect(createPrivateButton).toBeVisible();
    await createPrivateButton.click();

    await expect(main.getByRole('heading', { name: /create a private game/i })).toBeVisible();
    await expect(main.getByRole('button', { name: /play with a friend/i })).toBeVisible();
    await expect(main.getByText(/^time control$/i)).toBeVisible();
  });

  test('navigates to quick play', async ({ page }) => {
    await page.locator('#main-content').getByRole('button', { name: /find opponent/i }).click();
    await expect(page).toHaveURL('/quick-play');
    await expect(page.getByRole('heading', { name: /quick play/i })).toBeVisible();
  });

  test('navigates to local game', async ({ page }) => {
    await page.locator('#main-content').getByRole('button', { name: /play locally/i }).click();
    await expect(page).toHaveURL(/\/local/);
    await expect(page.getByTestId('board')).toBeVisible();
    await expect(page.locator('[data-testid^="board-square-"]')).toHaveCount(64);
  });

  test('navigates to bot game', async ({ page }) => {
    await page.locator('#main-content').getByRole('button', { name: /play vs bot/i }).click();
    await expect(page).toHaveURL('/bot');
  });

  test('navigates to puzzles', async ({ page }) => {
    await page.locator('#main-content').getByRole('button', { name: /puzzles tactical training/i }).click();
    await expect(page).toHaveURL('/puzzles');
  });
});
