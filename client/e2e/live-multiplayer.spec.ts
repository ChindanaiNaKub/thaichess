import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

async function waitForApiReady(page: Page) {
  await expect
    .poll(async () => {
      try {
        // Prefer IPv4 — Node may resolve `localhost` to ::1 while the server binds IPv4.
        const response = await page.request.get('http://127.0.0.1:3000/api/health');
        return response.ok();
      } catch {
        return false;
      }
    }, { timeout: 90_000 })
    .toBe(true);
}

async function createGuestPage(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

async function createPrivateGameAsWhite(page: Page): Promise<string> {
  await waitForApiReady(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const main = page.locator('#main-content');
  await expect(main.getByRole('button', { name: /choose mode/i })).toBeVisible();
  await main.getByRole('button', { name: /choose mode/i }).click();

  await expect(main.getByRole('heading', { name: /play a friend/i })).toBeVisible();
  await main.getByRole('button', { name: /^white$/i }).click();
  await main.getByRole('button', { name: /play with a friend/i }).click();

  await expect(main.getByRole('button', { name: /creating/i })).toBeVisible({ timeout: 10_000 });
  await page.waitForURL(/\/game\/[^/?#]+/, { timeout: 45_000 });
  await expect(page.getByRole('heading', { name: /waiting for opponent/i })).toBeVisible({ timeout: 30_000 });

  const match = page.url().match(/\/game\/([^/?#]+)/);
  expect(match?.[1]).toBeTruthy();
  return match![1];
}

async function expectLiveBoard(page: Page) {
  await expect(page.getByTestId('board')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-testid^="board-square-"]')).toHaveCount(64);
}

async function playWhiteOpeningPawn(page: Page) {
  const from = page.getByTestId('board-square-2-4');
  const to = page.getByTestId('board-square-3-4');
  await from.click();
  await expect(to.locator('.legal-dot, .legal-capture')).toHaveCount(1);
  await to.click();
  await expect(page.getByTestId('board-piece-3-4')).toBeVisible();
}

test.describe('Live multiplayer / watch smoke', () => {
  test('private game: two contexts join, move syncs, spectator watches, host reconnects', async ({ browser }) => {
    test.slow();

    const host = await createGuestPage(browser);
    const guest = await createGuestPage(browser);
    const spectator = await createGuestPage(browser);

    try {
      const gameId = await createPrivateGameAsWhite(host.page);
      const gameUrl = `/game/${gameId}`;

      await guest.page.goto(gameUrl, { waitUntil: 'domcontentloaded' });
      await expectLiveBoard(guest.page);
      await expectLiveBoard(host.page);

      await playWhiteOpeningPawn(host.page);
      await expect(guest.page.getByTestId('board-piece-3-4')).toBeVisible({ timeout: 15_000 });

      await spectator.page.goto(`/spectate/${gameId}`, { waitUntil: 'domcontentloaded' });
      await expectLiveBoard(spectator.page);
      await expect(spectator.page.getByTestId('board-piece-3-4')).toBeVisible({ timeout: 15_000 });

      // Same browser context keeps guest_* identity — reload should reclaim the seat.
      await host.page.reload({ waitUntil: 'domcontentloaded' });
      await expectLiveBoard(host.page);
      await expect(host.page.getByTestId('board-piece-3-4')).toBeVisible({ timeout: 15_000 });

      // Guest should still see the synced position after host reconnect.
      await expect(guest.page.getByTestId('board-piece-3-4')).toBeVisible();
    } finally {
      await Promise.all([
        host.context.close(),
        guest.context.close(),
        spectator.context.close(),
      ]);
    }
  });

  test('quick play: two seekers with the same time control are matched', async ({ browser }) => {
    test.slow();

    const seekerA = await createGuestPage(browser);
    const seekerB = await createGuestPage(browser);

    try {
      await waitForApiReady(seekerA.page);
      await seekerA.page.goto('/quick-play', { waitUntil: 'domcontentloaded' });
      await seekerB.page.goto('/quick-play', { waitUntil: 'domcontentloaded' });

      const findA = seekerA.page.getByRole('button', { name: /find opponent/i });
      const findB = seekerB.page.getByRole('button', { name: /find opponent/i });
      await expect(findA).toBeVisible({ timeout: 30_000 });
      await expect(findB).toBeVisible({ timeout: 30_000 });

      // Ensure both use default 5+0 (selected by default on Quick Play).
      await seekerA.page.getByRole('button', { name: /5\+0/i }).click();
      await seekerB.page.getByRole('button', { name: /5\+0/i }).click();

      await findA.click();
      await expect(seekerA.page.getByText(/searching for/i)).toBeVisible({ timeout: 15_000 });
      await findB.click();

      await Promise.all([
        seekerA.page.waitForURL(/\/game\/[^/?#]+/, { timeout: 45_000 }),
        seekerB.page.waitForURL(/\/game\/[^/?#]+/, { timeout: 45_000 }),
      ]);

      const gameIdA = seekerA.page.url().match(/\/game\/([^/?#]+)/)?.[1];
      const gameIdB = seekerB.page.url().match(/\/game\/([^/?#]+)/)?.[1];
      expect(gameIdA).toBeTruthy();
      expect(gameIdA).toBe(gameIdB);

      await expectLiveBoard(seekerA.page);
      await expectLiveBoard(seekerB.page);
    } finally {
      await Promise.all([seekerA.context.close(), seekerB.context.close()]);
    }
  });
});
