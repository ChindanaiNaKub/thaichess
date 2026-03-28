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
- explicit review metadata and checklist now exist on puzzles
- imported/generated puzzles now enter through a separate quarantine queue by default
- the current mate-in-2 puzzles have been re-quarantined after user feedback that they do not feel sound in actual play
- the import queue now has an initial multi-ply candidate batch ready for review

## Next Recommended Task

Move into a candidate review pass before promoting any new puzzle content.

### Immediate next task

Review the seeded candidate queue and promote the strongest first batch:

1. Run candidate-only checks:
   - `npm run validate:puzzle-candidates --workspace=server`
   - `npm run audit:puzzle-candidates --workspace=server`
2. Review the batch with the checklist:
   - theme clarity
   - teaching value
   - duplicate risk
3. Cut or rewrite candidates that still feel synthetic, duplicate-heavy, or awkward in actual play
4. Promote only the strongest candidates by setting:
   - `reviewStatus: 'ship'`
   - passing review checklist fields
5. Do not ship any mate-in-2 candidate until it survives real play review, not only engine validation

### Why this is next

- The pipeline exists now and the first candidate batch is seeded
- The current shipped set is intentionally limited to the simpler puzzles that still feel trustworthy
- The biggest content gap is the lack of trustworthy multi-ply puzzles
- The highest-value product improvement is better puzzle content, not more pipeline code

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
- the next gap is content depth: the current trustworthy shipped set has no multi-ply puzzles after quarantining the bad-feeling mate-in-2 group, even though the candidate queue now has a first batch to review

Next task:
Review the imported puzzle candidate batch and only promote candidates that still feel sound in actual play.

Start from shared/puzzleImportQueue.ts and add stronger multi-ply candidates, then run validate/audit on candidates before promoting any of them.
```
