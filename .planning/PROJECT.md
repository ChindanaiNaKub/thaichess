# Markruk Thai

## What This Is

A free, open-source Thai chess (Makruk) platform following lichess philosophy — no distractions, forever open source. The project helps chess players discover Makruk through familiar piece styles while introducing Thai youth to their traditional game. Built with React, TypeScript, Express, and Socket.IO for real-time multiplayer gameplay.

## Core Value

**Prevent bugs through comprehensive testing and establish quality standards for open source contributors.**

If code doesn't have tests and doesn't pass CI checks, it doesn't ship. Quality gates protect the user experience and make contributing easier.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Real-time multiplayer gameplay via Socket.IO — existing
- ✓ Game state management and synchronization — existing
- ✓ Basic move validation and game rules — existing
- ✓ Matchmaking system for pairing players — existing
- ✓ SQLite storage for completed games — existing
- ✓ React SPA with TypeScript and Vite — existing
- ✓ Basic test infrastructure (Vitest, Playwright, testing-library) — existing
- ✓ Accessibility foundations (ErrorBoundary, ARIA tests) — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Comprehensive test coverage for game engine (move validation, check detection, special rules)
- [ ] Component tests for all React components (Board, GamePage, modals, etc.)
- [ ] Custom hook tests (useGameSocket, useGameInteraction, etc.)
- [ ] Server/API tests (game endpoints, socket handlers, database operations)
- [ ] Regression test for infinite re-render bug (useEffect dependency issues)
- [ ] GitHub Actions CI/CD pipeline (test runs on PR, coverage reporting, quality gates)
- [ ] Piece style selector with multiple options (Makruk native, Lichess-style, chess.com-style)
- [ ] Piece style preview and saved preferences
- [ ] CONTRIBUTING.md for open source contributors
- [ ] Coverage thresholds enforced in CI

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- User authentication — Anonymous gameplay is the lichess philosophy; defer to future
- Mobile app — Web-first, mobile responsive web is sufficient for v1
- Real-time chat — High complexity, not core to gameplay experience
- Video/puzzle modes — Focused on live play for now
- Monetization — Forever free and open source, no ads, no premium features

## Context

**Existing Bugs Encountered:**
- Infinite re-render loop caused by useEffect dependency issues — UI becomes unresponsive, no clicks register

**Open Source Goals:**
- Solo developer currently building for eventual community contributions
- Want to lower barrier for contributors through clear standards and documentation
- Quality gates should catch issues before they reach users

**Target Audiences:**
- Chess players curious about Makruk — need familiar visual cues (western-style pieces)
- Thai youth learning their traditional game
- Casual players playing for fun
- Competitive players seeking serious games

**Technical Philosophy:**
- Follows lichess principles: no distractions, free forever, open source
- TypeScript for type safety across frontend and backend
- Real-time gameplay via Socket.IO
- Shared types between client and server

## Constraints

- **Tech Stack**: TypeScript, React, Express, Socket.IO, SQLite — already established, don't change without strong reason
- **Testing**: Vitest for unit/component tests, Playwright for E2E — use existing infrastructure
- **CI Platform**: GitHub Actions — free for public repos, where project will be hosted
- **Timeline**: Flexible — "whenever" pace, no external deadlines
- **Dependencies**: Avoid adding heavy libraries; prefer lightweight solutions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tests → CI → Piece styles order | Foundation first — need tests before CI can provide value, piece styles are feature work | — Pending |
| Multiple piece style options | Chess players discover Makruk through familiar visuals; lowers barrier to entry | — Pending |
| Coverage thresholds in CI | Automated quality gates prevent regressions and maintain standards for contributors | — Pending |
| CONTRIBUTING.md focus | Clear documentation lowers barrier for new contributors, reduces onboarding friction | — Pending |

---
*Last updated: 2026-03-20 after project initialization*
