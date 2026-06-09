# syntax=docker/dockerfile:1

# ── Stage 1: install deps ────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Env vars are injected at runtime via docker-compose env_file;
# provide blank stubs here so Next.js builds without them present.
ENV SPOTIFY_CLIENT_ID=placeholder \
    SPOTIFY_CLIENT_SECRET=placeholder \
    SPOTIFY_REFRESH_TOKEN=placeholder \
    STEAM_API_KEY=placeholder \
    STEAM_PROFILE_ID=placeholder \
    HOMELAB_STATUS_URL=placeholder
RUN npm run build

# ── Stage 3: slim runtime ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone output bundles only what's needed — copy it in
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
