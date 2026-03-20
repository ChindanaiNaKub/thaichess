# Feature Research: Testing & CI/CD for Open Source React Game

**Domain:** Open Source React Game Testing Infrastructure
**Researched:** 2026-03-20
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features contributors assume exist. Missing these = project feels unmaintained or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Unit tests for core game logic | Business rules must be verified | MEDIUM | Move validation, check detection, special rules like Pawn promotion and piece counting |
| Component tests for UI | React components need verification | MEDIUM | Board rendering, piece movement, modals, game state display |
| CI/CD pipeline on PR | Standard for open source projects | MEDIUM | GitHub Actions runs tests automatically, prevents broken merges |
| Coverage reporting | Contributors need visibility | LOW | HTML report + console summary, shows what's tested |
| Pre-commit hooks (optional but expected) | Catch issues before push | LOW | Run linting and tests on changed files |
| Test documentation | CONTRIBUTING.md explains how to test | LOW | Run commands, test patterns, what to test |
| Accessibility tests | Modern React standard | LOW | jest-axe for ARIA compliance, keyboard navigation |
| E2E tests for critical paths | Full user workflows | HIGH | Local game, online matchmaking, game completion |
| Error boundary tests | Production safety net | LOW | Verify graceful failure handling |

### Differentiators (Competitive Advantage)

Features that set this project apart from typical open source game projects.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 90%+ coverage threshold | Signals serious commitment to quality | HIGH | Most projects settle for 70-80%; this attracts serious contributors |
| Regression test suite for known bugs | Prevents recurring issues | MEDIUM | Document each bug with test, add to regression suite |
| Visual regression tests | Catches UI changes not caught by functional tests | HIGH | Playwright screenshots compare against baselines |
| Performance benchmarks | Ensures refactors don't degrade speed | MEDIUM | Benchmark critical paths (move generation, render performance) |
| Mutation testing | Validates test quality, not just coverage | HIGH | Checks if tests actually catch bugs (stryker-js) |
| Test-driven development examples | Shows contributors how to work TDD | LOW | Example PRs with tests written first |
| Game engine test fixtures | Reusable test data for contributors | LOW | Board states, move scenarios, edge cases documented |
| Comprehensive game rule coverage | Makruk has special rules unfamiliar to many | MEDIUM | Bia-or (Met rule), piece promotion, board counting |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Testing implementation details | Feels thorough | Tests break on refactors, create maintenance burden | Test user behavior and outcomes |
| 100% coverage requirement | Sounds like "perfect" quality | Diminishing returns, tests meaningless code, discourages contributions | Aim for 90% on core logic, 70-80% overall |
| Snapshot testing for UI | Easy to write | Fragile, fails on styling changes, low signal | Test accessibility and interaction instead |
| Mocking everything | Fast, isolated tests | Tests pass but code doesn't work, false confidence | Mock only external dependencies |
| Flaky E2E tests | Comprehensive coverage | Unreliable CI, ignored failures, team learns to distrust tests | Keep E2E focused on critical paths only |
| Premature optimization of test speed | Faster CI | Complex test setup, harder to maintain | Optimize only when CI becomes bottleneck |
| Testing private methods | Feels complete | Couples tests to implementation, prevents refactoring | Test public interface only |

## Feature Dependencies

```
[Component Tests]
    ├──requires──> [Unit Tests] (game logic must work before UI can be tested)
    └──enhances──> [E2E Tests] (component tests catch issues faster than E2E)

[CI/CD Pipeline]
    ├──requires──> [Unit Tests] (need tests to run)
    ├──requires──> [Component Tests]
    └──requires──> [Coverage Thresholds] (need coverage to enforce)

[Coverage Thresholds]
    ├──requires──> [Unit Tests]
    ├──requires──> [Component Tests]
    └──enhances──> [CI/CD Pipeline] (quality gates)

[Regression Test Suite]
    ├──enhances──> [Unit Tests] (adds bug-specific tests)
    └──enhances──> [Component Tests]

[Accessibility Tests]
    └──requires──> [Component Tests] (uses same testing-library infrastructure)

[Visual Regression Tests]
    ├──requires──> [E2E Tests] (uses Playwright infrastructure)
    └──conflicts──> [Frequent UI Changes] (creates noise during active development)

[Mutation Testing]
    └──requires──> [Coverage Thresholds] (only valuable after baseline coverage)
```

