# ThaiChess — The Ancient Art of Chess ♟

A free, open-source ThaiChess platform inspired by [Lichess](https://lichess.org). Play with friends online — no registration required.

> **Our mission:** Make ThaiChess famous worldwide. Thai chess is one of the oldest board games in existence — it deserves a world-class online platform.

## Features

- **Play with Friends** — Create a game and share the link instantly
- **Real-time Multiplayer** — WebSocket-based instant move updates
- **Local Play** — Practice on the same screen at `/local`
- **Time Controls** — Bullet, Blitz, Rapid, and Classical presets
- **Full ThaiChess Rules** — Complete game engine with all 6 piece types
- **Game History** — All completed games saved and browsable at `/games`
- **Beautiful UI** — Lichess-inspired dark theme with custom SVG pieces
- **Drag & Drop** — Move pieces by dragging or clicking
- **Mobile Friendly** — Touch support, responsive design, installable as PWA
- **Sound Effects** — Audio feedback for moves, captures, and checks
- **Game Controls** — Draw offers, resignation, and rematch
- **100% Free** — No ads, no paywall, no registration

## Quick Start (Development)

```bash
npm install
npm run dev
```

This starts both the server (port 3000) and client (port 5173). Open http://localhost:5173 to play.

## Fairy-Stockfish Integration

The app can use a real Fairy-Stockfish engine for bot play and game review without bundling the engine binary into this repo.

Supported engine modes:

- `FAIRY_STOCKFISH_SERVICE_URL` — point to a separate HTTP engine service
- `FAIRY_STOCKFISH_BINARY_PATH` — point directly to a locally installed Fairy-Stockfish executable

Optional tuning:

- `FAIRY_STOCKFISH_THREADS`
- `FAIRY_STOCKFISH_HASH_MB`

Example local setup:

```bash
export FAIRY_STOCKFISH_BINARY_PATH=/absolute/path/to/fairy-stockfish
export FAIRY_STOCKFISH_THREADS=1
export FAIRY_STOCKFISH_HASH_MB=64
npm run dev
```

If neither engine mode is configured, the app falls back to the built-in local evaluator and bot.

Live bot games now prioritize consistent response time over maximum search time. All bot levels are tuned to answer quickly, and if the external engine does not respond within the live-play budget the server falls back to the built-in local bot instead of letting the move stall.

### Render deployment

The checked-in `render.yaml` can also install the Makruk Fairy-Stockfish binary at build time for Render deployments.

Important environment variables for Render:

- `INSTALL_FAIRY_STOCKFISH=true`
- `FAIRY_STOCKFISH_BINARY_PATH=./bin/fairy-stockfish-makruk`
- `FAIRY_STOCKFISH_THREADS=1`
- `FAIRY_STOCKFISH_HASH_MB=64`

On Render free web services, this gives you real Fairy-Stockfish-backed bot and review analysis, but it will be slower than a local machine and the service still spins down after idle time.

## ThaiChess Rules

ThaiChess (หมากรุก) is the traditional chess of Thailand, closely related to the ancient Indian game Chaturanga.

| Piece | Thai Name | Movement |
|-------|-----------|----------|
| Khun (King) | ขุน | 1 square in any direction |
| Met (Queen) | เม็ด | 1 square diagonally |
| Khon (Bishop) | โคน | 1 square diagonally or 1 forward |
| Rua (Rook) | เรือ | Any distance horizontally/vertically |
| Ma (Knight) | ม้า | L-shape (same as chess) |
| Bia (Pawn) | เบี้ย | 1 forward; captures diagonally |

**Key differences from Western Chess:**
- Pawns start on the 3rd rank and promote on the 6th rank (to Met)
- No castling, no en passant, no double pawn step
- The Queen only moves 1 square diagonally (much weaker)
- The Bishop moves 1 diagonally or 1 forward

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Node.js, Express, Socket.IO 4 |
| Database | Turso/libSQL in production, local SQLite fallback in development |
| Game Engine | Custom TypeScript ThaiChess engine |

## Project Structure

```
├── shared/            # Shared types and game engine
│   ├── types.ts       # TypeScript type definitions
│   └── engine.ts      # ThaiChess game engine
├── server/            # Backend server
│   └── src/
│       ├── index.ts         # Express + Socket.IO server
│       ├── gameManager.ts   # Game room & clock management
│       └── database.ts      # Turso/libSQL persistence with local fallback
├── client/            # React frontend
│   └── src/
│       ├── components/      # Board, pieces, pages
│       └── lib/             # Socket client, sounds
├── Dockerfile         # Container deployment
└── package.json       # Workspace root
```

## Documentation

- [ADR: realtime identity and rated-game persistence](docs/adr-2026-03-26-realtime-identity-and-rated-game-persistence.md)

## Contributing

We'd love your help making ThaiChess famous! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. **Star this repo** — helps others discover it
2. **Play and share** — invite your friends
3. **Report bugs** — [open an issue](../../issues/new?template=bug_report.md)
4. **Request features** — [suggest ideas](../../issues/new?template=feature_request.md)
5. **Submit PRs** — code contributions welcome
6. **Translate** — help us add Thai and other languages

## Roadmap

- [x] Thai language support (ภาษาไทย)
- [x] Player accounts (optional, anonymous play always available)
- [x] ELO rating system
- [x] Puzzles and tactics trainer
- [x] Game analysis
- [x] AI opponent
- [ ] Tournaments
- [x] ThaiChess counting rules (full implementation)
- [X] Spectator mode improvements

## License

MIT — free to use, modify, and distribute.

---

*Made with ❤️ for Thai Chess. Inspired by [Lichess](https://lichess.org).*
