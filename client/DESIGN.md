---
name: ThaiChess
description: Cloth-dark Makruk table — felt surfaces, amber play actions, gold only for game state
colors:
  cloth-dusk: "oklch(0.22 0.015 65)"
  cloth-deeper: "oklch(0.19 0.015 65)"
  cloth-lift: "oklch(0.26 0.015 65)"
  play-amber: "oklch(0.70 0.14 70)"
  state-gold: "oklch(0.74 0.09 85)"
  state-gold-soft: "oklch(0.74 0.09 85 / 0.55)"
  lacquer-green: "oklch(0.58 0.16 135)"
  lacquer-green-light: "oklch(0.66 0.18 135)"
  danger: "oklch(0.52 0.20 25)"
  success: "oklch(0.58 0.16 120)"
  text-body: "oklch(0.76 0.015 65)"
  text-bright: "oklch(0.90 0.01 65)"
  text-dim: "oklch(0.68 0.015 65)"
  board-base: "oklch(0.78 0.08 78)"
  board-grid: "oklch(0.58 0.05 72 / 0.42)"
typography:
  display:
    fontFamily: "Chakra Petch, IBM Plex Sans Thai, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, Leelawadee UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, Leelawadee UI, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  label:
    fontFamily: "IBM Plex Sans Thai, Noto Sans Thai, Leelawadee UI, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    letterSpacing: "0.18em"
  ui-sm:
    fontSize: "0.875rem"
  ui-xs:
    fontSize: "0.75rem"
  tabular:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "1.25rem"
  tabular-lg:
    fontSize: "1.5rem"
rounded:
  sm: "4px"
  md: "0.6rem"
  lg: "0.75rem"
  xl: "0.9rem"
  2xl: "1rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-play:
    backgroundColor: "{colors.play-amber}"
    textColor: "{colors.cloth-dusk}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    typography: "{typography.title}"
  button-play-hover:
    backgroundColor: "oklch(0.72 0.15 75)"
    textColor: "{colors.cloth-dusk}"
    rounded: "{rounded.md}"
  button-primary-soft:
    backgroundColor: "color-mix(in oklab, oklch(0.58 0.16 135) 18%, transparent)"
    textColor: "{colors.lacquer-green-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.cloth-dusk}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "color-mix(in oklab, oklch(0.19 0.015 65) 92%, transparent)"
    textColor: "{colors.text-body}"
    rounded: "{rounded.xl}"
    padding: "24px"
  card-soft:
    backgroundColor: "color-mix(in oklab, oklch(0.22 0.015 65) 88%, transparent)"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.cloth-dusk}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: ThaiChess

## Overview

**Creative North Star: "The Felt Table"**

ThaiChess sits on a warm cloth-dark table — isotropic felt noise over ember-tinted neutrals — so the Makruk board and pieces read as the light source, not a SaaS dashboard chrome stack. The room is quiet: soft tonal steps, restrained borders, and motion that respects `prefers-reduced-motion`. Personality is curious and welcoming without elitism; tradition shows up in material and stroke discipline, not ornamental gold.

Action is amber. Antique gold is rare on purpose — it signals turn, check, puzzle-solved, and endgame counting. Lacquer green remains for legacy chrome (nav active, soft primary washes, focus rings) but does not compete with Play Amber for “start a game.” Icons share the Bia (เบี้ย) stroke ratio so chrome and pieces feel like one family.

**Key Characteristics:**
- Cloth-dark felt surfaces (never pure black; never chess.com wood as app chrome)
- Play Amber for CTAs; State Gold reserved for turn / check / puzzle-solved / counting
- Display Chakra Petch + body IBM Plex Sans Thai (Thai-first stacks)
- Flat-by-default elevation; board and menus lift sparingly
- Tactile board-first: chrome recedes; pieces and board carry weight

## Colors

Warm, low-chroma dusk neutrals with a single amber play voice and a deliberately scarce gold state signal.

### Primary
- **Play Amber** (`oklch(0.70 0.14 70)` / `--color-accent` / `--accent-action`): Primary play CTAs and “start now” actions. Not gold. Not nav fill.

### Secondary
- **Lacquer Green** (`oklch(0.58 0.16 135)` / `--color-primary`): Legacy chrome — active nav underline, soft `.ui-btn-primary` washes, focus outline base. Keep subordinate to Play Amber on marketing/home play paths.
- **Lacquer Green Light** (`oklch(0.66 0.18 135)` / `--color-primary-light`): Hover/focus companion and soft-button text.

