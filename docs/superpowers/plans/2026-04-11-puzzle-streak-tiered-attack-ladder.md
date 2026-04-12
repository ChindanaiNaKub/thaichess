# Puzzle Streak Tiered Attack Ladder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/puzzles` feel like a real Makruk attacking curriculum by selecting puzzles from the same level first, climbing from easier tactics to harder attacking ideas, and expanding the live pack toward forks, force-mate, and mate-preparation puzzles.

**Architecture:** Keep the existing editorial live-pool model, but add an explicit `streakTier` signal on shipped live puzzles and update the streak selector to choose by tier first, difficulty score second. Curate the live pack so it contains more attack-oriented ideas and fewer loose capture puzzles, then verify the selector and UI still work unchanged.

**Tech Stack:** TypeScript, React 19, Vitest, shared puzzle runtime data

---

## File Map

- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/shared/puzzles.ts`
  - Add the shared `PuzzleStreakTier` type and expose it on shipped puzzles.
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/shared/puzzleImportQueue.ts`
  - Add explicit `streakTier` metadata to live editorial overrides and manual live drafts.
  - Promote or demote specific live puzzles to create a more attack-oriented pool.
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/lib/puzzleStreak.ts`
  - Replace score-only streak selection with tier-first selection plus adjacent-tier fallback.
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/puzzleStreak.test.ts`
  - Add tier-based selection regression tests.
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/puzzleValidation.test.ts`
  - Update live-pool expectations and ensure attack-oriented coverage.
- Optional modify if needed: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/components/PuzzlePage.tsx`
  - Only if a tiny label or debug string must reflect tiered progression. Avoid UI churn otherwise.

## Task 1: Add Tier Metadata To Live Puzzles

