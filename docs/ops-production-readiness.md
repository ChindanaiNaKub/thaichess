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

`docs/project-review-and-growth-plan.md` still talks about DigitalOcean student credit — that section is **outdated**; use this file for hosting facts.

## Monthly cost & credit / expiry risk

| Item | Est. cost | Risk |
|------|-----------|------|
| **Northflank Developer Sandbox** | **$0** within free limits (typically 2 services, 2 jobs, 1 addon; card often required for account) | Free tier is for hobby use per Northflank docs. Leaving free limits → pay-as-you-go (~$0.01667/vCPU-hr, ~$0.00833/GB-hr). Confirm plan/usage in the Northflank billing UI. Optional: Student Developer Pack via `students@northflank.com` for higher free service limits. |
| **Turso** | Free Starter if within plan quotas | Plan/quota changes or overage; confirm in Turso dashboard. |
| Domains / email (name.com, Resend) | Existing maintainer costs | Independent of app compute host. |
| Privacy analytics (Plausible) | $0 until enabled; then Plausible Cloud or self-host | Client is wired but **off** until `VITE_PLAUSIBLE_DOMAIN` is set at **build** time. |

**Not in use:** DigitalOcean, Oracle Cloud, Azure, Render, Fly.io, Railway, etc. Do not plan cost/expiry around those products for this app.

**Action for maintainer:** check Northflank + Turso dashboards monthly; stay inside Sandbox free limits; set a billing alert if the account can leave free tier.

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

- Cookie banner (`CookieConsent`) stores `essential` | `analytics` in `localStorage` (`thaichess-cookie-consent`). Legacy value `true` = essential only.
- `PrivacyAnalytics` loads Plausible **only** when consent is `analytics` **and** `VITE_PLAUSIBLE_DOMAIN` is set at client build time.
- Optional: `VITE_PLAUSIBLE_SCRIPT_URL` (default `https://plausible.io/js/script.js`). Plausible sends `Cross-Origin-Resource-Policy: cross-origin`, compatible with this app’s COEP `require-corp`.
- Until the env var is set and the image rebuilt, the banner stays essential-only (no third-party script).

## Deploy checklist (Northflank)

1. Push/merge to the branch the service tracks (`main`).
2. Confirm Northflank build succeeds; `/api/health` → `status: ok`, `dependencies.database: ok`.
3. Runtime secrets: `SITE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `AUTH_SECRET`, Turso URL/token, OAuth if used.
4. To enable analytics: set build-time `VITE_PLAUSIBLE_DOMAIN=thaichess.dev` (and rebuild), then users who accept analytics load Plausible.
