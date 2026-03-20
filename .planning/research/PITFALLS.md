# Pitfalls Research

**Domain:** React/Socket.IO Testing & CI/CD
**Researched:** 2026-03-20
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: useEffect Dependency Arrays Causing Infinite Re-renders

**What goes wrong:**
Including non-stable values in useEffect dependency arrays causes infinite re-render loops. The UI becomes completely unresponsive — no clicks register, timers freeze, and the browser tab may crash. This was a PREVIOUSLY OBSERVED BUG in the project at `GamePage.tsx:196` and other components, and should now be treated as a regression risk.

**Why it happens:**
Developers include functions, objects, or arrays in dependency arrays that are recreated on every render. Common causes:
- Functions defined inside the component body (not wrapped in useCallback)
- Objects/arrays defined inline (not wrapped in useMemo)
- Event handler functions passed as dependencies
- navigate function from react-router (changes on route changes)

**How to avoid:**
1. **ESLint plugin:** `eslint-plugin-react-hooks` with exhaustive-deps rule is NON-NEGOTIABLE
2. **useCallback for all functions in dependencies:** Never put raw functions in useEffect
3. **Stable refs:** For values that shouldn't trigger re-renders, use useRef instead of state
4. **Socket.IO pattern:** The cleanup function in `useGameSocket.ts:136-149` is correct — always mirror socket.on() with socket.off()

**Warning signs:**
- Browser DevTools shows "maximum update depth exceeded" error
- Component re-renders >100 times per second (React DevTools Profiler)
- Network tab shows hundreds of rapid socket connect/disconnect cycles
- Memory usage climbing rapidly during game play

**Phase to address:** Test Foundation Phase — add ESLint rules AND a regression test specifically for this bug before adding new features

---

### Pitfall 2: Socket.IO Memory Leaks in Tests

**What goes wrong:**
Tests that create socket connections but don't properly clean them up cause memory leaks. CI runs slow down over time, tests timeout after 10-15 minutes, and eventually the CI runner crashes with "JavaScript heap out of memory."

**Why it happens:**
Socket.IO connections persist in the background even after tests complete. Common causes:
- Missing `afterEach(() => socket.close())` in test suites
- Server sockets created but never closed
- Event listeners not removed in cleanup
- Multiple sockets created in beforeEach without cleanup

**How to avoid:**
```typescript
// CORRECT pattern for Socket.IO tests
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';

let ioServer: Server;
let clientSocket: Socket;

beforeEach((done) => {
  ioServer = new Server(port);
  clientSocket = ioc(`http://localhost:${port}`);
  clientSocket.on('connect', done);
});

afterEach(() => {
  clientSocket.disconnect();
  ioServer.close();
});
```

**Warning signs:**
- Test suite takes >30 seconds to run
- "Warning: 10+ listeners added" in console output
- Port already in use errors between tests
- Memory profiling shows steady increase during test run

**Phase to address:** Test Foundation Phase — establish proper Socket.IO testing patterns before writing game engine tests

---

### Pitfall 3: Testing Implementation Details Instead of User Behavior

**What goes wrong:**
Tests break whenever you refactor code, even when functionality hasn't changed. Contributors give up fixing tests because "everything is red." You lose confidence in your test suite.

**Why it happens:**
Tests query for internal implementation details rather than what users see:
- Testing state values directly: `expect(gameState.turn).toBe('white')`
- Testing class names: `expect(container.querySelector('.selected-piece'))`
- Testing component internals: `expect(hookResult.current.moves).toHaveLength(5)`
- Using `getBy*` instead of `findBy*` for async operations

**How to avoid:**
**Testing Library's FIRST principle:**
- **F**ocused — test one thing
- **I**solated — no dependencies on other tests
- **R**epeatable — same result every time
- **S**elf-validating — pass/fail is obvious
- **T**horough — cover important cases

**Test what USERS see:**
```typescript
// WRONG — testing implementation
expect(gameState.board[0][0].type).toBe('k');

// RIGHT — testing user experience
expect(screen.getByLabelText('White king on a1')).toBeInTheDocument();
```

**Warning signs:**
- Refactoring breaks 50+ tests
- Tests mock the component under test
- Tests check CSS classes instead of visible text/ARIA
- "It works manually but tests fail"

**Phase to address:** Component Testing Phase — establish patterns before writing component tests

---

### Pitfall 4: Fake Timers Desyncing Game Clocks

**What goes wrong:**
Using fake timers in clock tests causes the game clock to behave unpredictably. Clocks jump forward 60 seconds at once, or count down in reverse, making time controls completely unreliable.

**Why it happens:**
Game clocks rely on real setInterval/setTimeout for smooth countdowns. Fake timers ( Jest.useFakeTimers() or vi.useFakeTimers() ) don't accurately simulate the passage of time when:
- Multiple timers are running simultaneously (white clock + black clock)
- Timer intervals change during the game (Makruk's special time rules)
- Socket.IO heartbeat conflicts with fake timers

**How to avoid:**
For clock testing, prefer ONE of these approaches:
1. **Test time calculations directly:** Test the `getRemainingTime()` function, not the UI
2. **Use real timers with accelerated time:** Set shorter time limits for tests
3. **Manual time control:** Test clock START/STOP/RESUME behavior, not countdown

```typescript
// PREFER: Test the business logic
test('calculates remaining time after 5 seconds', () => {
  const initial = 600; // 10 minutes
  const elapsed = 5000; // 5 seconds
  expect(getRemainingTime(initial, elapsed)).toBe(595);
});

