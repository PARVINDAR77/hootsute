# Project Baseline Audit — OmniSocial AI

> **Audit Date:** 2026-11-18  
> **Project Root:** `D:\hootsute`  
> **Git HEAD:** `bd2eeda` *(plus working-tree changes from UI polish, API unwrap fixes, 8-platform expansion, Bulk Publish, and WhatsApp removal)*

---

## 1. Repository & Monorepo Architecture

The project is an npm workspaces TypeScript monorepo following the required **PostgreSQL → Prisma → NestJS API → Next.js Frontend** architecture:

| Workspace / Folder | Role | Tech Stack | Scale (Verified) |
| :--- | :--- | :--- | :--- |
| `apps/web` | Frontend SaaS Web App (PWA-enabled) | Next.js `14.2.35` (App Router), React `18.3.1`, Tailwind CSS `3.4.3`, Lucide Icons, React Hook Form, Zod, TanStack Query | **33 pages**, **32 components**, **17 Jest test suites** |
| `apps/api` | Backend REST API & Scheduled Sweepers | NestJS `10.3.8`, Prisma `5.22.0`, Passport JWT, Bcrypt, Helmet, Throttler, Swagger, AWS S3 SDK, Stripe, IORedis | **23 active modules**, **30 controllers**, **197 REST endpoints**, **55+ unit suites**, **19 E2E suites** |
| `packages/shared` | Shared TypeScript enums & DTO contracts | TypeScript `5.4.5` | Single barrel `src/index.ts` (~2,000 lines), compiles cleanly to `dist/` |
| `apps/api/prisma` | Database Schema & Migrations | PostgreSQL 18 + Prisma ORM | **51 models**, **39 enums**, **21 applied migrations** |
| `scripts` | Backup, restore, DR, rollback, sandbox test harnesses | PowerShell + Bash + Node.js | **17 scripts** |
| `deploy` | Production ingress & automated TLS | Caddy (on-demand TLS for CNAMEs) + Nginx | **2 configs** (`Caddyfile`, `omnisocial.conf`) |

---

## 2. Verified Runtime & Architecture Compliance

| Architecture Rule | Current Status | Verification Notes |
| :--- | :---: | :--- |
| PostgreSQL is single source of truth | **PASS** | Running live on `localhost:5433/hootsute_db`; `GET /api/v1/health/ready` returns `200 OK` (`database: "connected"`). |
| Prisma handles database access | **PASS** | Prisma Client generated cleanly; zero direct frontend DB access. |
| NestJS owns business logic | **PASS** | All mutations/queries pass through `/api/v1/*` with global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`), `HttpExceptionFilter`, `TransformInterceptor`, and `LoggingInterceptor`. |
| Workspace isolation enforced | **PASS** | `WorkspaceAuthGuard` + `@RequireWorkspaceRole` / `@RequireWorkspaceRoles` enforce tenant scoping on workspace-scoped routes. |
| No secrets exposed to frontend | **PASS** | `TokenVaultService` uses AES-256-GCM; `passwordHash`, `tokenHash`, and encrypted OAuth tokens are omitted from API responses. |
| No fake business data / hardcoded dashboard stats | **PASS (Dashboard)** / **PARTIAL (Listening & Competitors)** | Dashboard, Calendar, Drafts, Inbox, Analytics, Links, Reports, Billing, and Webhooks read real PostgreSQL rows. However, Social Listening (`seedSampleMentionsForQuery`) and Competitor Intel (`seedSnapshotsForCompetitor`) populate synthetic sample telemetry until external scraping/APIs are connected. |
| No mock publishing in production | **PASS (Guarded)** | `env-validation.ts` and `ai-provider.factory.ts` / `storage-provider.factory.ts` / `billing-provider.factory.ts` explicitly block `mock` mode when `NODE_ENV=production`. In local development `.env`, `AI_TEXT_PROVIDER="mock"` and `PUBLISHING_PROVIDER="mock"` are currently active for local testing. |

---

## 3. Verified Baseline Test & Build Status

* **Shared Package Build (`npm run build --workspace=@packages/shared`):** **PASS** (0 errors)
* **Backend API Build (`npm run build:api`):** **PASS** (0 errors)
* **Frontend TypeScript Check (non-test source files):** **PASS** (0 errors in `apps/web/src/app`, `components`, `lib`)
* **Frontend Production Build (`next build`):** Encountered transient Windows sandbox `EPERM: mkdir .next/static/chunks` inside the sandbox; runtime dev server compiles and serves **26/26 tested routes with HTTP 200** cleanly. *(Must be verified outside sandbox in Phase 11.)*
* **Frontend Unit Tests (`npm run test:web`):** **PASS — 17/17 suites, 113/113 tests passed**
* **Backend Unit Tests (targeted run on publishing, social-accounts, content-drafts, config):** **PASS — 11/11 suites, 101/101 tests passed**
* **Backend Unit Tests (full earlier run before WhatsApp removal):** **59/60 suites passed (473/474 tests)** — 1 offline timeout failure in `apps/api/src/reports/services/white-label.service.spec.ts` (`verifyCnameDns` calls live `dns/promises` without mocking).

---

## 4. Critical Gaps & Risks Identified Before Redesign

1. **No Public Marketing Website Yet:** Root route `/` immediately redirects unauthenticated visitors to `/login`. None of the required public pages (`/`, `/features`, `/platforms`, `/pricing`, `/about`, `/contact`, `/blog`, `/faq`, `/privacy`, `/terms`, `/security`, `/help`) exist yet.
2. **No Dark Theme or Theme Persistence:** App is currently light-mode only; no theme switcher or `User.themePreference` persistence exists.
3. **No 3D / Motion Libraries Installed:** `apps/web/package.json` does **not** yet include `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, or `gsap`.
4. **Incomplete Auth Flows:** `/forgot-password` and `/reset-password` are static notices; no backend password-reset or email-verification endpoints exist yet; route is currently `/register` (prompt specifies `/signup` — should support `/signup` with `/register` redirect or alias).
5. **Simulated / In-Memory Backend Subsystems:**
   - **Web Push (`PushNotificationsService`):** In-memory `Map` + console log (needs Prisma table + `web-push` transport).
   - **SMTP Mail (`SmtpMailProvider`):** Console log (`nodemailer` not installed; `ResendMailProvider` is real HTTP).
   - **AI Image Generation (`MockImageProvider`):** Returns text creative brief only, not actual generated images.
   - **Executive Report Cron:** No `@Cron` runner executes `ExecutiveReportSchedule` automatically yet.
   - **Real-Time WebSockets:** No `@WebSocketGateway` exists (REST + webhook ingress + reconcilers).
6. **WhatsApp Residual References:** While `apps/api/src/whatsapp/`, web pages, and DB tables were already removed, minor references remain in `automations` spam keywords (`"whatsapp me"`), `docs/*.md`, and historical `stage_*_report.md` files.
7. **Visual Reference Image Missing:** The master prompt references an attached design reference image, which was not attached to the latest message—needed before Phase 1 styling begins.
