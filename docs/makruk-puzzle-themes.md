# Makruk Puzzle Themes

This project now uses a Makruk-adapted theme catalog derived from Chess.com's tactics taxonomy:

- source article: https://www.chess.com/article/view/chess-tactics
- local catalog: [shared/puzzleThemes.ts](/home/prab/Documents/markrukthai-1/shared/puzzleThemes.ts)

## Supported Now

These themes fit the current validator and solver model because they end in one of the outcomes the repo can already verify:

- `mate`: `Checkmate`, `BasicCheckmate`, `MateIn1`, `MateIn2`, `MateIn3`, `BackRank`, `MatingNet`, `SupportMate`, `SmotheredMate`
- `promotion`: `Promotion`
- `material`: `Tactic`, `Fork`, `DoubleAttack`, `Pin`, `Skewer`, `Discovery`, `DoubleCheck`, `HangingPiece`, `TrappedPiece`, `Interference`, `Overloading`, `RemovalOfDefender`, `Decoy`, `Deflection`, `Clearance`, `Sacrifice`, `ExchangeSacrifice`, `Desperado`, `Simplification`, `Endgame`, `XRay`, `Windmill`, `Zwischenzug`

## Makruk Adaptations

Some Chess.com themes do not map 1:1 to Makruk rules, so they were adapted instead of copied literally:

- `Attacking f7/f2` and `Attacking the Castled King` are folded into `VulnerableKing`
  Makruk has no castling and no identical f7/f2 opening weakness, but exposed king-shelter attacks still exist.
- `Queen Sacrifice` is folded into the broader `Sacrifice` family
  Makruk has no queen; forcing major sacrifices still matter, but the tactical lesson is the sacrifice itself.
- `Underpromotion` is folded into `Promotion`
  Makruk promotion is fixed to a met, so there is no underpromotion branch to teach separately.

## Future Themes

These are cataloged but not fully enforced by the current validator yet:

- `VulnerableKing`
- `Defense`
- `PerpetualCheck`
- `Stalemate`

Those need goal-specific validation beyond the current mate / promotion / material-win checks.

## Implementation Notes

- Theme-family helpers live in [shared/puzzleThemes.ts](/home/prab/Documents/markrukthai-1/shared/puzzleThemes.ts).
- Puzzle validation now reads theme families from that shared catalog in [shared/puzzleValidation.ts](/home/prab/Documents/markrukthai-1/shared/puzzleValidation.ts).
- Solver theme satisfaction now uses the same catalog in [shared/puzzleSolver.ts](/home/prab/Documents/markrukthai-1/shared/puzzleSolver.ts).
- Client labels for the expanded theme set are in [client/src/lib/i18n.tsx](/home/prab/Documents/markrukthai-1/client/src/lib/i18n.tsx).
