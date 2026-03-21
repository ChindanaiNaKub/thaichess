# Testing Patterns

**Analysis Date:** 2026-03-21

## Test Framework

**Runner:**
- Vitest for unit tests and integration tests
- Playwright for end-to-end tests
- Configuration in `client/vitest.config.ts`

**Assertion Library:**
- Vitest built-in `expect`
- `@testing-library/jest-dom` for DOM assertions
- `jest-axe` for accessibility testing

**Run Commands:**
```bash
npm run test          # Run all tests (Vitest)
npm run test:ui       # Run tests with UI
npm run test:run      # Run tests without watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run E2E tests with UI
```

## Test File Organization

**Location:**
- Unit/integration tests: `client/src/test/`
- E2E tests: `client/e2e/`
- Shared test utilities: `shared/test/`

**Naming:**
- Test files: `{feature}.test.{ts,tsx}` or `{feature}.spec.{ts,tsx}`
- Component tests: same as component file
- E2E tests: descriptive names with context

**Directory Structure:**
```
src/
├── test/
│   ├── engine.test.ts         # Core game logic
│   ├── components/
│   │   ├── Board.test.tsx     # Board component tests
│   │   └── Piece.test.tsx     # Piece component tests
│   ├── regression/
│   │   └── template.test.ts  # Regression test template
│   ├── a11y.test.tsx         # Accessibility tests
│   └── setup.ts              # Test setup and mocks
└── e2e/
    ├── home.spec.ts           # Homepage E2E tests
    └── local-game.spec.ts     # Local game E2E tests
```

## Test Structure

**Suite Organization:**
```typescript
describe('Feature: Component Name', () => {
  beforeEach(() => {
    // Setup
    vi.clearAllMocks();
  });

  describe('Behavior: Specific aspect', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

**Test Pattern (AAA):**
```typescript
it('should validate legal moves correctly', () => {
  // Arrange
  const board = createInitialBoard();
  const piece = { type: 'P', color: 'white' };
  board[6][4] = piece;

  // Act
  const moves = calculateLegalMoves(board, { row: 6, col: 4 });

  // Assert
  expect(moves).toHaveLength(2);
  expect(moves).toEqual([
    { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } },
    { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }
  ]);
});
```

## Mocking

**Framework:** Vi.js (Vitest's built-in mocking)

**Patterns:**
```typescript
// Mock component
vi.mock('../components/PieceSVG', () => ({
  default: ({ type, color }: { type: string; color: string }) => {
    return <div data-testid={`piece-${type}-${color}`} />;
  },
}));

// Mock API calls
vi.mock('../api/gameService', () => ({
  makeMove: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock hooks
const mockUseGame = vi.hook(() => ({
  gameState: mockGameState,
  makeMove: vi.fn(),
}));
```

**Common Mocks:**
- `IntersectionObserver` and `ResizeObserver` for board rendering
- `requestAnimationFrame` and `cancelAnimationFrame`
- `navigator.clipboard` for clipboard operations
- Window APIs like `matchMedia`

## Fixtures and Factories

**Test Data:**
```typescript
// Shared engine imports
import { createInitialBoard } from '@shared/engine';
import type { Board, Position, Piece, Move } from '@shared/types';

// Factory functions
const createTestBoard = (overrides?: Partial<Board>): Board => {
  const board = createInitialBoard();
  return overrides ? { ...board, ...overrides } : board;
};

const createTestPiece = (type: PieceType, color: PieceColor): Piece => ({
  type,
  color,
});

const createTestMove = (from: Position, to: Position): Move => ({
  from,
  to,
});
```

**Location:**
- Factories imported from `@shared/test/factories.ts`
- Test utilities in `client/src/test/utils/`

## Coverage

**Requirements:** No specific target enforced in configuration

**Coverage Provider:** V8
- Reporter types: text, html, json
- Excluded: node_modules/, dist/, test files, e2e/

**View Coverage:**
```bash
npm run test:coverage
# Opens coverage report in browser
# HTML report: client/coverage/index.html
```

## Test Types

**Unit Tests:**
- Focus on individual functions and components
- Isolated from external dependencies
- Mock all external interactions
- Located in `src/test/`

**Integration Tests:**
- Test component interactions
- Test API integration points
- Use real implementations where appropriate
- Located alongside unit tests

**E2E Tests:**
- Full user journey testing
- Real browser environment
- Test application flow and UI
- Use Playwright for browser automation
- Located in `e2e/` directory

**Common Patterns:**

**Async Testing:**
```typescript
it('should fetch game data asynchronously', async () => {
  const mockGame = { id: 'game1', state: 'waiting' };
  vi.mocked(fetchGameData).mockResolvedValue(mockGame);

  const result = await fetchGame('game1');

  expect(result).toEqual(mockGame);
  expect(fetchGameData).toHaveBeenCalledWith('game1');
});
```

**Error Testing:**
```typescript
it('should handle API error gracefully', () => {
  vi.mocked(makeMove).mockRejectedValue(new Error('Network error'));

  expect(() => makeMove('invalid')).rejects.toThrow('Network error');
});
```

## Accessibility Testing

**Framework:** Jest Axe with Testing Library

**Pattern:**
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<Board {...props} />);

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Performance Tests

**Framework:** Vitest benchmarks

**Pattern:**
```typescript
import { bench } from 'vitest';

bench('calculate legal moves for all pieces', () => {
  const board = createInitialBoard();
  calculateAllLegalMoves(board);
}, { iterations: 1000 });
```

## Test Utilities

**Custom Matchers:**
```typescript
// Custom matchers for game state
expect.extend({
  toBeInCheck(received, expectedColor) {
    // Implementation
  },
  toHaveValidMoves(received, piece) {
    // Implementation
  }
});
```

**Test Context:**
```typescript
// Mock context providers
const MockGameProvider = ({ children }: { children: React.ReactNode }) => {
  const [gameState, setGameState] = useState(mockGameState);

  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameContext.Provider>
  );
};
```

## Test Organization Tips

1. **Group related tests** with nested `describe` blocks
2. **Use beforeEach for cleanup** to prevent test pollution
3. **Mock external APIs** to avoid flaky tests
4. **Test error cases** alongside happy paths
5. **Document complex tests** with clear comments
6. **Use meaningful test names** that describe the behavior being tested

---

*Testing analysis: 2026-03-21*