### Tertiary
- **State Gold** (`oklch(0.74 0.09 85)` / `--color-gold` / `--accent-gold`): Turn indicator, king-in-check pulse, puzzle-solved confirmation, and endgame counting panels.
- **State Gold Soft** (`oklch(0.74 0.09 85 / 0.55)` / `--accent-gold-soft`): Soft rings/glows for those game-state signals.

### Neutral
- **Cloth Dusk** (`oklch(0.22 0.015 65)` / `--color-surface` / `--surface-base`): App background; felt noise overlays at ~0.2 opacity, soft-light blend.
- **Cloth Deeper** (`oklch(0.19 0.015 65)` / `--color-surface-alt`): Sticky header / denser panels.
- **Cloth Lift** (`oklch(0.26 0.015 65)` / `--color-surface-hover`): Hover fills and card borders via color-mix.
- **Text Body / Bright / Dim** (`oklch(0.76|0.90|0.68 0.01–0.015 65)`): Tinted warm neutrals — never pure gray.
- **Board Base / Grid** (`oklch(0.78 0.08 78)` / `oklch(0.58 0.05 72 / 0.42)`): Default board field; player board themes may override via `themes/boards.ts`.

### Named Rules
**The Gold-Is-State Rule.** State Gold appears only for active turn, check pulse, puzzle-solved, and endgame counting. Soft gold washes may outline counting start controls inside that panel; never on Play Amber CTAs, nav, or marketing badges.

**The Cloth-Not-Wood Rule.** App chrome is felt dusk. Wood/jade/ivory board themes are player board skins, not the product shell.

**The One Play Voice Rule.** Starting a game uses Play Amber (or solid accent fills). Do not promote Lacquer Green to the primary play CTA on home/marketing surfaces.

## Typography

**Display Font:** Chakra Petch (with IBM Plex Sans Thai)
**Body Font:** IBM Plex Sans Thai (with Noto Sans Thai, Leelawadee UI, system-ui)

**Character:** Angular, sporty display for brand and hero moments; calm, Thai-capable UI sans for everything you read and tap. Tracking tightens slightly on headings (`-0.02em`).

### Hierarchy
- **Display** (Chakra Petch, bold, tight tracking): Hero / brand moments via `.font-display`.
- **Title** (700, `-0.02em`, `--color-text-bright`): Section and card titles (`.ui-title`).
- **Body** (16px / 1.5 base; `.ui-body` uses dim text at ~1.6 line-height): Explanations and supporting copy; prefer readable measure on long lesson text.
- **UI Small** (`0.875rem` / `text-sm`): Dense Operate chrome — clock player names, compact labels.
- **UI XSmall** (`0.75rem` / `text-xs`): Densest chrome — side-panel initials, meta under stress.
- **Tabular Digits** (`1.25rem` → `1.5rem` / `text-xl` → `sm:text-2xl`, monospace): Live clock times only.
- **Label / Eyebrow** (0.7rem, 700, `0.18em` uppercase, Play Amber): `.ui-eyebrow` — rare section markers, not paragraph style.

### Named Rules
**The Thai-First Stack Rule.** Always keep Thai-capable fallbacks in the body stack; do not ship Latin-only body fonts as the sole face.

**The Clock Tabular Rule.** In-game clocks use documented UI Small / Tabular Digit steps — never one-off `px`/`rem` literals outside this ramp.
## Layout

Operate density with a calm max width: sticky header content and most marketing/app chrome sit in `max-w-6xl` with `px-4 sm:px-6`. Home hero aims for board-bleed presence (ADR Variant A) rather than an inset card as the first viewport. In-game shells prioritize board real estate; side panels and move lists use compact rhythm (`gap` 2–3, soft cards). Mobile: hamburger + stacked `ui-btn-secondary` items; board coordinates shrink under 640px width. Short viewports (`max-height: 700px`) compress tall scroll regions.

Spacing rhythm follows Tailwind-style 4/8/16/24/32 steps; cards commonly use `p-5`–`p-8`.

## Elevation & Depth

**Flat-by-default / tonal.** Depth comes from Cloth Dusk → Deeper → Lift steps, soft `color-mix` borders, and the felt noise layer — not stacked drop shadows. Shadows are rare and purposeful: board frame lift, sticky dropdown menus (`shadow-xl`), piece drag/hover drop-shadows, and `.hover-lift` (1px translate + soft shadow). No ambient SaaS card glow as the default resting state.