### Dependency Notes

- **Unit Tests required for Component Tests:** Game engine functions (move validation, check detection) must work before UI can meaningfully render and test interactions
- **CI/CD Pipeline requires Tests:** Cannot enforce quality gates without tests to run
- **Coverage Thresholds enhance CI:** Turn CI from "run tests" to "enforce standards"
- **Visual Regression conflicts with active UI development:** During piece style development, visual tests create noise; defer until UI stabilizes
- **Mutation testing requires coverage baseline:** Only meaningful after achieving 80%+ coverage; validates tests aren't just passing without catching bugs

## MVP Definition

### Launch With (v1)

Minimum viable testing infrastructure — what's needed to establish quality standards.

- [ ] **Unit tests for game engine** — Core business rules, move validation, check detection, special rules (Bia-or, piece counting)
- [ ] **Component tests for Board component** — Most complex UI component, critical for gameplay
- [ ] **Component tests for GamePage** — Main game interface, turn management, check indicators
- [ ] **GitHub Actions CI on PR** — Run tests automatically, block merge on failure
- [ ] **Coverage reporting** — Show coverage in PR comments, set visible baseline
- [ ] **CONTRIBUTING.md testing section** — How to run tests, what to test, patterns to follow
- [ ] **Regression test for infinite re-render bug** — Document known issue, prevent recurrence
- [ ] **Accessibility tests** — jest-axe integration, baseline ARIA compliance

### Add After Validation (v1.x)

Features to add once baseline testing is working and contributors are engaging.

- [ ] **Coverage thresholds in CI** — Block PR if coverage drops below 80% (global) or 70% (per file)
- [ ] **Component tests for all remaining components** — Modals, preferences, navigation
- [ ] **Custom hook tests** — useGameSocket, useGameInteraction, useGameState
- [ ] **E2E tests for critical user journeys** — Local game creation, move sequence, game completion
- [ ] **Server/API tests** — Socket handlers, game endpoints, database operations
- [ ] **Test fixtures library** — Reusable board states, game scenarios for contributors
- [ ] **Performance benchmarks** — Engine move generation, render performance

### Future Consideration (v2+)

Features to defer until project has established contributor base and stable patterns.

- [ ] **Visual regression testing** — Piece style rendering, board layout changes
- [ ] **Mutation testing** — Validate test quality with stryker-js
- [ ] **Comprehensive E2E coverage** — Full user journeys, edge cases, error states
- [ ] **Load testing** — WebSocket connection limits, concurrent game handling
- [ ] **Test analytics** — Coverage trends, flaky test detection, test runtime optimization

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Unit tests for game engine | HIGH | MEDIUM | P1 |
| Component tests for Board | HIGH | MEDIUM | P1 |
| GitHub Actions CI on PR | HIGH | MEDIUM | P1 |
| CONTRIBUTING.md testing section | HIGH | LOW | P1 |
| Regression test for infinite re-render | HIGH | LOW | P1 |
| Accessibility tests | MEDIUM | LOW | P1 |
| Coverage thresholds | HIGH | LOW | P2 |
| Component tests for all components | MEDIUM | MEDIUM | P2 |
| Custom hook tests | MEDIUM | MEDIUM | P2 |
| E2E tests for critical paths | MEDIUM | HIGH | P2 |
| Server/API tests | MEDIUM | HIGH | P2 |
| Test fixtures library | MEDIUM | LOW | P3 |
| Performance benchmarks | LOW | MEDIUM | P3 |
| Visual regression testing | LOW | HIGH | P3 |
| Mutation testing | LOW | HIGH | P3 |

**Priority key:**
- **P1: Must have for launch** — Establishes baseline quality standards
- **P2: Should have, add when possible** — Expands coverage, prevents regressions
- **P3: Nice to have, future consideration** — Optimizations and advanced quality checks

