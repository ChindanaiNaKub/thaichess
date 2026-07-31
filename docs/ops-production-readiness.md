# Production readiness notes (ops pass)

> Snapshot: 2026-07-29. Student-maintained live app at https://thaichess.dev

## Current hosting (authoritative)

**Active stack today: Northflank free cloud + Turso only.**  
Nothing else hosts the app — no DigitalOcean droplet, no Render, no Oracle VM, no Fly/Railway/Vercel for production.

| Layer | Provider | Notes |
|-------|----------|--------|
| App (Node + Socket.IO + static `client/dist`) | **Northflank** Developer Sandbox (free) | Combined service, Dockerfile build; public port **3000**; health `/api/health`; **1 instance**, currently **0.2 vCPU / 512 MB** (confirm in Northflank UI) |
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
| Privacy analytics | **$0 if unset / free tier** | Optional PostHog free cloud. Leave `VITE_POSTHOG_KEY` unset for no analytics. Default = no PostHog init, no cost. |

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

**Analytics are opt-in and off by default.** We use **PostHog free cloud** (US) when enabled — not Google Analytics.

- Recommended for a $0 student setup until you want metrics: leave `VITE_POSTHOG_KEY` **unset**. The cookie banner stays essential-only; PostHog never initializes; **$0**.
- When enabling: set `VITE_POSTHOG_KEY` (and optionally `VITE_POSTHOG_HOST`, default `https://us.i.posthog.com`) at **client build time**. Stay on PostHog free tier for early traffic.
- Product analytics only: pageviews + explicit events (`game_start`, `puzzle_complete`, `signup`). No autocapture, heatmaps, or session replay. Anonymous — no `identify()`, no PII in properties.
- Cookie banner stores `essential` | `analytics` in `localStorage` (`thaichess-cookie-consent`). Legacy `true` = essential only.
- `PrivacyAnalytics` initializes PostHog **only** when consent is `analytics` **and** `VITE_POSTHOG_KEY` is set. Revoking consent opts out and resets.

## Capacity on free Sandbox (0.2 vCPU / 512 MB / 1 instance)

**Can it handle the site?** Yes for **hobby / early traffic** — with clear ceilings. The architecture is already skewed for this:

| Workload | Who pays CPU/RAM | Fit on 512 MB |
|----------|------------------|---------------|
| Homepage, static assets, puzzles UI | Mostly client + Envoy cache | Fine |
| Bot play / analysis | Prefer **browser WASM** ([engine audit](./engine-server-load-audit.md)) | Fine if `FAIRY_STOCKFISH_*` **unset** on Northflank |
| Live multiplayer + clocks | **This one Node process** + Socket.IO | Fine for a **handful** of concurrent Games |
| Finished rated Games | Turso (off-box) | Fine within Turso free quotas |

**Hard limits of this free shape:**

1. **One instance** — every redeploy replaces the only process. Envoy briefly returns `upstream connect error` / connection refused until the new container listens on **3000**.
2. **Live rooms are in-memory** (ADR 0001) — a redeploy **wipes all in-progress multiplayer Games**. Client reconnect (10 attempts) and the server’s **10 min** disconnect TTL only help if the *same* process is still up (Wi‑Fi blips), not after a container replace.
3. **0.2 vCPU** — enough for light Socket.IO + Turso I/O; not enough if you also run Fairy-Stockfish **on the server**. Keep engine env unset in prod.
4. **512 MB** — Node + Express + Socket.IO + static serving is the budget. Do not add Redis / second stockfish / heavy addons on this service.

**Rough expectation:** comfortable for low concurrent live Games (think single digits of simultaneous playing sockets), plus many more visitors browsing/puzzles/bots in-browser. If you ever see OOM kills or sustained CPU throttle in Northflank metrics, the free levers are: keep WASM-first, batch merges, and optionally ask Northflank students pack for higher free limits — **not** turning on paid replicas while budget is $0.

**What stays $0 (do not do):** second replica for rolling deploys, paid Redis for live rooms, paid analytics beyond PostHog free tier, upsizing past Sandbox free limits without a billing plan.

## Deploy checklist (Northflank) — free tier, don’t surprise players

Assumes **1 instance** auto-rebuild on `main`. Zero-downtime rolling deploys need **≥2 instances** (usually leaves free Sandbox) — out of scope while budget is $0.

### Before merge

1. Prefer merging when few people are likely mid-Game (avoid Thai evening peak if you know players are on).
2. Batch small docs/UI merges — each `main` push can restart the only container.
3. Confirm secrets still present: `SITE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `AUTH_SECRET`, **`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`**, OAuth if used.
4. Analytics: **leave unset** for free. Do not set `VITE_POSTHOG_KEY` unless you deliberately enable PostHog (free tier).
5. Engine: leave `FAIRY_STOCKFISH_BINARY_PATH` / `FAIRY_STOCKFISH_SERVICE_URL` **unset** on this free service.

### During deploy (expected)

1. Push/merge to the branch the service tracks (`main`).
2. Northflank rebuilds → old instance stops → **brief site outage** (Envoy “upstream connect error… Connection refused” is normal here).
3. **All live in-memory Games end** when the process dies. Finished rated Games already on Turso are fine.
4. Optional (still free): post a one-line note in whatever community channel you use (“deploying — live games will reset”).

### After deploy

1. Wait until Northflank shows **Running** and `GET https://thaichess.dev/api/health` returns `status: ok`, `dependencies.database: ok` (and rising `uptime`).
2. Smoke: open homepage, start a bot or puzzle, optional quick friend Game.
3. If health stays bad: check Northflank logs for boot/Turso errors — do **not** spam redeploys.

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