### Shadow Vocabulary
- **Board frame** (`0 20px 36px oklch(0.10 0.02 65 / 0.28)` plus inset grid): Lifts the playing field off the cloth.
- **Menu popover** (`shadow-xl` on bordered surface-alt panel): Transient navigation only.
- **Hover lift** (`0 8px 18px rgba(0,0,0,0.14)` with `translateY(-1px)`): Optional accent for interactive tiles.
- **Focus halo** (`0 0 0 4px oklch(0.58 0.16 135 / 0.2)` with Lacquer Green Light outline): Keyboard visibility on dark cloth.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flat. Shadows appear for board presence, open menus, drag, or focus — not for every card.

## Shapes

Gently rounded, never pill-primary. Buttons and controls ≈ `0.6rem` (`.ui-btn-*`); soft cards ≈ `0.75rem`; primary cards ≈ `0.9rem`; Operate shells (Clock, Bot setup) share `1rem` / `rounded-2xl` — no one-off `1.75rem+` shells. Focus rings use ~4px corner ease. Legal-move dots and capture rings are circular on the board. Borders are hairline `color-mix` strokes against Cloth Lift — prefer ghost borders over hard dividers. Scrollbar thumb uses 3px radius on a 6px track.

### Named Rules
**The Soft-Corner Rule.** Prefer 0.6–0.9rem radii for chrome; reserve sharp 4px only for dense in-game chips (e.g. active move highlight).

## Components

Tactile board-first: chrome is quiet; the board and pieces do the heavy lifting.

### Buttons
- **Shape:** Soft rectangle (`0.6rem` / ~10px).
- **Play / Accent:** Solid Play Amber (`.button-accent-contrast` or `bg-accent`); dark cloth text or high-contrast white on solid fills; hover lightens slightly; active scales to `0.97`.
- **Primary soft:** Translucent Lacquer Green wash (`.ui-btn-primary`) for secondary emphasis — not the main “Play” path.
- **Secondary / Ghost:** Surface fill + Lift border (`.ui-btn-secondary`); bright text; hover fills Cloth Lift.
- **Focus:** Lacquer Green Light outline (2–3px) + soft halo; respect reduced motion.

### Chips
- Time-control / filter / side / strength chips share `.ui-choice` + `.ui-choice-selected` (Lacquer Green wash). Do not use Play Amber washes for selection — amber is reserved for start/find CTAs (`.button-accent-contrast`).
- Eyebrow-style uppercase tracking for rare status pills only.

### Cards / Containers
- **Corner Style:** `0.9rem` (`.ui-card`) or `0.75rem` (`.ui-card-soft`).
- **Background:** Translucent Cloth Deeper / Cloth Dusk mixes — not opaque white cards.
- **Shadow Strategy:** Flat-by-default; see Elevation.
- **Border:** Soft Lift mix, 1px.
- **Internal Padding:** Typically 20–32px (`p-5`–`p-8`).

### Inputs / Fields
- **Style:** Cloth surface, soft border, `rounded-md`/`lg`, bright text.
- **Focus:** Same Lacquer Green Light focus-visible system as buttons.
- **Error:** Danger tinted border/background wash (`danger` / `--color-danger`).

### Navigation
- Sticky header on Cloth Deeper with translucent backdrop; brand = white Khun piece mark + bold product name.
- Desktop: text links; active = Lacquer Green + 2px underline bar.
- Mobile: stacked secondary buttons; active gets primary border/wash.
- Language and auth controls stay compact (`h-7`–`h-9`) secondary buttons.

### Signature: Makruk Board & Pieces
- Board field uses theme tokens (`themes/boards.ts`); default grid is warm timber-tinted OKLCH in CSS.
- Selected / last-move / check / premove use restrained overlays; check pulses State Gold (honors reduced motion).
- Pieces: grab cursor, subtle lift on hover/select, stronger shadow while dragging; land animation is short and physical.
- Chrome icons: Bia stroke ratio `20/360` (`1/18` of viewBox) with round caps — one family with the pawn.

## Do's and Don'ts

### Do:
- **Do** put Play Amber on start-game / matchmaking CTAs.
- **Do** keep State Gold limited to turn, check, puzzle-solved, and endgame counting.
- **Do** preserve cloth felt noise and warm-tinted neutrals (never pure `#000` / pure gray text).
- **Do** use Chakra Petch for display moments and IBM Plex Sans Thai for UI/body.
- **Do** let the board bleed or dominate play surfaces; chrome stays subordinate.

### Don't:
- **Don't** spend State Gold on Play Amber CTAs, nav, or marketing chrome (counting panel washes are the exception).
- **Don't** restyle the app shell as wood/stone to “look like chess sites.”
- **Don't** invent purple SaaS gradients or glow-heavy dashboard cards as the default look.
- **Don't** drop Thai font fallbacks from the body stack.
- **Don't** ignore `prefers-reduced-motion` for check pulse, hero fade, or piece motion.
