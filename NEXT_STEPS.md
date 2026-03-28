# Handoff Note

## Repo

- Path: `/home/prab/Documents/markrukthai-1`
- Recommended branch start point: `main`

## Recently Implemented

- Rating UX improvements:
  - player ratings shown in recent games
  - player ratings shown in live game header and waiting room
  - leaderboard links added from home and account
- Recent games filters:
  - `All`
  - `Rated`
  - `Casual`
- Recent-games API now supports server-side filtering and filtered counts

## Verified Recently

- Client tests for `GamesPage` passed
- Client tests for `GamePage` passed
- Client tests for `AccountPage` passed
- Server tests for `gameManager` passed
- Server tests for `database-rating` passed
- Server build passed
- Client build passed

## Current Product Issue

Puzzle quality is now the main problem.

Observed issues:

1. Some puzzles do not match their title or description
2. Some puzzles have low teaching value
3. Some puzzles are buggy or ambiguous
4. Static puzzle content quality is worse than the current validation rules catch

Current status:

- the puzzle validator is stricter than before
- but "validator pass" still does not mean "worth shipping"
- the catalog has now been split into shipped puzzles vs quarantined puzzles
- see `docs/puzzle-audit-2026-03-28.md` for the keep/quarantine list

## Next Recommended Task

Move into a puzzle quality recovery pass before adding more puzzle content.

### Immediate next task

Finish the puzzle quarantine workflow:

1. Keep auditing every new puzzle before it reaches the shipped set
2. Add explicit review metadata instead of relying on a hard-coded shipped ID list
3. Build an import path for generated puzzles that defaults to quarantine
4. Add a simple reviewer checklist for:
   - theme clarity
   - teaching value
   - duplicate motif detection

### Why this is next

- The puzzle system already has validation code, but bad content is still getting through
- This is a product-trust problem, not just a code-quality problem
- Adding more generators or engines before fixing acceptance criteria will just create more bad puzzles faster
- The live set is smaller now, but the publishing workflow is still too manual

## ffish Assessment

Reference package:

- `ffish` on npm: https://www.npmjs.com/package/ffish

Current recommendation:

- Do **not** make `ffish` the next implementation task

Reasoning:

1. It can help with Makruk-capable engine verification because it is a WebAssembly wrapper around Fairy-Stockfish and Fairy-Stockfish supports Makruk
2. It does **not** solve bad puzzle descriptions, weak teaching quality, or curation mistakes by itself
3. It introduces more runtime and integration complexity in an area that already had previous Fairy-Stockfish revert history
4. The package is GPL-3.0, while this repo is MIT, so bundling it into the product needs careful license review before adoption

Safer use, if revisited later:

- as an offline puzzle-audit tool
- as a separate verification service boundary
- not as the first fix for the current puzzle-quality problem

## Resume Prompt

Use this when starting a new session:

```text
Repo: /home/prab/Documents/markrukthai-1
Branch: main

Recently completed:
- rating UX in live games and recent games
- leaderboard links from more entry points
- recent games filters: all / rated / casual

Current problem:
- puzzle dataset quality needs human curation, not just validator checks
- only the curated subset should be shipped

Next task:
Finish the puzzle quarantine workflow.

Start from docs/puzzle-audit-2026-03-28.md and turn the hard-coded shipped subset into explicit review metadata.
```
