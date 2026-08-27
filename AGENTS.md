# Repository Guidelines

## Project Structure & Module Organization
This repository uses npm workspaces with three main code areas. `client/` contains the React 19 and Vite frontend; most app code lives in `client/src/`, route entries live in `client/src/routes/`, and browser tests live in `client/e2e/`. `server/` contains the Express and Socket.IO backend in `server/src/`, with Express domain routers in `server/src/routes/`, database domain modules in `server/src/database/` (re-exported by `server/src/database.ts`), operational scripts in `server/src/scripts/`, and backend tests in `server/src/test/`. `shared/` holds cross-workspace engine logic, validation schemas, and shared types. Static assets are split across `assets/` and `client/public/`; long-form design and ADR docs live in `docs/`.

## Build, Test, and Development Commands
Use Node `22.22.0` (`.node-version`) and install dependencies with `npm ci`.

- `npm run dev` starts the client and server workspaces together.
- `npm run build` builds both workspaces for production.
- `npm run lint` or `npm run lint:fix` runs ESLint across the monorepo.
- `npm test` runs the client and server Vitest suites.
- `npm run test:e2e` runs Playwright end-to-end tests from `client/`.
- `npm run validate:puzzles` validates server-side puzzle data.

## Coding Style & Naming Conventions
TypeScript is standard across `client`, `server`, and `shared`. Follow the existing 2-space indentation, semicolons, and ES module import style. Use PascalCase for React components and route files such as `AccountRoute.tsx`; use camelCase for utilities, hooks, and server modules such as `leaderboardPagination.ts` and `useGamePageScreen.tsx`. Keep comments sparse and practical. ESLint is the primary enforced style tool; React hook rules are enabled for frontend code.

## Testing Guidelines
Vitest is the main test runner in both workspaces. Frontend tests also use Testing Library and `jest-axe`, while Playwright covers browser flows. Keep test files in the established locations: `client/src/test/`, `client/e2e/`, and `server/src/test/`. Name unit and integration tests with `.test.ts` or `.test.tsx`; use `.spec.ts` for Playwright files. Run `npm test` before every PR, and run `npm run test:e2e` when changing routing, gameplay, auth, or other user-facing flows.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits, for example `feat: add new ThaiChess logo` and `fix: translate support description to Thai`. Keep commit messages short, imperative, and scoped to one change. PR titles should also be conventional. Follow `.github/PULL_REQUEST_TEMPLATE.md`: describe what changed, mark the change type, confirm the code compiles, confirm the client build passes, and note local testing. Include screenshots for visible UI changes and link the relevant issue when one exists.

## Agent skills

### Issue tracker

GitHub Issues on `ChindanaiNaKub/markrukthai` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles; `wontfix` matches the existing GitHub label. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at repo root and ADRs in `docs/adr/`. See `docs/agents/domain.md`.

## Code Exploration Policy

Always use jCodeMunch-MCP for code navigation. Never fall back to Read, Grep, Glob, or Bash for code exploration.
**Exception:** use `Read` when you are about to edit a file — the harness requires a `Read` before `Edit`/`Write`. Use jCodeMunch to *find and understand* code, then `Read` only the file you are changing.

This server runs the **front door** surface: three tools reach every jCodeMunch capability, so the tool list stays small and the catalogue is fetched only when you need it.

**Start any session:**
1. `order { "action": "resolve_repo", "args": { "path": "." } }` — confirm the project is indexed. If it is not: `order { "action": "index_folder", "args": { "path": "." } }`

**Then, for any task:**
- Know what you want → `order { "action": "<name>", "args": { ... } }`
- Know the goal, not the tool → `route { "query": "your task in a sentence" }` picks the action and shapes the arguments
- Want to see what exists → `menu { "query": "what you are trying to do" }` returns matching actions with example arguments
- Want the whole catalogue and the usage rules → `jcodemunch_guide`

`menu` and `jcodemunch_guide` list every action this server can run, including ones absent from your tool list. That is expected: the front door is the way to call them.

**Interpreting results:**
- A `verdict` of `no_implementation_found` is evidence of absence. Report the gap; do not re-search with different wording.
- A `verdict` of `degraded` means a channel was unavailable, so absence is NOT proven. Read the note before relying on the result.
- `source: ""` alongside `source_status` means the body could not be read, not that the symbol is empty.

**After editing files:**
- With PostToolUse hooks installed (Claude Code), edited files are reindexed automatically.
- Otherwise `order { "action": "register_edit", "args": { "paths": [...] } }` after an edit, batched for bulk changes.

**Announce your model once per session** so the server can size its answers: `announce_model { "model": "<your-model-id>" }`.

