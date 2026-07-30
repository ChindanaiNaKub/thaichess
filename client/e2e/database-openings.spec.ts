import { test, expect, type Page } from '@playwright/test';

async function mockDatabaseApis(page: Page) {
  await page.route('**/api/games/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        games: [
          {
            id: 'game-e2e-1',
            white_name: 'Alice',
            black_name: 'Bob',
            result: 'white',
            result_reason: 'checkmate',
            time_control_initial: 300,
            time_control_increment: 0,
            move_count: 42,
            finished_at: Math.floor(Date.now() / 1000) - 120,
            rated: true,
            game_mode: 'quick_play',
            game_type: 'human',
            white_rating_before: 1200,
            black_rating_before: 1180,
            white_rating_after: 1210,
            black_rating_after: 1170,
          },
        ],
        total: 1,
        page: 0,
        limit: 20,
      }),
    });
  });

  await page.route('**/api/openings/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        positionHash: 'start',
        totalGames: 3,
        moves: [
          {
            moveUci: 'e2e3',
            totalGames: 3,
            whiteWins: 1,
            blackWins: 1,
            draws: 1,
            avgWhiteRating: 1200,
            avgBlackRating: 1190,
          },
        ],
      }),
    });
  });

  await page.route('**/api/openings/games**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        games: [],
        total: 0,
        page: 0,
        limit: 10,
        position: 'start',
        move: null,
      }),
    });
  });
}

test.describe('Game Database and Opening Explorer', () => {
  test('loads the game database page and submits search', async ({ page }) => {
    await mockDatabaseApis(page);
    await page.goto('/database', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { name: /game database/i })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    await page.getByLabel(/player/i).fill('Alice');
    await page.getByRole('button', { name: /^search$/i }).click();

    await expect(page.getByRole('table', { name: /game database search results/i })).toBeVisible();
    await expect(page.getByText(/Alice \(1200\) vs Bob \(1180\)/i)).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /players/i })).toBeVisible();
  });

  test('loads the opening explorer with board and move stats', async ({ page }) => {
    await mockDatabaseApis(page);
    await page.goto('/openings', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { name: /opening explorer/i })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.getByTestId('board')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid^="board-square-"]')).toHaveCount(64);
    await expect(page.getByRole('heading', { name: /move statistics/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /e2e3/i })).toBeVisible();
  });
});
