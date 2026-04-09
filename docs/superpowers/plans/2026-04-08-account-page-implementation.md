# Account Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the account page into a profile-first player hub, fix the incorrect About navigation highlight, and preserve existing account and puzzle-progress behavior.

**Architecture:** Keep the current account data flow and auth hooks unchanged, but refactor the presentation around a dominant profile/setup hero with supporting stats and training sections. Adjust the header API so it can render the public navigation without forcing any tab to appear active on the account route.

**Tech Stack:** React 19, TypeScript, React Router, Vite, Vitest, Testing Library, existing Tailwind utility styling

---

## File Map

- Modify: `client/src/components/AccountPage.tsx`
  Purpose: replace the current card-heavy layout with the Rally Board design and pass a neutral nav state to the header.
- Modify: `client/src/components/Header.tsx`
  Purpose: allow the public navigation to render with no highlighted item.
- Modify: `client/src/test/AccountPage.test.tsx`
  Purpose: lock in the new structure and the corrected header active-state behavior.
- Optional modify: `client/src/lib/i18n.full.tsx`
  Purpose: add small supporting copy only if the new profile hero needs new strings.
- Optional modify: `client/src/lib/i18n.th.ts`
  Purpose: mirror any new copy added to the full translations.

### Task 1: Lock Header Behavior

**Files:**
- Modify: `client/src/components/Header.tsx`
- Test: `client/src/test/AccountPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Add an assertion to the existing `Header` mock in `client/src/test/AccountPage.test.tsx` so the test can verify the `active` prop is `null` instead of `"about"`.

```tsx
const headerPropsSpy = vi.fn();

vi.mock('../components/Header', () => ({
  default: (props: { children?: ReactNode; active?: string | null }) => {
    headerPropsSpy(props);
    return <div data-testid="header">{props.children}</div>;
  },
}));
```

Then assert:

```tsx
expect(headerPropsSpy).toHaveBeenCalledWith(
  expect.objectContaining({ active: null }),
);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run --workspace=client -- src/test/AccountPage.test.tsx
```

Expected: FAIL because `AccountPage` still renders `Header active="about"`.

- [ ] **Step 3: Write minimal implementation**

Update `client/src/components/Header.tsx` to allow `active` to be `null`:

```tsx
interface HeaderProps {
  active?: 'play' | 'watch' | 'lessons' | 'puzzles' | 'games' | 'about' | null;
  subtitle?: string;
  right?: React.ReactNode;
}
```

Keep the nav visible when `active` is `null` by leaving the existing `active !== undefined` checks in place.

Update `client/src/components/AccountPage.tsx` to render:

```tsx
<Header active={null} />
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test:run --workspace=client -- src/test/AccountPage.test.tsx
```

Expected: PASS for the new header-state assertion.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Header.tsx client/src/components/AccountPage.tsx client/src/test/AccountPage.test.tsx
git commit -m "fix: remove about nav highlight from account page"
```

### Task 2: Redesign The Account Hero And Stats

**Files:**
- Modify: `client/src/components/AccountPage.tsx`
- Test: `client/src/test/AccountPage.test.tsx`
- Optional modify: `client/src/lib/i18n.full.tsx`
- Optional modify: `client/src/lib/i18n.th.ts`

- [ ] **Step 1: Write the failing test**

Add test assertions for the new hero-first hierarchy in `client/src/test/AccountPage.test.tsx`:

```tsx
expect(screen.getByText('account.title')).toBeInTheDocument();
expect(screen.getByText('player@example.com')).toBeInTheDocument();
expect(screen.getByText('account.save_profile')).toBeInTheDocument();
expect(screen.getByText('account.rating')).toBeInTheDocument();
expect(screen.getByText('account.rated_games')).toBeInTheDocument();
```

Add a new assertion for the primary account hero prompt if new copy is introduced, for example:

```tsx
expect(screen.getByText('account.username')).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run --workspace=client -- src/test/AccountPage.test.tsx
```

Expected: FAIL once the new structure-specific expectations are added.

- [ ] **Step 3: Write minimal implementation**

Refactor the top half of `client/src/components/AccountPage.tsx` into a Rally Board layout:

