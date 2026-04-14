# ThaiChess - The Ancient Art of Chess ♟

A free, open-source ThaiChess platform inspired by [Lichess](https://lichess.org). Play with friends online - no registration required.

> **Our mission:** Make ThaiChess famous worldwide. Thai chess is one of the oldest board games in existence - it deserves a world-class online platform.

## Play Online

🎮 **[Play ThaiChess](https://thaichess.dev)** — No registration required, start playing instantly!

## Features

- **Play with Friends** — Create a game and share the link instantly
- **Real-time Multiplayer** — WebSocket-based instant move updates
- **Local Play** — Practice on the same screen at `/local`
- **Time Controls** — Bullet, Blitz, Rapid, and Classical presets
- **Full ThaiChess Rules** — Complete game engine with all 6 piece types
- **Beautiful UI** — Lichess-inspired dark theme with custom SVG pieces
- **Mobile Friendly** — Touch support, responsive design, installable as PWA
- **100% Free** — No ads, no paywall, no registration
- **AI Opponent** — Play against bot at various difficulty levels
- **Puzzles & Tactics Trainer** — Learn through guided puzzle practice
- **Game Analysis** — Analyze games with move annotations
- **Lessons & Learning** — Guided learning system to improve your game
- **Player Accounts & ELO Rating** — Optional accounts with competitive rating (anonymous play always available)
- **Spectator Mode** — Watch live games from other players
- **Game Controls** — Draw offers, resignation, and rematch

## Quick Start

### Play Locally

```bash
npm install
npm run dev
```

This starts both the server (port 3000) and client (port 5173). Open http://localhost:5173 to play.

### For Developers

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, testing, and contribution guidelines.

## How to Play

ThaiChess (หมากรุก) is the traditional chess of Thailand, closely related to the ancient Indian game Chaturanga. For detailed rules and piece movements, see [How to Play Guide](docs/how-to-play.md).

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4 |
| Routing | React Router 7 |
| Data Fetching | TanStack React Query 5 |
| Authentication | Better Auth 1.6 |
| Backend | Node.js 22, Express 4, Socket.IO 4 |
| Database | Drizzle ORM, Turso.tech (production), SQLite (development) |
| Game Engine | Custom TypeScript ThaiChess engine |

## Project Structure

```
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components (pages, boards, panels)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Socket.IO client, auth, utilities
│   │   ├── queries/       # TanStack Query hooks
│   │   ├── routes/        # Route definitions
│   │   ├── test/          # Unit tests (Vitest)
│   │   ├── themes/        # Design tokens & theming
│   │   ├── workers/       # Web workers
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── e2e/               # Playwright end-to-end tests
│   └── public/            # Static assets, PWA manifest
├── server/                # Express + Socket.IO backend
│   ├── src/
│   │   ├── index.ts       # Express + Socket.IO setup
│   │   ├── betterAuth.ts  # Better Auth configuration
│   │   ├── database.ts    # Drizzle ORM & Turso queries
│   │   ├── gameManager.ts # Game room & clock management
│   │   ├── socketHandlers.ts  # Real-time game events
│   │   ├── engineGateway.ts   # Fairy-Stockfish integration
│   │   ├── scripts/       # Utility scripts (puzzles, etc.)
│   │   └── test/          # Unit tests (Vitest)
├── shared/                # Shared types & game engine
├── docs/                  # ADRs and guides
├── Dockerfile             # Container deployment
└── package.json           # Workspace root
```

## Documentation

- [ADR: realtime identity and rated-game persistence](docs/adr-2026-03-26-realtime-identity-and-rated-game-persistence.md) — Architecture decision for realtime state management
- [How to Play](docs/how-to-play.md) — Rules, piece movements, and strategy tips
- [Game Engine System](docs/makruk-rule-engine-system.md) — How the ThaiChess game engine works
- [Lesson System](docs/makruk-native-lesson-system.md) — Architecture of the lesson and learning features
- [Zod Validation System](docs/zod-validation-system.md) — Schema validation patterns used throughout the app
- [TanStack Query Patterns Guide](docs/tanstack-query-patterns.md) — Data fetching, caching, and state management patterns
- [TanStack Query Quick Reference](docs/tanstack-query-quick-reference.md) — Fast lookup for common patterns

## Contributing

We'd love your help making ThaiChess famous! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. **Star this repo** - helps others discover it
2. **Play and share** - invite your friends
3. **Report bugs** - [open an issue](../../issues/new?template=bug_report.md)
4. **Request features** - [suggest ideas](../../issues/new?template=feature_request.md)
5. **Submit PRs** - code contributions welcome
6. **Translate** - help us add Thai and other languages

## Roadmap

- [x] Thai language support (ภาษาไทย)
- [x] Player accounts (optional, anonymous play always available)
- [x] ELO rating system
- [x] Puzzles and tactics trainer
- [x] Game analysis
- [x] AI opponent
- [ ] Tournaments
- [x] ThaiChess counting rules (full implementation)
- [x] Spectator mode improvements

## License

MIT - free to use, modify, and distribute.

---

*Made with ❤️ for Thai Chess. Inspired by [Lichess](https://lichess.org).*
