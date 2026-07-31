---
status: accepted
date: 2026-07-31
---

# ThaiChess brand visual system (cloth, gold-as-state, Bia stroke)

## Context

Map [#306](https://github.com/ChindanaiNaKub/thaichess/issues/306) needs a handoff that won’t drift: one short ADR, a copy-ready token table, and links to locked prototypes — not a stack of separate design docs. Visual locks for material / gold / chrome icons were decided in [#310](https://github.com/ChindanaiNaKub/thaichess/issues/310); homepage composition in [#309](https://github.com/ChindanaiNaKub/thaichess/issues/309); type in [#308](https://github.com/ChindanaiNaKub/thaichess/issues/308).

## Decision

| Topic | Lock |
|-------|------|
| Material | **Cloth** (felt) — isotropic noise; optional silk weave only as opacity &lt; 5% atmosphere, never as ornament |
| Gold | **State only** — active turn indicator, king-in-check pulse, puzzle-solved confirmation. Antique/desaturated. Not for buttons, nav, or badges |
| Icon stroke | Locked to traditional **Bia (เบี้ย)** — `stroke-width` **20** on viewBox **360** → ratio **1/18** of icon viewBox; round caps |
| Type (related) | Display **Chakra Petch**; body/UI **IBM Plex Sans Thai** ([#308](https://github.com/ChindanaiNaKub/thaichess/issues/308)) |
| Homepage (related) | Variant A board-bleed hero ([#309](https://github.com/ChindanaiNaKub/thaichess/issues/309)) |

## Token table

| Token | Value | Usage rule |
|-------|-------|------------|
| `--surface-base` | `oklch(0.22 0.015 65)` | Primary app background (cloth dark) |
| `--surface-cloth-noise` | fractalNoise overlay, opacity ~0.18–0.22 | Isotropic felt; no directional grain |
| `--accent-action` | `oklch(0.70 0.14 70)` (amber) | Primary CTAs / play actions — **not** gold |
| `--accent-gold` | `oklch(0.74 0.09 85)` | **Only** turn-indicator, check-pulse, puzzle-solved |
| `--accent-gold-soft` | `oklch(0.74 0.09 85 / 0.55)` | Soft ring/glow for the three gold states |
| `--icon-stroke-ratio` | `20 / 360` (= `1/18`) | Multiply by icon viewBox size → stroke-width |
| `--icon-stroke-width` | `calc(var(--icon-size) / 18)` | Every shared chrome icon |
| `--font-display` | `"Chakra Petch", sans-serif` | Hero / brand moments |
| `--font-body` | `"IBM Plex Sans Thai", sans-serif` | UI, body, controls |

Source constants: `client/src/lib/makrukStroke.ts` (shipped); prototype specimen on `prototype/tokens-icons-310`.

## Rejected alternatives

| Option | Why not |
|--------|---------|
| **Wood** | Default chess.com / Lichess texture — reads as “international chess, Thai-localized,” not Makruk-native |
| **Stone** | Cold/minimal reads closer to Go/Xiangqi; not the material Thai players associate with Makruk |
| **Gold as chrome** | Burns signal value; recreates the dashboard chrome [#306](https://github.com/ChindanaiNaKub/thaichess/issues/306) rejected |
| **Generic icon stroke** | Current Friend/Puzzle SVGs use unrelated stroke weights — won’t feel like one family with pieces |

## Consequences

- Re-skin shared chrome icons (`FriendSVG`, `PuzzleSVG`, `BotSVG`, `QuickPlaySVG`, and new settings/timer marks) to Bia stroke ratio — see prototype icons below.
- Replace purple/green SaaS primary usage on marketing/home with `--accent-action`; reserve `--accent-gold` for the three game states in board/UI chrome.
- Homepage implementation should follow Variant A (board bleed), not the current inset `ui-card` hero; remove empty-queue Puzzle Streak apology strip.
- Load Chakra Petch + IBM Plex Sans Thai explicitly (self-host or fonts CDN) — do not rely on system Noto alone.
- Light mode and in-game shell beyond homepage/shared chrome remain out of scope for this pack (see map fog).

## Prototype links (do not embed)

| Artifact | Where |
|----------|--------|
| Homepage composition (Variant A) | Branch `prototype/homepage-composition-309` — `/?variant=A` |
| Cloth / gold / icons specimen (Variant A felt) | Branch `prototype/tokens-icons-310` — `/prototype/brand-tokens?variant=A` |
| Visual asset audit | Branch `research/audit-visual-assets-and-tokens` — `docs/thaichess-visual-assets-and-tokens-audit.md` |
| Map | [#306](https://github.com/ChindanaiNaKub/thaichess/issues/306) |
