# ==============================================================================
# OmniSocial AI — Next.js Frontend Web Application Production Dockerfile
# Standalone, multi-stage, non-root minimal alpine container
# ==============================================================================

# Stage 1: Base Alpine Image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN npm ci

# Stage 3: Build shared package and Next.js standalone application
FROM dependencies AS builder

# Build shared types package first
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@packages/shared

# Copy web application source code
COPY apps/web ./apps/web

# Build-time environment arguments (used by Next.js compiler for public bundles)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:4000/api/v1}
ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME:-"OmniSocial AI"}

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=@apps/web

# Stage 4: Production Runner (Standalone mode)
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy standalone build and static assets with non-root ownership
COPY --chown=node:node --from=builder /app/apps/web/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Drop root privileges
USER node

EXPOSE 3000

# Container liveness health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

CMD ["node", "apps/web/server.js"]
