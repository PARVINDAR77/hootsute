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

---

## Phase 17: Social Listening, Brand Mentions & Sentiment Monitoring Engine (Stage 17)
- [x] Database schema & zero-downtime PostgreSQL migrations for `ListeningQuery` and `ListeningMention`
  - Relational mapping to `Workspace` and `User`
  - Keyword and exclusion array tracking with indexed search
  - Mentions stream model tracking author, handle, platform, followers, content, url, reach estimates, and engagement counters
  - Cascading cleanup and star / read state management
- [x] Shared TypeScript contracts & DTOs in `@packages/shared` (`ListeningSentiment`, `ListeningQueryDto`, `CreateListeningQueryDto`, `UpdateListeningQueryDto`, `ListeningMentionDto`, `ListeningStreamFilterDto`, `ListeningAnalyticsSummaryDto`)
- [x] Rule-Based NLP Sentiment & Crisis Analysis Engine (`SentimentAnalyzerService`)
  - Normalized polarity scoring between -1.0 and +1.0
  - Contextual negations and linguistic intensifier handling
  - Automatic brand crisis / security incident marker alerting
- [x] Social Listening Backend Service & Controller (`apps/api/src/listening/`)
  - Complete query CRUD with collision prevention
  - Multi-platform sample mention generator seeding realistic brand & competitor buzz
  - Advanced feed filtering (query, sentiment, platform, keyword text search, starred)
  - Aggregated brand sentiment analytics (volume over time, reach, top authors, platform breakdown)
  - Star toggle and read-status mutations
- [x] Frontend Social Listening Dashboard (`apps/web/src/app/(dashboard)/listening/page.tsx`)
  - Sentiment & reach KPI summary cards (% Positive, % Negative, Total Mentions, Est. Reach)
  - Query pill navigation tabs with individual mention counters
  - Filter toolbar with live search, sentiment dropdown, platform dropdown, and starred toggle
  - Rich mention cards featuring author avatars, follower badges, sentiment scores, and direct link actions
  - `CreateQueryModal.tsx`: Keyword tags, exclusions, multi-platform selection checkboxes, and live validation
  - Sidebar integration (`ROUTES.LISTENING`)
- [x] 100% test pass rates across all test suites:
  - 51 API unit test suites (401 tests passed)
  - 15 API E2E test suites (101 tests passed)
  - 12 Web test suites (96 tests passed)
  - Zero-error Next.js production build with 26 static pages

---

## Phase 18: Multi-Level Approval Matrix & Collaborative Content Review Workflow (Stage 18)
- [x] Database schema & zero-downtime PostgreSQL migrations:
  - `ApprovalWorkflow` & `ApprovalWorkflowStep` models with required role requirements (`EDITOR`, `ADMIN`, `OWNER`)
  - `DraftStepReview` model recording decision notes, reviewers, decidedAt timestamps, and status transitions
  - `DraftComment` model enabling hierarchical in-line discussion threads with resolution tracking
  - State machine support for `CHANGES_REQUESTED` and automatic draft resolution upon mandatory step sign-offs
- [x] Shared TypeScript contracts & DTOs in `@packages/shared` (`ApprovalStepStatus`, `ApprovalWorkflowDto`, `ApprovalWorkflowStepDto`, `CreateApprovalWorkflowDto`, `DraftStepReviewDto`, `DraftApprovalProgressDto`, `RecordReviewDecisionDto`, `DraftCommentDto`, `CreateDraftCommentDto`)
- [x] Approval Workflows Backend Engine (`apps/api/src/approval-workflows/`)
  - Workflow CRUD with default workspace assignment
  - Auto-initialization of approval step matrix upon draft submission for review
  - State transition engine: changes requested automatically flags draft; all mandatory approvals automatically approve draft
  - Role hierarchy enforcement preventing unauthorized reviews
  - Threaded draft comments with resolve/unresolve and ownership-based deletion
