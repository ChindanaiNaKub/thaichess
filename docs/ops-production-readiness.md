# Production readiness notes (ops pass)

> Snapshot: 2026-07-29. Student-maintained live app at https://thaichess.dev

## Current hosting (authoritative)

**Active stack today: Northflank free cloud + Turso only.**  
Nothing else hosts the app — no DigitalOcean droplet, no Render, no Oracle VM, no Fly/Railway/Vercel for production.

| Layer | Provider | Notes |
|-------|----------|--------|
| App (Node + Socket.IO + static `client/dist`) | **Northflank** Developer Sandbox (free) | Combined service, Dockerfile build; public port **3000**; health `/api/health` |
| Edge / DNS | Northflank + name.com | Custom domain `thaichess.dev`; responses may show `server: istio-envoy` (Northflank’s managed edge on their cloud) |
| Database | **Turso** (`thaichess-chindanainakub`, `aws-ap-northeast-1`) | Primary prod DB via `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` |
| CI | GitHub Actions (`ci.yml`) | Lint, tests, build, release artifact on `main` push — **no auto-deploy job**; Northflank rebuilds from the tracked Git branch |

Brief history only (not current): older deploys used Render free, then a DigitalOcean droplet with SSH deploy. That droplet was deleted; CI’s DigitalOcean job was removed in PR #280. Live traffic is Northflank.

`docs/project-review-and-growth-plan.md` was updated on 2026-07-29 to mark DigitalOcean/student-credit text as historical; this file remains authoritative for hosting facts.

## Monthly cost & credit / expiry risk

| Item | Est. cost | Risk |
|------|-----------|------|
| **Northflank Developer Sandbox** | **$0** within free limits (typically 2 services, 2 jobs, 1 addon; card often required for account) | Free tier is for hobby use per Northflank docs. Leaving free limits → pay-as-you-go (~$0.01667/vCPU-hr, ~$0.00833/GB-hr). Confirm plan/usage in the Northflank billing UI. Optional: Student Developer Pack via `students@northflank.com` for higher free service limits. |
| **Turso** | Free Starter if within plan quotas | Plan/quota changes or overage; confirm in Turso dashboard. |
| Domains / email (name.com, Resend) | Existing maintainer costs | Independent of app compute host. |
| Privacy analytics | **$0 (not enabled)** | Code can load Plausible later, but **do not set** `VITE_PLAUSIBLE_DOMAIN` unless you have a free self-host or are willing to pay for Plausible Cloud. Default = no analytics script, no cost. |

**Not in use:** DigitalOcean, Oracle Cloud, Azure, Render, Fly.io, Railway, etc. Do not plan cost/expiry around those products for this app.

**Action for maintainer:** check Northflank + Turso dashboards monthly; stay inside Sandbox free limits; set a billing alert if the account can leave free tier.

## Engine CPU / RAM (client WASM vs server)

