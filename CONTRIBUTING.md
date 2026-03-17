# Contributing to Makruk Online

Thank you for your interest in making Makruk famous worldwide! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/markrukthai.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Open http://localhost:5173

## Development

The project has three main parts:

- **`shared/`** — Game engine and types (used by both client and server)
- **`server/`** — Node.js + Express + Socket.IO backend
- **`client/`** — React + TypeScript + Tailwind frontend

### Useful Commands

```bash
npm run dev              # Start both server and client
npm run dev:server       # Server only (port 3000)
npm run dev:client       # Client only (port 5173)

# Type checking
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit

# Build for production
npm run build
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Ensure TypeScript compiles: `npx tsc --noEmit` in both `client/` and `server/`
4. Ensure the client builds: `npm run build --workspace=client`
5. Test your changes locally
6. Commit with a descriptive message
7. Push and open a Pull Request

## Areas Where Help is Needed

- **Thai language support** — UI translations
- **Makruk counting rules** — Full implementation of endgame counting
- **AI opponent** — Basic Makruk engine for solo play
- **Puzzles** — Tactical puzzles for training
- **UI/UX improvements** — Especially mobile experience
- **Accessibility** — Screen reader support, keyboard navigation
- **Testing** — Unit tests for the game engine
- **Documentation** — Makruk strategy guides

## Code Style

- TypeScript with strict mode
- React functional components with hooks
- Tailwind CSS for styling
- Descriptive variable names
- No unnecessary comments (code should be self-explanatory)

## Questions?

Open an issue or start a discussion on GitHub. We're friendly!
