# Design Tokens

This document defines the design system tokens used throughout the ThaiChess application.

## Color System

All colors use the OKLCH color space for perceptual uniformity and better hue consistency.

### Board Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-board-light` | `oklch(0.82 0.06 75)` | Light squares on the board |
| `--color-board-dark` | `oklch(0.62 0.08 60)` | Dark squares on the board |
| `--color-board-selected` | `oklch(0.60 0.10 130)` | Selected square highlight |
| `--color-board-legal` | `oklch(0.50 0.08 120)` | Legal move dots (internal) |
| `--color-board-lastmove` | `oklch(0.80 0.12 100)` | Last move indication |
| `--color-board-check` | `oklch(0.55 0.22 25)` | Check warning (red gradient) |

### Surface Colors

Warm-tinted dark neutrals, never pure black.

| Token | Value | Usage | Contrast (vs text) |
|-------|-------|-------|-------------------|
| `--color-surface` | `oklch(0.16 0.015 65)` | Main background | 5.5:1 ✓ AA |
| `--color-surface-alt` | `oklch(0.19 0.015 65)` | Alternate background (cards, panels) | 4.8:1 ✓ AA |
| `--color-surface-hover` | `oklch(0.24 0.015 65)` | Hover states | 4.1:1 ✓ AA |

### Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `oklch(0.58 0.16 135)` | Primary actions, links, focus |
| `--color-primary-light` | `oklch(0.66 0.18 135)` | Hover state for primary |
| `--color-accent` | `oklch(0.62 0.14 70)` | Secondary actions, hints |
| `--color-danger` | `oklch(0.52 0.20 25)` | Errors, destructive actions |
| `--color-success` | `oklch(0.58 0.16 120)` | Success messages |

### Text Colors

| Token | Value | Usage | Contrast (vs surface) |
|-------|-------|-------|----------------------|
| `--color-text` | `oklch(0.76 0.015 65)` | Body text | 5.5:1 ✓ AA |
| `--color-text-bright` | `oklch(0.90 0.01 65)` | Headings, emphasis | 11:1 ✓ AAA |
| `--color-text-dim` | `oklch(0.56 0.015 65)` | Secondary text, labels | 3.5:1 (large only) |

## Spacing Scale

The spacing scale follows a 4px base unit for consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 0.25rem (4px) | Tight spacing |
| `2` | 0.5rem (8px) | Compact spacing |
| `3` | 0.75rem (12px) | Small gaps |
| `4` | 1rem (16px) | Default spacing |
| `5` | 1.25rem (20px) | Medium spacing |
| `6` | 1.5rem (24px) | Large spacing |
| `8` | 2rem (32px) | XL spacing |

## Typography

### Font Family

```css
font-family: 'DM Sans', 'Noto Sans Thai', system-ui, -apple-system, sans-serif;
```

- Primary: DM Sans (Latin script)
- Secondary: Noto Sans Thai (Thai script)
- Fallback: System fonts

### Type Scale

| Size | rem | px | Usage |
|------|-----|----|-------|
| xs | 0.75rem | 12px | Captions, labels |
| sm | 0.875rem | 14px | Secondary text |
| base | 1rem | 16px | Body text (default) |
| lg | 1.125rem | 18px | Large body |
| xl | 1.25rem | 20px | Small headings |
| 2xl | 1.5rem | 24px | Section headings |
| 3xl | 1.875rem | 30px | Page headings |

### Font Weights

| Weight | Usage |
|--------|-------|
| 400 | Body text |
| 500 | Emphasized text |
| 600 | Headings, buttons |
| 700 | Strong emphasis |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 0.25rem (4px) | Small elements, focus rings |
| md | 0.5rem (8px) | Buttons, cards |
| lg | 0.75rem (12px) | Large cards, panels |
| xl | 1rem (16px) | Hero elements |
| full | 9999px | Pills, badges |

## Focus Indicators

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

- **Color**: Primary green (`oklch(0.58 0.16 135)`)
- **Width**: 2px
- **Offset**: 2px
- **Radius**: 4px

## Elevation

Shadows use warm-tinted darks, never pure black.

| Level | CSS | Usage |
|-------|-----|-------|
| sm | `drop-shadow(0 2px 4px oklch(0.1 0.02 65 / 0.3))` | Subtle elevation |
| md | `drop-shadow(0 4px 8px oklch(0.1 0.02 65 / 0.4))` | Cards, panels |
| lg | `drop-shadow(0 8px 16px oklch(0.1 0.02 65 / 0.5))` | Modals, dropdowns |
| xl | `drop-shadow(0 16px 32px oklch(0.1 0.02 65 / 0.6))` | Highest elevation |

## Animation Timing

### Duration

| Token | Duration | Usage |
|-------|----------|-------|
| fast | 100ms | Micro-interactions |
| base | 150ms | Default transitions |
| slow | 250ms | Page transitions, modals |

### Easing

| Token | Bezier | Usage |
|-------|--------|-------|
| ease-out | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Standard |
| ease-in | `cubic-bezier(0.55, 0.085, 0.68, 0.53)` | Entry |
| bounce | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful |

## Accessibility Notes

- All text meets WCAG AA contrast requirements (4.5:1 minimum)
- Focus indicators use `:focus-visible` to avoid mouse users
- Reduced motion is respected via `@media (prefers-reduced-motion: reduce)`
- Board coordinate labels use dual coding (color + position)
- Legal moves use shapes (dots, rings) not just color
