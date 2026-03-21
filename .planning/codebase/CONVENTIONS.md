# Coding Conventions

**Analysis Date:** 2026-03-21

## Naming Patterns

**Files:**
- PascalCase for components: `Board.tsx`, `PieceSVG.tsx`, `GameTimer.tsx`
- camelCase for utilities and hooks: `useBoardLogic.ts`, `gameUtils.ts`
- snake_case for test files: `board.test.ts`, `gameLogic.test.ts`
- kebab-case for configuration and documentation

**Functions:**
- camelCase for all functions
- Event handlers prefixed with `on`: `onSquareClick`, `onPieceDrop`, `onMove`
- State setters prefixed with `set`: `setSelectedSquare`, `setBoardState`
- Internal functions prefixed with `_`: `_validateMove`, `_calculateLegalMoves`

**Variables:**
- camelCase for local variables and props
- TypeScript interfaces with PascalCase
- Constants with UPPER_SNAKE_CASE: `MAX_GAME_DURATION`, `DEFAULT_BOARD_SIZE`
- Boolean variables with is/has prefixes: `isMyTurn`, `hasValidMoves`, `isSelected`

**Types:**
- TypeScript interfaces for complex objects
- Type aliases with descriptive names
- Union types for enums: `PieceType = 'K' | 'M' | 'S' | 'R' | 'N' | 'P' | 'PM'`
- Generic types with descriptive parameter names

## Code Style

**Formatting:**
- ESLint with TypeScript support enabled
- Standard JavaScript formatting rules
- Semi-colons required
- Double quotes for strings (unless template literals needed)
- Indentation with 2 spaces

**Linting:**
- ESLint configuration in `eslint.config.js`
- Separate configs for client and server code
- React hooks rules enforced: `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`
- TypeScript strict mode enabled

## Import Organization

**Order:**
1. React imports
2. Third-party library imports
3. Shared imports from `@shared/*`
4. Local project imports
5. Relative imports

**Path Aliases:**
- `@shared/*` → `../shared/*` (shared types and utilities)

**Import Patterns:**
```typescript
// Standard imports
import React, { useState, useCallback, memo } from 'react';
import { render, fireEvent } from '@testing-library/react';

// Type-only imports
import type { Board, Position, PieceColor } from '@shared/types';

// Namespace imports
import * as gameUtils from './gameUtils';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations
- Error boundaries for React components
- Graceful fallbacks for missing data
- Logging errors with context

**Error Types:**
- Custom error classes for domain-specific errors
- TypeScript discriminated unions for error handling
- Proper error propagation up the call stack

**Example:**
```typescript
try {
  const result = await moveValidationService.validateMove(move);
  return result;
} catch (error) {
  logger.error('Move validation failed:', error);
  throw new MoveValidationError('Invalid move', { originalError: error });
}
```

## Logging

**Framework:** Console logging and structured logging

**Patterns:**
- Use consistent log levels: info, warn, error
- Include contextual information in logs
- Remove console.log before commits
- Use logger utilities for production

## Comments

**When to Comment:**
- Complex business logic algorithms
- Todo items with clear descriptions
- Workarounds for temporary issues
- Integration points with external systems

**JSDoc/TSDoc:**
- Required for all public APIs
- Include examples for complex functions
- Document parameters and return types
- Document side effects

**Function Example:**
```typescript
/**
 * Validates a move according to Thai chess rules
 * @param move - The move to validate
 * @param gameState - Current game state
 * @returns {ValidationResult} Object with validation result and error message
 * @example
 * const result = validateMove(move, gameState);
 * if (result.isValid) {
 *   // Move is valid
 * } else {
 *   console.error(result.error);
 * }
 */
function validateMove(move: Move, gameState: GameState): ValidationResult {
  // Implementation
}
```

## Function Design

**Size:**
- Keep functions under 50 lines
- Single responsibility principle
- Extract reusable logic into utilities

**Parameters:**
- 3-5 parameters maximum
- Use object for multiple related parameters
- Optional parameters with defaults

**Return Values:**
- Consistent return types
- Avoid null/undefined when possible
- Use discriminated unions for success/failure cases

## Module Design

**Exports:**
- Named exports for functions and types
- Default export only for main components
- Barrel files for clean imports

**Barrel Files:**
- `src/components/index.ts` - Re-export commonly used components
- `src/types/index.ts` - All type exports
- `src/utils/index.ts` - Utility functions

## TypeScript Patterns

**Strict Mode:**
- Enabled with noImplicitAny, strictNullChecks
- Explicit type annotations for public APIs
- Interface types over type aliases for objects

**Best Practices:**
- Use `readonly` for immutable data
- Literal types for enum-like values
- Generics for reusable components
- Utility types for common transformations

## React Patterns

**Component Design:**
- Functional components with hooks
- memo for expensive components
- useCallback for event handlers
- useMemo for expensive calculations

**State Management:**
- useState for component state
- useReducer for complex state logic
- Context for shared state
- Custom hooks for reusable logic

**Props:**
- PropTypes for runtime validation
- Default props where appropriate
- Interface definitions for props

---

*Convention analysis: 2026-03-21*