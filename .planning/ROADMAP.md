# Roadmap: Markruk Thai Testing Foundation

**Created:** 2026-03-20
**Granularity:** Coarse (3-5 broader phases)
**Coverage:** 33/33 requirements mapped ✓

## Phases

- [x] **Phase 1: Test Foundation** - Establish testing patterns, documentation, and regression prevention (completed 2026-03-20)
- [ ] **Phase 2: Game Engine Tests** - Comprehensive coverage of Makruk rules and move validation
- [ ] **Phase 3: Component & Server Tests** - UI layer testing and backend validation
- [ ] **Phase 4: CI/CD & Piece Styles** - Automated quality gates and visual customization

## Phase Details

### Phase 1: Test Foundation

**Goal:** Establish testing patterns and guardrails that prevent previously fixed bugs from recurring

**Depends on:** Nothing (first phase)

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04

**Success Criteria** (what must be TRUE):
1. ESLint react-hooks exhaustive-deps rule catches dependency issues before code merges
2. Contributors can reference CONTRIBUTING.md for Socket.IO cleanup patterns and testing guidelines
3. Regression test coverage exists for previously fixed high-risk bugs
4. Existing useEffect dependency risks are identified and resolved before merge

**Plans:** 2/2 plans complete
- [ ] [01-01-PLAN.md](.planning/phases/01-test-foundation/01-01-PLAN.md) — Configure ESLint with react-hooks exhaustive-deps rule
- [ ] [01-02-PLAN.md](.planning/phases/01-test-foundation/01-02-PLAN.md) — Create contributor documentation and regression test template

---

### Phase 2: Game Engine Tests

**Goal:** Achieve comprehensive test coverage of Makruk game rules and move validation logic

**Depends on:** Phase 1 (Test Foundation)

**Requirements:** ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, ENGINE-05, ENGINE-06, ENGINE-07

**Success Criteria** (what must be TRUE):
1. All Makruk piece movements (King, Queen, Rook, Bishop, Knight, Pawn) have validated test cases
2. Check, checkmate, and stalemate detection tests verify correct game end conditions
3. Makruk-specific rules (Bia-or promotion, piece counting) have comprehensive test coverage
4. Engine code maintains 90%+ test coverage threshold

**Plans:** TBD

---

### Phase 3: Component & Server Tests

**Goal:** Verify UI behavior and backend API correctness through comprehensive testing

**Depends on:** Phase 2 (Game Engine Tests)

**Requirements:** COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, SRV-01, SRV-02, SRV-03, SRV-04, SRV-05

**Success Criteria** (what must be TRUE):
1. Board and GamePage components render correctly with proper piece placement and turn management
2. Custom hooks (useGameSocket, useGameInteraction) have verified connection handling and cleanup
3. All modal components have tests for rendering and user interactions
4. Socket.IO handlers validate game state and enforce server-side move validation
5. Database operations persist and retrieve game data correctly
6. Accessibility tests verify ARIA compliance and keyboard navigation works

**Plans:** TBD

---

### Phase 4: CI/CD & Piece Styles

**Goal:** Automate quality enforcement and deliver piece style customization for users

**Depends on:** Phase 3 (Component & Server Tests)

**Requirements:** CI-01, CI-02, CI-03, CI-04, CI-05, STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05, STYLE-06

**Success Criteria** (what must be TRUE):
1. All pull requests run tests in CI with clear pass/fail reporting
2. Coverage reports are generated and visible in PR comments
3. Code cannot merge without meeting coverage thresholds (80% global, 70% per-file, 90% engine.ts)
4. Users can select piece styles from settings (Makruk native, Lichess-style, chess.com-style)
5. Piece style preview shows each set before selection
6. User's piece style preference persists across browser sessions

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Test Foundation | 2/2 | Complete   | 2026-03-20 |
| 2. Game Engine Tests | 0/1 | Not started | - |
| 3. Component & Server Tests | 0/2 | Not started | - |
| 4. CI/CD & Piece Styles | 0/2 | Not started | - |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| ENGINE-01 | Phase 2 | Pending |
| ENGINE-02 | Phase 2 | Pending |
| ENGINE-03 | Phase 2 | Pending |
| ENGINE-04 | Phase 2 | Pending |
| ENGINE-05 | Phase 2 | Pending |
| ENGINE-06 | Phase 2 | Pending |
| ENGINE-07 | Phase 2 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| COMP-05 | Phase 3 | Pending |
| COMP-06 | Phase 3 | Pending |
| SRV-01 | Phase 3 | Pending |
| SRV-02 | Phase 3 | Pending |
| SRV-03 | Phase 3 | Pending |
| SRV-04 | Phase 3 | Pending |
| SRV-05 | Phase 3 | Pending |
| CI-01 | Phase 4 | Pending |
| CI-02 | Phase 4 | Pending |
| CI-03 | Phase 4 | Pending |
| CI-04 | Phase 4 | Pending |
| CI-05 | Phase 4 | Pending |
| STYLE-01 | Phase 4 | Pending |
| STYLE-02 | Phase 4 | Pending |
| STYLE-03 | Phase 4 | Pending |
| STYLE-04 | Phase 4 | Pending |
| STYLE-05 | Phase 4 | Pending |
| STYLE-06 | Phase 4 | Pending |

**Coverage:** 33/33 requirements mapped ✓

---
*Last updated: 2026-03-20*
