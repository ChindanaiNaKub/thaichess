# Contributing to ThaiChess

Thank you for your interest in making ThaiChess famous worldwide! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/markrukthai.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Open http://localhost:5173

## Development

The project has three main parts:

- **`shared/`** — Game engine and types (used by both client and server)
- **`server/`** — Node.js + Express + Socket.IO backend
- **`client/`** — React + TypeScript + Tailwind frontend

### Useful Commands

```bash
npm run dev              # Start both server and client
npm run dev:server       # Server only (port 3000)
npm run dev:client       # Client only (port 5173)

# Type checking
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit

# Build for production
npm run build
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Ensure TypeScript compiles: `npx tsc --noEmit` in both `client/` and `server/`
4. Ensure the client builds: `npm run build --workspace=client`
5. Test your changes locally
6. Commit with a descriptive message
7. Push and open a Pull Request

### Branch Policy

- `main` is a protected branch and should only receive changes through pull requests
- Direct pushes to `main` should be blocked for everyone, including admins/owners
- Pull requests should only be merged after the required GitHub Actions checks pass
- If you are working solo, keep the same rule for yourself to avoid bypassing CI by accident

## Areas Where Help is Needed

- **Thai language support** — UI translations
- **ThaiChess counting rules** — Full implementation of endgame counting
- **AI opponent** — Basic game engine for solo play
- **Puzzles** — Tactical puzzles for training
- **UI/UX improvements** — Especially mobile experience
- **Accessibility** — Screen reader support, keyboard navigation
- **Testing** — Unit tests for the game engine
- **Documentation** — Strategy guides

## Code Style

- TypeScript with strict mode
- React functional components with hooks
- Tailwind CSS for styling
- Descriptive variable names
- No unnecessary comments (code should be self-explanatory)
- ESLint with react-hooks exhaustive-deps rule enforced

## Testing

### Running Tests

From the project root or client directory:

```bash
# Unit and component tests (watch mode)
npm run test

# Run tests once (without watch)
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui
```

### Test Structure

Tests are co-located with source code:

- `client/src/test/engine.test.ts` - Game engine logic tests
- `client/src/test/Board.test.tsx` - Board component tests
- `client/src/test/a11y.test.tsx` - Accessibility tests
- `client/src/test/regression/` - Regression tests for fixed bugs
- `client/e2e/` - End-to-end tests with Playwright

### Test Patterns

**File naming:**
- Unit tests: `*.test.ts` and `*.test.tsx`
- E2E tests: `*.spec.ts`

**Test structure:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component/Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const props = { ... };

    // Act
    render(<Component {...props} />);

    // Assert
    expect(screen.getByText('something')).toBeInTheDocument();
  });
});
```

### What to Test

**High priority (always test):**
- Game engine logic (move validation, check/checkmate detection)
- Component rendering and user interactions
- Socket.IO event handling and cleanup
- Accessibility (ARIA labels, keyboard navigation)

**Medium priority:**
- State management logic
- Custom hook behavior
- Edge cases and error handling

**Low priority (optional):**
- Pure UI components (buttons, icons)
- Third-party library integrations

### Regression Tests

When fixing a bug, add a regression test to prevent it from recurring:

1. Create test in `client/src/test/regression/`
2. Use naming: `{bug-name}-{YYYY-MM-DD}.test.ts`
3. Document: Bug symptoms, root cause, fix date
4. See `template.test.ts` for examples

## Code Quality

### Linting

Run ESLint before committing:

```bash
# Client
cd client && npm run lint

# Server
cd server && npm run lint

# Auto-fix issues
npm run lint:fix
```

### React Hooks Rules

**CRITICAL:** All useEffect/useCallback/useMemo dependencies must be declared.

- ESLint `exhaustive-deps` rule enforces this
- **Never disable the rule** without team approval
- Missing dependencies cause stale closures and infinite loops

**Example:**
```typescript
// WRONG - missing dependencies
useEffect(() => {
  socket.on('game_state', handleGameState);
  return () => socket.off('game_state', handleGameState);
}, []); // Missing handleGameState!

// CORRECT - all dependencies declared
useEffect(() => {
  socket.on('game_state', handleGameState);
  return () => socket.off('game_state', handleGameState);
}, [handleGameState]);
```

### Socket.IO Cleanup Patterns

**Always cleanup event listeners in useEffect:**

```typescript
useEffect(() => {
  const handleEvent = (data) => {
    // Handle event
  };

  // Register listener
  socket.on('event', handleEvent);

  // Cleanup - CRITICAL: pass handler reference
  return () => {
    socket.off('event', handleEvent);
  };
}, [deps]);
```

**Anti-patterns to avoid:**

- **Missing cleanup:** Causes memory leaks and duplicate listeners
- **Cleanup without reference:** `socket.off('event')` removes ALL listeners, including from other components
- **Listeners inside connect handler:** Creates duplicates on each reconnection

**Correct pattern (from useGameSocket.ts):**
```typescript
useEffect(() => {
  const handleGameState = (gs: ClientGameState) => {
    setGameState(gs);
  };

  socket.on('game_state', handleGameState);

  return () => {
    socket.off('game_state', handleGameState); // Pass reference!
  };
}, [gameId, navigate]);
```

### TypeScript

- Run `npx tsc --noEmit` to check types without building
- Fix all type errors before committing
- Use `unknown` instead of `any` for uncertain types

## Questions?

Open an issue or start a discussion on GitHub. We're friendly!