**Files:**
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/shared/puzzles.ts`
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/shared/puzzleImportQueue.ts`
- Test: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/puzzleValidation.test.ts`

- [ ] **Step 1: Write the failing test for live-pool tier coverage**

```ts
it('ships an editorial live pool with explicit streak tiers and attack-oriented coverage', () => {
  expect(PUZZLES.every(puzzle => puzzle.streakTier)).toBe(true);
  expect(PUZZLES.some(puzzle => puzzle.streakTier === 'foundation')).toBe(true);
  expect(PUZZLES.some(puzzle => puzzle.streakTier === 'practical_attack')).toBe(true);
  expect(PUZZLES.some(puzzle => puzzle.streakTier === 'forcing_conversion')).toBe(true);
  expect(PUZZLES.some(puzzle => puzzle.streakTier === 'mate_pressure')).toBe(true);
  expect(PUZZLES.some(puzzle => puzzle.tags.includes('fork'))).toBe(true);
  expect(PUZZLES.some(puzzle => puzzle.tags.includes('mate-preparation'))).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run --workspace=client -- src/test/puzzleValidation.test.ts
```

Expected: FAIL because `streakTier` does not exist yet or because the live pool does not satisfy the new tier assertions.

- [ ] **Step 3: Add the shared type and puzzle field**

```ts
export type PuzzleStreakTier =
  | 'foundation'
  | 'practical_attack'
  | 'forcing_conversion'
  | 'mate_pressure';

export interface Puzzle {
  // ...
  streakTier: PuzzleStreakTier;
  // ...
}
```

- [ ] **Step 4: Add explicit tiers to live editorial drafts**

```ts
type EditorialLiveOverride = Pick<
  PuzzleCandidateDraft,
  'title' | 'description' | 'explanation' | 'source' | 'motif' | 'difficulty' | 'difficultyScore'
> & {
  tags: string[];
  streakTier: PuzzleStreakTier;
};

[9006, {
  // ...
  streakTier: 'foundation',
}],
[9008, {
  // ...
  streakTier: 'foundation',
}],
[9015, {
  // ...
  streakTier: 'forcing_conversion',
}],
[9100, {
  // ...
  streakTier: 'mate_pressure',
}],
```

- [ ] **Step 5: Thread the tier into finalized live puzzles**

```ts
const preparedDraft: PuzzleCandidateDraft = {
  ...draft,
  ...override,
  streakTier: override.streakTier,
  // ...
};
```

If `PuzzleCandidateDraft` does not already permit the property, extend the draft type in the smallest shared place that keeps compile-time safety.

- [ ] **Step 6: Re-run the live-pool validation test**

Run:

```bash
npm run test:run --workspace=client -- src/test/puzzleValidation.test.ts
```

Expected: PASS for the new tier-field assertions, or a smaller follow-up failure that now points at missing coverage rather than missing types.

- [ ] **Step 7: Commit**

```bash
git add shared/puzzles.ts shared/puzzleImportQueue.ts client/src/test/puzzleValidation.test.ts
git commit -m "feat: add streak tiers to live puzzles"
```

## Task 2: Rebalance The Live Pool Toward Attacking Ideas

**Files:**
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/shared/puzzleImportQueue.ts`
- Test: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/puzzleValidation.test.ts`

- [ ] **Step 1: Write the failing test for attack-first live-pool composition**

```ts
it('biases the shipped live pool toward forks, force-mate ideas, and mate preparation', () => {
  const liveTitles = PUZZLES.map(puzzle => puzzle.title);
  const liveTags = PUZZLES.flatMap(puzzle => puzzle.tags);

  expect(liveTags.filter(tag => tag === 'fork').length).toBeGreaterThanOrEqual(2);
  expect(liveTags.filter(tag => tag === 'mate-preparation').length).toBeGreaterThanOrEqual(2);
  expect(PUZZLES.some(puzzle => ['MateIn2', 'MateIn3', 'MatingNet'].includes(puzzle.theme))).toBe(true);
  expect(PUZZLES.every(puzzle => !liveTitles.includes('Take the Loose Knight, Keep the Initiative'))).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run --workspace=client -- src/test/puzzleValidation.test.ts
```

Expected: FAIL because the current live pack does not yet meet the new attack-heavy target.

- [ ] **Step 3: Promote stronger attack-oriented drafts into the live pack**

Promote only puzzles whose first move is human-plausible and attack-oriented. Prefer:

```ts
[someId, {
  // ...
  tags: ['editorial-live', 'reviewed-practical', 'fork', 'forcing-check'],
  streakTier: 'practical_attack',
}],
[someMatePrepId, {
  // ...
  tags: ['editorial-live', 'reviewed-practical', 'mate-preparation', 'mating-net'],
  streakTier: 'mate_pressure',
}],
```

Use existing candidate drafts where possible instead of inventing brand-new puzzles unless the current pool is too small.

- [ ] **Step 4: Demote remaining capture-only or non-practical live puzzles**

Remove `editorial-live` from any puzzle that still teaches a loose grab or non-forcing collection:

```ts
tags: ['reviewed-practical', 'hanging-piece', 'forcing-sequence'],
```

Do this only for puzzles that fail the current live-quality bar. Keep the draft in the import queue for future review; only remove it from the shipped pool.

- [ ] **Step 5: Re-run validation to confirm the new live-pool composition**

Run:

```bash
npm run test:run --workspace=client -- src/test/puzzleValidation.test.ts
```

Expected: PASS with updated live-pool counts and attack-oriented coverage.

- [ ] **Step 6: Commit**

```bash
git add shared/puzzleImportQueue.ts client/src/test/puzzleValidation.test.ts
git commit -m "feat: rebalance live puzzle pool toward attacks"
```

## Task 3: Make Streak Selection Tier-First

**Files:**
- Modify: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/lib/puzzleStreak.ts`
- Test: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/puzzleStreak.test.ts`

- [ ] **Step 1: Write the failing selector tests**

```ts
it('starts the streak from foundation puzzles', () => {
  const puzzle = selectNextStreakPuzzle({
    adaptiveDifficultyScore: 900,
    solvedCount: 0,
    recentPuzzleIds: [],
  });

  expect(puzzle.streakTier).toBe('foundation');
});

it('does not surface mate-pressure puzzles in the opening phase', () => {
  const seen = new Set(
    Array.from({ length: 8 }, (_, index) =>
      selectNextStreakPuzzle({
        adaptiveDifficultyScore: 980,
        solvedCount: index % 2,
        recentPuzzleIds: [],
      }).streakTier,
    ),
  );

  expect(seen.has('mate_pressure')).toBe(false);
});

it('opens mate-pressure puzzles in the late phase', () => {
  const puzzle = selectNextStreakPuzzle({
    adaptiveDifficultyScore: 1650,
    solvedCount: 10,
    recentPuzzleIds: [],
  });

  expect(['forcing_conversion', 'mate_pressure']).toContain(puzzle.streakTier);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run --workspace=client -- src/test/puzzleStreak.test.ts
```

Expected: FAIL because the selector still uses only difficulty score and recency.

- [ ] **Step 3: Add tier progression helpers**

```ts
function getPreferredStreakTier(solvedCount: number): Puzzle['streakTier'] {
  if (solvedCount >= 9) return 'mate_pressure';
  if (solvedCount >= 6) return 'forcing_conversion';
  if (solvedCount >= 3) return 'practical_attack';
  return 'foundation';
}

const STREAK_TIER_ORDER: Puzzle['streakTier'][] = [
  'foundation',
  'practical_attack',
  'forcing_conversion',
  'mate_pressure',
];
```

- [ ] **Step 4: Filter candidates by preferred tier first, adjacent tiers second**

```ts
function getTierWindow(preferredTier: Puzzle['streakTier']): Puzzle['streakTier'][] {
  const index = STREAK_TIER_ORDER.indexOf(preferredTier);
  return STREAK_TIER_ORDER.filter((_, currentIndex) => Math.abs(currentIndex - index) <= 1);
}

const preferredTier = getPreferredStreakTier(solvedCount);
const allowedTiers = getTierWindow(preferredTier);
const tierCandidates = candidates.filter(candidate => candidate.streakTier === preferredTier);
const fallbackCandidates = tierCandidates.length > 0
  ? tierCandidates
  : candidates.filter(candidate => allowedTiers.includes(candidate.streakTier));
```

- [ ] **Step 5: Keep score-matching inside the selected tier window**

```ts
const ranked = [...fallbackCandidates].sort((left, right) => {
  const leftTierPenalty = left.streakTier === preferredTier ? 0 : 120;
  const rightTierPenalty = right.streakTier === preferredTier ? 0 : 120;
  const leftScore = rankCandidate(left) + leftTierPenalty;
  const rightScore = rankCandidate(right) + rightTierPenalty;

  if (leftScore !== rightScore) return leftScore - rightScore;
  if (left.difficultyScore !== right.difficultyScore) return left.difficultyScore - right.difficultyScore;
  return left.id - right.id;
});
```

- [ ] **Step 6: Re-run the streak selector test file**

Run:

```bash
npm run test:run --workspace=client -- src/test/puzzleStreak.test.ts
```

Expected: PASS with the new progression behavior.

- [ ] **Step 7: Commit**

```bash
git add client/src/lib/puzzleStreak.ts client/src/test/puzzleStreak.test.ts
git commit -m "feat: make puzzle streak selection tier-based"
```

## Task 4: Verify `/puzzles` End-To-End Regressions

**Files:**
- Test: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/PuzzlePage.test.tsx`
- Test: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/PuzzleRoutes.test.tsx`
- Test: `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/test/FeedbackWidget.test.tsx`

- [ ] **Step 1: Run the targeted regression suite**

Run:

```bash
npm run test:run --workspace=client -- src/test/FeedbackWidget.test.tsx src/test/i18nCatalog.test.ts src/test/PuzzlePage.test.tsx src/test/puzzleStreak.test.ts src/test/puzzleValidation.test.ts src/test/PuzzleRoutes.test.tsx
```

Expected: PASS with all puzzle UI and selector regressions green.

- [ ] **Step 2: Run the client build**

Run:

```bash
npm run build --workspace=client
```

Expected: successful Vite production build with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/test/FeedbackWidget.test.tsx client/src/test/i18nCatalog.test.ts client/src/test/PuzzlePage.test.tsx client/src/test/PuzzleRoutes.test.tsx client/src/test/puzzleStreak.test.ts client/src/test/puzzleValidation.test.ts shared/puzzleImportQueue.ts shared/puzzles.ts client/src/lib/puzzleStreak.ts
git commit -m "feat: stage puzzle streak as an attack ladder"
```

## Task 5: Manual Local Review

**Files:**
- No code changes required unless issues are found.

- [ ] **Step 1: Run the app locally**

Run:

```bash
npm run dev
```

Expected: client and server start successfully for local review.

- [ ] **Step 2: Review the streak progression manually**

Check:

```text
1. Opening puzzles are simple pins/forks or direct attacking ideas.
2. Mid-run puzzles introduce stronger forcing conversions.
3. Late-run puzzles surface mate-preparation or force-mate ideas.
4. Removed loose-capture puzzles do not reappear.
5. The board layout and sidebar remain stable.
```

- [ ] **Step 3: Record any follow-up gaps**

If the live pack still feels too capture-heavy, create a follow-up note listing:

```text
- puzzle id
- why it feels non-practical
- whether to demote, rewrite, or replace
```

No code should be changed in this step unless a clearly scoped bug is discovered and handled as a separate task.

---

## Self-Review

- Spec coverage: This plan covers the approved tiered adaptive ladder, attack-oriented live-pool rebalance, and selector verification. It intentionally does not include screenshot/Facebook import workflow, because that is a separate subsystem with its own review and quarantine concerns.
- Placeholder scan: All tasks include concrete files, commands, and representative code. No TODO/TBD placeholders remain.
- Type consistency: The plan consistently uses `streakTier` and the four shared tier values across shared data and selector logic.

## Next Plan

After this plan is implemented, create a separate plan for:

- image-based manual puzzle intake
- screenshot-to-draft workflow
- quarantine-first review for Facebook puzzle imports

