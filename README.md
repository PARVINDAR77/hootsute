# OmniSocial AI — AI Social Media Management SaaS

OmniSocial AI is a multi-tenant AI Social Media Management platform inspired by tools like Hootsuite. 

This repository contains:
* **Stage 1**: Architectural Foundation, Enterprise Authentication, PostgreSQL Persistence, and Modern SaaS Web Interface.
* **Stage 2**: Business Workspaces, Multi-Tenancy, Membership Management, Cryptographic Invitations & Onboarding Wizard.

---

## 1. Monorepo Structure

```text
hootsute/
├── apps/
│   ├── web/                    # Next.js 14 App Router Frontend (Tailwind CSS, Lucide Icons, Workspace Context)
│   └── api/                    # NestJS REST API (/api/v1, Swagger, Prisma ORM, Bcrypt, JWT, WorkspaceAuthGuard)
├── packages/
│   └── shared/                 # Shared TypeScript models, enums (WorkspaceRole, WorkspaceStatus), and interfaces
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

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Context Providers (`AuthContext`, `WorkspaceContext`).
* **Backend**: NestJS 10, TypeScript, Express, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`, `cookie-parser`.
* **Database & ORM**: PostgreSQL 18, Prisma ORM 5 with versioned schema migrations (`hootsute_db` and isolated `hootsute_test_db`).
* **Security & Multi-Tenancy**:
  * Bcrypt password hashing (12 salt rounds).
  * Short-lived JWT access tokens (15m) and rotating DB-persisted refresh sessions (7d) with automatic token reuse containment.
  * Multi-tenant relational hierarchy: `User -> WorkspaceMember -> Workspace -> Resources`.
  * `WorkspaceAuthGuard`: Strict tenant-isolation guard validating membership and role hierarchy (`OWNER` > `ADMIN` > `EDITOR` > `VIEWER`).
  * Cryptographic SHA-256 invitation tokens (single-use, expiring in 7 days, revocable).
  * Atomic ownership transfer and final-owner protection.
  * Comprehensive audit logging for all workspace and membership lifecycle events.

---

## 3. Windows Development Guide

### Prerequisites
1. **Node.js**: v20+ or v24+ (`node -v`)
2. **npm**: v10+ (`npm -v`)
3. **PostgreSQL**: Local PostgreSQL 16–18 OR Docker Desktop for Windows.

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
```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "d:\hootsute\pgdata" start
```

---

### Step 3: Install Dependencies & Build Shared Package

```powershell
npm install
npm run build --workspace=@packages/shared
```

---

### Step 4: Apply Database Migrations

Generate Prisma Client and apply versioned migrations:
```powershell
npm run prisma:generate
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

---

### Step 5: Run Development Servers

Run both the NestJS API and Next.js frontend concurrently:
```powershell
npm run dev
```

Or run services individually in dedicated terminals:
```powershell
# Start NestJS REST API (port 4000)
npm run dev:api

# Start Next.js Frontend (port 3000)
npm run dev:web
```

---

## 4. Verification & Testing

### Run All Automated Tests
```powershell
# Run API Unit Tests (Auth & Workspaces Service, Guards)
npm run test:api

# Run Frontend Unit Tests (Validation schemas)
npm run test:web

# Run End-to-End Tests against isolated test database (Tenant Isolation, RBAC, Auth, Invitations)
npm run test:e2e
```

### Run Production Builds
```powershell
npm run build:api
npm run build:web
```

---

## 5. Multi-Tenant Workspaces & Pages

* **Workspace Onboarding**: `/onboarding/workspace` — wizard to initialize business workspace with custom slug and timezone.
* **Workspace Selector**: Interactive header dropdown to switch between authorized workspaces.
* **Workspace Settings**: `/settings/workspace` — configure business name, industry, timezone, website, and description (read-only for non-admins).
* **Team Members**: `/settings/members` — member roster with role update dropdowns, member removal, and atomic ownership transfer.
* **Invitations**: `/settings/invitations` — issue single-use hashed invitations, view pending invites, copy direct link (development mode), and revoke tokens.
* **Invitation Acceptance**: `/invitations/accept?token=...` — public token inspection and authenticated acceptance flow with auto-redirection to dashboard.
* **Swagger API Documentation**: `http://localhost:4000/api/docs` — complete OpenAPI specification for all auth, health, workspace, and invitation endpoints.
