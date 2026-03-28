# Puzzle Quality Recovery Plan

## Problem

The current puzzle dataset has content-quality failures that users can feel immediately:

- the tactic does not match the description
- the explanation teaches the wrong idea
- the puzzle has multiple reasonable answers
- the listed solution branch is buggy or confusing

This is more important than adding more puzzle content right now.

## Assessment of `ffish`

Package:

- https://www.npmjs.com/package/ffish

What it is:

- a WebAssembly wrapper around Fairy-Stockfish
- technically capable of variant analysis
- Fairy-Stockfish supports Makruk

Why it is not the first fix:

1. The repo already has a custom puzzle validator and solver:
   - `shared/puzzleSolver.ts`
   - `shared/puzzleValidation.ts`
   - `server/src/scripts/validatePuzzles.ts`
2. The current failures are mostly content acceptance failures, not absence of an engine
3. Adding another engine path now would raise complexity in an area that already had Fairy-Stockfish-related regressions and reverts
4. `ffish` is GPL-3.0, while this repo is MIT, so shipping it inside the product needs careful license review

## Recommendation

### Now

Do a dataset and validation cleanup first.

Current status after the first curation pass:

- validator guardrails are stricter
- the live set should be treated as a curated subset, not the whole raw catalog
- see `docs/puzzle-audit-2026-03-28.md` for the current keep/quarantine split

### Later

If stronger engine-backed verification is still needed, consider Fairy-Stockfish only as:

- an offline audit tool
- a pre-publish verification step
- a separate service boundary

Do not make it the first response to low-quality puzzle content.

## Next Task

### Task name

Puzzle Audit And Quarantine

### Goal

Make the puzzle set trustworthy before adding new generation or engine integration work.

### Scope

1. Audit `shared/puzzles.ts`
2. Identify puzzles that are:
   - incorrect
   - ambiguous
   - low teaching value
   - mismatched with title/description/explanation
3. Remove or quarantine bad puzzles from the shipped catalog
4. Strengthen `shared/puzzleValidation.ts`
5. Add regression tests for the new validation rules
6. Add explicit review status metadata so publishing is not controlled by a temporary hard-coded subset

## Acceptance Criteria

The task is complete only when all of the following are true:

1. Every shipped puzzle passes the current validator
2. Every shipped puzzle has exactly one intended first move
3. The final solution state actually matches the declared theme
4. Puzzle description and explanation match the winning idea
5. Broken puzzles are removed or excluded from the shipped set
6. New tests fail when a puzzle has:
   - multiple winning first moves
   - a mismatched theme
   - a too-vague or misleading explanation rule that should now be rejected

## Suggested Implementation Order

1. Run a manual audit on the current puzzle list
2. Tag each puzzle as:
   - keep
   - fix
   - remove
3. Tighten validation rules around:
   - theme correctness
   - ambiguity
   - explanation quality floor
4. Ship only the curated subset and quarantine the rest
5. Add tests covering the failures found in the audit
6. Only after that, decide whether engine-backed verification is still needed

## Non-Goals

- adding more starter puzzles
- integrating `ffish` into the live app
- rebuilding the analysis stack
- revisiting Fairy-Stockfish runtime integration yet
