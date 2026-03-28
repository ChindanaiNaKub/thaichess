# Puzzle Generation Workflow

## Goal

Generate better puzzle candidates from real games or exported move lists, then keep them quarantined until they survive review.

## Why This Workflow

- real games produce more believable positions than synthetic hand-placement alone
- the repo already has a forcing-line validator and audit pipeline
- the missing step was mining candidate positions into draft puzzles

## Command

Use the generator script:

```bash
npm run generate:puzzle-candidates --workspace=server
```

Useful flags:

```bash
npm run generate:puzzle-candidates --workspace=server -- --limit 100 --filter rated --max-per-game 2 --starting-id 4000 --min-source-moves 16 --reject-result-reasons agreement,max_plies,stopped
```

If the local database has no finished games yet, mine from a JSON file instead:

```bash
npm run generate:puzzle-candidates --workspace=server -- --input ./tmp/exported-games.json --starting-id 4000
```

Expected JSON shape:

```json
[
  {
    "id": "game-1",
    "source": "Rated game export",
    "moves": [
      {
        "from": { "row": 2, "col": 4 },
        "to": { "row": 3, "col": 4 }
      }
    ]
  }
]
```

## Turso Export

If production finished games live in Turso, export them first with the same database env vars the app uses:

```bash
npm run export:puzzle-sources --workspace=server -- --limit 500 --filter rated --min-source-moves 16 --output ../tmp/turso-puzzle-sources.json
```

Then mine that exported corpus locally as many times as you want:

```bash
npm run generate:puzzle-candidates --workspace=server -- --input ../tmp/turso-puzzle-sources.json --starting-id 5000
```

If you want a review-ready markdown pack at the same time:

```bash
npm run generate:puzzle-candidates --workspace=server -- --input ../tmp/turso-puzzle-sources.json --starting-id 5000 --markdown-output ../tmp/turso-puzzle-review.md
```

Note:

- when you run `npm run ... --workspace=server`, relative paths are resolved from `server/`
- use `../tmp/...` if you want files under the repo-root `tmp/` directory
- keep the whole command on one line; splitting the markdown path onto the next line makes the shell treat it as a separate command

This is the recommended path for real-game mining because:

- it pulls from the same Turso connection settings used by production
- it gives you a stable local JSON corpus for repeatable mining runs
- it avoids re-querying Turso every time you tweak generation settings
- it can now emit a score-sorted markdown review file directly

## What The Script Does

1. Load recent finished games from the database, or read a JSON move export.
2. Filter out low-value source games such as very short games or capped self-play runs.
3. Scan 3-ply windows across each remaining move list.
4. Try to convert each window into a checkmate, promotion, or tactic candidate.
5. Reject anything that fails the existing puzzle validator.
6. Print only valid draft candidates as JSON snippets for manual review.

## Review Standard

A generated draft is still not ready to ship.

After generation:

1. Paste only the strongest drafts into [shared/puzzleImportQueue.ts](/home/prab/Documents/markrukthai-1/shared/puzzleImportQueue.ts)
2. Run:
   - `npm run validate:puzzle-candidates --workspace=server`
   - `npm run audit:puzzle-candidates --workspace=server`
3. Review:
   - theme clarity
   - teaching value
   - duplicate risk
   - whether the position feels sound in actual play
4. Promote only reviewed candidates by setting `reviewStatus: 'ship'` and passing the checklist

## Current Limitation

This first workflow mines only 3-ply candidates. That matches the current need for trustworthy multi-ply imports without overcomplicating the generator.

## Optional Self-Play Source

If you do not have enough real finished games yet, generate offline self-play exports first:

```bash
npm run generate:selfplay --workspace=server -- --count 50 --output ./tmp/selfplay.json --white hard --black hard --opening-min 4 --opening-max 10 --max-plies 160 --seed 1
```

Then mine candidates from that export:

```bash
npm run generate:puzzle-candidates --workspace=server -- --input ./tmp/selfplay.json --starting-id 5000
```

Treat self-play as a fallback source, not an auto-publish source. It is useful for volume, but it still needs review because bot-vs-bot positions can feel synthetic.

## Local Autoloop

If you want an autoresearch-style local loop, run:

```bash
npm run generate:puzzle-loop --workspace=server -- --cycles 20 --games-per-cycle 25 --output-dir ./tmp/puzzle-loop --white medium --black medium --opening-min 4 --opening-max 10 --max-plies 80 --max-candidates-per-game 2 --max-cycle-candidates 20 --min-source-moves 16 --min-candidate-score 900 --seed 1
```

If you want it to keep running until you stop it manually:

```bash
npm run generate:puzzle-loop --workspace=server -- --forever --games-per-cycle 25 --output-dir ./tmp/puzzle-loop --white medium --black medium --opening-min 4 --opening-max 10 --max-plies 80 --max-candidates-per-game 2 --max-cycle-candidates 20 --min-source-moves 16 --min-candidate-score 900 --seed 1
```

What it does:

1. plays a batch of self-play games
2. mines 3-ply puzzle candidates in memory
3. writes per-cycle game exports and candidate JSON into `./tmp/puzzle-loop`
4. keeps running for the requested number of cycles
5. if you pass `--forever`, it keeps cycling until you stop the process
6. ranks candidates by score, drops duplicate fingerprints across the whole loop, and keeps only the strongest cycle output

This is the fastest local loop in the current repo because it avoids reloading scripts between every game.
