# Markdown Documentation Inventory — OmniSocial AI

> **Audit Date:** 2026-11-18  
> **Scope:** Every Markdown (`*.md`) file in `D:\hootsute` (excluding `node_modules`)  
> **Total Markdown Files Audited:** 23

---

## 1. Complete Inventory Matrix

| # | File Path | Purpose | Status | Feature / Stage Described | Conflicts with Actual Code? | Action Needed | Dependencies |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `README.md` | Main repository onboarding, stack overview, Windows local dev & test guide | **Outdated** | Stages 1–3 only (Auth, Workspaces, Meta OAuth) | **Yes** — Lists only Stages 1–3, mentions PostgreSQL port `5432` while local `.env` uses `5433`, omits LinkedIn/X/Pinterest/YouTube/TikTok/Threads, AI Studio, Bulk Publish, Inbox, Analytics, Billing, etc. | **Correct & Update** (Phase 1+) | References `docs/*`, `.env.example`, `docker-compose.yml` |
| 2 | `docs/PROJECT_OVERVIEW.md` | Executive product overview, Stage 1 scope boundary, tech stack | **Outdated** | Stage 1 baseline & initial product vision | **Yes** — Describes Stage 1 boundary and WhatsApp preview workflows (WhatsApp module has been removed). | **Correct & Update** | Referenced by `README.md` |
| 3 | `docs/SYSTEM_ARCHITECTURE.md` | Architecture diagram, multi-tenancy, invitation lifecycle, Meta OAuth, Token Vault | **Partially Outdated** | Stages 1–3 architecture | **Yes** — Lists AI/Publisher/Analytics/Billing/S3 as "Future Subsystems" and shows WhatsApp Worker; actual codebase has 23 active NestJS modules and 8 social providers, no BullMQ/Redis worker queue (uses `@nestjs/schedule` sweepers). | **Consolidate into `docs/ARCHITECTURE.md` & update** | References `DATABASE_DESIGN.md`, `SECURITY_BASELINE.md` |
| 4 | `docs/DATABASE_DESIGN.md` | ER diagram and table specs for `SocialAccount`, `OAuthState`, `OAuthSession` | **Outdated** | Stages 1–3 database schema (3 tables only) | **Yes** — Documents only 3 tables and 2 Meta providers; actual `schema.prisma` has **51 models**, **39 enums**, and **8 providers**. | **Supersede/Update as `docs/DATABASE_SCHEMA.md`** | Linked to `apps/api/prisma/schema.prisma` |
| 5 | `docs/API_CONVENTIONS.md` | API base URL, response/error envelopes, endpoint table | **Partially Outdated** | Stages 1–3 endpoints (~29 endpoints) | **Yes** — Envelope format is accurate, but endpoint table lists only ~29 endpoints; actual API has **30 controllers / 197 endpoints**. | **Preserve conventions; expand into `docs/API_REFERENCE.md`** | Linked to `apps/api/src/**/*.controller.ts` |
| 6 | `docs/AUTHENTICATION_FLOW.md` | Mermaid sequence diagram & security properties for register/login/refresh/logout | **Current** | Stage 1 JWT + rotated refresh token auth | **Minor** — Still matches `auth.controller.ts` & `auth.service.ts`; does not yet cover password reset or email verification (both unimplemented). | **Preserve & extend in Phase 3** | Linked to `docs/SECURITY_BASELINE.md` |
| 7 | `docs/SECURITY_BASELINE.md` | Threat model, RBAC, XSS/CSRF/SQLi controls, super-admin CLI bootstrap | **Mostly Current** | Stage 1 security hardening | **Minor** — CLI flag syntax example (`--email`) differs slightly from positional args in `create-super-admin.ts`; omits AES-256-GCM dual-key rotation, HMAC webhooks, magic-byte upload checks. | **Expand into `docs/SECURITY.md`** | Referenced by `README.md`, `DEPLOYMENT_GUIDE.md` |
| 8 | `docs/DEPLOYMENT_GUIDE.md` | Production Docker builds, Compose stack, Nginx TLS, backup & DR | **Mostly Current** | Production deployment & DR (Stages 9–10) | **Minor** — Mentions `META_WHATSAPP_APP_SECRET` (removed) and omits new env vars for Pinterest/YouTube/TikTok/Threads/Resend/Stripe/S3/Caddy. | **Correct & Update as `docs/DEPLOYMENT.md`** | References `docker-compose.prod.yml`, `scripts/*`, `deploy/*` |
| 9 | `docs/DEVELOPMENT_ROADMAP.md` | Detailed Phase 1–25 checklist of historical engineering stages | **Partially Outdated / Overstates Some Items** | Phases 1–25 historical log | **Yes** — Lists Phase 5 (WhatsApp, now removed), claims Claude 3.5 AI & WebSocket gateways (not in codebase), and marks Web Push / SMTP / Listening / Competitors as 100% done despite simulated/in-memory pieces. | **Preserve as historical log; maintain accurate `docs/IMPLEMENTATION_ROADMAP.md`** | Standalone historical ledger |
| 10 | `stage_7_phase_d_dashboard_report.md` | Completion report for Stage 7 Analytics Dashboard UI | **Historical** | Stage 7 Phase D (Oct 10, 2026) | Historical snapshot (mentions WhatsApp in surrounding suite context). | **Preserve / Archive** | Links to Stage 7 analytics files |
| 11 | `stage_9_phase_b_milestone_3_report.md` | Reliability & observability milestone report | **Historical** | Stage 9B M3 (Oct 10, 2026) | Historical snapshot for commit `5b01ed9`. | **Preserve / Archive** | Part of Stage 9 release series |
| 12 | `stage_9_phase_b_milestone_4_report.md` | Verification & release readiness report | **Historical** | Stage 9B M4 (Oct 10, 2026) | Historical snapshot (references WhatsApp). | **Preserve / Archive** | Part of Stage 9 release series |
| 13 | `stage_9_final_release_gate_report.md` | Stage 9B release gate sign-off | **Historical** | Stage 9B Gate (Oct 10, 2026) | Historical snapshot. | **Preserve / Archive** | Depends on M3 & M4 reports |
| 14 | `stage_9_phase_c_production_safety_report.md` | Production safety closure report (`env-validation`, token vault) | **Historical** | Stage 9C (Oct 10, 2026) | Historical snapshot. | **Preserve / Archive** | Linked to `env-validation.ts` |
| 15 | `stage_9_phase_d_staging_report.md` | Controlled staging deployment & smoke testing report | **Historical** | Stage 9D (Oct 10, 2026) | Historical snapshot (references WhatsApp). | **Preserve / Archive** | Linked to `docker-compose.staging.yml` |
| 16 | `stage_9_phase_e_release_candidate_report.md` | Release candidate `v1.0.0-rc1` UAT report | **Historical** | Stage 9E (Oct 10, 2026) | Historical snapshot (references WhatsApp). | **Preserve / Archive** | Part of Stage 9 release series |
| 17 | `stage_9_phase_f_final_release_audit_report.md` | Final release audit report | **Historical** | Stage 9F (Oct 10, 2026) | Historical snapshot (references WhatsApp). | **Preserve / Archive** | Part of Stage 9 release series |
| 18 | `stage_9_phase_g_release_packaging_report.md` | Release packaging & deployment readiness report | **Historical** | Stage 9G (Oct 10, 2026) | Historical snapshot (references WhatsApp). | **Preserve / Archive** | Part of Stage 9 release series |
| 19 | `stage_9_phase_h_commit_readiness_report.md` | Git staging audit for `v1.0.0-rc1` | **Historical** | Stage 9H (Oct 10, 2026) | Historical snapshot (references WhatsApp). | **Preserve / Archive** | Part of Stage 9 release series |
| 20 | `stage_9_phase_i_precommit_verification_report.md` | Final pre-commit verification report | **Historical** | Stage 9I (Oct 10, 2026) | Historical snapshot (references WhatsApp). | **Preserve / Archive** | Part of Stage 9 release series |
| 21 | `stage_10_phase_a_staging_smoke_test_report.md` | Stage 10A staging smoke test report (23/23 pass) | **Historical** | Stage 10A (Oct 10, 2026) | Historical snapshot (commit `5b01ed9`). | **Preserve / Archive** | Part of Stage 10 release series |
| 22 | `stage_10_phase_b_uat_and_readiness_report.md` | Stage 10B UAT & DR verification report | **Historical** | Stage 10B (Oct 10, 2026) | Historical snapshot (commit `5b01ed9`). | **Preserve / Archive** | Part of Stage 10 release series |
| 23 | `stage_10_phase_c_external_readiness_report.md` | Stage 10C external integrations & TLS ingress audit | **Historical** | Stage 10C (Oct 10, 2026) | Historical snapshot (commit `5b01ed9`, references WhatsApp Cloud sandbox & Nginx WebSocket proxy). | **Preserve / Archive** | Linked to `deploy/nginx/omnisocial.conf`, `deploy/caddy/Caddyfile`, `scripts/*` |

