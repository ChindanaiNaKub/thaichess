# Production readiness notes (ops pass)

> Snapshot: 2026-07-29. Student-maintained live app at https://thaichess.dev

## Current hosting

| Layer | Provider | Notes |
|-------|----------|--------|
| App (Node + Socket.IO + static `client/dist`) | **Northflank** Sandbox combined service | Dockerfile build; public port **3000**; health `/api/health` |
| Edge / DNS | Northflank domain + name.com | Apex via Northflank DNS target; responses show `server: istio-envoy` on Google Cloud |
| Database | **Turso** (`thaichess-chindanainakub`, `aws-ap-northeast-1`) | Primary prod DB via `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` |
| CI | GitHub Actions (`ci.yml`) | Lint, tests, build, release artifact on `main` push — **no auto-deploy job** |

History (for context): Render free → DigitalOcean droplet + SSH deploy → droplet deleted (credit expiry / teardown) → Northflank (PR #279 Dockerfile, PR #280 removed DO deploy).

Older notes in `docs/project-review-and-growth-plan.md` still mention DigitalOcean credit; treat that as **historical**. Live traffic is on Northflank now.

## Monthly cost & credit / expiry risk

| Item | Est. cost | Risk |
|------|-----------|------|
| Northflank Developer Sandbox | **$0** within free limits (2 services, 2 jobs, 1 addon; card required for account) | Sandbox is “hobby / not for production” in Northflank docs. Exceeding free limits → pay-as-you-go (~$0.01667/vCPU-hr, ~$0.00833/GB-hr). Student pack email (`students@northflank.com`) can raise free service count — confirm status in the Northflank billing UI. |
| DigitalOcean GitHub Student credit | N/A (droplet gone) | Previously cited expiry ~**2026-07-31**; no longer hosting. |
| Oracle Always Free / $300 trial | Optional fallback | Trial credits do **not** roll over after 30 days; Always Free Ampere capacity was constrained when last checked. |
| Turso | Free Starter if within plan quotas | Plan/quota changes or overage; confirm plan in Turso dashboard. |
| Domains / email (name.com, Resend) | Existing maintainer costs | Independent of app host. |
| Privacy analytics (Plausible) | $0 until enabled; then Plausible Cloud or self-host | Client is wired but **off** until `VITE_PLAUSIBLE_DOMAIN` is set at **build** time. |

**Action for maintainer:** open Northflank billing + Turso dashboards monthly; set a calendar reminder before any student/sandbox entitlement ends; keep a documented fallback (Oracle Always Free VM or small paid VPS) if Sandbox is revoked.

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
2. Confirm build succeeds; `/api/health` → `status: ok`, `dependencies.database: ok`.
3. Runtime secrets: `SITE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `AUTH_SECRET`, Turso URL/token, OAuth if used.
4. To enable analytics: set build-time `VITE_PLAUSIBLE_DOMAIN=thaichess.dev` (and rebuild), then users who accept analytics load Plausible.