- [x] Frontend Collaborative Review Interface (`apps/web/`)
  - `ApprovalMatrixStepper.tsx`: Visual multi-stage review progress stepper, role badges, reviewer notes, and decision panels (Approve / Request Changes)
  - `DraftCommentsDrawer.tsx`: In-line discussion drawer with threaded replies, resolution status toggles, and deletion
  - Full integration into Draft Details page (`apps/web/src/app/(dashboard)/content/drafts/[id]/page.tsx`)
- [x] 100% test pass rates across all test suites:
  - 53 API unit test suites (416 tests passed)
  - 16 API E2E test suites (115 tests passed)
  - 13 Web test suites (100 tests passed)
  - Clean production builds for shared package, NestJS backend, and Next.js frontend

---

## Phase 19: White-Label Agency Portals & Automated PDF/Email Executive Reports (Stage 19)
- [x] Database schema & zero-downtime PostgreSQL migrations:
  - `WhiteLabelConfig` model (brand name, custom domain CNAME, logo, favicon, primary/secondary/accent palettes, support email, portal title, custom CSS overrides, hidePoweredBy watermark toggle)
  - `ExecutiveReportSchedule` model (cadence frequency, recipient emails, metric domain toggles, next run scheduling)
  - `GeneratedExecutiveReport` model (period start/end, synthesized metrics summary JSON, responsive HTML template, delivery logs, status)
- [x] Shared TypeScript contracts & DTOs in `@packages/shared` (`ReportFrequency`, `WhiteLabelConfigDto`, `UpsertWhiteLabelConfigDto`, `ExecutiveReportScheduleDto`, `CreateReportScheduleDto`, `UpdateReportScheduleDto`, `GeneratedExecutiveReportDto`, `ExecutiveReportSummaryDto`, `GenerateReportRequestDto`)
- [x] Reports & White-Label Backend Module (`apps/api/src/reports/`)
  - `WhiteLabelService`: Custom portal branding per workspace, public resolution by custom domain/subdomain or workspace slug
  - `ExecutiveReportsService`: Multi-network analytics aggregation (impressions, reach, net follower growth, top 5 published posts, UTM link conversion attribution, and brand listening sentiment polarity breakdown)
  - Responsive HTML executive report synthesizer with dynamic agency brand colors, logo header, and KPI tables
  - Public unauthenticated portal branding discovery endpoint (`GET /api/v1/white-label/public/:domainOrSlug`)
  - Full schedule management and on-demand report runner
- [x] Frontend Agency White-Label & Reports Suite (`apps/web/`)
  - `WhiteLabelPage` (`/settings/white-label`): Agency identity form, CNAME DNS instructions, color picker swatches, custom CSS editor, and real-time interactive live portal preview card
  - `ExecutiveReportsPage` (`/reports`): Top KPI summary banner, reports archive grid with metric chips, automated schedules table, on-demand synthesis modal, schedule configuration modal, and full-screen HTML report viewer drawer with print/PDF export
  - Navigation links added to `Sidebar.tsx` under Workspace and Analytics sections
- [x] 100% test pass rates across all test suites:
  - 55 API unit test suites (430 tests passed)
  - 17 API E2E test suites (238 tests passed)
  - 14 Web test suites (105 tests passed)
  - Zero-error monorepo production build across all 32 static and dynamic routes

---

## Phase 20: AI Smart Auto-Moderation & Sentiment-Driven Triage in Unified Inbox (Stage 20)
- [x] Database schema & zero-downtime PostgreSQL migrations:
  - `InboxModerationAction` enum (`AUTO_HIDE`, `AUTO_FLAG`, `ASSIGN_TO_ROLE`, `AUTO_REPLY`, `CLOSE_INTERACTION`)
  - `InboxModerationRule` model (name, description, active status, priority, triggerKeywords, negativeKeywords, sentimentFilter, minSentimentScore, action, actionPayload, assignedRole, matchesCount, lastTriggeredAt)
  - `InboxAutoReplyTemplate` model (name, category, body, tone, tags, usageCount, isActive)
  - Workspace relations and indexing (`[workspaceId, isActive]`, `[workspaceId, category]`)
