# Deployment Note: Render + Turso

This project is designed to run as a single Node.js web service on Render with Turso/libSQL as the durable database.

## Recommended Production Shape

- **App runtime**: one Render web service
- **Database**: Turso/libSQL
- **Realtime transport**: Socket.IO on the same web service
- **Static client**: served by the same server build

This is the right setup for the current project size. Do not add Redis, workers, or multiple app instances unless traffic forces the change.

## Why This Shape

- It keeps costs low.
- It matches the current codebase.
- It avoids coordination infrastructure that a hobby project does not need yet.
- Turso gives durable storage for accounts, sessions, ratings, finished games, and feedback.

## Current Architectural Limits

The app is still a **single-instance realtime system**.

That means:

- live games are kept in server memory
- matchmaking is kept in server memory
- socket rate limits are kept in server memory
- reconnect works only when the same logical game state still lives on that one process

This is acceptable for one Render web service. It is not ready for active-active multi-instance scaling.

## Required Production Environment

Set these at minimum:

- `NODE_ENV=production`
- `SITE_URL=https://thaichess.dev` or your real public URL
- `TURSO_DATABASE_URL=...`
- `TURSO_AUTH_TOKEN=...`
- `AUTH_SECRET=...`

If email login is enabled in production, also set:

- `RESEND_API_KEY=...`
- `AUTH_FROM_EMAIL=...`

Optional:

- `ADMIN_EMAILS=email1@example.com,email2@example.com`

## Important Rule

In production, **do not rely on local SQLite fallback storage** for anything important.

Render free web services use ephemeral filesystem storage unless you explicitly add a persistent disk. For this project, Turso should be treated as the durable source of truth for:

- users
- sessions
- login codes
- rated stats
- finished games
- feedback

## Render Notes

The checked-in `render.yaml` is fine for the single-service deployment model, but production should always include a real Turso configuration.

Recommended practice:

1. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Render.
2. Set a strong `AUTH_SECRET`.
3. Deploy only one web instance for now.
4. Watch app logs after deploy for auth, reconnect, and database-save errors.

## Operational Checklist

Before deploy:

- run server tests
- run client tests you trust for core game flows
- confirm Turso credentials are present
- confirm `SITE_URL` matches the public domain

After deploy:

- create a private game and join from a second browser
- disconnect and reconnect one browser
- confirm the same seat is restored
- finish a rated quick-play game
- confirm a single Elo update is shown and saved

## What Not To Build Yet

Do not add these yet:

- Redis-backed Socket.IO adapters
- multi-region workers
- event buses
- CQRS
- microservices
- Kubernetes

Those are only worth it if you outgrow a single web process.

## When To Revisit The Architecture

Revisit this deployment shape if one of these becomes true:

- you want multiple concurrent app instances
- you see frequent reconnect failures caused by restarts or deploys
- matchmaking traffic becomes too bursty for one process
- you add heavier background jobs such as tournament orchestration or large-scale analysis

At that point, the next likely move is:

- keep the monolith
- add Redis for shared realtime coordination
- keep Turso or move to a stronger primary relational store only if write pressure demands it
