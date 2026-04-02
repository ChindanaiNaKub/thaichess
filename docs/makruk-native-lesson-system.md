# Makruk-Native Lesson System

This course outline uses the structure of [makrukthai.blogspot.com](https://makrukthai.blogspot.com) as a knowledge reference, not as copy. The goal is to turn recurring Makruk teaching clusters on that site into a modern lesson product that feels like a coach on top of a board.

## Reference Signals

The site repeatedly groups Makruk knowledge around:

- beginner movement and piece identity
- named opening families such as `Ma Yong`, `Ma Phuk`, and `Ma Thiam`
- Thai pawn-structure language such as `bia sung`, `bia phuk`, `bia thiam`, and `bia kao`
- middlegame ideas about tied pieces, expanding an edge, and avoiding a `ruea loi`
- endgame `lai` patterns, correct-corner vs wrong-corner logic, and counting rules
- Thai-first vocabulary such as `bia ngai`, `sak kradan`, and `sak mak`

## Product Conversion Rules

Each lesson is built around one idea only.

- Show one board position immediately.
- Ask the learner to choose or play one move.
- Explain why the Makruk idea works in that exact shape.
- Give feedback that redirects the learner back to the pattern, not to abstract theory.

This keeps the experience coach-like instead of article-like.

## Course Structure

### 1. Foundations Of Makruk Shape

- Battlefield and piece limits
- Met and Khon as short-range control pieces
- First `bia sung na met`
- Promotion lane to `bia ngai`

### 2. Opening Formations

- `Ma Yong` right entry
- `Ma Yong` left entry
- `Ma Phuk` vs `Ma Thiam`
- Pawn-structure language: `bia phuk`, `bia thiam`, `bia kao`, inside vs outside pawn

### 3. Middlegame Pressure

- Avoiding `ruea loi`
- Expanding a small edge instead of forcing tactics
- Khon plus Met support nets
- Stacked rook lane pressure

### 4. Endgame Chasing

- Counting awareness: `sak kradan` and `sak mak`
- Correct corner with `bia ngai`
- Khon and `bia ngai` chasing skeletons
- Ma against `bia ngai` escape control

### 5. Thai Terms In Action

- Read the board through Thai terms
- Choose the best plan from Thai pattern names

## Example Lesson Pattern

`First Bia Sung Na Met`

- Scene 1: show the starting shape and highlight the Met file
- Question: which move creates the named Thai structure?
- Feedback: `e3-e4` is right because it creates a real Makruk landmark, not just "center control"
- Scene 2: show the new high pawn
- Question: which supporting move keeps the shape healthy?
- Feedback: support first, because a loose high pawn becomes a target
- Wrap: name the pattern, its purpose, and the next practical follow-up

The matching data lives in [client/src/lib/makrukNativeLessonSystem.ts](/Users/kwanchanokroumsuk/Documents/thaichess/client/src/lib/makrukNativeLessonSystem.ts).
