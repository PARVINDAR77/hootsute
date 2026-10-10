# ==============================================================================
# OmniSocial AI — NestJS Backend API Production Dockerfile
# Multi-stage, non-root, minimal alpine container
# ==============================================================================

# Stage 1: Base Alpine Image with OpenSSL for Prisma
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS dependencies
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Stage 3: Build shared package, Prisma client, and NestJS API
FROM dependencies AS builder

# Build shared types package first
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@packages/shared

# Generate Prisma Client
COPY apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build NestJS API
COPY apps/api ./apps/api
RUN npm run build --workspace=@apps/api

# Remove devDependencies to minimize image size
RUN npm prune --omit=dev

# Stage 4: Production Runner
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

# Copy production artifacts with non-root ownership
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/packages/shared ./packages/shared
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /app/apps/api/prisma ./apps/api/prisma

# Drop root privileges
USER node

EXPOSE 4000

# Container liveness health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/src/main.js"]
