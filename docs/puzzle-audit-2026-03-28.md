# Puzzle Audit 2026-03-28

## Conclusion

The original set of `19` puzzles was not all broken.
It was mostly over-curated by the validator and under-curated by humans.

That means:

- the lines are usually legal
- the themes usually resolve correctly
- but too many puzzles feel synthetic, repetitive, or too weak to teach much

So the fix is not "make the engine stricter" alone.
The fix is to ship a smaller curated set and quarantine the rest.

## Curation Rule

Keep only puzzles that are both:

1. mechanically sound
2. distinct enough to teach a clear idea without feeling like a duplicate of a better puzzle

## Ship

- `#1 Corner Clamp`
  Clear beginner mate pattern with king and Khon support.
- `#6 Met-Supported Sweep`
  Distinct mate pattern because the Met support matters.
- `#8 Quiet Promotion`
  Cleanest basic promotion example in the set.
- `#10 Rook Harvest`
  Simple first tactical capture with a clear target.
- `#12 Open File Pickup`
  Better major-piece capture example than the weaker one-move pickups.
- `#13 Met Wins the Rua`
  Distinct tactic because the Met, not the rook, wins the material.

## Quarantine

- `#2 Long File Finish`
  Legal, but too close to other rook mate-in-1 positions and not the clearest representative.
- `#3 Sidewall Mate`
  Legal, but another minimal rook mate that does not add enough beyond the kept mate-in-1 entries.
- `#4 Seventh-Rank Ladder`
  Overlaps heavily with other rook-lift mate patterns.
- `#5 Central Ladder`
  Near-duplicate teaching value with `#4`.
- `#7 Supported Promotion`
  Promotion works, but the extra pieces add noise without improving the lesson.
- `#9 Met Escort`
  Another promotion-to-Met example that is weaker than `#8` as a first teaching puzzle.
- `#11 Backward Cleanup`
  Valid tactic, but less clean and less memorable than `#10`.
- `#14 Sideways Pickup`
  Valid tactic, but lower-value and less instructive than `#12`.
- `#15 Rook Pivot Mate`
  Engine-valid, but user feedback says the mate-in-2 position does not feel sound in actual play.
- `#16 Back Rank Switch`
  Valid mate in 2, but too similar to the other quarantined rook-reposition candidates to prioritize for re-review.
- `#17 File Fence`
  Engine-valid, but user feedback says the mate-in-2 position does not feel sound in actual play.
- `#18 Fifth-Rank Sweep`
  Valid mate in 2, but lower-priority than the other quarantined mate-in-2 candidates for real-play review.
- `#19 Double Rua Finish`
  Engine-valid, but user feedback says the mate-in-2 position does not feel sound in actual play.

## What This Means

Passing validation does not mean "good puzzle."

For this repo, validation currently proves:

- legal position
- forced solution path
- theme resolves
- copy is not obviously lying about the theme

It does not prove:

- strong teaching value
- good variety
- realistic or elegant construction
- that the puzzle is the best representative of its motif

## Product Decision Applied

The shipped puzzle catalog should be reduced to:

- `1`
- `6`
- `8`
- `10`
- `12`
- `13`

The remaining `13` puzzles should stay in repo only as quarantined data until they are rewritten or replaced.
