# OmniSocial AI — Production Deployment & Disaster Recovery Guide

## 1. System Requirements & Architecture Overview

OmniSocial AI is a multi-tenant SaaS application architected as a TypeScript monorepo with NestJS backend, Next.js frontend, and PostgreSQL relational database.

### Required Software:
- **Container Runtime:** Docker Engine 24.0+ (or Docker Desktop 4.25+)
- **Orchestration:** Docker Compose v2.20+
- **Host OS:** Linux (Ubuntu 22.04 LTS / Debian 12 / Amazon Linux 2023) or Windows Server / 11 with WSL2
- **Database Client Tools:** PostgreSQL 16+ `pg_dump`, `pg_restore`, `psql`

---

## 2. Production Environment Configuration

Before launching production containers, copy `.env.example` to `.env` on the host and configure required production secrets.

### Production Environment Checklist:
| Variable | Description | Security Requirements |
|---|---|---|
| `NODE_ENV` | Environment mode | Must be set to `production` |
| `POSTGRES_USER` | PostgreSQL user | Dedicated database user (not default `postgres` on hosted RDS) |
| `POSTGRES_PASSWORD` | PostgreSQL password | High-entropy random secret (>= 24 characters) |
| `POSTGRES_DB` | Database name | E.g. `omnisocial_production` |
| `DATABASE_URL` | Prisma connection string | `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public` |
| `JWT_ACCESS_SECRET` | JWT Access token secret | High-entropy string (>= 32 characters, non-default) |
| `JWT_REFRESH_SECRET` | JWT Refresh token secret | High-entropy string (>= 32 characters, distinct from access secret) |
| `TOKEN_ENCRYPTION_KEY` | AES-256-GCM token key | **Exactly 64-character hexadecimal string** (32 bytes). **CRITICAL:** Do NOT rotate after storing credentials without fallback key migration! |
| `TOKEN_ENCRYPTION_KEY_FALLBACK` | Secondary rotation key | Optional 64-character hex key for zero-downtime key rotation |
| `META_APP_ID` | Meta App Client ID | Meta Developer Console App ID |
| `META_APP_SECRET` | Meta App Secret | Required in production for OAuth and HMAC-SHA256 webhook ingress |
| `META_WEBHOOK_VERIFY_TOKEN` | Meta Webhook Verify Token | High-entropy token (non-default) matching Meta App Dashboard |
| `META_WHATSAPP_APP_SECRET` | WhatsApp Webhook Secret | Required if WhatsApp provider is set to `meta` |
| `CORS_ORIGIN` | Allowed Frontend Origin | Explicit production domain (e.g. `https://app.omnisocial.ai`). Wildcard `*` or `localhost` prohibited in production! |
| `COOKIE_SECURE` | HTTPS cookie flag | Automatically `true` when `NODE_ENV=production` |

> [!CAUTION]
> The boot-time environment validator (`apps/api/src/config/env-validation.ts`) will abort application startup if any production secrets are missing, too short, or set to development defaults.

---

## 3. Building Production Docker Images

Build both images from the monorepo root:

```bash
# 1. Build NestJS Backend API Image (Minimal Alpine, Non-root)
docker build -t omnisocial-api:latest -f apps/api/Dockerfile .

# 2. Build Next.js Web Frontend Image (Standalone Minimal Alpine, Non-root)
docker build -t omnisocial-web:latest \
  --build-arg NEXT_PUBLIC_API_URL="https://api.omnisocial.ai/api/v1" \
  --build-arg NEXT_PUBLIC_APP_NAME="OmniSocial AI" \
  -f apps/web/Dockerfile .
```

Both images run as non-root `node` (`uid=1000`) and exclude all local secrets and `.env` files via `.dockerignore`.

---

## 4. Production Docker Compose Stack

