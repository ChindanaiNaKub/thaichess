# Makruk - Thai Chess Online

A free, open-source Makruk (Thai Chess) platform inspired by [Lichess](https://lichess.org). Play with friends online — no registration required.

## Features

- **Play with Friends** — Create a game and share the link
- **Real-time Multiplayer** — WebSocket-based instant move updates
- **Time Controls** — Bullet, Blitz, Rapid, and Classical presets
- **Full Makruk Rules** — Complete Thai Chess implementation including:
  - All 6 piece types (Khun, Met, Khon, Rua, Ma, Bia)
  - Pawn promotion to Met on the 6th rank
  - Check, checkmate, and stalemate detection
- **Beautiful UI** — Dark theme inspired by Lichess
- **Drag & Drop** — Move pieces by dragging or clicking
- **Mobile Friendly** — Touch support and responsive design
- **Sound Effects** — Audio feedback for moves, captures, and checks
- **Game Controls** — Draw offers, resignation, and rematch
- **Move History** — Full game notation display

## Makruk Rules

Makruk (หมากรุก) is the traditional chess of Thailand. It is played on an 8×8 board with the following pieces:

| Piece | Thai Name | Movement |
|-------|-----------|----------|
| Khun (King) | ขุน | 1 square in any direction |
| Met (Queen) | เม็ด | 1 square diagonally |
| Khon (Bishop) | โคน | 1 square diagonally or 1 forward |
| Rua (Rook) | เรือ | Any distance horizontally/vertically |
| Ma (Knight) | ม้า | L-shape (same as chess) |
| Bia (Pawn) | เบี้ย | 1 forward, captures diagonally |

**Key Differences from Chess:**
- Pawns start on the 3rd rank (not 2nd)
- Pawns promote on the 6th rank (not 8th) to Met
- No castling, en passant, or double pawn step
- The Queen (Met) only moves 1 square diagonally
- The Bishop (Khon) moves 1 diagonally or 1 forward

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Node.js + Express + Socket.IO
- **Game Engine**: Custom TypeScript Makruk engine with full move validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

Run both server and client in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server   # Server on port 3000
npm run dev:client   # Client on port 5173
```

### Production Build

```bash
npm run build
npm start
```

The production server serves the built client files and runs on port 3000.

## Project Structure

```
├── shared/            # Shared types and game engine
│   ├── types.ts       # TypeScript type definitions
│   └── engine.ts      # Makruk game engine
├── server/            # Backend server
│   └── src/
│       ├── index.ts         # Express + Socket.IO server
│       └── gameManager.ts   # Game room management
├── client/            # React frontend
│   └── src/
│       ├── components/      # React components
│       │   ├── Board.tsx    # Chess board with drag & drop
│       │   ├── PieceSVG.tsx # SVG piece rendering
│       │   ├── GamePage.tsx # Main game interface
│       │   ├── HomePage.tsx # Game creation page
│       │   ├── Clock.tsx    # Game clock
│       │   └── ...
│       └── lib/
│           ├── socket.ts    # Socket.IO client
│           └── sounds.ts    # Sound effects
└── package.json       # Root workspace config
```

## License

MIT