// AVOID: Fake timers for UI countdowns
```

**Warning signs:**
- Clock tests sometimes pass, sometimes fail (flaky)
- Test timeouts when clock component is mounted
- Clock jumps from 10:00 to 9:00 instantly in tests

**Phase to address:** Game Engine Testing Phase — separate time logic from UI before testing

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Mocking the entire socket module | Tests run without server | Network bugs slip through; tests don't catch real socket issues | NEVER — use test server instead |
| Copy-pasting useEffect cleanup | Quick to add new listeners | Incomplete cleanup when listeners change | Only in prototype, NEVER in production |
| Testing with `queryBy*` for existence | Tests pass when element missing | False positives; bugs caught by users instead of tests | NEVER — use `queryBy*` only for ABSENCE |
| Skipping `@testing-library/user-event` | One less dependency | Tests don't simulate real interaction | NEVER — free with testing-library |
| Ignoring ESLint react-hooks warnings | Code ships faster | Infinite re-render bugs in production | NEVER — fix immediately |
| Coverage thresholds on % only | Easy to hit targets | Critical paths untested; useless coverage | NEVER — enforce coverage on critical files |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Socket.IO client | Using global socket in tests | Create fresh socket per test with afterEach cleanup |
| React Router navigate | Including navigate in useEffect deps | Use useRef to hold latest navigate or use useCallback pattern |
| SQLite in tests | Testing against real database file | Use :memory: database or mock the database layer |
| Socket.IO emit/ack | Not awaiting async acknowledgment | Wrap emit in promise, test both success and failure paths |
| CI GitHub Actions | Not caching node_modules | Slow builds (~5 min vs ~30 sec) — always cache dependencies |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Test file with 500+ tests | Test suite takes 10+ minutes; devs stop running tests locally | Split test files by feature; use test.only during development | ~50 tests per file is comfortable limit |
| Rendering full game tree in tests | Tests timeout; memory spike | Test individual moves, not full games | ~100 game states in memory |
| Not parallelizing Vitest workers | Tests run serially, taking 5x longer | Ensure vitest.config.ts has `threads: true` and `maxThreads: 4` | Missing parallel config = single-threaded execution |
| E2E tests for every edge case | E2E suite takes 30+ minutes | Keep E2E for critical paths only; unit test edge cases | >20 E2E tests is usually too many |
| Coverage on all files | Maintains 80% coverage but critical files untested | Set per-file thresholds; enforce 90%+ on game engine, 60% on UI | "Looks good overall" masks gaps |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client game state | Cheaters send fake "I won" messages | Always validate moves server-side; client state is for display only |
| Exposing all socket events | Clients can emit admin/debug events | Whitelist allowed events; validate event payloads server-side |
| No rate limiting on moves | Move spamming crashes server | Rate limit socket events per connection |
| Game ID enumeration | Attackers find and join private games | Use cryptographically random game IDs; optionally add password protection |
| Storing game history forever | Database bloat; privacy issues | Archive old games; implement game cleanup job |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback on invalid move | User clicks, nothing happens, confused | Always show why move is invalid ("King would be in check") |
| Sound on by default | Startles users; distracting in public spaces | Save sound preference; default to OFF or ask first |
| No undo confirmation | Accidental click ruins game | Show "Are you sure?" for resign/draw offers |
| Clock not visible on mobile | User loses on time unexpectedly | Always show clock; collapsible move history instead |
| No indication of network lag | User thinks app frozen | Show connection status; indicate "waiting for opponent..." |
| Move history as PGN only | Casual users can't read notation | Show visual move list; PGN as secondary |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Move validation:** Often missing special rules (Makruk's "bench" pieces, promoted pieces) — verify ALL Makruk rules are tested
- [ ] **Socket reconnection:** Often missing auto-reconnect logic — verify test simulates disconnect/reconnect cycle
- [ ] **Game clock:** Often missing countdown when tab is inactive — verify clock works with document.hidden
- [ ] **Draw offers:** Often missing expiration (old offers persist) — verify draw offers have timeout
- [ ] **Spectator mode:** Often missing (can only play, not watch) — verify users can watch games
- [ ] **Mobile dragging:** Often missing (desktop only) — verify touch events work on mobile
- [ ] **Keyboard navigation:** Often missing — verify board is fully keyboard accessible
- [ ] **Piece styles:** Often missing persistence — verify style choice saves across sessions
- [ ] **Error boundaries:** Often missing around socket-dependent components — verify UI shows error when socket fails
- [ ] **Coverage thresholds:** Often set too low or not enforced in CI — verify coverage gates actually block merges

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Infinite re-render bug in production | HIGH | 1. Identify component via React DevTools Profiler 2. Add exhaustive-deps ESLint rule 3. Fix dependency arrays 4. Add regression test |
| Socket memory leaks in CI | MEDIUM | 1. Add afterEach cleanup to all socket tests 2. Run tests with --inspect to identify leaks 3. Add socket leak test to CI |
| Test suite at 50% pass rate | HIGH | 1. Comment out failing tests temporarily 2. Fix implementation-detail tests FIRST 4. Gradually re-enable tests |
| CI timeout after 15 min | MEDIUM | 1. Run subset locally to identify slow tests 2. Add test.skip to slow tests 3. Parallelize Vitest workers 4. Consider splitting slow test file |
| Coverage report lies (80% but gaps) | LOW | 1. Run coverage with --per-file flag 2. Identify untested critical files 3. Add file-specific thresholds |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Infinite re-render loops | Test Foundation — ESLint rules + regression test | Regression test passes; no warnings in CI |
| Socket memory leaks | Test Foundation — establish cleanup patterns | All tests pass with no memory warnings |
| Testing implementation details | Component Testing — establish Testing Library patterns | Refactoring Board.tsx doesn't break tests |
| Fake timer clock issues | Game Engine Testing — separate time logic | Clock tests are deterministic and stable |
| Client-side validation trust | Server Testing — validate all moves server-side | Invalid move requests are rejected |
| Missing Makruk rules | Game Engine Testing — comprehensive rule coverage | All special rules have tests |
| No socket reconnection | Component Testing — test disconnect scenarios | Simulated disconnect shows "reconnecting..." |
| UX sound annoyance | Feature Implementation — user preferences | Sound preference persists; default is OFF |
| Coverage gaps | CI/CD Phase — enforce per-file thresholds | game.ts has 90%+ coverage enforced |
| Mobile drag broken | E2E Testing — Playwright mobile emulation | E2E test passes on mobile viewport |

## Most Common React Testing Library Mistakes

Source: Kent C. Dodds' "Common Mistakes with React Testing Library"

### HIGH Importance (fix immediately)

1. **Not using the ESLint plugin:** `eslint-plugin-testing-library` catches mistakes before they reach review
2. **Not using `screen`:** Always destructure `screen` from `@testing-library/react` — queries automatically use document.body
3. **Using `query*` variants for existence checks:** Use `getBy*` or `findBy*` for elements that should exist; `queryBy*` only for testing absence
4. **Using `waitFor` unnecessarily:** If you can use `findBy*`, do that instead — `findBy*` is built-in waiting

### MEDIUM Importance (improves test quality)

5. **Wrong assertion for disabled state:** Use `toBeDisabled()` instead of checking attributes directly
6. **Adding ARIA attributes just for testing:** This is testing implementation — test the actual accessible behavior instead
7. **Using `wrapper` instead of destructuring:** Modern `render()` API returns queries directly; don't use wrapper pattern
8. **Not using `@testing-library/user-event`:** Real keyboard/click simulation vs. lower-level events

### LOW Importance (minor improvements)

9. **Using `getBy*` with await:** `getBy*` is synchronous; use `findBy*` for async
10. **Calling `cleanup` manually:** Automatic with setup — manual cleanup is redundant

## Sources

- [React Testing Library Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) — HIGH confidence, official testing library author
- [Socket.IO Testing Documentation](https://socket.io/docs/v4/testing/) — HIGH confidence, official docs
- [Vitest Common Errors](https://vitest.dev/guide/common-errors.html) — HIGH confidence, official docs
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — HIGH confidence, official docs
- [GitHub Actions Quickstart](https://docs.github.com/en/actions/quickstart) — HIGH confidence, official docs
- [Project Codebase Analysis](/home/prab/Documents/markrukthai-1/) — HIGH confidence, direct observation
  - useGameSocket.ts:37-150 — Existing socket lifecycle pattern (CORRECT)
  - GamePage.tsx:61-196 — Multiple useEffect patterns
  - client/src/test/ — Existing test infrastructure

---

*Pitfalls research for: Markruk Thai (React/Socket.IO Testing & CI/CD)*
*Researched: 2026-03-20*
