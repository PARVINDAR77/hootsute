# Existing Features & 8-Platform Capability Matrix — OmniSocial AI

> **Audit Date:** 2026-11-18  
> **Honesty Rule:** Status reflects verified source code and runtime behavior—not roadmap checkboxes.

---

## 1. Core SaaS Module Inventory

| Module / Feature | Backend Module | Frontend Route(s) | Persistence (Prisma) | Real API / Provider Status | Verified Status |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Auth & Sessions** | `AuthModule`, `UsersModule` | `/login`, `/register`, `/settings` | `User`, `RefreshSession` | Real JWT + rotated SHA-256 refresh cookies, bcrypt(12) | **Implemented & Tested** *(Password reset & email verification missing)* |
| **Multi-Tenant Workspaces & RBAC** | `WorkspacesModule` | `/onboarding/workspace`, `/settings/workspace`, `/settings/members`, `/settings/invitations`, `/invitations/accept` | `Workspace`, `WorkspaceMember`, `WorkspaceInvitation`, `AuditLog` | Real PostgreSQL transactions, `WorkspaceAuthGuard`, SHA-256 invites | **Implemented & Tested** |
| **Brand Kit** | `BrandProfileModule` | `/settings/brand-kit` | `WorkspaceBrandProfile` | Real CRUD + feeds AI prompt synthesis | **Implemented & Tested** |
| **AI Content Studio** | `ContentGenerationModule`, `OccasionsModule` | `/content/studio` | `FestivalOccasion`, `ContentDraft`, `ContentVariant` | Real Gemini & OpenAI HTTP providers + dev Mock fallback; **Image gen is brief-only mock** | **Implemented (Text) / Brief-Only (Image)** |
| **Drafts & Multi-Level Approvals** | `ContentDraftsModule`, `ApprovalWorkflowsModule` | `/content/drafts`, `/content/drafts/[id]` | `ContentDraft`, `ContentVariant`, `ContentRevision`, `ApprovalWorkflow`, `ApprovalWorkflowStep`, `DraftStepReview`, `DraftComment` | Real workflow CRUD, role hierarchy, bulk approve, threaded comments | **Implemented & Tested** |
| **Scheduling, Calendar & Bulk Publish** | `PublishingModule` | `/calendar`, `/bulk-publish` | `ScheduledPost`, `ScheduledPostTarget`, `PublishingAttempt` | Real SHA-256 immutable snapshots, sweeper, retry backoff, CSV importer, Bulk Multi-Account Publish (`IMMEDIATE` / `SCHEDULED` / `STAGGERED`) | **Implemented & Tested** |
| **Media Asset Management & Quotas** | `MediaModule` | `/media`, `MediaPickerModal` | `MediaAsset` | Real AWS S3/R2 presigned URLs + magic-byte validation + plan quotas + local mock fallback | **Implemented & Tested** *(Requires S3/R2 env for prod)* |
| **Unified Social Inbox & Moderation** | `InboxModule` | `/inbox`, `/settings/inbox-moderation` | `SocialInteraction`, `InteractionReplyAttempt`, `InteractionNote`, `SocialWebhookEvent`, `InboxSyncCheckpoint`, `InboxNotification`, `InboxModerationRule`, `InboxAutoReplyTemplate` | Real Meta FB/IG adapters, HMAC webhooks, reply reconciler, keyword/sentiment auto-moderation | **Implemented & Tested (FB/IG)** *(No WebSocket push yet)* |
| **Analytics & Growth Insights** | `AnalyticsModule` | `/analytics` *(dedicated `/analytics/insights` route planned)* | `AccountAnalyticsSnapshot`, `PostAnalyticsSnapshot`, `AnalyticsSyncJob`, `AnalyticsSyncError`, `GrowthInsight` | Real Meta FB/IG analytics adapters + rule-based insights engine + sweeper | **Implemented & Tested (FB/IG)** |
| **Social Listening** | `ListeningModule` | `/listening` | `ListeningQuery`, `ListeningMention` | Real PostgreSQL storage + rule-based NLP `SentimentAnalyzerService`; **mention ingestion uses internal sample seeder** | **Implemented (UI/DB/NLP) / Sample Ingestion** |
| **Competitor Benchmarking** | `CompetitorsModule` | `/competitors` | `CompetitorProfile`, `CompetitorSocialAccount`, `CompetitorBenchmarkSnapshot` | Real PostgreSQL + comparison engine; **telemetry sync uses internal snapshot seeder** | **Implemented (UI/DB) / Sample Telemetry** |
| **Branded Link Shortener & UTM** | `LinksModule` | `/links`, public `/api/v1/links/r/:code` | `ShortenedLink`, `LinkClickEvent` | Real Base62 shortener, HTTP 302 redirect, SHA-256 IP hashing, click analytics | **Implemented & Tested** |
| **Smart Automations** | `AutomationsModule` | `/automations` | `AutomationRule`, `AutomationExecutionLog` | Real trigger-action engine, rule test simulator, execution audit trail | **Implemented & Tested** |
| **Outbound Webhooks** | `WebhooksModule` | `/settings/webhooks` | `WebhookSubscription`, `WebhookDeliveryLog` | Real HTTP POST dispatch, HMAC-SHA256 signing, secret rotation, retries | **Implemented & Tested** |
| **White-Label & Executive Reports** | `ReportsModule` | `/settings/white-label`, `/reports` | `WhiteLabelConfig`, `ExecutiveReportSchedule`, `GeneratedExecutiveReport` | Real Caddy `ask` endpoint, live DNS CNAME verifier, HTML executive report generator; **no `@Cron` auto-runner yet** | **Implemented & Tested** *(Needs cron runner for schedules)* |
| **Stripe Billing & Subscriptions** | `BillingModule` | `/settings/billing` | `WorkspaceSubscription`, `BillingInvoice` | Real Stripe SDK Checkout, Portal, webhook handler + dev mock fallback | **Implemented & Tested** *(Requires Stripe keys for live)* |
| **Transactional Mail** | `MailModule` | Backend service | None | Real `ResendMailProvider` HTTP; `SmtpMailProvider` is console-simulated | **Implemented (Resend) / Simulated (SMTP)** |
| **PWA & Web Push** | `PushNotificationsModule` | `manifest.json`, `sw.js`, header toggle | **None (in-memory `Map`)** | VAPID endpoints & SW exist; backend dispatch is console-logged | **Prototype / Needs DB + `web-push`** |
| **Public Marketing Website** | None | None (`/` redirects to `/login`) | None | Not built yet | **Planned (Phase 2)** |
| **WhatsApp Separate System** | **Removed** | **Removed** | **Removed** | Deleted cleanly prior to Phase 0; residual text references in docs/automations spam list only | **Removed** |

