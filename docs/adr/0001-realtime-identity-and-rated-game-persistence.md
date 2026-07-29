---
status: accepted
date: 2026-03-26
---

# Stable player identity and transactional rated-game persistence

Socket.IO socket IDs were used as live player identity while rated game completion wrote ratings and saved games outside a single transaction. That broke reconnect (a new socket looked like a new player) and allowed duplicate finish events to apply Elo more than once.

We use a **stable `playerId` per seat** (User ID when signed in, persistent `guest_*` ID for Guests; socket ID is transport only) and save finished **rated** Games in one libSQL/Turso transaction keyed by game ID so completion is idempotent. Live room state stays in-memory on a single app instance — no Redis or multi-service split yet. Current hosting details live in [`docs/ops-production-readiness.md`](../ops-production-readiness.md).

**Rejected for now:** keeping socket-only identity (incorrect reconnect); Redis + separate game service (ops cost for a hobby monolith).

**Trade-off:** realtime correctness still requires one app instance; guest continuity depends on the browser keeping `guest_*` storage.
