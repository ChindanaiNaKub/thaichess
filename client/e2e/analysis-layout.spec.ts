import { test, expect, type Page } from '@playwright/test';

interface TestMove {
  from: { row: number; col: number };
  to: { row: number; col: number };
  captured: null;
}

function buildLongMoveList(plyCount: number): TestMove[] {
  return Array.from({ length: plyCount }, (_, index) => {
    const side = index % 2;
    const pair = Math.floor(index / 2);
    const fromRow = side === 0 ? 2 + (pair % 2) : 5 - (pair % 2);
    const toRow = side === 0 ? 3 + (pair % 2) : 4 - (pair % 2);
    const col = (pair + side) % 8;

    return {
      from: { row: fromRow, col },
      to: { row: toRow, col },
      captured: null,
    };
  });
}

function buildTwoMoveGame(): TestMove[] {
  return [
    { from: { row: 2, col: 0 }, to: { row: 3, col: 0 }, captured: null },
    { from: { row: 5, col: 0 }, to: { row: 4, col: 0 }, captured: null },
  ];
}

async function openInlineAnalysis(page: Page, moves: TestMove[], suffix: string): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const storageKey = `inline-analysis:e2e-${suffix}-${Date.now()}`;
  await page.evaluate(
    ({ key, moves: inlineMoves }) => {
      window.sessionStorage.setItem(key, JSON.stringify({
        source: 'local',
        moves: inlineMoves,
        result: 'unknown',
        reason: 'unknown',
      }));
    },
    { key: storageKey, moves },
  );

  await page.goto(`/analysis/local?payload=${encodeURIComponent(storageKey)}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('analysis-game-view')).toBeVisible();
}

async function activeMoveIsInsideMoveList(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const list = document.querySelector('[data-testid="analysis-move-list"]');
    const active = document.querySelector('.move-active');

    if (!(list instanceof HTMLElement) || !(active instanceof HTMLElement)) {
      return false;
    }

    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    return activeRect.top >= listRect.top && activeRect.bottom <= listRect.bottom;
  });
}

async function activeMoveText(page: Page): Promise<string | null> {
  return await page.evaluate(() => document.querySelector('.move-active')?.textContent?.trim() ?? null);
}

test.describe('Analysis Page Layout', () => {
  test('keeps the selected move and analysis controls visible while navigating', async ({ page }) => {
    await page.setViewportSize({ width: 1454, height: 768 });
    await openInlineAnalysis(page, buildLongMoveList(40), 'layout');
    await expect(page.getByTestId('analysis-enter-analysis')).toBeInViewport();

    await page.getByTestId('analysis-enter-analysis').focus();
    const latestMoveText = await activeMoveText(page);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => activeMoveText(page)).not.toBe(latestMoveText);

    await page.keyboard.press('Home');
    for (let i = 0; i < 26; i += 1) {
      await page.keyboard.press('ArrowRight');
    }

    await expect.poll(() => activeMoveIsInsideMoveList(page)).toBe(true);
    await expect(page.getByTestId('analysis-enter-analysis')).toBeInViewport();

    await page.keyboard.press('End');
    await expect.poll(() => activeMoveIsInsideMoveList(page)).toBe(true);
    await expect(page.getByTestId('analysis-enter-analysis')).toBeInViewport();
  });

  test('supports keyboard navigation inside an analysis branch', async ({ page }) => {
    await page.setViewportSize({ width: 1454, height: 768 });
    await openInlineAnalysis(page, buildTwoMoveGame(), 'branch-keyboard');

    await page.keyboard.press('ArrowLeft');
    await page.getByTestId('analysis-enter-analysis').click();

    const analysisRootText = await activeMoveText(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => activeMoveText(page)).not.toBe(analysisRootText);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => activeMoveText(page)).toBe(analysisRootText);

    await page.getByTestId('board-square-5-1').click();
    await page.getByTestId('board-square-4-1').click();
    await expect(page.getByTestId('analysis-active-variation-move')).toBeVisible();
    await expect(page.getByTestId('analysis-variation-line')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('analysis-active-variation-move')).toBeHidden();
    await expect(page.getByTestId('analysis-variation-line')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('analysis-active-variation-move')).toBeVisible();

    await page.getByTestId('analysis-main-move-1').click();
    await expect(page.getByTestId('analysis-active-variation-move')).toBeHidden();
    await expect(page.getByTestId('analysis-variation-line')).toBeVisible();
  });
});
