# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```
[project-root]/
├── client/              # Frontend React application
│   ├── public/          # Static assets
│   ├── src/            # Source code
│   │   ├── components/  # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Client utilities and providers
│   │   ├── test/       # Client tests and test data
│   │   └── workers/    # Web workers for CPU-intensive tasks
│   └── dist/           # Build output (generated)
├── server/              # Backend Node.js application
│   ├── src/            # Source code
│   │   ├── scripts/    # Database and data scripts
│   │   └── dist/       # Build output (generated)
│   └── dist/shared/    # Compiled shared code server copy
├── shared/             # Shared code between client and server
│   └── utils/          # Shared utility functions
├── data/               # Static data files
├── scripts/            # Build and deployment scripts
├── .planning/          # Planning documents
│   └── codebase/       # Generated architecture documents
└── .github/            # GitHub workflows and templates
```

## Directory Purposes

**client/src/components/:**
- Purpose: All React UI components for the application
- Contains: Game components, pages, widgets, SVG pieces
- Key files: `GamePage.tsx`, `Board.tsx`, `AnalysisPage.tsx`

**client/src/lib/:**
- Purpose: Client-side utilities and React contexts
- Contains: Authentication, internationalization, socket handling
- Key files: `auth.tsx`, `i18n.tsx`, `socket.ts`

**client/src/hooks/:**
- Purpose: Custom React hooks for game logic and state management
- Contains: Game interaction, socket communication
- Key files: `useGameSocket.ts`, `useGameInteraction.ts`

**server/src/:**
- Purpose: Backend server logic and API endpoints
- Contains: Game management, matchmaking, authentication, database
- Key files: `index.ts`, `gameManager.ts`, `database.ts`

**shared/:**
- Purpose: Shared TypeScript types and game logic
- Contains: Game rules, board representation, type definitions
- Key files: `types.ts`, `engine.ts`

**data/:**
- Purpose: Static game data and assets
- Contains: Puzzles, game databases, initial data

## Key File Locations

**Entry Points:**
- `client/src/main.tsx`: React application entry point
- `server/src/index.ts`: Node.js server entry point
- `client/src/App.tsx`: Main router component

**Configuration:**
- `package.json`: Project dependencies and scripts
- `vite.config.ts`: Build configuration for client
- `tsconfig.json`: TypeScript configuration
- `shared/types.ts`: Shared type definitions

**Core Logic:**
- `server/src/gameManager.ts`: Game room management and state
- `shared/engine.ts`: Thai chess rules and validation
- `client/src/lib/auth.tsx`: Authentication context and API
- `client/src/components/Board.tsx`: Board rendering and interaction

**Testing:**
- `client/src/test/`: Client unit and integration tests
- `client/src/test/engine.test.ts`: Game engine tests
- `server/test/`: Server test directory (if present)

## Naming Conventions

**Files:**
- PascalCase for components and types: `GamePage.tsx`, `GameState.ts`
- camelCase for utilities and hooks: `useGameSocket.ts`, `auth.tsx`
- kebab-case for page routes: URLs are kebab-case, files remain PascalCase

**Directories:**
- All lowercase with underscores for internal directories: `src/components/`
- All lowercase with hyphens for feature directories (if any)

**Classes/Interfaces:**
- PascalCase with descriptive names: `GameManager`, `AuthUser`
- Interface names prefixed with `I` or descriptive: `GameState`, `ClientGameState`

## Where to Add New Code

**New Game Mode:**
- Primary code: `client/src/components/[GameMode].tsx`
- Tests: `client/src/test/[GameMode].test.ts`
- Server logic: Add to `server/src/gameManager.ts` or create new module

**New Component:**
- Implementation: `client/src/components/[ComponentName].tsx`
- Styles: Add to `index.css` or component CSS modules
- Tests: `client/src/test/[ComponentName].test.ts`

**New API Endpoint:**
- Implementation: Add to `server/src/index.ts` or create route module
- Types: Update `shared/types.ts` for shared interfaces
- Tests: Add in `server/test/` directory

**New Shared Logic:**
- Implementation: `shared/[featureName].ts`
- Update both client and server imports as needed

## Special Directories

**client/dist/:**
- Purpose: Generated build output for deployment
- Generated: Yes
- Committed: Usually no (in .gitignore)

**server/dist/:**
- Purpose: Generated build output for server
- Generated: Yes
- Committed: Usually no (in .gitignore)

**shared/utils/:**
- Purpose: Small shared utility functions
- Generated: No
- Committed: Yes

**data/puzzles.json:**
- Purpose: Static puzzle data for puzzle mode
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-21*