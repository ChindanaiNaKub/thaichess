# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

**Large React Components:**
- Issue: GamePage.tsx (668 lines) and AnalysisPage.tsx (954 lines) violate single responsibility principle
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/components/GamePage.tsx`
  - `/home/prab/Documents/markrukthai-1/client/src/components/AnalysisPage.tsx`
- Impact: Hard to test, maintain, and understand
- Fix approach: Extract business logic to custom hooks, split into smaller components

**Missing ESLint React Hooks Rule:**
- Issue: Lack of exhaustive-deps rule detection leads to infinite re-render bugs
- Files:
  - `/home/prab/Documents/markrukthai-1/client/vite.config.ts`
  - No evidence of eslint-plugin-react-hooks configuration
- Impact: Production freezes, UI unresponsiveness, memory leaks
- Fix approach: Add ESLint config with 'react-hooks/exhaustive-deps' rule

**Auth Implementation Spread Across Components:**
- Issue: Authentication logic duplicated in multiple files
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/lib/auth.tsx`
  - `/home/prab/Documents/markrukthai-1/client/src/components/AccountPage.tsx`
  - `/home/prab/Documents/markrukthai-1/client/src/components/LoginPage.tsx`
- Impact: Inconsistent authentication flow, security gaps
- Fix approach: Create centralized auth context provider

## Known Bugs

**Puzzle Validation Logic Missing:**
- Issue: Template test file exists but no actual puzzle validation tests found
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/test/puzzleValidation.test.ts`
- Symptoms: Puzzle solutions might not be correctly validated
- Trigger: When puzzle answers are incorrect but system accepts them
- Workaround: Manual testing required for puzzle functionality

**Regression Test Template Unfilled:**
- Issue: Template exists but no actual regression tests implemented
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/test/regression/template.test.ts`
- Symptoms: Previously fixed bugs may reappear without warning
- Trigger: Code changes without proper testing
- Workaround: Manual regression testing before releases

## Security Considerations

**X-Forwarded-For Header Reliance:**
- Risk: Potential IP spoofing through proxy headers
- Files:
  - `/home/prab/Documents/markrukthai-1/server/src/security.ts:56-59`
- Current mitigation: Basic header parsing but no validation
- Recommendations: Add IP validation, consider using trusted proxies list

**Game ID Validation Limited:**
- Risk: Simple regex validation may allow bypass
- Files:
  - `/home/prab/Documents/markrukthai-1/server/src/security.ts:65-67`
- Current mitigation: Alphanumeric-only validation
- Recommendations: Consider UUID generation instead, add server-side game ID verification

**Client-Side Error Reporting:**
- Risk: Error messages may contain sensitive information
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/lib/errorReporting.ts:13-27`
- Current mitigation: Basic sanitization
- Recommendations: Sanitize all error messages before transmission, avoid stack traces in prod

## Performance Bottlenecks

**Large AnalysisPage Component:**
- Problem: 954 lines likely causing render performance issues
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/components/AnalysisPage.tsx`
- Cause: Complex board rendering, move history display
- Improvement path: Virtualize move history, memoize calculations, break into smaller components

**Socket.IO Connection Management:**
- Problem: Multiple socket connections possible without proper cleanup
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/hooks/useGameSocket.ts:37-150`
- Cause: No connection pooling or connection reuse
- Improvement path: Implement connection pooling, track active connections

## Fragile Areas

**Game State Dependencies:**
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/components/GamePage.tsx`
  - `/home/prab/Documents/markrukthai-1/client/src/hooks/useGameSocket.ts`
- Why fragile: Multiple useEffect hooks with complex dependencies
- Safe modification: Create custom hooks for all game state operations
- Test coverage: Missing tests for dependency edge cases

**Board Rendering Logic:**
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/components/Board.tsx`
- Why fragile: Complex piece rendering with multiple conditions
- Safe modification: Extract piece rendering logic into separate components
- Test coverage: Limited unit tests for board interactions

## Scaling Limits

**In-Memory Rate Limiting:**
- Current capacity: Limited by server memory
- Files:
  - `/home/prab/Documents/markrukthai-1/server/src/security.ts:15-45`
- Limit: Map grows indefinitely without cleanup
- Scaling path: Implement Redis-based rate limiting with automatic cleanup

**Socket.IO Connections:**
- Current capacity: Limited by file descriptors
- Limit: OS-level connection limits
- Scaling path: Implement connection pooling and connection management

## Dependencies at Risk

**React Testing Library:**
- Risk: Heavy reliance without version pinning
- Impact: Breaking changes in minor versions
- Migration plan: Pin to specific versions, create test abstraction layer

**Socket.IO:**
- Risk: Version compatibility between client and server
- Impact: Connection failures, event mismatches
- Migration plan: Use exact version matching, create version compatibility tests

## Missing Critical Features

**Game History Persistence:**
- Problem: No evidence of game history storage beyond current session
- Blocks: Cannot review past games, no statistics tracking
- Priority: High for game analysis features

**Spectator Mode:**
- Problem: Users cannot watch live games
- Blocks: Cannot create tournament or spectator functionality
- Priority: Medium for community features

## Test Coverage Gaps

**Move Validation Logic:**
- What's not tested: Special Makruk rules implementation
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/test/engine.test.ts`
  - Missing tests for promoted pieces, bench pieces
- Risk: Game rules incorrectly implemented
- Priority: High - core game functionality

**Error Boundary Testing:**
- What's not tested: Error boundary recovery scenarios
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/components/ErrorBoundary.tsx`
  - `/home/prab/Documents/markrukthai-1/client/src/components/BoardErrorBoundary.tsx`
- Risk: Error boundaries may not catch all errors
- Priority: Medium - user experience

**Socket.IO Reconnection:**
- What's not tested: Network recovery scenarios
- Files:
  - `/home/prab/Documents/markrukthai-1/client/src/hooks/useGameSocket.ts`
- Risk: Games lost on network interruption
- Priority: High - network resilience

---

*Concerns audit: 2026-03-21*