# Technology Stack

**Project:** Markruk Thai
**Researched:** 2026-03-20

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.x | UI library | Already established; excellent ecosystem; testing-library support |
| TypeScript | 5.x | Type safety | Already used across frontend and backend; shared types prevent bugs |
| Vite | 5.x | Build tool | Already configured; fast HMR; native ESM; excellent test runner integration |
| Express | 4.x | Server framework | Already established; minimal; works well with Socket.IO |

### Real-time Communication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Socket.IO | 4.x | Websocket communication | Already established; automatic reconnection; fallback to polling; excellent testing support |

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQLite | 3.x | Game storage | Already established; file-based; no server needed; sufficient for v1 scale |

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 1.x | Unit/component tests | Already configured; Vite-native; faster than Jest; compatible with Jest APIs |
| Playwright | 1.x | E2E tests | Already configured; reliable; mobile emulation; auto-waiting; network interception |
| @testing-library/react | 14.x | Component testing | Already configured; encourages user-centric testing; official React recommendation |
| @testing-library/user-event | 14.x | User interaction | Needed upgrade; simulates real user input better than fireEvent |
| @testing-library/jest-dom | 6.x | DOM assertions | Already configured; readable matchers; improves test clarity |
| jest-axe | 6.x | Accessibility tests | Already configured; automated ARIA checks; WCAG compliance |

### CI/CD

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Actions | - | CI/CD pipeline | Free for public repos; where project will be hosted; excellent TypeScript support |
| coverage-provider (V8) | - | Coverage reports | Already configured in Vitest; faster than Istanbul |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-plugin-react-hooks | - | Hook rules | NON-NEGOTIABLE — prevents infinite re-render bugs |
| eslint-plugin-testing-library | - | Test linting | Prevents common Testing Library mistakes before commit |
| react-router-dom | 6.x | Routing | Already used; essential for game URL navigation |
| socket.io-client | 4.x | Socket client | Already used; required for multiplayer |
| clsx | 2.x | Conditional classes | Already used; cleaner conditional CSS classes |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Test runner | Vitest | Jest | Vitest is Vite-native (10x faster), already configured, Jest migration cost outweighs benefits |
| E2E framework | Playwright | Cypress | Playwright is faster, supports all browsers, already configured, better TypeScript support |
| State management | Component state + hooks | Redux/Zustand | Game state is simple enough for local state; adding global state would be over-engineering |
| Database | SQLite | PostgreSQL | SQLite is sufficient for v1; no auth required; can migrate later if needed |
| WebSocket | Socket.IO | raw WebSockets | Socket.IO provides reconnection, room management, fallbacks — all needed for multiplayer games |

## Installation

### Core (already installed)

```bash
# Frontend dependencies
npm install react react-dom react-router-dom
npm install -D @types/react @types/react-dom

# Build tool
npm install -D vite @vitejs/plugin-react

# Backend dependencies
npm install express socket.io
npm install -D @types/express

# Database
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### Testing (already installed)

```bash
# Test frameworks
npm install -D vitest @vitest/ui
npm install -D playwright @playwright/test

# Testing library
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Accessibility testing
npm install -D jest-axe

# ESLint for testing
npm install -D eslint-plugin-react-hooks eslint-plugin-testing-library
```

### Missing (recommended additions)

```bash
# ESLint testing library plugin (not yet installed)
npm install -D eslint-plugin-testing-library

# User event library (verify version)
npm install -D @testing-library/user-event@latest
```

## Development Workflow

```bash
# Install dependencies
npm install

# Run dev server
npm run dev          # Vite dev server

# Run tests
npm run test         # Vitest watch mode
npm run test:run     # Single test run
npm run test:ui      # Vitest UI
npm run test:coverage # Coverage report
npm run test:e2e     # Playwright E2E tests

# Type check
npm run type-check   # TypeScript check

# Lint
npm run lint         # ESLint
```

## Sources

- [React Documentation](https://react.dev/) — HIGH confidence, official docs
- [Vitest Guide](https://vitest.dev/) — HIGH confidence, official docs
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — HIGH confidence, official docs
- [Socket.IO Documentation](https://socket.io/docs/v4/) — HIGH confidence, official docs
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — HIGH confidence, official docs
- [Project Codebase Analysis](/home/prab/Documents/markrukthai-1/) — HIGH confidence, direct observation