- [x] Shared TypeScript contracts & DTOs in `@packages/shared`:
  - `InboxModerationAction`, `InboxModerationRuleDto`, `CreateInboxModerationRuleDto`, `UpdateInboxModerationRuleDto`
  - `InboxAutoReplyTemplateDto`, `CreateInboxAutoReplyTemplateDto`, `UpdateInboxAutoReplyTemplateDto`, `InboxTriageResultDto`
- [x] Inbox Auto-Moderation & Triage Engine (`apps/api/src/inbox/`)
  - `InboxModerationService`: Full CRUD for moderation rules and auto-reply templates
  - Rule evaluation & triage engine: Keyword matching (case-insensitive boundary matching with negation exclusions), sentiment analysis filtering, and automated actions (auto-hide, flag, auto-reply, role assignment, ticket closing)
  - `InboxModerationController`: REST endpoints under `/api/v1/workspaces/:workspaceId/inbox/` with RBAC authorization
  - Registered in `InboxModule`
- [x] Frontend Inbox Moderation & Triage Management (`apps/web/`)
  - `InboxModerationPage` (`/settings/inbox-moderation`): KPI statistics banner, Moderation Rules tab, Rule Creation/Edit Modal with test-simulator, Auto-Reply Template Library tab, Template Creation Modal
  - Sidebar integration with `ShieldAlert` icon under Settings (`ROUTES.SETTINGS_INBOX_MODERATION`)
- [x] 100% test pass rates across all test suites:
  - 56 API unit test suites (438 tests passed)
  - 18 API E2E test suites (247 tests passed)
  - 15 Web test suites (108 tests passed)
  - Zero-error monorepo Next.js production build across all 33 static and dynamic routes

---

## Phase 21: Competitor Benchmarking & Public Intelligence Hub (Stage 21)
- [x] Database schema & zero-downtime PostgreSQL migrations:
  - `CompetitorCategory` enum (`DIRECT`, `INDIRECT`, `ASPIRATIONAL`)
  - `CompetitorProfile` model (name, websiteUrl, avatarUrl, category, notes, isActive, relations to Workspace, socialAccounts, and snapshots)
  - `CompetitorSocialAccount` model (competitorProfileId, platform, handle, publicUrl, followersCount, followingCount, postsCount, isActive, lastSyncedAt)
  - `CompetitorBenchmarkSnapshot` model (competitorProfileId, platform, period, snapshotDate, followerGrowthRate, followersCount, engagementRate, postingFrequencyWeekly, estReach, estImpressions, sentimentScore, sentimentDistribution JSON, topPostExcerpt, topPostEngagementRate)
  - Workspace relations: `competitorProfiles CompetitorProfile[]`
- [x] Shared TypeScript contracts & DTOs in `@packages/shared`:
  - `CompetitorCategory`, `CompetitorProfileDto`, `CreateCompetitorProfileDto`, `UpdateCompetitorProfileDto`
  - `CompetitorSocialAccountDto`, `AddCompetitorAccountDto`, `CompetitorBenchmarkSnapshotDto`
  - `CompetitorComparisonSummaryDto`, `CompetitorLeaderboardItemDto`
- [x] Competitor Intelligence Backend Engine (`apps/api/src/competitors/`):
  - `CompetitorsService`: Profile and social channel CRUD, automated public telemetry snapshot generator across DAY, WEEK, DAYS_28 periods, side-by-side benchmark comparison engine with natural-language AI strategic recommendations
  - `CompetitorsController`: REST endpoints under `/api/v1/workspaces/:workspaceId/competitors` with strict RBAC (`OWNER`/`ADMIN` write; `VIEWER` read)
  - Registered in `AppModule`
