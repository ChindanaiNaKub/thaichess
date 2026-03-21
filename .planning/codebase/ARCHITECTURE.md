# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Multi-tier real-time web application with client-server separation

**Key Characteristics:**
- Client-server architecture with real-time bidirectional communication
- Single-page application (SPA) with multiple game modes
- Socket.IO for real-time game state synchronization
- REST API for authentication, data persistence, and game state queries
- In-memory game room management with database persistence
- Thai chess (Makruk) specific game logic

## Layers

**Client Layer:**
- Purpose: React SPA for user interface and game presentation
- Location: `client/src/`
- Contains: React components, hooks, utilities, and configuration
- Depends on: React, React Router, Socket.IO client
- Used by: End users through web browsers

**Server Layer:**
- Purpose: Express.js backend with Socket.IO for real-time logic
- Location: `server/src/`
- Contains: Game logic, matchmaking, authentication, database access
- Depends on: Express, Socket.IO, SQLite database
- Used by: Client applications through HTTP and WebSocket

**Shared Layer:**
- Purpose: TypeScript types and shared game logic
- Location: `shared/`
- Contains: Type definitions, game engine, board representation
- Depends on: TypeScript, chess logic implementations
- Used by: Both client and server for type safety and shared game rules

**Data Layer:**
- Purpose: Database operations and data persistence
- Location: `server/src/database.ts`, SQLite database file
- Contains: Game history, user accounts, feedback storage
- Depends on: SQLite ORM and file storage
- Used by: Server layer for persistent data

## Data Flow

**Game Creation Flow:**
1. Client → Server: `create_game` Socket.IO event
2. Server: Create in-memory GameRoom via GameManager
3. Server → Client: `game_created` event with gameId
4. Server → Client: Game state updates via `game_joined` event
5. Both players receive game state for immediate rendering

**Real-time Game Play:**
1. Player makes move → Client → Server: `make_move` Socket.IO event
2. Server: Validate move via shared game engine
3. Server → Both players: `move_made` event with updated state
4. Server: Update in-memory game room
5. On game end → Server: Save to database via saveCompletedGame

**Matchmaking Flow:**
1. Client → Server: `find_game` Socket.IO event
2. Server: Add to MatchmakingQueue with time control
3. Server: Periodically try to find match in same time control
4. Match found → Server: Create new game room
5. Server → Both players: `matchmaking_found` event

**Authentication Flow:**
1. Client → Server: Email verification request to REST endpoint
2. Server: Issue login code via configured service
3. Client → Server: Login code verification
4. Server: Set session cookie for authenticated requests
5. Client: All subsequent requests include authentication

## Key Abstractions

**GameRoom:**
- Purpose: Represents a single game instance with state
- Examples: `server/src/gameManager.ts` lines 22-29, `shared/types.ts` lines 70-81
- Pattern: In-memory object with shared state management

**GameState/ClientGameState:**
- Purpose: Complete game state for display and synchronization
- Examples: `shared/types.ts` lines 47-64, 82-101
- Pattern: Immutable updates with new state objects

**GameManager:**
- Purpose: Central game management and room lifecycle
- Examples: `server/src/gameManager.ts`
- Pattern: Singleton with room ID lookup and player tracking

**SocketRateLimiter:**
- Purpose: Rate limiting protection against abuse
- Examples: `server/src/security.ts` lines 71-88
- Pattern: Sliding window rate limiting per socket and IP

## Entry Points

**Client Application:**
- Location: `client/src/main.tsx`
- Triggers: DOM load and React application bootstrapping
- Responsibilities: Provider setup, error boundaries, routing

**Server Application:**
- Location: `server/src/index.ts`
- Triggers: Node.js startup and Express server initialization
- Responsibilities: HTTP server, Socket.IO setup, route handlers

**Client Router:**
- Location: `client/src/App.tsx`
- Triggers: React Router navigation
- Responsibilities: Route matching and lazy loading of components

## Error Handling

**Strategy:** Layered error handling with graceful degradation

**Patterns:**
- Client boundaries: `ErrorBoundary`, `BoardErrorBoundary` components catch rendering errors
- Server validation: All inputs validated before processing
- Socket error handling: Client receives error events, server logs detailed errors
- Global error reporting: Client errors reported via `/api/client-errors` endpoint

## Cross-Cutting Concerns

**Logging:** Custom logging with different levels (logInfo, logWarn, logError) in `server/src/logger.ts`

**Validation:** Input validation in `server/src/security.ts` with sanitization of game IDs, positions, etc.

**Authentication:** Email-based authentication with session cookies via `server/src/auth.ts`

**Monitoring:** Custom monitoring counters in `server/src/monitoring.ts` for tracking key metrics

---

*Architecture analysis: 2026-03-21*