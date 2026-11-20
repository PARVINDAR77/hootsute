# Existing Database Inventory — OmniSocial AI

> **Audit Date:** 2026-11-18  
> **Engine:** PostgreSQL 18 (local instance `localhost:5433/hootsute_db`)  
> **ORM:** Prisma 5.22.0 (`apps/api/prisma/schema.prisma`)  
> **Totals:** **51 Models** | **39 Enums** | **21 Applied Migrations**

## 1. Prisma Models (51 Tables)

| # | Prisma Model | PostgreSQL Table (`@@map`) | Workspace-Scoped (`workspaceId`) | Field/Relation Count |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `User` | `users` | Global / Child | 38 |
| 2 | `RefreshSession` | `refresh_sessions` | Global / Child | 10 |
| 3 | `Workspace` | `workspaces` | Global / Child | 53 |
| 4 | `WorkspaceMember` | `workspace_members` | Yes | 10 |
| 5 | `WorkspaceInvitation` | `workspace_invitations` | Yes | 13 |
| 6 | `SocialAccount` | `social_accounts` | Yes | 26 |
| 7 | `OAuthState` | `oauth_states` | Yes | 11 |
| 8 | `OAuthSession` | `oauth_sessions` | Yes | 11 |
| 9 | `WorkspaceBrandProfile` | `workspace_brand_profiles` | Yes | 20 |
| 10 | `ContentDraft` | `content_drafts` | Yes | 27 |
| 11 | `ContentVariant` | `content_variants` | Global / Child | 16 |
| 12 | `ContentRevision` | `content_revisions` | Global / Child | 13 |
| 13 | `FestivalOccasion` | `festival_occasions` | Global / Child | 14 |
| 14 | `AuditLog` | `audit_logs` | Yes | 11 |
| 15 | `ScheduledPost` | `scheduled_posts` | Yes | 21 |
| 16 | `ScheduledPostTarget` | `scheduled_post_targets` | Global / Child | 23 |
| 17 | `PublishingAttempt` | `publishing_attempts` | Global / Child | 13 |
| 18 | `AccountAnalyticsSnapshot` | `account_analytics_snapshots` | Yes | 20 |
| 19 | `PostAnalyticsSnapshot` | `post_analytics_snapshots` | Yes | 26 |
| 20 | `AnalyticsSyncJob` | `analytics_sync_jobs` | Yes | 20 |
| 21 | `AnalyticsSyncError` | `analytics_sync_errors` | Global / Child | 11 |
| 22 | `GrowthInsight` | `growth_insights` | Yes | 15 |
| 23 | `SocialInteraction` | `social_interactions` | Yes | 34 |
| 24 | `InteractionReplyAttempt` | `interaction_reply_attempts` | Yes | 16 |
| 25 | `InteractionNote` | `interaction_notes` | Yes | 10 |
| 26 | `SocialWebhookEvent` | `social_webhook_events` | Global / Child | 7 |
| 27 | `InboxSyncCheckpoint` | `inbox_sync_checkpoints` | Yes | 12 |
| 28 | `InboxNotification` | `inbox_notifications` | Yes | 12 |
| 29 | `MediaAsset` | `media_assets` | Yes | 22 |
| 30 | `WorkspaceSubscription` | `workspace_subscriptions` | Yes | 17 |
| 31 | `BillingInvoice` | `billing_invoices` | Yes | 13 |
| 32 | `AutomationRule` | `automation_rules` | Yes | 15 |
| 33 | `AutomationExecutionLog` | `automation_execution_logs` | Yes | 11 |
| 34 | `ShortenedLink` | `shortened_links` | Yes | 20 |
| 35 | `LinkClickEvent` | `link_click_events` | Global / Child | 11 |
| 36 | `ListeningQuery` | `listening_queries` | Yes | 15 |
| 37 | `ListeningMention` | `listening_mentions` | Yes | 21 |
| 38 | `ApprovalWorkflow` | `approval_workflows` | Yes | 10 |
| 39 | `ApprovalWorkflowStep` | `approval_workflow_steps` | Global / Child | 10 |
| 40 | `DraftStepReview` | `draft_step_reviews` | Global / Child | 12 |
| 41 | `DraftComment` | `draft_comments` | Yes | 17 |
| 42 | `WhiteLabelConfig` | `white_label_configs` | Yes | 18 |
| 43 | `ExecutiveReportSchedule` | `executive_report_schedules` | Yes | 17 |
| 44 | `GeneratedExecutiveReport` | `generated_executive_reports` | Yes | 16 |
| 45 | `InboxModerationRule` | `inbox_moderation_rules` | Yes | 15 |
| 46 | `InboxAutoReplyTemplate` | `inbox_auto_reply_templates` | Yes | 10 |
| 47 | `CompetitorProfile` | `competitor_profiles` | Yes | 13 |
| 48 | `CompetitorSocialAccount` | `competitor_social_accounts` | Global / Child | 13 |
| 49 | `CompetitorBenchmarkSnapshot` | `competitor_benchmark_snapshots` | Global / Child | 17 |
| 50 | `WebhookSubscription` | `webhook_subscriptions` | Yes | 14 |
| 51 | `WebhookDeliveryLog` | `webhook_delivery_logs` | Yes | 15 |