```tsx
<div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.85fr)]">
  <section className="rounded-[2rem] border border-surface-hover/60 bg-surface-alt/80 p-6 sm:p-8">
    {/* account hero */}
    {/* restriction banner */}
    {/* compact stats strip */}
    {/* username form */}
    {/* secondary actions */}
  </section>
  <aside className="grid gap-5 content-start">
    {/* puzzle summary */}
    {/* next training move */}
    {/* recent puzzle activity */}
  </aside>
</div>
```

Keep the hero profile-first:

```tsx
<div className="flex flex-wrap items-start justify-between gap-4">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-light">{t('auth.sign_in')}</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-bright">{t('account.title')}</h1>
    <p className="mt-2 text-sm text-text-dim">{user.email}</p>
  </div>
  <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
    {user.role}
  </span>
</div>
```

Move stats into a tighter summary grid and keep the username form visually dominant with a larger save button.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test:run --workspace=client -- src/test/AccountPage.test.tsx
```

Expected: PASS with the redesigned structure still rendering the user and stats correctly.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AccountPage.tsx client/src/test/AccountPage.test.tsx client/src/lib/i18n.full.tsx client/src/lib/i18n.th.ts
git commit -m "feat: redesign account profile hero"
```

### Task 3: Reframe Puzzle Progress As The Next Move

**Files:**
- Modify: `client/src/components/AccountPage.tsx`
- Test: `client/src/test/AccountPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Add assertions that keep the puzzle area anchored to the account page after the redesign:

```tsx
expect(screen.getByText('account.puzzle_title')).toBeInTheDocument();
expect(screen.getByText('account.puzzle_last_played_label')).toBeInTheDocument();
expect(screen.getAllByText('#5001 · Trapped Knight').length).toBeGreaterThan(0);
expect(screen.getByRole('button', { name: 'account.puzzle_continue' })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run --workspace=client -- src/test/AccountPage.test.tsx
```

Expected: FAIL if the redesign temporarily removes or renames these puzzle sections.

- [ ] **Step 3: Write minimal implementation**

Restructure the right-side puzzle area in `client/src/components/AccountPage.tsx` into:

```tsx
<aside className="grid gap-5 content-start">
  <section>{/* puzzle summary chips */}</section>
  <section>{/* next training move card with continue CTA */}</section>
  <section>{/* last played and recent solves */}</section>
</aside>
```

Style the “next move” card as the primary supporting card:

```tsx
<div className="rounded-[1.75rem] border border-primary/20 bg-primary/10 p-5">
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">{t('account.puzzle_next_label')}</p>
  {/* title, description, chips, CTA */}
</div>
```

Keep navigation behavior unchanged:

```tsx
navigate(puzzleRoute(String(continuePuzzle.id)));
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test:run --workspace=client -- src/test/AccountPage.test.tsx
```

Expected: PASS with puzzle continuation and recent activity intact.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/AccountPage.tsx client/src/test/AccountPage.test.tsx
git commit -m "feat: reframe account puzzle progress as next move"
```

### Task 4: Verify Focused Account And Login UI Regressions

**Files:**
- Test: `client/src/test/AccountPage.test.tsx`
- Test: `client/src/test/AuthProvider.test.tsx`
- Test: `client/src/test/LoginPage.test.tsx`

- [ ] **Step 1: Run focused client tests**

Run:

```bash
npm run test:run --workspace=client -- src/test/AccountPage.test.tsx src/test/AuthProvider.test.tsx src/test/LoginPage.test.tsx
```

Expected: PASS

- [ ] **Step 2: Run full build**

Run:

```bash
npm run build
```

Expected: PASS for both client and server builds

- [ ] **Step 3: Commit**

```bash
git add client/src/components/AccountPage.tsx client/src/components/Header.tsx client/src/test/AccountPage.test.tsx client/src/test/AuthProvider.test.tsx client/src/test/LoginPage.test.tsx client/src/lib/i18n.full.tsx client/src/lib/i18n.th.ts
git commit -m "feat: polish account dashboard layout"
```

## Self-Review

- Spec coverage: the plan covers the header active-state fix, the profile-first layout, the puzzle-progress reframing, and verification.
- Placeholder scan: no `TODO`, `TBD`, or “add tests” placeholders remain.
- Type consistency: `Header.active` is explicitly widened to include `null`, and all account route references use that same shape.
