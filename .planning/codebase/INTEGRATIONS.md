# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**Databases:**
- Turso/SQLite - Primary database
  - Client: @libsql/client
  - URL: TURSO_DATABASE_URL
  - Auth: TURSO_AUTH_TOKEN
  - Fallback: Local SQLite file database

**File Storage:**
- Local filesystem only - SQLite database files
- Data directory: DATA_DIR (default: /data)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Custom email-based authentication
  - Implementation: Session tokens with login codes
  - Login codes: 6-digit numeric codes
  - Session cookies with SameSite=Lax
- Admin emails: ADMIN_EMAILS (comma-separated)

## Monitoring & Observability

**Error Tracking:**
- None detected - Custom error logging in code

**Logs:**
- Custom logger in `server/src/logger.ts`
- Request logging middleware
- Error tracking with structured logging

## CI/CD & Deployment

**Hosting:**
- Fly.io - Primary deployment
  - Region: Singapore (sin)
  - Size: shared-cpu-1x, 256mb
  - Auto-deploy configured
- Docker containerization
- Build stage with Node.js 22-alpine

**CI Pipeline:**
- GitHub Actions (exists but not detailed)

## Environment Configuration

**Required env vars:**
- PORT=3000
- NODE_ENV=development/production
- DATA_DIR=/path/to/data (default: ./data)
- TURSO_DATABASE_URL (for production)
- TURSO_AUTH_TOKEN (for production)
- AUTH_SECRET (session signing)
- RESEND_API_KEY (optional, email login codes)
- AUTH_FROM_EMAIL (optional, email sender)

**Secrets location:**
- .env file (local development)
- Fly.io secrets (production)

## Webhooks & Callbacks

**Incoming:**
- Socket.IO events for real-time game communication
- HTTP API endpoints for authentication and game data

**Outgoing:**
- Email notifications via Resend (optional)
  - API key: RESEND_API_KEY
  - From email: AUTH_FROM_EMAIL

---

*Integration audit: 2026-03-21*
```