# Architecture Decision Record (ADR)

**ADR ID**: ADR-2026-03-26-001  
**Title**: Use stable player identity for live game ownership and transactional rated-game persistence  
**Status**: Accepted  
**Date**: 2026-03-26  
**Owner**: Project maintainer  
**Deciders**: Project maintainer  
**Scope**: Realtime gameplay, reconnect behavior, rated quick-play persistence

---

## Core

### 1. Context

**Problem statement**: The server used ephemeral Socket.IO socket IDs as the main identity for live players, while rated game completion updated users and games outside a single transaction. That created two correctness risks:

- a reconnect could lose the player's seat because a new socket ID looked like a new player
- duplicate game-finish events could apply Elo changes more than once or leave stats and saved games out of sync

**Goals**:
- Make reconnect restore the same live seat for both guests and signed-in players
- Ensure a finished rated game updates ratings and the saved game record exactly once
- Keep the system compatible with a single Render web service and Turso/libSQL

**Non-goals**:
- Introduce Redis, queues, or multi-instance realtime coordination
- Split the app into microservices
- Redesign the rating system itself

**Constraints**:
- Regulatory/compliance: none beyond normal account and email handling
- Latency/SLO: move and reconnect paths must stay fast enough for realtime play on a single low-cost instance
- Data residency: no strict requirement
- Platform/runtime: Node.js on Render free tier, Turso/libSQL for durable data, Socket.IO for realtime
- Team/operational maturity: one maintainer, hobby project, low ops budget

**Assumptions**:
- Production uses Turso or another durable libSQL target for accounts, sessions, ratings, and finished games
- The app continues to run as a single web process on Render for the near term
- Guests need reconnect support without forced registration

### 2. Decision Drivers (What Matters Most)

| Priority | Driver | Why it matters | How we measure |
|---:|---|---|---|
| 1 | Correctness | Players must not lose seats or get duplicate Elo updates | reconnect success rate, zero duplicate rating incidents |
| 2 | Delivery speed | The project is maintained by one person | lead time for fixes, code complexity |
| 3 | Cost | The app is hosted for free or near-free | monthly infra spend |
| 4 | Operability | Failures must be understandable without heavy platform work | incident recovery time, simple runbooks |
| 5 | Extensibility | The design should not block future scale work | bounded future migration cost |

### 3. Options Considered

| Option | Summary | Pros | Cons | Reversibility |
|---|---|---|---|---|
| A | Keep socket IDs as identity and current save flow | No new work | Reconnect remains fragile; duplicate finish paths remain risky | Easy |
| B | Add stable player identity plus transactional game completion | Fixes the current correctness issues with limited complexity | Requires schema/model changes in live state and more careful DB code | Medium |
| C | Move live state to Redis and add a separate game service | Stronger future scale path | Too much operational overhead for a hobby project | Hard |

### 4. Decision

**We choose**: Option B

**Why**:
- It fixes the two user-visible correctness issues now.
- It fits the current hosting model and budget.
- It keeps the codebase as a modular monolith instead of over-engineering early.
- It leaves a clear upgrade path to Redis or multi-instance coordination later if growth requires it.

### 5. Architecture Impact (Implementation-Ready)

**Boundaries and contracts**
- Realtime room state keeps two identities per seat:
  - current socket ID for transport
  - stable player ID for ownership and reconnect
- Signed-in players use their user ID as `playerId`.
- Guests use a persistent browser-generated `guest_*` ID sent in the Socket.IO handshake.
- Matchmaking keeps the same stable player ID so quick play and private games share one identity model.

**Data and consistency**
- Source of truth for live seat ownership: in-memory `GameManager`
- Source of truth for finished rated games and ratings: libSQL/Turso
- Consistency model:
  - strong for rated game completion
  - in-memory best-effort for live room state on a single instance
- Rated game save flow now runs in a write transaction:
  - check existing game row by game ID
  - compute and apply ratings if needed
  - insert the finished game row
  - commit once

**Failure modes and resilience**
- Reconnect with a new socket ID restores the old seat when `playerId` matches an existing seat owner.
- Duplicate finish calls for the same rated game ID return the already-saved result instead of reapplying ratings.
- Local SQLite can raise `SQLITE_BUSY` under concurrent writes, so the save path retries and then falls back to the committed row if another writer already won.
- Degradation plan:
  - live games still depend on one server process
  - accounts, ratings, sessions, and saved games remain durable in Turso/libSQL

**Security**
- Signed-in identity still comes from the session cookie.
- Guest identity is not trusted for privilege; it only restores anonymous live-game ownership.
- Guest IDs are validated to a strict `guest_*` format before use.

**Observability**
- Log and monitor:
  - reconnect success and failure
  - duplicate finished-game saves
  - database lock retries
- Minimum metrics to add later:
  - `game_reconnect_success_total`
  - `game_reconnect_failure_total`
  - `rated_game_save_retry_total`
  - `rated_game_duplicate_total`

**Cost and capacity**
- Current design is intended for one app instance.
- It avoids Redis, workers, and other paid coordination infrastructure.
- If traffic grows enough to require multiple instances, the next step is Redis-backed Socket.IO coordination and externalized live-room state.

### 6. Rollout, Validation, and Rollback

**Rollout plan**
- Ship the realtime identity and DB transaction changes together.
- Keep the rest of the architecture unchanged.
- Monitor reconnect behavior and rated-game completion after deploy.

**Validation plan**
- Unit tests for reconnecting with a new socket ID
- Unit tests for duplicate concurrent rated-game saves
- Manual smoke test:
  - start a live game
  - disconnect and reconnect the browser
  - confirm the same seat is restored
  - finish a rated quick-play game and confirm a single rating change

**Rollback plan**
- Revert the code changes if reconnect or game completion regresses badly.
- No destructive data migration is required for rollback.
- Existing saved game rows remain valid.

### 7. Consequences

**Positive**
- Reconnect works for guests and signed-in users without forcing registration.
- Rated quick-play persistence is atomic and idempotent by game ID.
- The design stays simple enough for one maintainer.

**Negative / tradeoffs**
- Live game state is still in memory, so the app is still single-instance for realtime correctness.
- The DB save path is more complex because it now handles write contention explicitly.
- Guest identity remains browser-local, so clearing storage resets guest continuity.

**Follow-ups**
- Add lightweight production metrics and alerts for reconnect and rated-game save failures
- Fail startup in production if no durable DB is configured
- Split server bootstrap concerns into smaller modules under a modular-monolith structure

### 8. Links

- Design doc: none
- Diagram(s): none
- Tickets/epics: none
- Related ADRs: none

---

## References

- This decision is based on the current repo architecture and the implemented changes on 2026-03-26.
