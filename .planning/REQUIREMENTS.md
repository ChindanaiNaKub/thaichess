# Requirements: Markruk Thai Testing Foundation

**Defined:** 2026-03-20
**Core Value:** Prevent bugs through comprehensive testing and establish quality standards for open source contributors

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Test Foundation

- [ ] **FOUND-01**: ESLint react-hooks exhaustive-deps rule configured and enforced
- [ ] **FOUND-02**: Socket.IO cleanup patterns documented in CONTRIBUTING.md
- [ ] **FOUND-03**: CONTRIBUTING.md testing section explains run commands, patterns, and what to test
- [ ] **FOUND-04**: Regression test suite template created for documenting and preventing recurring bugs

### Game Engine Tests

- [ ] **ENGINE-01**: All piece types have move validation tests (King, Queen, Rook, Bishop, Knight, Pawn)
- [ ] **ENGINE-02**: Check detection tests verify king is in attack
- [ ] **ENGINE-03**: Checkmate detection tests verify game end conditions
- [ ] **ENGINE-04**: Stalemate detection tests verify draw conditions
- [ ] **ENGINE-05**: Makrush Bia-or (Met rule) tests for pawn promotion
- [ ] **ENGINE-06**: Piece counting rule tests for bare king scenarios
- [ ] **ENGINE-07**: Engine achieves 90%+ test coverage

### Component Tests

- [ ] **COMP-01**: Board component tests verify rendering, piece placement, and square interaction
- [ ] **COMP-02**: GamePage component tests verify turn management, check indicators, and game state display
- [ ] **COMP-03**: All modal components have tests (GameOverModal, PromoteModal, etc.)
- [ ] **COMP-04**: useGameSocket hook tests verify connection, event handling, and cleanup
- [ ] **COMP-05**: useGameInteraction hook tests verify piece selection and move logic
- [ ] **COMP-06**: Accessibility tests (jest-axe) verify ARIA compliance and keyboard navigation

### Server & API Tests

- [ ] **SRV-01**: Socket connection handler tests verify join/leave behavior
- [ ] **SRV-02**: Move handler tests verify server-side validation
- [ ] **SRV-03**: Game state management tests verify GameManager behavior
- [ ] **SRV-04**: Database operation tests verify game persistence
- [ ] **SRV-05**: API endpoint tests verify error responses

### CI/CD Pipeline

- [ ] **CI-01**: GitHub Actions workflow runs on all pull requests
- [ ] **CI-02**: Tests run in CI with clear pass/fail reporting
- [ ] **CI-03**: Coverage report generated and viewable (HTML + PR comment)
- [ ] **CI-04**: Coverage thresholds enforced: 80% global, 70% per-file, 90%+ for engine.ts
- [ ] **CI-05**: Branch protection rules block merging without passing CI

### Piece Style Options

- [ ] **STYLE-01**: Piece style selector accessible from settings menu
- [ ] **STYLE-02**: Makruk native piece set available
- [ ] **STYLE-03**: Lichess-style piece set available
- [ ] **STYLE-04**: chess.com-style piece set available
- [ ] **STYLE-05**: Piece style preview shows each set before selection
- [ ] **STYLE-06**: User's piece style preference saved and persisted

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Additional Testing

- **E2E-01**: E2E tests for critical user journeys (local game, online matchmaking, game completion)
- **PERF-01**: Performance benchmarks for move generation and render performance
- **VIS-01**: Visual regression tests for piece style rendering

### Enhanced CI/CD

- **CI-06**: Automated dependency updates security scanning
- **CI-07**: Deploy previews for pull requests

### Additional Piece Styles

- **STYLE-07**: Additional piece sets contributed by community
- **STYLE-08**: Custom piece upload support

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 100% coverage requirement | Diminishing returns, tests meaningless code, discourages contributions |
| Snapshot testing for UI | Fragile, fails on styling changes, low signal — test behavior instead |
| Mutation testing (stryker-js) | Nice-to-have, defer until baseline coverage is proven |
| User authentication | Anonymous gameplay aligns with lichess philosophy; defer to future |
| Mobile native app | Web-first approach; mobile responsive web is sufficient |
| Real-time chat | High complexity, not core to gameplay experience |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

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
| SRV-01 | Phase 4 | Pending |
| SRV-02 | Phase 4 | Pending |
| SRV-03 | Phase 4 | Pending |
| SRV-04 | Phase 4 | Pending |
| SRV-05 | Phase 4 | Pending |
| CI-01 | Phase 5 | Pending |
| CI-02 | Phase 5 | Pending |
| CI-03 | Phase 5 | Pending |
| CI-04 | Phase 5 | Pending |
| CI-05 | Phase 5 | Pending |
| STYLE-01 | Phase 6 | Pending |
| STYLE-02 | Phase 6 | Pending |
| STYLE-03 | Phase 6 | Pending |
| STYLE-04 | Phase 6 | Pending |
| STYLE-05 | Phase 6 | Pending |
| STYLE-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
