# Makruk Rule Engine System

This document converts the Gameindy Makruk manuals into product and engine structure. It does not copy the manual text. It extracts the rule system and turns it into code-oriented architecture.

Authoritative references:

- [Basics of playing Thai chess](https://makruk.gameindy.com/manual/lets-get-to-know-basics-of-playing-thai-chess)
- [Difference between Sak Kradan and Sak Mak](https://makruk.gameindy.com/manual/what-is-the-difference-between-counting-sak-kradan-and-sak-mak)
- [Draw rules in Thai chess](https://makruk.gameindy.com/manual/what-are-the-rules-for-drawing-in-thai-chess)
- [Winning and losing decisions in Thai chess competitions](https://makruk.gameindy.com/manual/winning-and-losing-decisions-in-thai-chess-competitions-what-are-they)

## Rule Engine Structure

Shared rule source:

- [makrukRules.ts](/Users/kwanchanokroumsuk/Documents/thaichess/shared/makrukRules.ts)

Responsibilities:

- define piece movement facts and rule references
- expose authoritative counting helpers
- expose Makruk timeout-material evaluation
- keep rule logic reusable across engine, puzzles, and lessons

Engine integration:

- [engine.ts](/Users/kwanchanokroumsuk/Documents/thaichess/shared/engine.ts)

Makruk-native behaviors now centered in the engine:

- `Sak Mak` starts automatically when there are no unpromoted pawns and one side is bare king
- `Sak Kradan` remains request-based for the weaker side
- `Sak Mak` limits follow the Gameindy table:
  - 2 Rua: 8
  - 1 Rua: 16
  - 2 Khon: 22
  - 2 Ma: 32
  - 1 Khon: 44
  - 1 Ma, Met, or any number of Bia Ngai: 64
- immediate `Sak Mak` draw is detected when the starting count is already beyond the limit
- timeout resolution checks Makruk winning material instead of assuming any flag fall is a win

## Puzzle System Design

Shared design module:

- [makrukRulePuzzles.ts](/Users/kwanchanokroumsuk/Documents/thaichess/shared/makrukRulePuzzles.ts)

System shape:

- board position
- side to move
- counting context
- goal type
- expected action
- rule-native evaluation

Supported puzzle goals:

- force mate
- win before the count expires
- hold a draw
- evaluate a counting outcome
- choose the correct counting action

This lets the product support unique Makruk puzzles such as:

- immediate `Sak Mak` draw recognition
- choosing `Sak Kradan` instead of a move
- finishing before the count closes

Example puzzle:

- `sak-mak-immediate-draw` in [makrukRulePuzzles.ts](/Users/kwanchanokroumsuk/Documents/thaichess/shared/makrukRulePuzzles.ts)
- lesson-style answer: draw immediately, because the start count is already beyond the two-Rua `Sak Mak` limit

## Lesson Structure

Client lesson module:

- [makrukRuleLessons.ts](/Users/kwanchanokroumsuk/Documents/thaichess/client/src/lib/makrukRuleLessons.ts)

Lesson pattern:

- coach explains one rule
- board shows one rule state
- learner answers one decision question or plays one move
- feedback explains the Makruk rule behind the answer

Tracks:

- movement and results
- counting decisions

Example lesson:

- `when-sak-mak-starts` in [makrukRuleLessons.ts](/Users/kwanchanokroumsuk/Documents/thaichess/client/src/lib/makrukRuleLessons.ts)

It teaches:

- `Sak Mak` is automatic
- it needs no unpromoted pawns
- it needs one side to be bare king
- the entry position itself can already be a draw

## Notes

- I kept the system centered on counting instead of western defaults like the 50-move rule.
- The Gameindy draw page also mentions `รุกล้อ`; because the request explicitly asked not to build the system around repetition logic, this rule is documented as a Makruk draw category but not turned into a generic repetition engine here.
- The timeout clause for `ขุน + เบี้ยเทียม 3 ตัว` requires a shape interpretation. In code it is modeled narrowly as three adjacent same-rank unpromoted pawns and marked as an inference because the manual names the formation but does not formalize board coordinates.