The production Compose configuration is defined in [`docker-compose.prod.yml`](file:///d:/hootsute/docker-compose.prod.yml).

### Starting the Stack:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Checking Service Health:
```bash
docker compose -f docker-compose.prod.yml ps
```

### Stopping the Stack Safely:
```bash
docker compose -f docker-compose.prod.yml down
```

### Service Architecture & Port Mapping:
- **`postgres`:** Internal network only (`omnisocial_internal`). Database port `5432` is intentionally NOT bound to host network interfaces for security.
- **`api`:** Listening on container port `4000`, bound to `127.0.0.1:4000` for reverse proxy access. Healthcheck probe: `GET /api/v1/health`.
- **`web`:** Listening on container port `3000`, bound to `127.0.0.1:3000` for reverse proxy access. Healthcheck probe: `GET /`.

---

## 5. Reverse Proxy & HTTPS Configuration

The production containers bind to `127.0.0.1`. A reverse proxy (such as Nginx, AWS ALB, or Cloudflare) terminates SSL/TLS and forwards requests:

### Example Nginx Configuration:
```nginx
# API Gateway Reverse Proxy
server {
    listen 443 ssl http2;
    server_name api.omnisocial.ai;

    ssl_certificate /etc/letsencrypt/live/api.omnisocial.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.omnisocial.ai/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}

# Web Application Reverse Proxy
server {
    listen 443 ssl http2;
    server_name app.omnisocial.ai;

    ssl_certificate /etc/letsencrypt/live/app.omnisocial.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.omnisocial.ai/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Disaster Recovery & Backup Protocol

### Backup Procedure:
Automated backups use PostgreSQL custom format (`-Fc`) with internal compression and integrity validation.

```bash
# Linux / Bash:
./scripts/backup-db.sh

# Windows / PowerShell:
powershell -ExecutionPolicy Bypass -File .\scripts\backup-db.ps1
```

- Backups are stored in `./backups/omnisocial_db_YYYYMMDD_HHMMSS.dump`.
- Permissions are restricted to owner read/write (`chmod 600`).
- Integrity is verified immediately following creation using `pg_restore --list`.

### Retention & Offsite Archival Policy:
1. Retain local daily backups for 14 days.
2. Ship encrypted backups daily to off-site cloud object storage (e.g. AWS S3 Glacier / Google Cloud Storage Archive) with 30-day lifecycle retention.
3. Encrypt backups at rest using GPG or KMS before offsite transmission:
   ```bash
   gpg --symmetric --cipher-algo AES256 ./backups/omnisocial_db_*.dump
   ```

### Tested Disaster Recovery & Safe Restore Protocol:

OmniSocial AI implements a strict **two-tier database restore architecture**:

1. **Standard Verification Restore (`scripts/restore-db.sh`, `scripts/restore-db.ps1`):**
   - Designed exclusively for testing backup viability into new, temporary, or disposable databases.
   - **Hard Fail-Safe:** Unconditionally refuses any target named `hootsute_db`, containing `prod`, or matching `$POSTGRES_DB`. There are no force-override flags in routine restore scripts.

   ```bash
   # Safe verification restore into a disposable test database:
   # 1. Create temporary test database
   createdb hootsute_restore_test

   # 2. Run restore script (Linux / Bash)
   ./scripts/restore-db.sh ./backups/omnisocial_db_20261010.dump hootsute_restore_test

   # 2b. Run restore script (Windows / PowerShell)
   powershell -ExecutionPolicy Bypass -File .\scripts\restore-db.ps1 `
     -BackupFile .\backups\omnisocial_db_20261010.dump `
     -TargetDatabase hootsute_restore_test

   # 3. Verify public table count (expecting 33 tables)
   psql -d hootsute_restore_test -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

   # 4. Clean up disposable database
   dropdb hootsute_restore_test
   ```

2. **Emergency Production Disaster Recovery Protocol (`scripts/emergency-production-recovery.sh`, `scripts/emergency-production-recovery.ps1`):**
   - A separate, restricted disaster recovery procedure for complete host recovery.
   - **Strict Gates:**
     - Requires environment variable `EMERGENCY_RECOVERY_AUTHORIZED=TRUE`.
     - Validates source backup archive integrity with `pg_restore --list` before modifying database.
     - **Mandatory Pre-Recovery Snapshot:** Automatically creates `./backups/pre_recovery_snapshot_<db>_<timestamp>.dump` of the target database before executing the restore, providing a guaranteed rollback path.

   ```bash
   # Linux / Bash (Requires explicit authorization):
   EMERGENCY_RECOVERY_AUTHORIZED=TRUE ./scripts/emergency-production-recovery.sh \
     ./backups/omnisocial_db_20261010.dump \
     omnisocial_production

   # Windows / PowerShell (Requires explicit authorization):
   $env:EMERGENCY_RECOVERY_AUTHORIZED="TRUE"
   powershell -ExecutionPolicy Bypass -File .\scripts\emergency-production-recovery.ps1 `
     -BackupFile .\backups\omnisocial_db_20261010.dump `
     -ProductionDatabase omnisocial_production
   ```

> [!CAUTION]
> Never use the emergency recovery script during routine deployment. Routine restores must always verify against disposable databases first.

---

## 7. Distributed Rate Limiting with Redis

To share throttling state across horizontally scaled API containers, OmniSocial AI integrates Redis-backed distributed storage via `RedisThrottlerStorage`.

### Configuration:
- `REDIS_URL`: Connection URI to the private Redis service (e.g. `redis://:secret@redis:6379`).
- `RATE_LIMIT_REDIS_FALLBACK`: Controls behavior if Redis is partitioned or unreachable.
  - `fail-closed` (**Production Default**): Aborts requests with `503 Service Unavailable` to prevent abuse spikes from penetrating backend infrastructure.
  - `local-fallback` (**Development Default**): Gracefully degrades to per-instance in-memory tracking with explicit warning logs.

### Network Isolation:
The Redis container runs on the internal bridge network (`omnisocial_internal`) with `--requirepass` authentication. Port 6379 is **never exposed** to the host or internet.

---

## 8. Safe Inbox Reply Reconciliation Engine

When a social media provider (Facebook Graph API or Instagram Graph API) encounters a network timeout or connection abort during comment reply dispatch, the reply attempt is marked `AMBIGUOUS_TIMEOUT` to prevent duplicate comment submission.

### Reconciliation Architecture:
1. **Periodic Background Sweep:** `InboxReplyReconcilerService` executes every 30 seconds (`@Cron`).
2. **Worker Claim Locking:** Uses atomic database updates (`CLAIMED_BY_{workerId}`) with a 60-second lease to ensure mutual exclusion across concurrent API workers and instances.
3. **Multi-Stage Resolution Pipeline:**
   - **Step 1 (Webhook/Inbound check):** Checks whether the provider's comment webhook or local record already confirmed the page reply was created.
   - **Step 2 (Provider Status Check):** Queries the parent comment's replies edge on Meta Graph API (`/{comment-id}/comments` or `/{comment-id}/replies`).
   - **Step 3 (Idempotent State Transition):**
     - If confirmed created -> `status: SENT`, `externalReplyId` recorded, interaction triage resolved.
     - If confirmed absent -> `status: FAILED` with `errorCode: PROVIDER_CONFIRMED_NOT_SENT` (safe for user manual re-submission; **never automatically resubmitted**).
     - If provider times out -> bounded exponential backoff up to 3 retries.
     - If max retries exhausted or provider unsupported -> flagged `UNRESOLVED_NEEDS_REVIEW` for operator audit.
4. **Observability:**
   Operators can query `service.getReconciliationStats(workspaceId)` or view counts of pending, ambiguous, and unresolved attempts.

---

## 9. Structured JSON Production Logging & Inspection Guide

OmniSocial AI outputs machine-readable, structured single-line JSON logs in production (`LOG_FORMAT=json` or `NODE_ENV=production`).

### Log Event Schema:
```json
{
  "timestamp": "2026-10-10T05:30:15.123Z",
  "severity": "INFO",
  "service": "omnisocial-api",
  "environment": "production",
  "context": "HTTP",
  "correlationId": "req-9b8e2f89-4d6a-4933-911b-87b6a18d1234",
  "message": "GET /api/v1/inbox/interactions 200 - 32ms",
  "metadata": {
    "method": "GET",
    "path": "/api/v1/inbox/interactions",
    "statusCode": 200,
    "durationMs": 32,
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Sensitive Data Redaction Policy:
All logs pass through `LogRedactorUtil`, which automatically masks:
- Bearer tokens: `Bearer [REDACTED]`
- Raw JWT signatures: `[REDACTED_JWT]`
- Database & Redis URL credentials: `postgresql://***:***@...`
- Keys matching: `password`, `secret`, `token`, `authorization`, `cookie`, `jwt`, `encryptionKey`, `session`, `privateKey`.
- Request bodies are never dumped raw to prevent leakage of user passwords or message contents.

### Inspecting Production Logs via Docker Compose:
```bash
# View combined live tail of all services:
docker compose -f docker-compose.prod.yml logs -f

# Filter API logs only:
docker compose -f docker-compose.prod.yml logs -f api

# Filter errors across all services:
docker compose -f docker-compose.prod.yml logs api | grep '"severity":"ERROR"'

# Follow logs by correlation ID:
docker compose -f docker-compose.prod.yml logs api | grep 'req-9b8e2f89'
```

