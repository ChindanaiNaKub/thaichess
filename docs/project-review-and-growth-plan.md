# ThaiChess — Project Review & Growth Plan

> Written 2026-05-29. An honest assessment of where the project stands and what to do next.
>
> **Hosting update (2026-07-29):** Production runs on **Northflank free cloud + Turso** only. DigitalOcean / student-credit hosting in this doc is **historical** — see [`docs/ops-production-readiness.md`](ops-production-readiness.md) for current facts.

## Is it production-ready? Yes — and it's well past hobby quality.

Already built properly:

- CSRF/origin protection, rate limiting (HTTP + socket), CORS allowlist (`server/src/security.ts`)
- Real CI/CD: unit tests, e2e (Playwright), build smoke test (SSH deploy to DigitalOcean was removed; Northflank builds from Git)
- ~50 test files across client and server, including a11y and benchmark tests
- Drizzle + Turso managed DB, Better Auth with OAuth + 2FA + email OTP
- PWA, SEO (sitemap, robots, server meta via `seoHtml.ts`), i18n (Thai + English), error boundaries, structured logging/monitoring

> Note: the build and tests were not run during this review, so they aren't certified as passing — but the structure and breadth are genuinely strong.

## The honest truth

The problem is **not the code**. The thing hurting the project — no traffic, no donations after 4 months — is a **distribution and sustainability problem**, not an engineering one. Polishing code more will not fix it.

- Zero traffic means zero donations. Donations = traffic x engagement, and both are near zero right now.
- For a free niche board game, donations almost never sustain hosting. That's normal for indie projects.

## The real issues, in priority order

1. **Hosting sustainability.** Live app is on **Northflank free (Sandbox)** + **Turso**. Stay inside free limits and watch billing; free tiers can change or overage into pay-as-you-go. Details: [`ops-production-readiness.md`](ops-production-readiness.md). *(Older text here about DigitalOcean student credit is obsolete.)*
2. **Nobody knows it exists.** A world-class platform shipped into silence.
3. **Donations as the revenue model.** Rarely works for niche free projects.

## What to do

### 1. Cost / sustainability (do first)

- Stay on Northflank free + Turso; check dashboards monthly (see ops doc).
- Lean on the browser WASM engine (`fairy-stockfish-nnue.wasm`) for analysis/bots so the server stays cheap. Reserve the server for multiplayer + persistence only.
- Optional later: put Cloudflare in front for free CDN/caching/DDoS protection (not required for current Northflank setup).

### 2. Get actual players (the work that matters now)

- Go where Makruk players are: Thai Facebook groups (huge in Thailand), r/chess, r/makruk, chessvariants community, BoardGameGeek, Discord servers.
- The hook: there is no good modern Makruk site. Lead with "the Lichess for Thai chess," in Thai, to a Thai audience.
- Make sharing native: a finished game should produce a one-tap shareable image/link with the URL on it (already have `PostGameSharePanel` + share-card export). Every game becomes an ad.
- Add privacy-friendly analytics (Plausible/Umami) — there's already a cookie-consent component. Can't improve traffic you can't measure.
- Seed liquidity: keep bot play and puzzles front-and-center so a solo visitor has fun immediately even when no humans are online.

### 3. Sustainability / donation model

- Reframe "donate" into something with a reason to pay: one-time supporter badge, board/piece themes (theming system already exists in `client/src/themes/`), or a Patreon framed as "keep the lights on."
- Be transparent about running costs. Niche communities often rally around a visible maintainer.

## What NOT to spend time on now

- More features. Already have puzzles, lessons, analysis, bots, ratings, spectating.
- Exception: **tournaments** (the one unchecked roadmap item) — a scheduled event gives a community a reason to show up at the same time. Worth it *after* there's a small community to invite.

## Concrete next steps I can help with

- Keep Northflank free-tier usage documented and within limits ([`ops-production-readiness.md`](ops-production-readiness.md))
- Verify the share-card/share-link flow embeds the URL and works on mobile
- Privacy-friendly analytics hook exists but stays **off** ($0) unless you set `VITE_PLAUSIBLE_DOMAIN`; do not buy Plausible Cloud for this
- Run the build and full test suite to confirm everything currently passes

## Key open questions

- Are we still within Northflank Sandbox free limits this month?
- Is Turso still on the free plan / within quota?

(Answers live in the Northflank + Turso dashboards; see the ops doc.)
