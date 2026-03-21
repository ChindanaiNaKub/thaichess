# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- JavaScript/TypeScript - Frontend and backend
- React - UI components

**Secondary:**
- HTML/CSS - Frontend styling

## Runtime

**Environment:**
- Node.js 22 - Runtime

**Package Manager:**
- npm v10.0.0 - Dependency management
- Workspaces - Monorepo management
- Lockfile: package-lock.json present

## Frameworks

**Core:**
- React 19.0.0 - Frontend UI library
- Express.js 4.21.0 - Backend web framework
- Socket.IO 4.8.0 - Real-time communication
- TypeScript 5.7.0 - Type safety
- Vite 6.0.0 - Frontend build tool

**Testing:**
- Vitest 4.1.0 - Unit testing
- Playwright 1.58.2 - E2E testing
- Testing Library - Component testing
- Jest 14.6.1 - Testing utilities

**Build/Dev:**
- ESLint 9.39.4 - Code linting
- TypeScript Compiler - Build compilation
- tsx 4.19.0 - TypeScript execution
- concurrently 9.1.0 - Process orchestration

## Key Dependencies

**Critical:**
- @libsql/client 0.17.2 - Database client
- Socket.IO client/server 4.8.0 - Real-time features
- React Router DOM 7.1.0 - Client-side routing
- express-rate-limit 8.3.1 - Rate limiting
- cors 2.8.5 - Cross-origin requests

**Infrastructure:**
- uuid 11.1.0 - Unique identifiers
- Tailwind CSS 4.0.0 - CSS framework

## Configuration

**Environment:**
- Node.js environment variables
- PORT, NODE_ENV, DATA_DIR
- Turso database connection (optional)
- Resend email service (optional)

**Build:**
- Vite configuration with React and Tailwind
- TypeScript compiler configuration
- ESLint configuration with React hooks

## Platform Requirements

**Development:**
- Node.js 22
- npm v10
- Python 3 (for SQLite native modules)

**Production:**
- Node.js 22 runtime
- Docker container support
- Fly.io deployment target

---

*Stack analysis: 2026-03-21*
```