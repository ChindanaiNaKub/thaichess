# Browser Engine Assets

These files are generated from the `fairy-stockfish-nnue.wasm` npm package by:

```sh
npm run prepare:engine --workspace=client
```

The generated files are intentionally ignored by git:

- `/engines/fairy-stockfish.js`
- `/engines/stockfish.js`
- `/engines/stockfish.wasm`
- `/engines/stockfish.worker.js`
- `/engines/manifest.json`

High-level bot moves try this browser engine first. If the asset is missing or a
browser cannot run it, levels 8-12 still fall back to the server engine and then
to the lightweight local search so players do not get stuck waiting.