## 2. Prisma Enums (39)

| Enum | Values |
| :--- | :--- |
| `Role` | `SUPER_ADMIN`, `BUSINESS_OWNER`, `BUSINESS_ADMIN`, `BUSINESS_MEMBER` |
| `UserStatus` | `ACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION` |
| `WorkspaceRole` | `OWNER`, `ADMIN`, `EDITOR`, `VIEWER` |
| `WorkspaceStatus` | `ACTIVE`, `SUSPENDED` |
| `WorkspaceMemberStatus` | `ACTIVE`, `INVITED`, `SUSPENDED` |
| `SocialProvider` | `META_FACEBOOK`, `META_INSTAGRAM`, `LINKEDIN`, `TWITTER_X`, `PINTEREST`, `YOUTUBE`, `TIKTOK`, `THREADS` |
| `SocialAccountType` | `FACEBOOK_PAGE`, `INSTAGRAM_BUSINESS`, `INSTAGRAM_CREATOR`, `LINKEDIN_PAGE`, `LINKEDIN_PROFILE`, `TWITTER_PROFILE`, `PINTEREST_BUSINESS`, `YOUTUBE_CHANNEL`, `TIKTOK_BUSINESS`, `TIKTOK_CREATOR`, `THREADS_PROFILE` |
| `SocialConnectionStatus` | `CONNECTED`, `EXPIRED`, `REVOKED`, `DISCONNECTED` |
| `DraftStatus` | `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED` |
| `ApprovalStepStatus` | `PENDING`, `APPROVED`, `CHANGES_REQUESTED`, `SKIPPED` |
| `CampaignObjective` | `ENGAGEMENT`, `SALES_LEADS`, `ANNOUNCEMENT`, `FESTIVAL_WISHES`, `BRAND_AWARENESS`, `EVENT_PROMOTION`, `EDUCATIONAL`, `RECRUITMENT` |
| `ContentType` | `POST`, `REEL_STORY_BRIEF`, `CAROUSEL`, `CAMPAIGN` |
| `SocialPlatform` | `FACEBOOK`, `INSTAGRAM`, `LINKEDIN`, `TWITTER_X`, `PINTEREST`, `YOUTUBE`, `TIKTOK`, `THREADS` |
| `ListeningSentiment` | `POSITIVE`, `NEUTRAL`, `NEGATIVE` |
| `BrandTone` | `PROFESSIONAL`, `CASUAL_FRIENDLY`, `FESTIVE_WARM`, `INSPIRATIONAL`, `URGENT_PROMOTIONAL`, `AUTHORITATIVE`, `PLAYFUL` |
| `MediaType` | `IMAGE`, `VIDEO` |
| `MediaProcessingStatus` | `PENDING`, `UPLOADING`, `PROCESSING`, `READY`, `FAILED` |
| `MediaStorageProvider` | `S3`, `LOCAL_MOCK` |
| `SubscriptionPlan` | `FREE`, `PRO`, `ENTERPRISE` |
| `SubscriptionStatus` | `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `UNPAID`, `INCOMPLETE` |
| `BillingInterval` | `MONTHLY`, `YEARLY` |
| `AutomationTriggerType` | `INBOX_NEW_MESSAGE`, `OCCASION_UPCOMING`, `POST_PUBLISHED`, `POST_HIGH_PERFORMANCE` |
| `AutomationActionType` | `AUTO_REPLY`, `AUTO_HIDE_SPAM`, `GENERATE_AI_DRAFT`, `DISPATCH_WEBHOOK`, `RECYCLE_POST` |
| `AutomationExecutionStatus` | `SUCCESS`, `FAILED`, `SKIPPED` |
| `ScheduledPostStatus` | `SCHEDULED`, `PROCESSING`, `PARTIALLY_PUBLISHED`, `PUBLISHED`, `FAILED`, `CANCELLED`, `NEEDS_REAPPROVAL` |
| `PublishTargetStatus` | `PENDING`, `DISPATCHING`, `PUBLISHED`, `FAILED`, `AUTH_REQUIRED`, `AMBIGUOUS_TIMEOUT`, `RETRYING`, `CANCELLED`, `SKIPPED` |
| `AttemptOutcome` | `SUCCESS`, `DEFINITIVE_FAILURE`, `AMBIGUOUS_TIMEOUT`, `AUTH_FAILURE`, `RATE_LIMITED` |
| `AnalyticsMetricPeriod` | `DAY`, `WEEK`, `DAYS_28`, `LIFETIME` |
| `PostAnalyticsType` | `POST`, `IMAGE`, `VIDEO`, `REEL`, `CAROUSEL`, `STORY` |
| `SyncJobType` | `ACCOUNT_DAILY`, `POST_INCREMENTAL`, `MANUAL_REFRESH`, `HISTORICAL_BACKFILL` |
| `SyncJobStatus` | `QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL_SUCCESS`, `FAILED` |
| `GrowthInsightCategory` | `TIMING`, `CONTENT_FORMAT`, `ENGAGEMENT`, `TOPIC_AUDIENCE`, `CONSISTENCY` |
| `InteractionType` | `COMMENT`, `REPLY`, `MENTION` |
| `InteractionWorkflowStatus` | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `IGNORED` |
| `ReplyAttemptStatus` | `PENDING`, `SENT`, `FAILED`, `AMBIGUOUS_TIMEOUT` |
| `ReportFrequency` | `WEEKLY`, `MONTHLY`, `ON_DEMAND` |
| `InboxModerationAction` | `AUTO_HIDE`, `AUTO_FLAG`, `ASSIGN_TO_ROLE`, `AUTO_REPLY`, `CLOSE_INTERACTION` |
| `CompetitorCategory` | `DIRECT`, `INDIRECT`, `ASPIRATIONAL` |
| `WebhookDeliveryStatus` | `SUCCESS`, `FAILED`, `PENDING_RETRY` |

## 3. Applied Migration History (21 Migrations)

1. `20261009055927_init_auth_foundation`
2. `20261009063209_add_workspaces_and_memberships`
3. `20261009064535_add_social_accounts_and_oauth`
4. `20261009071500_add_content_generation_and_drafts`
5. `20261009083444_add_whatsapp_integration`
6. `20261009092648_add_post_scheduling_engine`
7. `20261010034514_add_analytics_data_layer`
8. `20261010043626_add_social_inbox_and_community_management`
9. `20261012091118_add_shortened_links_and_click_events`
10. `20261012092704_add_social_listening_models`
11. `20261012093730_add_approval_matrix_and_comments`
12. `20261012094728_add_white_label_and_executive_reports`
13. `20261012100409_add_inbox_moderation_and_auto_reply`
14. `20261012101639_add_competitor_benchmarking`
15. `20261012103130_add_outbound_webhooks`
16. `20261012110000_add_media_asset_management`
17. `20261012113000_add_workspace_storage_quota`
18. `20261012120000_add_workspace_billing_and_subscriptions`
19. `20261012130000_add_workspace_automations_and_workflows`
20. `20261012140000_add_linkedin_and_twitter_providers`
21. `20261118120000_expand_social_platforms_and_remove_whatsapp`

## 4. Schema & Persistence Findings (Phase 0 Audit)

1. **Multi-Tenant Isolation:** 36+ tenant tables enforce explicit `workspaceId` foreign keys with `ON DELETE CASCADE` and composite indexes.
2. **8 Social Networks in Schema:** `SocialProvider`, `SocialAccountType`, and `SocialPlatform` already include `FACEBOOK`, `INSTAGRAM`, `LINKEDIN`, `TWITTER_X`, `PINTEREST`, `YOUTUBE`, `TIKTOK`, and `THREADS` (added in migration `20261118120000_expand_social_platforms_and_remove_whatsapp`).
3. **WhatsApp Tables Status:** Already removed cleanly via migration `20261118120000_expand_social_platforms_and_remove_whatsapp` (4 tables and 2 enums dropped prior to this Phase 0 audit).
4. **Persistence Gaps to Address Additively in Later Phases:**
   - **Web Push Subscriptions:** `PushNotificationsService` currently stores subscriptions in an in-memory `Map`; requires an additive `PushSubscription` Prisma model for persistence across restarts.
   - **User Theme Preference:** No `themePreference` column on `User` yet (can be added via additive migration in Phase 1).
   - **Password Reset & Email Verification Tokens:** No `PasswordResetToken` / `EmailVerificationToken` model yet (additive migration in Phase 3).
   - **Public Contact Inquiries:** No `ContactInquiry` table yet if storing submissions in PostgreSQL (additive migration in Phase 2).