## Competitor Feature Analysis

Analysis of successful open source React projects and their testing approaches.

| Feature | React (Facebook) | Lichess | Testing-Library Philosophy | Our Approach |
|---------|------------------|---------|---------------------------|--------------|
| Test framework | Jest (custom) | ScalaTest | Vitest/Jest agnostic | Vitest (already configured) |
| Coverage threshold | Not enforced | Unknown | Not specified | Enforce 80% global, 70% per file |
| Testing philosophy | Implementation details + behavior | Behavior-focused | **"The more your tests resemble the way your software is used, the more confidence they can give you"** | Follow Testing-Library guidance |
| E2E tests | Limited | Unknown | "Avoid E2E tests when faster tests will do" | E2E only for critical paths |
| Accessibility | Axe integration | High priority | Core concern (jest-axe) | jest-axe for all components |
| CI requirements | Required | Required | Essential for open source | GitHub Actions on all PRs |

**Key insight from Testing-Library philosophy (Kent C. Dodds):**
> "The more your tests resemble the way your software is used, the more confidence they can give you." — This means testing user behavior (clicks, keyboard input, screen output) rather than implementation details (internal state, function calls).

## Coverage Standards Research

Industry benchmarks from successful open source projects:

| Metric | Minimum | Good | Excellent | Notes |
|--------|---------|------|-----------|-------|
| Overall coverage | 60-70% | 70-80% | 85-90%+ | Diminishing returns above 90% |
| Critical path coverage | 80%+ | 90%+ | 95%+ | Game engine, Board component |
| Per-file threshold | None | 60% | 70%+ | Prevents new files without tests |

**Recommended for this project:**
- Global: 80% coverage threshold (blocks PR if below)
- Per-file: 70% threshold (prevents untested new files)
- Critical paths: 90%+ target (engine, Board, GamePage)

## Testing Patterns to Follow

Based on React Testing Library best practices:

1. **Test user behavior, not implementation:**
   ```typescript
   // Good: Tests what user sees and does
   test('player can move piece to valid square', () => {
     render(<Board {...props} />);
     const fromSquare = screen.getByRole('button', { name: /white pawn at a3/i });
     const toSquare = screen.getByRole('button', { name: /empty square a4/i });
     fireEvent.click(fromSquare);
     fireEvent.click(toSquare);
     expect(toSquare).toHaveAttribute('data-piece', 'pawn-white');
   });

   // Bad: Tests internal implementation
   test('movePiece is called with correct params', () => {
     const spy = vi.spyOn(game, 'movePiece');
     // ...test implementation details
   });
   ```

2. **Use screen queries over container:**
   ```typescript
   // Good: User-centered query
   const button = screen.getByRole('button', { name: /new game/i });

   // Avoid: Implementation-centric query
   const button = container.querySelector('.new-game-button');
   ```

3. **Avoid unnecessary cleanup:**
   - Testing Library's cleanup is automatic in modern versions
   - Don't add `afterEach(cleanup)` unless needed

4. **Mock only external dependencies:**
   - Don't mock the component you're testing
   - Don't mock React hooks
   - Mock APIs, browser APIs, third-party libraries

## Sources

- [React Testing Library - Introduction](https://testing-library.com/docs/react-testing-library/intro/) — HIGH confidence, official documentation
- [Vitest - Coverage Configuration](https://vitest.dev/guide/coverage.html) — HIGH confidence, official documentation
- [Kent C. Dodds - Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) — HIGH confidence, authoritative blog by RTL creator
- [React Contributing Guidelines](https://github.com/facebook/react/blob/main/CONTRIBUTING.md) — HIGH confidence, official repository
- [GitHub Actions Features](https://github.com/features/actions) — HIGH confidence, official documentation
- [Lichess Repository](https://github.com/ornicar/lila) — MEDIUM confidence, example open source chess platform (Scala, not React)

---

*Feature research for: Markruk Thai Testing Infrastructure*
*Researched: 2026-03-20*
