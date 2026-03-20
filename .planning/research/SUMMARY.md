# Research Summary: Markruk Thai Testing & CI/CD

**Domain:** Real-time multiplayer game testing (React/Socket.IO)
**Researched:** 2026-03-20
**Overall confidence:** MEDIUM

## Executive Summary

Markruk Thai is a free, open-source Thai chess platform following the lichess philosophy — no distractions, forever open source. The project uses React, TypeScript, Express, and Socket.IO for real-time multiplayer gameplay. The current research focused on testing and CI/CD pitfalls for a real-time game application.

The project previously had a **critical bug** — infinite re-render loops caused by useEffect dependency issues that made the UI completely unresponsive. The bug is fixed, but it remains the highest-priority regression risk to address in the test foundation phase. The codebase shows good patterns in some areas (useGameSocket.ts has proper socket cleanup) but risky patterns in others (multiple useEffect hooks in GamePage.tsx with potential dependency issues).

The testing infrastructure is well-established: Vitest for unit/component tests, Playwright for E2E, and testing-library for React components. However, test coverage is incomplete — the project needs comprehensive tests for the game engine (move validation, check detection, Makruk's special rules), components, custom hooks, and server/API endpoints.

**Key insight:** React/Socket.IO testing has specific pitfalls around cleanup, async timing, and implementation details that general testing advice doesn't cover. The project needs Socket.IO-specific test patterns to avoid memory leaks and flaky tests.

## Key Findings

**Stack:** React + TypeScript + Vite (frontend), Express + Socket.IO (backend), SQLite (storage), Vitest (unit tests), Playwright (E2E), GitHub Actions (CI/CD) — already established and working.

**Architecture:** Single Page App with shared TypeScript types between client and server, real-time gameplay via Socket.IO websockets, component-based React architecture with custom hooks for socket logic and game interaction.

**Critical pitfall:** useEffect dependency arrays causing infinite re-render loops (historical bug and current regression risk), Socket.IO memory leaks in tests due to missing cleanup, and testing implementation details instead of user behavior.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Test Foundation Phase** — Stabilize the codebase first
   - Addresses: ESLint react-hooks rules, regression coverage for the previously fixed infinite re-render bug, Socket.IO cleanup patterns, CI/CD pipeline
   - Avoids: Writing more code that inherits the same bugs
   - Success criteria: All ESLint warnings resolved, regression test prevents bug recurrence, tests run in <30 seconds locally

2. **Game Engine Testing Phase** — Test the core business logic
   - Addresses: Move validation, check detection, Makruk special rules (bench pieces, promotion)
   - Avoids: Building features on untested foundation
   - Success criteria: 90%+ coverage on engine.ts, all Makruk rules have tests

3. **Component Testing Phase** — Test UI layer
   - Addresses: Board, GamePage, modals, custom hooks (useGameSocket, useGameInteraction)
   - Avoids: Testing implementation details; refactor-resistant tests
   - Success criteria: All components have tests, refactoring doesn't break tests

4. **Server/API Testing Phase** — Test backend logic
   - Addresses: Socket handlers, game endpoints, database operations, server-side move validation
   - Avoids: Client-trusted state (security risk)
   - Success criteria: Server validates all moves, all socket handlers tested

5. **CI/CD & Quality Gates Phase** — Automate quality enforcement
   - Addresses: GitHub Actions pipeline, coverage thresholds, branch protection rules
   - Avoids: Merging code without quality checks
   - Success criteria: PRs blocked without passing tests, coverage report in PR comments

**Phase ordering rationale:**
- Foundation first — can't build reliable tests on unstable code
- Game engine before UI — business logic is the hardest to change later
- Components before server — UI tests are faster to write and debug
- CI/CD last — need tests in place before enforcing them

**Research flags for phases:**
- Phase 1 (Test Foundation): LOW research needed — standard React/Socket.IO patterns are well-documented
- Phase 2 (Game Engine): MEDIUM research needed — Makruk rules are specific; may need rule reference
- Phase 3 (Component Testing): LOW research needed — testing-library patterns are established
- Phase 4 (Server Testing): MEDIUM research needed — Socket.IO server testing patterns vary
- Phase 5 (CI/CD): LOW research needed — GitHub Actions has excellent documentation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing codebase analyzed; stack is proven and documented |
| Features | MEDIUM | Table stakes inferred from similar projects (lichess); Makruk rules may need verification |
| Architecture | HIGH | Codebase structure analyzed; patterns documented in TESTING.md |
| Pitfalls | HIGH | Based on official documentation (Kent C. Dodds, Socket.IO, Vitest, Playwright) and codebase analysis |

## Gaps to Address

- **Makruk rules verification:** While general move validation patterns are clear, specific Makruk rules (e.g., "bench" piece promotion, counting rules for bare kings) may need domain expert verification
- **Performance testing:** E2E performance under load not researched — recommend phase-specific research before launch
- **Mobile testing patterns:** Playwright mobile emulation documented but real device testing not covered
- **Accessibility standards:** Basic ARIA testing exists, but WCAG compliance audit not done

## Recommended Next Steps

1. **Immediate:** Verify the infinite re-render bug remains fixed and keep it covered as a regression risk
2. **Phase 1:** Set up ESLint react-hooks exhaustive-deps rule to prevent similar bugs
3. **Phase 1:** Write a regression test specifically for the infinite re-render bug pattern
4. **Phase 1:** Document Socket.IO test patterns in CONTRIBUTING.md for future contributors
5. **Phase 2:** Source Makruk rule reference or domain expert to verify test cases cover all special rules
