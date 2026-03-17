FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

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

# Build the client
RUN npm run build --workspace=client

# --- Production stage ---
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install production + dev deps (need tsx for running TypeScript)
RUN npm install

COPY shared/ ./shared/
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Create data directory for SQLite
RUN mkdir -p /app/data
ENV DATA_DIR=/app/data
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npx", "tsx", "server/src/index.ts"]