---

## 2. Key Documentation Drift Summary

1. **Core docs frozen at Stages 1–3:** `README.md`, `PROJECT_OVERVIEW.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_DESIGN.md`, and `API_CONVENTIONS.md` describe only ~15% of the actual codebase (missing 20 backend modules, 48 DB models, 168 REST endpoints, and 25+ web routes).
2. **Stale WhatsApp references across 16 Markdown files:** The separate WhatsApp backend module, web pages, and DB tables have already been removed in migration `20261118120000_expand_social_platforms_and_remove_whatsapp`, so docs referencing WhatsApp as active must be updated (while preserving historical `stage_*` reports as read-only archive records).
3. **Unimplemented claims in `DEVELOPMENT_ROADMAP.md`:**
   - **Anthropic Claude 3.5** is mentioned in Phase 4, but only Gemini, OpenAI, and Mock text providers exist in `ai-provider.factory.ts`.
   - **WebSocket Gateways** are checked off in Phase 9, but zero `@WebSocketGateway` / `socket.io` gateways exist in `apps/api/src`.
   - **Web Push & SMTP** are checked off in Phases 23 & 25, but `PushNotificationsService` is in-memory + console-logged and `SmtpMailProvider` logs to console (`ResendMailProvider` is real HTTP).
4. **Recommended Documentation Consolidation (Post-Phase 0 Approval):**
   - Keep all 14 `stage_*_report.md` files intact as historical artifacts (optionally move to `docs/archive/` if approved).
   - Establish authoritative, code-verified living docs (`README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_REFERENCE.md`, `docs/DESIGN_SYSTEM.md`, `docs/PLATFORM_INTEGRATIONS.md`, `docs/IMPLEMENTATION_ROADMAP.md`, `docs/API_PAGE_INTEGRATION_MATRIX.md`).
