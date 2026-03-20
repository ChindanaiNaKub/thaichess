# Architecture Patterns

**Domain:** Real-time Multiplayer Game (React/Socket.IO)
**Researched:** 2026-03-20

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (React)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │  Pages      │  │ Components  │  │ Custom Hooks        │    │
│  │  - GamePage │  │  - Board    │  │  - useGameSocket    │    │
│  │  - LocalGame│  │  - Clock    │  │  - useGameInteraction│   │
│  │  - QuickPlay│  │  - Modals   │  │  - useGameState     │    │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘    │
│         │                │                                           │
│         └────────────────┴────────────────┐                       │
│                                           │                       │
│  ┌────────────────────────────────────────▼─────────────────┐  │
│  │              Socket.IO Client (singleton)                  │  │
│  │  - connectSocket()                                         │  │
│  │  - socket.on('move_made', ...)                            │  │
│  │  - socket.emit('make_move', ...)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket (Socket.IO protocol)
                            │
┌─────────────────────────────────────────────────────────────────┐
│                         Server (Express)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Socket.IO Server                           │   │
│  │  - socket.on('join_game', ...)                          │   │
│  │  - socket.on('make_move', ...)                          │   │
│  │  - Game room management                                  │   │
│  └───────────────┬───────────────────────────────────────┘   │
│                  │                                             │
│  ┌───────────────▼───────────────────────────────────────┐   │
│  │              Game Engine (shared types)                 │   │
│  │  - validateMove()                                       │   │
│  │  - getLegalMoves()                                      │   │
│  │  - isCheck() / isCheckmate()                           │   │
│  └───────────────┬───────────────────────────────────────┘   │
│                  │                                             │
│  ┌───────────────▼───────────────────────────────────────┐   │
│  │              Game Storage (SQLite)                      │   │
│  │  - saveCompletedGame()                                  │   │
│  │  - getGameHistory()                                     │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **GamePage** | Main game UI, orchestrates sub-components | useGameSocket, useGameInteraction, Board, Clock, MoveHistory |
| **Board** | Render board squares, pieces, handle drag-drop | Receives game state, emits square clicks/piece drops |
| **useGameSocket** | Socket connection lifecycle, event listeners | Socket.IO client, sets game state |
| **useGameInteraction** | Move selection logic, premove handling | Game state, Board component |
| **Clock** | Countdown timer display | Receives time from game state |
| **MoveHistory** | Display move list | Receives move history from game state |
| **Server Socket Handlers** | Validate moves, manage game rooms | Game engine, SQLite storage |

## Data Flow

### Normal Game Flow

```
1. User clicks piece
   Board.handleSquareClick(piecePosition)
   → useGameInteraction.handleSquareClick()
   → setSelectedSquare(piecePosition)
   → Board re-renders with legal move highlights

2. User clicks target square
   Board.handleSquareClick(targetPosition)
   → useGameInteraction.handleSquareClick(targetPosition)
   → socket.emit('make_move', { from, to })
   → Server receives move

3. Server validates and broadcasts
   Server: socket.on('make_move')
   → Engine.validateMove() [SERVER-SIDE CRITICAL]
   → GameState.update()
   → socket.to(gameId).emit('move_made', { move, gameState })

4. All clients update
   Client: socket.on('move_made')
   → setGameState(newGameState)
   → Board re-renders with new position
```

### Socket Connection Flow

```
1. Component mounts
   → connectSocket() [singleton, safe to call multiple times]
   → socket.connect()

2. useEffect setup
   → socket.on('connect', handleConnect)
   → socket.on('move_made', handleMoveMade)
   → ... (all event listeners)

3. Component unmounts
   → useEffect cleanup: socket.off('connect', handleConnect)
   → socket.off('move_made', handleMoveMade)
   → ... (mirror all listeners)
   → socket.disconnect() [if no other components using it]
```

## Patterns to Follow

### Pattern 1: Shared TypeScript Types

**What:** Define types once in `@shared/types`, use on client and server

**When:** Any data that crosses the client/server boundary

**Example:**
```typescript
// shared/types.ts
export interface ClientGameState {
  board: Board;
  turn: PieceColor;
  status: 'waiting' | 'playing' | 'finished';
  isCheck: boolean;
  whiteTime: number;
  blackTime: number;
  // ...
}

// Client usage
import { ClientGameState } from '@shared/types';
const [gameState, setGameState] = useState<ClientGameState | null>(null);

// Server usage
import { ClientGameState } from '@shared/types';
socket.emit('game_state', gameState as ClientGameState);
```

