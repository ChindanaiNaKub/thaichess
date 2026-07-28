FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Build tools for native optional deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/
COPY scripts/ ./scripts/

# Build the client (prepare:engine needs scripts/setup-browser-fairy-stockfish.mjs)
RUN npm run build --workspace=client

# --- Production stage ---
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install production + dev deps (need tsx for running TypeScript)
RUN npm install

COPY shared/ ./shared/
COPY server/ ./server/
COPY scripts/ ./scripts/
COPY --from=builder /app/client/dist ./client/dist

# Create data directory for SQLite
RUN mkdir -p /app/data
ENV DATA_DIR=/app/data
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npx", "tsx", "server/src/index.ts"]
