# Repository Guidelines

## Project Structure & Module Organization
This repository uses npm workspaces with three main code areas. `client/` contains the React 19 and Vite frontend; most app code lives in `client/src/`, route entries live in `client/src/routes/`, and browser tests live in `client/e2e/`. `server/` contains the Express and Socket.IO backend in `server/src/`, with operational scripts in `server/src/scripts/` and backend tests in `server/src/test/`. `shared/` holds cross-workspace engine logic, validation schemas, and shared types. Static assets are split across `assets/` and `client/public/`; long-form design and ADR docs live in `docs/`.

## Build, Test, and Development Commands
Use Node `22.22.0` (`.node-version`) and install dependencies with `npm ci`.

- `npm run dev` starts the client and server workspaces together.
- `npm run build` builds both workspaces for production.
- `npm run lint` or `npm run lint:fix` runs ESLint across the monorepo.
- `npm test` runs the client and server Vitest suites.
- `npm run test:e2e` runs Playwright end-to-end tests from `client/`.
- `npm run validate:puzzles` validates server-side puzzle data.

## Coding Style & Naming Conventions
TypeScript is standard across `client`, `server`, and `shared`. Follow the existing 2-space indentation, semicolons, and ES module import style. Use PascalCase for React components and route files such as `AccountRoute.tsx`; use camelCase for utilities, hooks, and server modules such as `leaderboardPagination.ts` and `useGameSocket.tsx`. Keep comments sparse and practical. ESLint is the primary enforced style tool; React hook rules are enabled for frontend code.

## Testing Guidelines
Vitest is the main test runner in both workspaces. Frontend tests also use Testing Library and `jest-axe`, while Playwright covers browser flows. Keep test files in the established locations: `client/src/test/`, `client/e2e/`, and `server/src/test/`. Name unit and integration tests with `.test.ts` or `.test.tsx`; use `.spec.ts` for Playwright files. Run `npm test` before every PR, and run `npm run test:e2e` when changing routing, gameplay, auth, or other user-facing flows.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits, for example `feat: add new ThaiChess logo` and `fix: translate support description to Thai`. Keep commit messages short, imperative, and scoped to one change. PR titles should also be conventional. Follow `.github/PULL_REQUEST_TEMPLATE.md`: describe what changed, mark the change type, confirm the code compiles, confirm the client build passes, and note local testing. Include screenshots for visible UI changes and link the relevant issue when one exists.
