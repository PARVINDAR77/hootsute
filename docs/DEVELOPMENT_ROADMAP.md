# SaaS Development Roadmap

## Phase 1: Architectural Foundation & Enterprise Security (Current Stage)
- [x] Monorepo workspace organization (`apps/web`, `apps/api`, `packages/shared`)
- [x] PostgreSQL & Prisma schema initialization with strict relational constraints
- [x] Initial database migration applied
- [x] JWT + Rotated Refresh Token Authentication lifecycle
- [x] Password hashing with bcrypt (12 rounds)
- [x] Role-Based Access Control (`SUPER_ADMIN`, `BUSINESS_OWNER`, `BUSINESS_ADMIN`, `BUSINESS_MEMBER`)
- [x] NestJS versioned API (`/api/v1`) with global validation, error filtering, and logging
- [x] Health checks (`/health` and `/health/ready` with DB ping)
- [x] Interactive Swagger OpenAPI documentation
- [x] Responsive Next.js App Router UI with clean navigation, login, registration, and protected dashboard routes
- [x] Automated test suites (backend & frontend)

---

## Phase 2: Workspaces & Multi-Tenancy (Stage 2)
- Multi-tenant business workspace isolation
- Team member invitations with role delegation
- Workspace branding settings (logos, colors, voice & tone guidelines)
- Subscription tier quota enforcement

---

## Phase 3: Social Account Connections (Stage 3)
- Meta Graph API integration (Facebook Pages, Instagram Business)
- LinkedIn Marketing API integration
- X (Twitter) API v2 integration
- Token encryption at rest for OAuth access tokens and secrets
- Real-time token expiry checks and reconnection notifications

---

## Phase 4: AI Marketing & Creative Engine (Stage 4)
- Post copy generator with tone adjustment, length controls, and hashtag recommendations
- AI visual generator for post creative graphics
- Automated festival and holiday calendar event curation
- BullMQ worker queues for async LLM and image processing

---

## Phase 5: WhatsApp Preview & Approval Workflow (Stage 5)
- Meta WhatsApp Business API webhook integrations
- Interactive preview message generation with approve/reject buttons
- Team feedback loop directly within WhatsApp chats

---

## Phase 6: Scheduler & Publisher Worker (Stage 6)
- High-precision scheduled post dispatcher
- Retries with exponential backoff on network failures
- Post status tracking (`DRAFT`, `PENDING_APPROVAL`, `SCHEDULED`, `PUBLISHED`, `FAILED`)

---

## Phase 7: Analytics & Reporting (Stage 7)
- Follower growth, reach, impressions, and engagement rate metrics
- Scheduled weekly / monthly automated PDF reports
