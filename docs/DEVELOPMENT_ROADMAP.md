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
- [x] Multi-tenant business workspace isolation
- [x] Team member invitations with role delegation
- [x] Workspace branding settings (logos, colors, voice & tone guidelines)
- [x] Subscription tier quota enforcement

---

## Phase 3: Social Account Connections (Stage 3)
- [x] Meta Graph API integration (Facebook Pages, Instagram Business)
- [x] Token encryption at rest with AES-256-GCM for OAuth access tokens
- [x] Replay-resistant single-use OAuth states and ephemeral selection sessions
- [x] Disconnect, reconnect, and tenant-isolated credential vaulting

---

## Phase 4: AI Marketing & Creative Engine (Stage 4)
- [x] Multi-provider AI synthesis (Anthropic Claude 3.5, OpenAI GPT-4o, Google Gemini Flash)
- [x] Post copy generator with tone adjustment, length controls, and hashtag recommendations
- [x] Automated festival and holiday calendar event curation with localized religious/national occasions
- [x] Content draft approval workflows and revision history

---

## Phase 5: WhatsApp Preview & Approval Workflow (Stage 5)
- [x] Meta WhatsApp Cloud API integration with signed HMAC-SHA256 webhook verification
- [x] Interactive preview message generation with approve/reject quick action buttons
- [x] Granular stakeholder consent tracking and notification dispatch
- [x] Cryptographic single-use action tokens for web fallback review

---

## Phase 6: Scheduler & Publisher Worker (Stage 6)
- [x] High-precision scheduled post dispatcher with snapshot immutability
- [x] Retry state machine with exponential backoff and jitter
- [x] Reconciler daemon for ambiguous network timeouts and deduplication
- [x] Post status tracking (`DRAFT`, `SCHEDULED`, `DISPATCHING`, `PUBLISHED`, `FAILED`, `CANCELLED`)

---

## Phase 7: Analytics & Reporting (Stage 7)
- [x] Comprehensive engagement, impressions, and follower growth metric collection
- [x] Historical snapshot aggregation (Daily, Weekly, Monthly)
- [x] Interactive analytics dashboard with comparison intervals and platform breakdown
- [x] Rule-based growth insights engine generating actionable recommendations

---

## Phase 8: Unified Social Inbox & Engagement (Stage 8)
- [x] Cross-platform comment and direct message aggregation (Facebook & Instagram)
- [x] In-app threading, bidirectional reply dispatch, and SLA resolution tracking
- [x] Sentiment tagging and AI-assisted reply drafting

---

## Phase 9: Real-Time Webhooks & WebSocket Notifications (Stage 9)
- [x] Event-driven WebSocket gateways for instant inbox and notification sync
- [x] Cryptographic signature validation for external social webhooks
- [x] In-app notification center with read/unread tracking and filtering

---

## Phase 10: Media Asset Management & Cloud Storage (Stage 10)
- [x] Presigned direct-to-cloud uploads (AWS S3 / Cloudflare R2 / Local adapter)
- [x] Magic-byte file signature validation preventing malicious file spoofing
- [x] Media asset tagging, thumbnail generation, and modal asset picker for post creation

---

## Phase 11: Workspace Storage Quota Enforcement (Stage 11)
- [x] Real-time storage consumption metering per tenant
- [x] Plan-based storage and asset count quota gates
- [x] Safe deletion with physical storage reclamation and database synchronization

---

## Phase 12: Stripe Billing, Subscriptions & Metered Usage (Stage 12)
- [x] Stripe Checkout session initiation for FREE, PRO, and ENTERPRISE plans
- [x] Stripe Customer Portal for self-service payment and subscription management
- [x] Idempotent webhook handling with signature verification (`invoice.paid`, `customer.subscription.*`)
- [x] Automated grace period and downgrade handling on subscription cancellation

---

## Phase 13: Smart Automations, Trigger-Action Workflows & Audit Trail (Stage 13)
- [x] Configurable automation rules engine (`AUTO_REPLY_INBOX`, `AI_DRAFT_GENERATE`, `WEBHOOK_DISPATCH`, etc.)
- [x] Rule execution history with granular audit logs and failure diagnostics
- [x] In-app automation rule builder and toggle controls

---