---

## 2. Social Media Platform Capability Matrix (8 Target Networks)

| Platform | Enum (`SocialProvider`) | OAuth 2.0 Flow | Multi-Account Support | Publishing Adapter | Inbox Adapter | Analytics Adapter | Live Production Requirements |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Facebook Pages** | `META_FACEBOOK` | Implemented (`MetaOAuthService`) | Yes | Implemented (`/feed`) | Implemented (`MetaFacebookInboxAdapter`) | Implemented (`MetaFacebookAnalyticsAdapter`) | Requires `META_APP_ID`, `META_APP_SECRET` & Meta App Review (`pages_manage_posts`, `pages_read_engagement`) |
| **Instagram Professional** | `META_INSTAGRAM` | Implemented (`MetaOAuthService`) | Yes | Implemented (`/media` + `/media_publish`) | Implemented (`MetaInstagramInboxAdapter`) | Implemented (`MetaInstagramAnalyticsAdapter`) | Requires Business/Creator IG linked to FB Page + Meta App Review; image/video media URL required |
| **LinkedIn** | `LINKEDIN` | Implemented (`LinkedInOAuthService`) | Yes | Implemented (`/v2/ugcPosts`) | Unsupported (Planned) | Unsupported (Planned) | Requires `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` & Marketing/Community Management API approval for company pages |
| **Twitter / X** | `TWITTER_X` | Implemented (`TwitterOAuthService`) | Yes | Implemented (`/2/tweets`, 280-char enforced) | Unsupported (Planned) | Unsupported (Planned) | Requires `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` & X API Basic/Pro tier for write volume |
| **Pinterest** | `PINTEREST` | Implemented (`PinterestOAuthService`) | Yes | Implemented (`/v5/pins`, 500-char desc) | Unsupported (API N/A) | Unsupported (Planned) | Requires `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, Pinterest Standard access, image URL & board ID |
| **YouTube** | `YOUTUBE` | Implemented (`YouTubeOAuthService`) | Yes | Implemented (Data API v3 metadata; resumable binary video upload planned) | Unsupported (Planned) | Unsupported (Planned) | Requires Google Cloud OAuth (`YOUTUBE_CLIENT_ID/SECRET`) & Google API verification for public video upload |
| **TikTok** | `TIKTOK` | Implemented (`TikTokOAuthService`) | Yes | Implemented (Content Posting API v2 `PULL_FROM_URL`) | Unsupported (API restricted) | Unsupported (Planned) | Requires `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, verified domain & TikTok Content Posting API audit |
| **Threads** | `THREADS` | Implemented (`ThreadsOAuthService`) | Yes | Implemented (Threads v1.0 2-step publish, 500-char enforced) | Unsupported (Planned) | Unsupported (Planned) | Requires `THREADS_APP_ID`, `THREADS_APP_SECRET` & Meta Threads API permissions |
