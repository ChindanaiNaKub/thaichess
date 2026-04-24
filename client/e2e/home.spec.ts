import { test, expect, type Page } from '@playwright/test';

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.locator('#main-content').getByRole('button', { name: /play now/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /play thai chess anytime/i })).toBeVisible();
}

test.describe('Homepage', () => {
  test('renders hero content and reveals the private game setup on demand', async ({ page }) => {
    await gotoHome(page);

    await expect(page).toHaveTitle(/ThaiChess/);

    const main = page.locator('#main-content');
    const createPrivateButton = main.getByRole('button', { name: /create a private game/i }).first();

    await expect(createPrivateButton).toBeVisible();
    await createPrivateButton.click();

    await expect(main.getByRole('heading', { name: /create a private game/i })).toBeVisible();
    await expect(main.getByRole('button', { name: /play with a friend/i })).toBeVisible();
    await expect(main.getByText(/^time control$/i)).toBeVisible();
  });

  test('navigates to quick play', async ({ page }) => {
    await gotoHome(page);

    await page.locator('#main-content').getByRole('button', { name: /play now/i }).click();
    await expect(page).toHaveURL('/quick-play');
    await expect(page.getByRole('heading', { name: /quick play/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/^time control$/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: /5\+0/i })).toBeVisible({ timeout: 30000 });
  });

  test('navigates to puzzle streak', async ({ page }) => {
    await gotoHome(page);

    await page.locator('#main-content').getByRole('button', { name: /puzzles tactical training/i }).click();
    await expect(page).toHaveURL('/puzzles/streak');
    await expect(page.getByRole('heading', { name: /puzzle streak/i })).toBeVisible({ timeout: 30000 });
  });

  test('keeps the puzzles dropdown open while moving to puzzle streak', async ({ page }) => {
    await gotoHome(page);

    const nav = page.getByRole('navigation');
    await nav.getByRole('button', { name: /^puzzles$/i }).hover();
    await expect(page.getByRole('button', { name: /^random puzzle$/i })).toBeVisible();

    await page.getByRole('button', { name: /^puzzle streak$/i }).click();
    await expect(page).toHaveURL('/puzzles/streak');
    await expect(page.getByRole('heading', { name: /puzzle streak/i })).toBeVisible({ timeout: 30000 });
  });

  test('navigates to local game', async ({ page }) => {
    await gotoHome(page);

    await page.locator('#main-content').getByRole('button', { name: /play locally/i }).click();
    await expect(page).toHaveURL(/\/local/);
    await expect(page.getByTestId('board')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid^="board-square-"]')).toHaveCount(64);
  });

  test('navigates to bot game', async ({ page }) => {
    await gotoHome(page);

    await page.locator('#main-content').getByRole('button', { name: /play vs bot/i }).click();
    await expect(page).toHaveURL('/bot');
    await expect(page.locator('[data-testid="start-game-button"]:visible').first()).toBeVisible({ timeout: 30000 });
  });
});
