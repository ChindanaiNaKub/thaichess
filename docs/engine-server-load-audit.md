# Engine load audit (client WASM vs server)

> Audit for [#247](https://github.com/ChindanaiNaKub/thaichess/issues/247). Goal: lean on browser WASM for analysis/bots; reserve the Northflank app instance for multiplayer + persistence.

## Inventory

### Client (preferred for analysis / bots)

| Path | Role |
|------|------|
| `client/src/lib/browserEngineAnalysis.ts` + `workers/browserEngineAnalysisWorker.ts` | Fairy-Stockfish **WASM** position analysis |
| `client/src/lib/browserEngineBot.ts` + `workers/browserEngineBotWorker.ts` | WASM bot moves |
| `client/src/lib/localBot.ts` + `workers/botWorker.ts` | JS heuristic bot (offline fallback) |
| `client/src/hooks/useBotGameScreen.tsx` | Bot Games: WASM first → `/api/bot/move` / local JS fallback |
| `client/src/hooks/useReviewEngineAnalysis.ts` | Live position eval during review (browser-first with server fallback) |
| `scripts/setup-browser-fairy-stockfish.mjs` | Packages `fairy-stockfish-nnue.wasm` into the client build |

### Server HTTP (CPU-heavy if hit)

| Route | Implementation | Who calls it |
|-------|----------------|--------------|
| `POST /api/analysis/position` | `engineGateway.analyzePositionWithEngine` → remote service or Fairy-Stockfish **binary** | Review hook fallback; Analysis editor “analyze position” |
| `POST /api/analysis/game` | Full-game review (non-stream) | Legacy / rare |
| `POST /api/analysis/game/stream` | Full-game review via SSE | `analysisWorker` / `useGameAnalysis` (share-card accuracy, Analysis game mode) |
| `POST /api/bot/move` | `getBotMoveWithEngine` → binary/service or local JS | Bot Game **fallback** when WASM fails / high-level race |

### Server process (always-on cost when configured)

| Mechanism | Notes |
|-----------|--------|
| `warmUpReviewEngine()` on listen | Spawns/warms binary or service only if `FAIRY_STOCKFISH_BINARY_PATH` or `FAIRY_STOCKFISH_SERVICE_URL` is set |
| `fairyStockfishBinary.ts` lanes `analysis` + `bot` | Long-lived engine processes; Hash/Threads from env |
| `shared/engine.ts` via `gameManager` | **Rule legality / clocks** for live Games — not Stockfish; **must stay** on server |

### Offline / non-request (ignore for prod sizing)

Server `src/scripts/*` puzzle generators may call engines locally. They are not part of the live request path.

## Keep on server (justified)

1. **Live multiplayer rule validation** (`shared/engine` in `gameManager`) — authoritative Game state; not WASM.
2. **`/api/bot/move` as fallback** — older devices / WASM failure / high-level timeout race still need a move; rate-limited.
3. **Optional binary/service** — keep for signed-in Analysis depth and fallbacks; **do not require** it on Northflank free tier if WASM covers play.

## Move / prefer client (this pass + follow-ups)

| Item | Status | Hosting impact |
|------|--------|----------------|
| Post-game / review **position** eval defaulting to server | **Fixed:** default `engineSource` is now `browser-with-server-fallback` | Cuts routine `/api/analysis/position` traffic after every finished Game |
| Analysis “quick” mode | Already browser-first | — |
| Analysis full **game** stream (`/api/analysis/game/stream`) | **Stay for now** (heavier port); follow-up: WASM multipv game review | Largest remaining CPU spike when users open Analysis / accuracy share cards |
| Bot moves | Already WASM-first | Residual load only on fallback |

## Hosting sizing notes (Northflank Sandbox)

- **Without** `FAIRY_STOCKFISH_*` env: app RAM stays on Express + Socket.IO + Turso I/O; engine warm-up is a no-op. Prefer this for free-tier baseline.
- **With** binary configured: budget ~one Fairy-Stockfish process (Hash MB × lanes). Prefer unset binary in prod until Analysis stream is client-side.
- Client WASM shifts CPU to the player’s browser — correct for a niche free Product; watch share-card accuracy still triggers server game analysis until that follow-up ships.

## Follow-ups (not in this PR)

1. Port `useGameAnalysis` / `analysisWorker` to browser WASM (or hybrid) so share-card accuracy and Analysis game mode stop streaming from the origin.
2. After (1), consider removing prod binary from Northflank entirely and treating `/api/analysis/*` + `/api/bot/move` as optional/dev-only.
3. Product/infra: Cloudflare (#246) still helps static WASM assets more than engine CPU.