## Phase 14: Multi-Network Social Expansion (LinkedIn & Twitter/X) (Stage 14)
- [x] Database schema & zero-downtime PostgreSQL migrations for LinkedIn & Twitter/X
- [x] LinkedIn OAuth 2.0 flow supporting personal profile & organization company page discovery
- [x] Twitter / X OAuth 2.0 PKCE flow with v2 identity resolution
- [x] Encrypted token storage at rest via `TokenVaultService` (AES-256-GCM)
- [x] LinkedIn publisher dispatching to `/v2/ugcPosts` with organization vs person author URNs
- [x] Twitter / X publisher dispatching to `/2/tweets` with automated strict 280-character limit enforcement
- [x] `PublisherFactoryService` routing for multi-network publish and mock fallbacks
- [x] Frontend connection cards, branding badges, and unified candidate selection modal
- [x] 100% test passing across 47 API unit test suites, 12 E2E test suites, and 9 Web test suites

---

## Phase 15: Bulk CSV / Batch Calendar Importer (Stage 15)
- [x] Downloadable RFC 4180 CSV post template with standard headers and sample multi-platform posts
- [x] Pre-flight dry-run validation engine (`POST /api/v1/workspaces/:workspaceId/bulk-schedule/validate`)
  - Date format parsing & minimum future timestamp verification
  - Platform-specific character length linting (Twitter/X <= 280, Instagram <= 2,200, LinkedIn <= 3,000)
  - Account handle and workspace connection resolution with automatic platform fallback mapping
  - Line-by-line linting and non-mutating preview diagnostics
- [x] Batch committer (`POST /api/v1/workspaces/:workspaceId/bulk-schedule/import`)
  - Creates approved `ContentDraft` records with multi-platform variants and initial revisions
  - Generates canonical JSON snapshots with SHA-256 integrity hashes
  - Spawns corresponding `ScheduledPost` records and `ScheduledPostTarget` rows
  - Records full batch audit log trail
- [x] Interactive Frontend Bulk Importer modal (`BulkScheduleModal.tsx`)
  - Drag-and-drop CSV upload dropzone and raw text paste view
  - Download template trigger
  - Live pre-flight diagnostics table with KPI counters and validation error callouts
  - "Bulk CSV Import" entry point directly integrated into Publishing Calendar
- [x] 100% test passing across 48 API unit test suites (373 tests), 13 E2E test suites (188 tests), and 10 Web test suites (86 tests)

---

## Phase 16: Branded Link Shortener, UTM Campaign Tagging & Click Attribution Engine (Stage 16)
- [x] Database schema & zero-downtime PostgreSQL migrations for `ShortenedLink` and `LinkClickEvent`
  - Relational ties to `Workspace` and `User`
  - Indexed unique `shortCode` and per-workspace link collections
  - Cascading telemetry logs recording IP hash, User-Agent, device type, browser, OS, referrer, and timestamps
- [x] Shared TypeScript contracts & DTOs in `@packages/shared` (`UtmParametersDto`, `CreateShortenedLinkDto`, `ShortenedLinkDto`, `LinkClickEventDto`, `LinkClickAnalyticsDto`)
- [x] Backend Link Shortener Service (`apps/api/src/links/services/links.service.ts`)
  - Collision-resistant Base62 nano-slug generation and custom slug availability validation
  - Deterministic UTM parameter query string synthesis (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`)
  - Fast telemetry ingestion and privacy-preserving SHA-256 IP hashing
  - Aggregated link analytics engine (total clicks, unique estimated visitors, device breakdowns, top referrers, and daily time series)
- [x] Public Link Redirection & Workspace Controller (`apps/api/src/links/controllers/`)
  - Public `@Public()` HTTP 302 redirect controller (`/api/v1/links/r/:code`) with graceful 404 fallback
  - Authenticated CRUD workspace controller (`POST /links`, `GET /links`, `DELETE /links/:id`, `GET /links/:id/analytics`)
- [x] Frontend Link Shortener Dashboard & UTM Builder (`apps/web/src/app/(dashboard)/links/page.tsx`)
  - KPI overview metrics bar (Total Links, Total Clicks, Avg Clicks/Link, Top Referrer)
  - Quick search and copy-to-clipboard actions
  - `CreateLinkModal.tsx`: One-click UTM network presets (LinkedIn, Twitter/X, Facebook, Instagram), live URL preview, custom slug configuration
  - `LinkAnalyticsDrawer.tsx`: Detailed analytics drawer with device breakdown progress bars, top referrer table, and recent telemetry events
  - Sidebar navigation entry (`ROUTES.LINKS`)
- [x] 100% test pass rate across all suites:
  - 49 API unit test suites (384 tests passed)
  - 14 API E2E test suites (197 tests passed)
  - 11 Web test suites (92 tests passed)
  - Clean production builds for shared package, NestJS backend, and Next.js frontend