See **[`docs/engine-server-load-audit.md`](./engine-server-load-audit.md)** (#247).

Summary: bot play and position review prefer browser Fairy-Stockfish WASM; keep `shared/engine` on the server for live Games. Avoid setting `FAIRY_STOCKFISH_BINARY_PATH` / `FAIRY_STOCKFISH_SERVICE_URL` on Northflank unless you need server Analysis fallbacks — unset keeps Sandbox RAM for Socket.IO + persistence.

## Database backup (Turso)

**In-repo:** no automated dump/cron. Security hardening script exists (`server/scripts/apply-security-hardening.sh`); that is not a backup.

**Platform (Turso):**

- Point-in-time recovery (PITR): backups at `COMMIT`. Free plan: restore within last **24 hours**. Paid tiers: longer windows (see [Turso PITR docs](https://docs.turso.tech/features/point-in-time-recovery)).
- Restore creates a **new** DB, then you retarget `TURSO_DATABASE_URL` / token and delete the old DB when done:

```bash
turso db create thaichess-restore --from-db thaichess-chindanainakub --timestamp 2026-07-29T00:00:00Z
```

- Manual offsite dump (recommended weekly + before risky migrations):

```bash
turso auth login
turso db shell thaichess-chindanainakub .dump > "backups/thaichess-$(date -u +%Y%m%dT%H%M%SZ).sql"
```

Restore from dump: `turso db create thaichess-from-dump --from-dump ./path/to/dump.sql`

**Gap:** 24h PITR alone is not enough for student ops (mistakes noticed late, account loss). Keep encrypted dumps somewhere durable (personal drive / object storage) outside Turso.

## Privacy-friendly analytics

**We are not using Plausible (or any paid analytics) in production right now.**

- Recommended for a $0 student setup: leave `VITE_PLAUSIBLE_DOMAIN` **unset**. The cookie banner stays essential-only; no third-party script loads; **$0**.
- Plausible **Cloud** is a paid product — do **not** buy it unless you want to. The code hook is optional future wiring only.
- If you ever want free traffic stats later (optional, not required):
  - Self-host Plausible or Umami on free compute you already have, **or**
  - Use another free privacy-friendly host and point `VITE_PLAUSIBLE_SCRIPT_URL` / domain at it after consent — still only if you opt in.
- Cookie banner stores `essential` | `analytics` in `localStorage` (`thaichess-cookie-consent`). Legacy `true` = essential only.
- `PrivacyAnalytics` loads a script **only** when consent is `analytics` **and** `VITE_PLAUSIBLE_DOMAIN` is set at client build time.

## Deploy checklist (Northflank)

1. Push/merge to the branch the service tracks (`main`).
2. Confirm Northflank build succeeds; `/api/health` → `status: ok`, `dependencies.database: ok`.
3. Runtime secrets: `SITE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `AUTH_SECRET`, **`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (required in production)**, OAuth if used.
4. Analytics: **leave unset** for free (recommended). Do not set `VITE_PLAUSIBLE_DOMAIN` unless you deliberately enable a free self-hosted or paid analytics backend.

Production refuses to start without a remote Turso URL (`assertProductionUsesDurableDatabase`). Local `file:` SQLite remains available for development and tests only.

## Opening Explorer backfill (`game_positions`)

Opening Explorer reads from `game_positions`. New finished Games write positions automatically; older Games need a one-time (or recovery) backfill.

### When to run

- After deploying Opening Explorer the first time against an existing Turso database
- After changing `position_hash` format (use `BACKFILL_FORCE=1`)
- After a failed mid-run (script is idempotent via `NOT EXISTS` / delete-then-insert)

### Dev / local

```bash
# From repo root, against local SQLite in DATA_DIR / data/
npx tsx server/src/scripts/backfillGamePositions.ts

# Preview only
BACKFILL_DRY_RUN=1 npx tsx server/src/scripts/backfillGamePositions.ts
```

### Production (Turso)

Requires maintainer credentials — this repo does not auto-run backfill on deploy.

```bash
export TURSO_DATABASE_URL='libsql://…'
export TURSO_AUTH_TOKEN='…'
BACKFILL_DRY_RUN=1 npx tsx server/src/scripts/backfillGamePositions.ts
npx tsx server/src/scripts/backfillGamePositions.ts
```

Full rebuild after hash-format changes:

```bash
BACKFILL_FORCE=1 npx tsx server/src/scripts/backfillGamePositions.ts
```

### Runtime / disk impact

- Cost scales with finished Games × plies (one `game_positions` row per ply including the starting position)
- Expect multi-minute runs and noticeable Turso write volume on large archives; prefer `BACKFILL_DRY_RUN=1` first
- Until backfill completes, Opening Explorer correctly shows the empty state (“No data yet”) for unindexed positions

**Status (2026-07-30):** prod backfill is still a maintainer action. Code and docs are ready; run against Turso when convenient and confirm `/openings` shows non-zero games for the starting position.

## Public API rate limits (Game Database / Opening Explorer)

These sit **on top of** the global `/api/` limiter (60 requests / IP / minute):

| Route | Limit | Why |
|-------|-------|-----|
| `GET /api/games/search` | **20 / IP / minute** | Heavier `LIKE` + filter SQL against `games` |
| `GET /api/openings/stats` | **30 / IP / minute** | Aggregations over `game_positions` |
| `GET /api/openings/games` | **30 / IP / minute** | Joined position → game lookups |

Player name search also requires **at least 2 characters**. Indexes exist on `games.white_name` / `games.black_name` for equality/prefix use; leading-wildcard `LIKE '%x%'` still cannot use B-tree indexes — consider FTS later if scrape cost grows.

## Operational metrics (ADR-0001 follow-up)

Live reconnect and rated-game persistence emit **structured JSON logs** and counters on the existing `/api/metrics` scrape (Prometheus text).

| Log `event` | Counter | When |
|-------------|---------|------|
| `game_reconnect_success` | `thaichess_game_reconnect_success_total` | Seat restored by durable `playerId` |
| `game_reconnect_failure` | `thaichess_game_reconnect_failure_total` | Disconnect TTL expiry, or seat reclaim failure/exception |
| `rated_game_save_retry` | `thaichess_rated_game_save_retry_total` | SQLite busy retry while saving a rated Game |
| `rated_game_duplicate` | `thaichess_rated_game_duplicate_total` | Idempotent hit: rated Game row already present |

Details use `gameId` / reason codes only — **no display names, emails, or other PII**.

### How to alert

Until a hosted metrics backend exists, watch Northflank logs (or any log drain) for sustained bursts:

1. **Reconnect health:** many `game_reconnect_failure` with `reason=disconnect_ttl_expired` relative to `game_reconnect_success` over ~15–30 minutes.
2. **Rated save health:** repeated `rated_game_save_retry` or rising `database_save_completed_game_failed` errors; occasional `rated_game_duplicate` after double finish is expected (idempotent), but a sudden spike with save failures needs investigation.

Optional later: scrape `GET /api/metrics` into Prometheus/Grafana and alert on counter rate thresholds.