- [x] Frontend Public Intelligence & Benchmarking Dashboard (`apps/web/`):
  - `CompetitorsPage` (`/competitors`): Comparative KPI summary banner (Avg Engagement Rate lead, Total Brand Reach, Publishing Cadence, Sentiment Index lead), Industry Leaderboard matrix with relative engagement distribution bars and category badges, AI Strategic Insights callout cards, Top Performing Content feed, Tracked Competitor Profiles grid with channel chips, Track Competitor Modal, and Add Channel Modal
  - Sidebar integration with `Swords` icon under Analytics navigation (`ROUTES.COMPETITORS`)
- [x] 100% test pass rates across all test suites:
  - 57 API unit test suites (448 tests passed)
  - 19 API E2E test suites (257 tests passed)
  - 16 Web test suites (111 tests passed)
  - Zero-error monorepo Next.js production build across all 34 static and dynamic routes

---

## Phase 22: Outbound Webhooks & Developer Integrations Engine (Stage 22)
- [x] Database schema & zero-downtime PostgreSQL migrations:
  - `WebhookDeliveryStatus` enum (`SUCCESS`, `FAILED`, `PENDING_RETRY`)
  - `WebhookSubscription` model (name, targetUrl, secretKey, eventTypes, isActive, description, failureCount, lastTriggeredAt)
  - `WebhookDeliveryLog` model (subscriptionId, workspaceId, eventType, payload, statusCode, durationMs, responseBody, errorMessage, status, attemptNumber, nextRetryAt)
  - Workspace relations: `webhookSubscriptions WebhookSubscription[]`, `webhookDeliveryLogs WebhookDeliveryLog[]`
- [x] Shared TypeScript contracts & DTOs in `@packages/shared`:
  - `WebhookDeliveryStatus`, `WEBHOOK_EVENT_TYPES`, `WebhookEventType`
  - `WebhookSubscriptionDto`, `CreateWebhookSubscriptionDto`, `UpdateWebhookSubscriptionDto`
  - `WebhookDeliveryLogDto`, `WebhookTestPingResponseDto`, `WebhookSecretRotateResponseDto`
- [x] Outbound Webhook Dispatch & Management Engine (`apps/api/src/webhooks/`):
  - `WebhooksService`: Subscription CRUD, cryptographically secure HMAC-SHA256 signature generator (`X-OmniSocial-Signature: sha256=...`), timestamp header (`X-OmniSocial-Timestamp`), secret rotation, live test ping dispatcher, event broadcast dispatch engine, delivery log recorder with latency tracking, and manual retry handler
  - `WebhooksController`: REST endpoints under `/api/v1/workspaces/:workspaceId/webhooks` with strict RBAC authorization
  - Registered in `AppModule`
- [x] Frontend Developer Webhook & Delivery Stream Suite (`apps/web/`):
  - `WebhooksPage` (`/settings/webhooks`):
    - Configured Endpoints view: status badges, failure indicators, subscribed event tags, secret key masking with eye toggle and copy buttons, Rotate Secret modal, Send Test Ping trigger, Edit/Delete
    - Outbound Delivery Stream tab: live attempt logs with HTTP status codes, latency in ms, event type, timestamp, payload inspector modal, and one-click manual retry
    - Developer Verification Guide tab: Node.js HMAC-SHA256 verification code snippet
    - Register/Edit Webhook modal with event checkboxes
  - Sidebar integration with `Webhook` icon under Automations navigation (`ROUTES.SETTINGS_WEBHOOKS`)
- [x] 100% test pass rates across all test suites:
  - 58 API unit test suites (458 tests passed)
  - 20 API E2E test suites (268 tests passed)
  - 17 Web test suites (114 tests passed)
  - Zero-error monorepo Next.js production build across all 35 static and dynamic routes



