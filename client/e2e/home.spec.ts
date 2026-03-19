import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/ThaiChess/);
    await expect(page.getByRole('heading', { name: /thai chess/i })).toBeVisible();
  });

  test('displays game mode options', async ({ page }) => {
    await expect(page.getByRole('button', { name: /quick play/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /play with friend/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /play vs bot/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /puzzles/i })).toBeVisible();
  });

  test('navigates to quick play', async ({ page }) => {
    await page.getByRole('button', { name: /quick play/i }).click();
    await expect(page).toHaveURL(/\/game\/[a-z0-9]+/);
    await expect(page.getByText(/waiting for opponent/i)).toBeVisible();
  });

  test('navigates to local game', async ({ page }) => {
    await page.getByRole('button', { name: /play with friend/i }).click();
    await expect(page).toHaveURL(/\/local/);
    await expect(page.locator('.board-square-light')).toHaveCount(32);
    await expect(page.locator('.board-square-dark')).toHaveCount(32);
  });

  test('navigates to bot game', async ({ page }) => {
    await page.getByRole('button', { name: /play vs bot/i }).click();
    await expect(page).toHaveURL('/bot');
  });

  test('navigates to puzzles', async ({ page }) => {
    await page.getByRole('button', { name: /puzzles/i }).click();
    await expect(page).toHaveURL(/\/puzzle/);
  });
});
