# Puzzle Streak Tiered Attack Ladder Design

Date: 2026-04-11
Status: Approved in conversation, pending written-spec review
Related files:
- `/Users/kwanchanokroumsuk/Documents/thaichess/client/src/lib/puzzleStreak.ts`
- `/Users/kwanchanokroumsuk/Documents/thaichess/shared/puzzleImportQueue.ts`
- `/Users/kwanchanokroumsuk/Documents/thaichess/shared/puzzles.ts`

## Summary

The current puzzle streak uses a mostly score-based adaptive selector. That helps avoid impossible jumps, but it still produces a mixed teaching experience because tactical capture puzzles, practical attacking ideas, forks, and mating ideas can appear in an order that feels arbitrary. The platform now also has a smaller but more curated live pack, so the next step is to make streak progression feel intentional instead of merely random.

This design introduces a tiered attack ladder for the live puzzle streak. The streak should still shuffle puzzles within the current skill band, but it should no longer mix early-stage practical tactics with late-stage mate-preparation puzzles as though they were equivalent. The system should also bias the live pool away from loose capture-only ideas and toward attack-oriented Makruk ideas such as forks, force-mate lines, mating-net preparation, and practical attacking conversions.

## Goals

- Make streak progression feel like training that climbs from easier to harder.
- Keep puzzle order fresh by randomizing within a compatible level instead of fixing one rigid sequence.
- Increase the share of attack-oriented puzzles in the live pool.
- Prefer forks, force-mate patterns, and mate-preparation ideas over generic material grabs.
- Preserve the existing adaptive feel while making the opening phase easier and more coherent.

## Non-Goals

- Do not build a full puzzle curriculum UI or course browser in this phase.
- Do not replace the existing puzzle metadata model with a new rating system.
- Do not eliminate randomness completely.
- Do not rewrite the whole generation pipeline again in this phase.

## Core Design

### Tiered adaptive ladder

The streak should select puzzles by two dimensions:

1. `streakTier`
   - A coarse teaching band that represents what kind of attacking idea the user should face next.
2. `difficultyScore`
   - A fine-grained score used only inside the current tier or adjacent fallback tiers.

Instead of picking from the whole live pool by score distance alone, the selector should first choose a preferred tier based on solved streak count and recent performance. Then it should select a puzzle from that tier whose difficulty score is near the current adaptive target.

### Intended tiers

The live editorial pool should be grouped into four tiers:

1. `foundation`
   - beginner pin
   - direct fork
   - obvious forcing move
   - short tactical win with immediate purpose

2. `practical-attack`
   - double attack with real follow-up
   - trapped-piece win
   - practical pin before pickup
   - simple attacking conversion

3. `forcing-conversion`
   - fork with a non-trivial follow-up
   - restriction before gain
   - rook pin before collection
   - forcing tactical lines that remain human-plausible

4. `mate-pressure`
   - mate preparation
   - mating-net construction
   - force-mate sequences
   - count-critical attacking finishes

### Tier progression

The streak should open in `foundation`. After the player solves enough puzzles in the current run, the preferred tier should rise gradually:

- solved `0-2`: `foundation`
- solved `3-5`: `practical-attack`
- solved `6-8`: `forcing-conversion`
- solved `9+`: `mate-pressure`

Difficulty score still matters, but only after the preferred tier is chosen. This preserves the current adaptive behavior without letting the score system skip the teaching ladder.

### Failure behavior

A wrong move should not immediately collapse the user back to the easiest tactical content. Instead:

- remain on the same puzzle until solved, as the UI now does
- keep the current preferred tier for the next selection if the puzzle is eventually solved
- lower `adaptiveDifficultyScore` on failure as it does today
- only fall back one tier if the current tier has no suitable candidate near the target score

This keeps the system supportive without feeling punitive or chaotic.

## Live Pool Curation Policy

### What to add

The editorial live pool should be expanded with more attack-first puzzles in these families:

- knight fork with a meaningful follow-up
- force-mate in 2 or 3
- mate-preparation using rook barriers, interference, or escape-square restriction
- practical attacking sequences where the first move is forcing, not just greedy

### What to reduce

The live pool should avoid puzzles whose main lesson is only:

- loose capture without true forcing value
- material grab where the target can simply escape
- exchange or trade that is technically good but not practical for human solvers
- “already winning, just collect something” conversions

### Live-pool balance target

The shipped streak pool should aim for a strong attacking identity:

- at least one clear beginner pin or beginner fork
- multiple practical forks or double attacks
- multiple trap/restriction attacking conversions
- multiple mate-preparation or direct mating puzzles
- at least one count-critical attacking puzzle

The pool does not need equal counts by motif, but it should feel intentionally attack-oriented rather than capture-oriented.

## Selection Rules

1. Filter to live editorial puzzles only.
2. Filter to unlocked puzzles.
3. Determine preferred tier from `solvedCount`.
4. Build candidate set from that tier, excluding the recent-window history.
5. Rank by:
   - tier match
   - distance to adaptive difficulty score
   - recent theme penalty
   - anti-repetition penalty for identical motif families
6. If the tier has too few candidates, allow fallback to adjacent tiers only.
7. Randomize among the top shortlist so the order still feels fresh.

## Data Model

Each live puzzle should expose a tier signal. This can be implemented in one of two equivalent ways:

- explicit `streakTier` metadata on shipped puzzles
- derived tier from tags, theme, and difficulty score

Recommendation: add explicit `streakTier` metadata for live puzzles. It is simpler to reason about, easier to test, and easier to curate manually when the live pack is intentionally editorial.

Suggested values:

- `foundation`
- `practical_attack`
- `forcing_conversion`
- `mate_pressure`

## Testing Strategy

### Unit tests

- streak starts from `foundation`
- early solved counts do not surface `mate_pressure` puzzles
- mid-run solved counts can surface `practical_attack` and `forcing_conversion`
- high solved counts can surface `mate_pressure`
- selection prefers puzzles in the current tier before adjacent fallback tiers

### Curation regression tests

- live pool excludes known low-practicality puzzles that were manually removed
- live pool still contains at least one fork-family puzzle
- live pool still contains mate-preparation content
- live pool remains sorted and explainable by tier coverage

### UI regression tests

- streak still advances automatically after a correct solution
- wrong moves keep the current puzzle active
- board orientation and current layout remain unchanged by selector changes

## Rollout

### Phase 1

- Add `streakTier` to the live editorial puzzles.
- Update tests for tier-based pool coverage.

### Phase 2

- Update streak selection to choose by tier first, score second.
- Verify the new progression feels smoother in local play.

### Phase 3

- Add or promote more fork and mate-preparation puzzles into the live pack.
- Remove or demote remaining capture-only puzzles that feel non-practical.
