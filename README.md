# OmniSocial AI — AI Social Media Management SaaS (Stage 1 Foundation)

OmniSocial AI is a multi-tenant AI Social Media Management platform inspired by tools like Hootsuite. 

This repository contains **Stage 1: Architectural Foundation, Enterprise Authentication, PostgreSQL Persistence, and Modern SaaS Web Interface**.

---

## 1. Monorepo Structure

```text
hootsute/
├── apps/
│   ├── web/                    # Next.js 14 App Router Frontend (Tailwind CSS, React Hook Form, Zod)
│   └── api/                    # NestJS REST API (/api/v1, Swagger, Prisma ORM, Bcrypt, JWT)
├── packages/
│   └── shared/                 # Shared TypeScript models, enums (UserRole, UserStatus), and interfaces
├── docs/                       # Architecture, Database, Security & API Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_CONVENTIONS.md
│   ├── AUTHENTICATION_FLOW.md
│   ├── SECURITY_BASELINE.md
│   └── DEVELOPMENT_ROADMAP.md
├── .env.example                # Canonical environment variable templates
├── docker-compose.yml          # Containerized PostgreSQL service
├── package.json                # Workspace configuration and root script runner
└── README.md
```

---

## 2. Technology Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, React Hook Form, Zod.
* **Backend**: NestJS 10, TypeScript, Express, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`, `cookie-parser`.
* **Database & ORM**: PostgreSQL 18, Prisma ORM 5 with versioned schema migrations.
* **Security & Auth**: Bcrypt password hashing (12 salt rounds), short-lived JWT access tokens (15m), rotating DB-persisted refresh sessions (7d) with automatic token reuse containment, RBAC guards (`SUPER_ADMIN`, `BUSINESS_OWNER`, `BUSINESS_ADMIN`, `BUSINESS_MEMBER`), and RFC-compliant error filters.

---

## 3. Beginner-Friendly Windows Development Guide

### Prerequisites
1. **Node.js**: v20+ or v24+ (`node -v`)
2. **npm**: v10+ (`npm -v`)
3. **PostgreSQL**: Either local PostgreSQL 16-18 OR Docker Desktop for Windows.

---

### Step 1: Clone and Configure Environment

Copy the example environment file to `.env`:
```powershell
Copy-Item .env.example .env
Copy-Item .env.example apps/api/.env
```

Ensure your `DATABASE_URL` matches your local database:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hootsute_db?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hootsute_test_db?schema=public"
```

---

### Step 2: Start PostgreSQL Database

#### Option A: Using Docker Compose
```powershell
docker compose up -d
```

#### Option B: Using Local Windows PostgreSQL Service
If using an installed PostgreSQL 18 on Windows, ensure the service is running:
```powershell
# To start database server on custom data directory
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "d:\hootsute\pgdata" start
```

---

### Step 3: Install Dependencies & Build Shared Package

Run `npm install` from the workspace root:
```powershell
npm install
npm run build --workspace=@packages/shared
```

---

### Step 4: Apply Database Migrations

Generate Prisma Client and apply migrations to synchronize PostgreSQL:
```powershell
npm run prisma:generate
npx prisma migrate dev --name init_auth_foundation --schema=apps/api/prisma/schema.prisma
```

---

### Step 5: Securely Bootstrap the Initial Super Administrator

Public registration creates `BUSINESS_OWNER` accounts. To provision the initial `SUPER_ADMIN`, run the secure CLI script:
```powershell
npm run admin:create -- admin@omnisocial.ai "YourSecurePassword123!" "System Administrator"
```

---

### Step 6: Start Backend and Frontend

#### In Terminal 1 (NestJS API on Port 4000):
```powershell
npm run dev:api
```
* **Base API**: `http://localhost:4000/api/v1`
* **Health Check**: `http://localhost:4000/api/v1/health`
* **DB Readiness**: `http://localhost:4000/api/v1/health/ready`
* **Swagger OpenAPI Docs**: `http://localhost:4000/api/docs`

#### In Terminal 2 (Next.js Web on Port 3000):
```powershell
npm run dev:web
```
* **Web Application**: `http://localhost:3000`
* **Sign In**: `http://localhost:3000/login`
* **Register Workspace**: `http://localhost:3000/register`
* **Dashboard**: `http://localhost:3000/dashboard`

---

## 4. Running Automated Tests

Run backend unit and integration test suites:
```powershell
npm run test:api
```

Run frontend form validation tests:
```powershell
npm run test:web
```

---

## 5. REST API Endpoints Overview

| Method | Path | Auth Required | Description |
|:---|:---|:---|:---|
| `GET` | `/api/v1/health` | No | Liveness probe & uptime |
| `GET` | `/api/v1/health/ready` | No | PostgreSQL database readiness verification |
| `POST` | `/api/v1/auth/register` | No | User & workspace registration |
| `POST` | `/api/v1/auth/login` | No | User authentication & token issuance |
| `POST` | `/api/v1/auth/refresh` | No | Rotates access and refresh tokens |
| `POST` | `/api/v1/auth/logout` | Yes | Revokes active session & clears cookies |
| `POST` | `/api/v1/auth/logout-all` | Yes | Invalides all active user sessions |
| `GET` | `/api/v1/auth/me` | Yes | Returns current authenticated user profile |
| `GET` | `/api/docs` | No | Interactive Swagger UI |

---

## 6. Common Windows Troubleshooting

* **Port 5432 in use**: If another PostgreSQL instance is already bound to port 5432, update `POSTGRES_PORT` and `DATABASE_URL` in `.env` to `5433` or stop the conflicting service using `Get-Process | Where-Object { $_.ProcessName -like "*postgres*" }`.
* **Prisma schema not found**: Always specify `--schema=apps/api/prisma/schema.prisma` if executing Prisma commands from the root directory.
* **CORS issues**: Ensure `CORS_ORIGIN=http://localhost:3000` is defined in `.env`.
