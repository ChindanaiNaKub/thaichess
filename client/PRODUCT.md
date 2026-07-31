# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: chess players (casual to intermediate), roughly 18–45, English or Thai speaking, who already know Western chess basics and want a new variant without signup friction. Job: play Makruk now — live opponent or bot — learn rules through lessons, practice with puzzles, and optionally sign in for ratings and history.

Secondary: Thai diaspora and Southeast Asia culture enthusiasts who want an accessible digital Makruk experience to share with family.

## Product Purpose

ThaiChess is a free, open-source online platform for Makruk (Thai chess). It exists so people can play, learn, and practice authentic Makruk instantly in the browser. Success means a player can start a game in seconds, understand how Makruk differs from Western chess, and return for live play, puzzles, lessons, and (when signed in) rated games.

## Positioning

Purpose-built for Makruk — not a generic chess site with Makruk bolted on. Free and playable without an account; structured lessons, live multiplayer, puzzle practice, and bot fallback so the player is never stuck waiting alone. Distinct from multi-variant sites (e.g. PyChess, PlayOK) by Makruk-first rules, learning path, and zero-friction onboarding.

## Operating Context

Played in the browser at thaichess.dev. Core loops: find or start a Game (live Socket.IO matchmaking or vs bot), study lessons / how-to-play content, solve puzzles, check leaderboards, manage a User account (Better Auth) or continue as Guest (`guest_*` ID). Optional Donation supports hosting. Bilingual EN/TH. Community touchpoints include Discord; marketing channels (Reddit, YouTube, SEO) are outside the product UI but shape who arrives.

## Capabilities and Constraints

Confirmed:

- Live multiplayer Makruk over Socket.IO; bot play when no human opponent
- Puzzles, lessons / how-to-play, ratings (Elo on rated Games), leaderboards
- Guest play without signup; User accounts for persistent profile, ratings, history
- Authentic Makruk rules including promotion and endgame counting
- Bilingual English / Thai product UI
- Opt-in PrivacyAnalytics only after AnalyticsConsent; no advertising identity by default
- Voluntary Donation page for hosting/development costs
- Open source (npm workspaces: React/Vite client, Express server, shared engine)

Terminology (must preserve in product copy): Product = ThaiChess; game = Makruk; User vs Guest vs Player; Game (prefer over Match in user-facing copy); Rated game; Donation.

Undecided / not captured here: formal accessibility conformance target (WCAG level not set; a11y tests and keyboard/SR expectations exist in CONTRIBUTING); pricing beyond free + donations.

## Brand Commitments

- Product name in UI and marketing: **ThaiChess** (not Markrukthai / MarkrukThai — those are repo/engine names)
- Voice: curious, welcoming, respectful of tradition; never elitist
- Tagline direction from existing copy: Makruk as chess that evolved differently in Thailand; playable in seconds; no signup / no waiting
- Assets on hand: favicons and PWA icons (`client/public/favicon.*`, `icon-192.*`, `icon-512.*`), `og-image.jpg`, donate QR, bot avatars, Makruk board/piece reference imagery under `assets/`

## Evidence on Hand

- Live product: https://thaichess.dev
- Domain glossary and naming: `CONTEXT.md` (repo root)
- Marketing ICP and positioning draft: `docs/Marketing Strategy.md`
- How-to-play and engine docs: `docs/how-to-play.md`, `docs/makruk-rule-engine-system.md`, `docs/makruk-native-lesson-system.md`
- A11y test harness exists (`client/src/test/a11y.test.tsx`); CONTRIBUTING encourages screen reader and keyboard support
- Do not fabricate testimonials, press quotes, user counts, or competitive win rates not already in repo docs

## Product Principles

1. Instant play over gatekeeping — Guest can start before any account wall.
2. Makruk authenticity over chess-generic shortcuts — rules, counting, and learning reflect the real game.
3. Never leave the player stranded — bot fallback and clear learning paths when live opponents are scarce.
4. Respect identity and privacy — clear User/Guest/Player language; analytics only with consent.
5. Bilingual by default — EN and TH are first-class, not an afterthought.