**Benefits:** Type safety across boundary, compile-time error detection

### Pattern 2: Socket Lifecycle in useEffect

**What:** Register all listeners in useEffect, cleanup in return function

**When:** Any component using Socket.IO

**Example:**
```typescript
useEffect(() => {
  const handleConnect = () => { /* ... */ };
  const handleMoveMade = (data: MoveData) => { /* ... */ };

  socket.on('connect', handleConnect);
  socket.on('move_made', handleMoveMade);

  return () => {
    socket.off('connect', handleConnect);
    socket.off('move_made', handleMoveMade);
  };
}, [gameId]);
```

**Benefits:** Prevents memory leaks, removes stale listeners, prevents duplicate handlers

### Pattern 3: Server-Side Move Validation

**What:** Always validate moves server-side, never trust client

**When:** Any move submitted by client

**Example:**
```typescript
// Server
socket.on('make_move', ({ gameId, move }) => {
  const game = games.get(gameId);

  // CRITICAL: Validate server-side
  const validation = validateMove(game.state, move);
  if (!validation.valid) {
    socket.emit('move_rejected', { reason: validation.reason });
    return;
  }

  // Apply validated move
  const newState = applyMove(game.state, move);
  io.to(gameId).emit('move_made', { move, gameState: newState });
});
```

**Benefits:** Prevents cheating, catches bugs in client validation

### Pattern 4: Custom Hooks for Socket Logic

**What:** Extract socket logic into reusable hooks

**When:** Multiple components need same socket events

**Example:**
```typescript
// useGameSocket.ts
export function useGameSocket({ gameId }) {
  const [gameState, setGameState] = useState(null);
  // ... socket logic

  return { gameState, playerColor, gameOverInfo, /* ... */ };
}

// GamePage.tsx
const { gameState, playerColor } = useGameSocket({ gameId });
```

**Benefits:** Separation of concerns, testability, reusability

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Only Move Validation

**What:** Client validates move and sends "valid" flag to server

**Why bad:** Cheaters can bypass validation, send illegal moves

**Instead:** Always validate server-side, ignore client validation for security

### Anti-Pattern 2: Nested useEffect with Missing Dependencies

**What:** useEffect without proper dependency array

**Why bad:** Infinite re-renders, stale closures, bugs

**Instead:** Use ESLint exhaustive-deps rule, useCallback for functions in deps

### Anti-Pattern 3: Direct DOM Manipulation

**What:** Using `document.querySelector` in React components

**Why bad:** Bypasses React, breaks re-rendering, hard to test

**Instead:** Use refs, state, or Testing Library queries in tests

### Anti-Pattern 4: Mocking Sockets in Production Code

**What:** Having `if (test) mockSocket()` in actual component

**Why bad:** Test logic in production, harder to maintain

**Instead:** Use dependency injection or test environment configuration

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Socket connections | Single Node.js process sufficient | Add Redis adapter for Socket.IO scaling | Multiple server instances with load balancer |
| Game storage | SQLite in-memory | Consider PostgreSQL | Sharded database, separate read replicas |
| Move validation | In-memory game state | Same, but more RAM | Game state in Redis, periodic persistence |
| Test suite | Run all tests in CI | Parallel test execution | Split test suites, run on matrix |

**Current scale target:** Casual play, not competitive chess server规模. SQLite and single Node.js process are sufficient for MVP.

## Testing Architecture

### Unit Tests (Vitest)

```
Test files: client/src/test/
Scope: Individual functions, pure logic
Mocking: Minimal, only external deps
Runtime: <1 second per test
```

### Component Tests (Vitest + Testing Library)

```
Test files: client/src/test/*.test.tsx
Scope: Component rendering, user interactions
Mocking: Browser APIs, complex SVG components
Runtime: 1-5 seconds per test
```

### E2E Tests (Playwright)

```
Test files: client/e2e/
Scope: Full user workflows
Mocking: Only external services
Runtime: 5-30 seconds per test
```

### Server Tests (Vitest)

```
Test files: server/test/ (not yet created)
Scope: Socket handlers, API endpoints
Mocking: Database, Socket.IO client
Runtime: 1-10 seconds per test
```

## Sources

- [Socket.IO Architecture](https://socket.io/docs/v4/server-api/) — HIGH confidence, official docs
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — HIGH confidence, official docs
- [Project Codebase Analysis](/home/prab/Documents/markrukthai-1/) — HIGH confidence, direct observation
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) — HIGH confidence, authoritative source

---

*Architecture research for: Markruk Thai*
*Researched: 2026-03-20*
