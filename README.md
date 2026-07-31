# ThaiChess

Free online Makruk (หมากรุก), Thai chess. No signup. Play with friends, a bot, or someone online.

[Play at thaichess.dev](https://thaichess.dev)

Chess evolved differently in Thailand: different pieces, different promotion, and counting rules near the endgame. ThaiChess is built for Makruk, with lessons, puzzles, live play, and a bot so you are not stuck waiting for an opponent.

## Features

- Instant play: share a link, Quick Play, or same-device local play at `/local`
- Full Makruk rules: six piece types and counting
- Learn as you go: lessons, puzzles, and post-game analysis
- Bot at several strengths when no one else is free
- Optional accounts and Elo; guests can always play
- Spectate live games; draw, resign, rematch; bullet through classical clocks
- Phone-friendly PWA, dark theme, custom SVG pieces
- Free and open source: no ads, no paywall

Interface habits borrow from [Lichess](https://lichess.org). The rules, learning path, and product are for Makruk.

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

Rules, piece moves, and strategy tips: [How to Play Guide](docs/how-to-play.md).

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
│   │   ├── database.ts    # Database facade (re-exports domain modules)
│   │   ├── database/      # Domain DB modules (auth, games, puzzles, …)
│   │   ├── routes/        # Express routers (auth, games, SEO, puzzles, …)
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

- [Ops: production readiness](docs/ops-production-readiness.md) — Hosting, cost/credit risk, Turso backups, analytics
- [ADR: realtime identity and rated-game persistence](docs/adr/0001-realtime-identity-and-rated-game-persistence.md) — Architecture decision for realtime state management
- [How to Play](docs/how-to-play.md) — Rules, piece movements, and strategy tips
- [Game Engine System](docs/makruk-rule-engine-system.md) — How the ThaiChess game engine works
- [Lesson System](docs/makruk-native-lesson-system.md) — Architecture of the lesson and learning features
- [Zod Validation System](docs/zod-validation-system.md) — Schema validation patterns used throughout the app
- [TanStack Query Patterns Guide](docs/tanstack-query-patterns.md) — Data fetching, caching, and state management patterns
- [TanStack Query Quick Reference](docs/tanstack-query-quick-reference.md) — Fast lookup for common patterns

## Contributing

Setup, testing, and PR guidelines: [CONTRIBUTING.md](CONTRIBUTING.md).

1. Star the repo so others can find it
2. Play and share a link with a friend
3. Report bugs — [open an issue](../../issues/new?template=bug_report.md)
4. Suggest features — [feature request](../../issues/new?template=feature_request.md)
5. Send PRs
6. Help translate (Thai and other languages)

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

## Optional analytics (PostHog)

Privacy-friendly product analytics are **off by default**. We do **not** use Google Analytics.

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_POSTHOG_KEY` | to enable | Project API key from PostHog (US cloud). Leave unset = no PostHog. |
| `VITE_POSTHOG_HOST` | no | Defaults to `https://us.i.posthog.com`. |

Capture runs only after the user chooses **Accept analytics** in the cookie banner. Events: pageviews, `game_start`, `puzzle_complete`, `signup`. See `.env.example` and [docs/ops-production-readiness.md](docs/ops-production-readiness.md).

## License

MIT — free to use, modify, and distribute.
