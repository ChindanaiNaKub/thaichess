# Makruk - Thai Chess Online ♟

A free, open-source Makruk (Thai Chess) platform inspired by [Lichess](https://lichess.org). Play with friends online — no registration required.

> **Our mission:** Make Makruk (หมากรุก) famous worldwide. Thai chess is one of the oldest board games in existence — it deserves a world-class online platform.

## Features

- **Play with Friends** — Create a game and share the link instantly
- **Real-time Multiplayer** — WebSocket-based instant move updates
- **Local Play** — Practice on the same screen at `/local`
- **Time Controls** — Bullet, Blitz, Rapid, and Classical presets
- **Full Makruk Rules** — Complete Thai Chess engine with all 6 piece types
- **Game History** — All completed games saved to database, browsable at `/games`
- **Beautiful UI** — Lichess-inspired dark theme with custom SVG pieces
- **Drag & Drop** — Move pieces by dragging or clicking
- **Mobile Friendly** — Touch support and responsive design
- **Sound Effects** — Audio feedback for moves, captures, and checks
- **Game Controls** — Draw offers, resignation, and rematch
- **100% Free** — No ads, no paywall, no registration

## Quick Start

```bash
npm install
npm run dev
```

This starts both the server (port 3000) and client (port 5173).

## Deploy for Free

This project is designed to run for **$0/month** using free hosting tiers. Here are your options:

### Option 1: Fly.io (Recommended)

Fly.io offers a generous free tier with WebSocket support and persistent storage.

```bash
# 1. Install the Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Sign up (free, no credit card needed for hobby plan)
fly auth signup

# 3. Launch your app (from the project root)
fly launch --no-deploy

# 4. Create a volume for the database
fly volumes create makruk_data --size 1 --region sin

# 5. Deploy
fly deploy

# Your app is now live at https://your-app-name.fly.dev
```

**Cost: $0/month** on the free tier (3 shared VMs, 3GB storage).

### Option 2: Render.com

```bash
# 1. Push your code to GitHub
# 2. Go to render.com, sign up free
# 3. Create a "Web Service", connect your repo
# 4. Set:
#    - Build Command: npm install && npm run build --workspace=client
#    - Start Command: npx tsx server/src/index.ts
#    - Environment: NODE_ENV=production
```

**Cost: $0/month** on free tier (spins down after 15min inactivity).

### Option 3: Railway.app

```bash
# 1. Push your code to GitHub
# 2. Go to railway.app, sign up with GitHub
# 3. Create a project from your repo
# 4. It auto-detects the Dockerfile and deploys
```

**Cost: $0-5/month** ($5 free credit monthly).

### Option 4: Self-host (VPS)

For maximum control, use a free Oracle Cloud VM or any $5/month VPS:

```bash
# On your server:
git clone https://github.com/YOUR_USERNAME/makrukthai.git
cd makrukthai
npm install
npm run build --workspace=client
NODE_ENV=production npx tsx server/src/index.ts
```

Use `nginx` as a reverse proxy with a free SSL certificate from Let's Encrypt.

### Option 5: Docker (Any Platform)

```bash
docker build -t makruk .
docker run -p 3000:3000 -v makruk-data:/data makruk
```

## Makruk Rules

Makruk (หมากรุก) is the traditional chess of Thailand.

| Piece | Thai Name | Symbol | Movement |
|-------|-----------|--------|----------|
| Khun (King) | ขุน | ♚ | 1 square in any direction |
| Met (Queen) | เม็ด | ♛ | 1 square diagonally |
| Khon (Bishop) | โคน | ⛊ | 1 square diagonally or 1 forward |
| Rua (Rook) | เรือ | ♜ | Any distance horizontally/vertically |
| Ma (Knight) | ม้า | ♞ | L-shape (same as chess) |
| Bia (Pawn) | เบี้ย | ♟ | 1 forward; captures diagonally |

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
| Database | SQLite (via better-sqlite3) |
| Game Engine | Custom TypeScript Makruk engine |

## Project Structure

```
├── shared/            # Shared types and game engine
│   ├── types.ts       # TypeScript type definitions
│   └── engine.ts      # Makruk game engine
├── server/            # Backend server
│   └── src/
│       ├── index.ts         # Express + Socket.IO server
│       ├── gameManager.ts   # Game room & clock management
│       └── database.ts      # SQLite persistence
├── client/            # React frontend
│   └── src/
│       ├── components/      # Board, pieces, pages
│       └── lib/             # Socket client, sounds
├── Dockerfile         # Container deployment
├── fly.toml           # Fly.io config
└── package.json       # Workspace root
```

## Contributing

We'd love your help making Makruk famous! Here's how:

1. **Star this repo** — helps others discover it
2. **Play and share** — invite your friends to play
3. **Report bugs** — open GitHub issues
4. **Submit PRs** — code contributions welcome
5. **Translate** — help us add Thai and other languages

## Roadmap

- [ ] Player accounts (optional, anonymous play always available)
- [ ] ELO rating system
- [ ] Puzzles and tactics trainer
- [ ] Game analysis and engine evaluation
- [ ] Thai language support (ภาษาไทย)
- [ ] Tournaments
- [ ] Mobile app (PWA)
- [ ] AI opponent
- [ ] Makruk counting rules (full implementation)
- [ ] Spectator mode improvements

## License

MIT — free to use, modify, and distribute.

---

*Made with ❤️ for Thai Chess. Inspired by [Lichess](https://lichess.org).*
