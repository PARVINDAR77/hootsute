# Existing API Inventory — OmniSocial AI

> **Audit Date:** 2026-11-18  
> **Source of Truth:** Extracted directly from all `apps/api/src/**/*.controller.ts` files  
> **Base URL:** `http://localhost:4000/api/v1` | **Swagger UI:** `http://localhost:4000/api/docs`  
> **Total Controllers:** 30 | **Total REST Endpoints:** 197

## Summary by Controller

| Controller File | Route Prefix | Endpoints |
| :--- | :--- | :---: |
| `apps/api/src/analytics/controllers/analytics-dashboard.controller.ts` | `/workspaces/:workspaceId/analytics` | 7 |
| `apps/api/src/analytics/controllers/analytics-sync.controller.ts` | `/workspaces/:workspaceId/analytics` | 2 |
| `apps/api/src/approval-workflows/controllers/approval-workflows.controller.ts` | `/workspaces/:workspaceId/approval-workflows` | 5 |
| `apps/api/src/approval-workflows/controllers/draft-approvals.controller.ts` | `/workspaces/:workspaceId/drafts/:draftId` | 7 |
| `apps/api/src/auth/auth.controller.ts` | `/auth` | 6 |
| `apps/api/src/automations/automations.controller.ts` | `/workspaces/:workspaceId/automations` | 9 |
| `apps/api/src/billing/billing.controller.ts` | `/` | 6 |
| `apps/api/src/brand-profile/brand-profile.controller.ts` | `/workspaces/:workspaceId/brand-profile` | 2 |
| `apps/api/src/competitors/controllers/competitors.controller.ts` | `/workspaces/:workspaceId/competitors` | 9 |
| `apps/api/src/content-drafts/content-drafts.controller.ts` | `/workspaces/:workspaceId/content-drafts` | 15 |
| `apps/api/src/content-generation/content-generation.controller.ts` | `/workspaces/:workspaceId/content-generation` | 1 |
| `apps/api/src/health/health.controller.ts` | `/health` | 2 |
| `apps/api/src/inbox/controllers/inbox-moderation.controller.ts` | `/workspaces/:workspaceId/inbox` | 11 |
| `apps/api/src/inbox/controllers/inbox.controller.ts` | `/workspaces/:workspaceId/inbox` | 12 |
| `apps/api/src/inbox/controllers/meta-social-webhook.controller.ts` | `/webhooks/meta,meta/webhook` | 2 |
| `apps/api/src/links/controllers/link-redirect.controller.ts` | `/links` | 2 |
| `apps/api/src/links/controllers/links.controller.ts` | `/workspaces/:workspaceId/links` | 4 |
| `apps/api/src/listening/controllers/listening.controller.ts` | `/workspaces/:workspaceId/listening` | 9 |
| `apps/api/src/media/media.controller.ts` | `/workspaces/:workspaceId/media` | 9 |
| `apps/api/src/occasions/occasions.controller.ts` | `/occasions` | 2 |
| `apps/api/src/publishing/controllers/bulk-schedule.controller.ts` | `/workspaces/:workspaceId/bulk-schedule` | 3 |
| `apps/api/src/publishing/controllers/scheduled-posts.controller.ts` | `/workspaces/:workspaceId/scheduled-posts` | 9 |
| `apps/api/src/push-notifications/push-notifications.controller.ts` | `/notifications/push` | 5 |
| `apps/api/src/reports/controllers/executive-reports.controller.ts` | `/workspaces/:workspaceId/reports` | 9 |
| `apps/api/src/reports/controllers/white-label.controller.ts` | `/` | 6 |
| `apps/api/src/social-accounts/oauth.controller.ts` | `/oauth` | 7 |
| `apps/api/src/social-accounts/social-accounts.controller.ts` | `/workspaces/:workspaceId/social-accounts` | 14 |
| `apps/api/src/webhooks/controllers/webhooks.controller.ts` | `/workspaces/:workspaceId/webhooks` | 9 |
| `apps/api/src/workspaces/invitations.controller.ts` | `/invitations` | 2 |
| `apps/api/src/workspaces/workspaces.controller.ts` | `/workspaces` | 11 |

---

## Complete Endpoint Catalog (197 Endpoints)

### `apps/api/src/analytics/controllers/analytics-dashboard.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/analytics/overview` | `JWT_AUTH` | — |
| `GET` | `/api/v1/workspaces/:workspaceId/analytics/timeseries` | `JWT_AUTH` | — |
| `GET` | `/api/v1/workspaces/:workspaceId/analytics/posts` | `JWT_AUTH` | — |
| `GET` | `/api/v1/workspaces/:workspaceId/analytics/top-performing` | `JWT_AUTH` | — |
| `GET` | `/api/v1/workspaces/:workspaceId/analytics/insights` | `JWT_AUTH` | — |
| `POST` | `/api/v1/workspaces/:workspaceId/analytics/insights/:insightId/dismiss` | `JWT_AUTH` | — |
| `POST` | `/api/v1/workspaces/:workspaceId/analytics/insights/generate` | `JWT_AUTH` | — |

### `apps/api/src/analytics/controllers/analytics-sync.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/analytics/sync-status` | `JWT_AUTH` | — |
| `POST` | `/api/v1/workspaces/:workspaceId/analytics/sync-now` | `JWT_AUTH` | — |

### `apps/api/src/approval-workflows/controllers/approval-workflows.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/approval-workflows` | `ADMIN` | Create a new multi-stage approval workflow |
| `GET` | `/api/v1/workspaces/:workspaceId/approval-workflows` | `VIEWER` | List all approval workflows configured for the workspace |
| `GET` | `/api/v1/workspaces/:workspaceId/approval-workflows/:id` | `VIEWER` | List all approval workflows configured for the workspace |
| `PUT` | `/api/v1/workspaces/:workspaceId/approval-workflows/:id` | `ADMIN` | Update an existing approval workflow |
| `DELETE` | `/api/v1/workspaces/:workspaceId/approval-workflows/:id` | `ADMIN` | Delete an approval workflow |

### `apps/api/src/approval-workflows/controllers/draft-approvals.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/drafts/:draftId/approval/init` | `EDITOR` | Initialize or submit draft to approval workflow matrix |
| `GET` | `/api/v1/workspaces/:workspaceId/drafts/:draftId/approval/progress` | `VIEWER` | Get multi-step approval progress matrix for a draft |
| `POST` | `/api/v1/workspaces/:workspaceId/drafts/:draftId/approval/steps/:stepId/decision` | `EDITOR` | Record approval or change request decision on a review step |
| `GET` | `/api/v1/workspaces/:workspaceId/drafts/:draftId/comments` | `VIEWER` | Get contextual comments and review discussion threads |
| `POST` | `/api/v1/workspaces/:workspaceId/drafts/:draftId/comments` | `VIEWER` | Add a new in-line review comment or threaded reply |
| `PATCH` | `/api/v1/workspaces/:workspaceId/drafts/:draftId/comments/:commentId/resolve` | `VIEWER` | Toggle resolved status of a comment thread |
| `DELETE` | `/api/v1/workspaces/:workspaceId/drafts/:draftId/comments/:commentId` | `VIEWER` | Delete a comment |

### `apps/api/src/auth/auth.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `PUBLIC` | Register a new business owner account |
| `POST` | `/api/v1/auth/login` | `PUBLIC` | Authenticate user and issue access/refresh tokens |
| `POST` | `/api/v1/auth/refresh` | `PUBLIC` | Rotate access and refresh tokens |
| `POST` | `/api/v1/auth/logout` | `JWT_AUTH` | Revoke active refresh session and clear cookies |
| `POST` | `/api/v1/auth/logout-all` | `JWT_AUTH` | Revoke all active sessions for current user |
| `GET` | `/api/v1/auth/me` | `JWT_AUTH` | Retrieve authenticated user profile |

### `apps/api/src/automations/automations.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/automations/templates` | `VIEWER, EDITOR, ADMIN, OWNER` | Get list of pre-built 1-click automation recipes |
| `GET` | `/api/v1/workspaces/:workspaceId/automations/logs` | `VIEWER, EDITOR, ADMIN, OWNER` | Get past execution audit logs for workspace automations |
| `GET` | `/api/v1/workspaces/:workspaceId/automations` | `VIEWER, EDITOR, ADMIN, OWNER` | Get all configured automation rules in the workspace |
| `POST` | `/api/v1/workspaces/:workspaceId/automations` | `ADMIN, OWNER` | Create a new trigger-action automation rule |
| `GET` | `/api/v1/workspaces/:workspaceId/automations/:ruleId` | `VIEWER, EDITOR, ADMIN, OWNER` | Get a specific automation rule by ID |
| `PUT` | `/api/v1/workspaces/:workspaceId/automations/:ruleId` | `ADMIN, OWNER` | Update an existing automation rule |
| `DELETE` | `/api/v1/workspaces/:workspaceId/automations/:ruleId` | `ADMIN, OWNER` | Delete an automation rule |
| `PATCH` | `/api/v1/workspaces/:workspaceId/automations/:ruleId/toggle` | `ADMIN, OWNER` | Toggle an automation rule enabled/disabled |
| `POST` | `/api/v1/workspaces/:workspaceId/automations/:ruleId/test` | `ADMIN, OWNER` | Dry-run test an automation rule against sample payload |

### `apps/api/src/billing/billing.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/billing/plans` | `PUBLIC` | Get list of available subscription pricing plans and tier limits |
| `GET` | `/api/v1/workspaces/:workspaceId/billing/subscription` | `VIEWER, EDITOR, ADMIN, OWNER` | Get current workspace subscription status and renewal info |
| `GET` | `/api/v1/workspaces/:workspaceId/billing/invoices` | `VIEWER, EDITOR, ADMIN, OWNER` | Get past billing invoices for the workspace |
| `POST` | `/api/v1/workspaces/:workspaceId/billing/checkout-session` | `ADMIN, OWNER` | Create a Stripe Checkout Session for subscription upgrade |
| `POST` | `/api/v1/workspaces/:workspaceId/billing/customer-portal` | `ADMIN, OWNER` | Generate a customer portal session to manage cards and subscriptions |
| `POST` | `/api/v1/billing/webhook` | `PUBLIC` | Stripe webhook receiver for payment and subscription events |

### `apps/api/src/brand-profile/brand-profile.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/brand-profile` | `VIEWER` | Retrieve workspace brand profile |
| `PUT` | `/api/v1/workspaces/:workspaceId/brand-profile` | `ADMIN` | Create or update workspace brand profile |

### `apps/api/src/competitors/controllers/competitors.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/competitors` | `ADMIN` | Create a new tracked competitor profile |
| `GET` | `/api/v1/workspaces/:workspaceId/competitors` | `VIEWER` | List all tracked competitors for the workspace |
| `GET` | `/api/v1/workspaces/:workspaceId/competitors/benchmark/summary` | `VIEWER` | Get side-by-side comparative benchmarking analytics summary |
| `POST` | `/api/v1/workspaces/:workspaceId/competitors/benchmark/sync` | `ADMIN` | Trigger synchronization of competitor public telemetry snapshots |
| `GET` | `/api/v1/workspaces/:workspaceId/competitors/:id` | `VIEWER` | Trigger synchronization of competitor public telemetry snapshots |
| `PATCH` | `/api/v1/workspaces/:workspaceId/competitors/:id` | `ADMIN` | Update competitor profile information |
| `DELETE` | `/api/v1/workspaces/:workspaceId/competitors/:id` | `ADMIN` | Delete competitor profile and remove from tracking |
| `POST` | `/api/v1/workspaces/:workspaceId/competitors/:id/accounts` | `ADMIN` | Add or update a social channel to track for this competitor |
| `DELETE` | `/api/v1/workspaces/:workspaceId/competitors/:id/accounts/:accountId` | `ADMIN` | Remove a social channel from a competitor profile |

### `apps/api/src/content-drafts/content-drafts.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts` | `EDITOR` | Create a new content draft |
| `GET` | `/api/v1/workspaces/:workspaceId/content-drafts` | `VIEWER` | List workspace content drafts with filters and pagination |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/bulk-approve` | `ADMIN` | Bulk approve multiple campaign drafts (ADMIN or OWNER only) |
| `GET` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId` | `VIEWER` | Retrieve content draft by ID with variants and revisions |
| `PATCH` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId` | `EDITOR` | Update editable fields of draft and its variants |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/duplicate` | `EDITOR` | Duplicate an existing draft and all its platform variants |
| `DELETE` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId` | `EDITOR` | Delete a draft according to authorization and status policy |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/variants/:variantId/regenerate` | `EDITOR` | Regenerate whole variant or a specific field using AI provider |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/variants/:variantId/translate` | `EDITOR` | Translate variant to target language using AI |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/variants/:variantId/adapt` | `EDITOR` | Adapt variant content to another target social platform |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/variants/:variantId/creative-brief` | `EDITOR` | Generate structured visual creative brief for image direction |
| `GET` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/revisions` | `VIEWER` | Retrieve append-only revision history of a draft |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/submit-review` | `EDITOR` | Submit draft for review (DRAFT -> IN_REVIEW) |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/approve` | `ADMIN` | Approve draft (IN_REVIEW -> APPROVED). ADMIN or OWNER only. |
| `POST` | `/api/v1/workspaces/:workspaceId/content-drafts/:draftId/reject` | `ADMIN` | Reject draft with mandatory reason (IN_REVIEW -> REJECTED). ADMIN or OWNER only. |

### `apps/api/src/content-generation/content-generation.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/content-generation/generate` | `EDITOR` | Generate multi-platform marketing content using real AI provider |

### `apps/api/src/health/health.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | `PUBLIC` | Liveness health check endpoint |
| `GET` | `/api/v1/health/ready` | `PUBLIC` | Readiness probe verifying database connectivity |

### `apps/api/src/inbox/controllers/inbox-moderation.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/inbox/moderation-rules` | `ADMIN` | Create a new inbox auto-moderation triage rule |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/moderation-rules` | `VIEWER` | List all auto-moderation triage rules configured for workspace |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/moderation-rules/:id` | `VIEWER` | List all auto-moderation triage rules configured for workspace |
| `PUT` | `/api/v1/workspaces/:workspaceId/inbox/moderation-rules/:id` | `ADMIN` | Update an existing moderation rule |
| `DELETE` | `/api/v1/workspaces/:workspaceId/inbox/moderation-rules/:id` | `ADMIN` | Delete a moderation rule |
| `POST` | `/api/v1/workspaces/:workspaceId/inbox/reply-templates` | `EDITOR` | Create an AI auto-reply template |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/reply-templates` | `VIEWER` | List all auto-reply templates in workspace |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/reply-templates/:id` | `VIEWER` | Get details for a reply template |
| `PUT` | `/api/v1/workspaces/:workspaceId/inbox/reply-templates/:id` | `EDITOR` | Update an auto-reply template |
| `DELETE` | `/api/v1/workspaces/:workspaceId/inbox/reply-templates/:id` | `EDITOR` | Delete an auto-reply template |
| `POST` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId/triage` | `EDITOR` | Evaluate an interaction against moderation rules and execute triage action |

### `apps/api/src/inbox/controllers/inbox.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/interactions` | `JWT_AUTH` | — |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId` | `JWT_AUTH` | — |
| `POST` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId/replies` | `EDITOR, ADMIN, OWNER` | Post public reply to comment or mention |
| `PATCH` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId/status` | `EDITOR, ADMIN, OWNER` | Update workflow triage status (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, IGNORED) |
| `PATCH` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId/assignment` | `EDITOR, ADMIN, OWNER` | Assign interaction to workspace team member |
| `PATCH` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId/read` | `JWT_AUTH` | — |
| `POST` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId/notes` | `EDITOR, ADMIN, OWNER` | Add internal collaboration note visible only to workspace members |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/interactions/:interactionId/notes` | `JWT_AUTH` | — |
| `POST` | `/api/v1/workspaces/:workspaceId/inbox/sync` | `EDITOR, ADMIN, OWNER` | Trigger manual synchronization of comments and mentions |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/sync-status` | `JWT_AUTH` | — |
| `GET` | `/api/v1/workspaces/:workspaceId/inbox/notifications` | `JWT_AUTH` | — |
| `PATCH` | `/api/v1/workspaces/:workspaceId/inbox/notifications/:notificationId/read` | `JWT_AUTH` | — |

### `apps/api/src/inbox/controllers/meta-social-webhook.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/webhooks/meta,meta/webhook` | `PUBLIC` | Meta Webhook Handshake Verification (hub.challenge) |
| `POST` | `/api/v1/webhooks/meta,meta/webhook` | `PUBLIC` | Meta Inbound Webhook Event Notifications |

### `apps/api/src/links/controllers/link-redirect.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/links/r/:code` | `PUBLIC` | Public short URL redirect with click telemetry tracking |
| `GET` | `/api/v1/links/l/:code` | `JWT_AUTH` | Alternative short URL redirect endpoint |

### `apps/api/src/links/controllers/links.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/links` | `EDITOR` | Create a shortened branded link with UTM tracking parameters |
| `GET` | `/api/v1/workspaces/:workspaceId/links` | `VIEWER` | List all shortened links for the workspace |
| `GET` | `/api/v1/workspaces/:workspaceId/links/:linkId/analytics` | `VIEWER` | Retrieve click metrics, device breakdowns, and referrers for a link |
| `DELETE` | `/api/v1/workspaces/:workspaceId/links/:linkId` | `EDITOR` | Soft delete a shortened link |

### `apps/api/src/listening/controllers/listening.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/listening/queries` | `EDITOR` | Create a new brand/competitor listening query |
| `GET` | `/api/v1/workspaces/:workspaceId/listening/queries` | `VIEWER` | List all listening queries for the workspace |
| `GET` | `/api/v1/workspaces/:workspaceId/listening/queries/:id` | `VIEWER` | List all listening queries for the workspace |
| `PUT` | `/api/v1/workspaces/:workspaceId/listening/queries/:id` | `EDITOR` | Update an existing listening query |
| `DELETE` | `/api/v1/workspaces/:workspaceId/listening/queries/:id` | `ADMIN` | Delete a listening query and all its mentions |
| `GET` | `/api/v1/workspaces/:workspaceId/listening/feed` | `VIEWER` | Get paginated mentions stream with advanced filters |
| `PATCH` | `/api/v1/workspaces/:workspaceId/listening/mentions/:id/star` | `EDITOR` | Toggle starred status on a mention |
| `PATCH` | `/api/v1/workspaces/:workspaceId/listening/mentions/:id/read` | `VIEWER` | Mark mention as read or unread |
| `GET` | `/api/v1/workspaces/:workspaceId/listening/analytics` | `VIEWER` | Get aggregate sentiment metrics, breakdown, and reach statistics |

### `apps/api/src/media/media.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/media/[upload-sessions,upload-session]` | `EDITOR, ADMIN, OWNER` | Initiate a secure media upload session and obtain a signed upload URL |
| `POST` | `/api/v1/workspaces/:workspaceId/media/:assetId/complete` | `EDITOR, ADMIN, OWNER` | Verify and finalize an uploaded media asset |
| `POST` | `/api/v1/workspaces/:workspaceId/media/direct-upload` | `EDITOR, ADMIN, OWNER` | Direct server-mediated file upload |
| `GET` | `/api/v1/workspaces/:workspaceId/media` | `VIEWER, EDITOR, ADMIN, OWNER` | List and search workspace media assets with pagination |
| `GET` | `/api/v1/workspaces/:workspaceId/media/storage-usage` | `VIEWER, EDITOR, ADMIN, OWNER` | Get workspace storage quota, usage metrics, and asset counts |
| `GET` | `/api/v1/workspaces/:workspaceId/media/:assetId` | `VIEWER, EDITOR, ADMIN, OWNER` | Get single media asset details by ID |
| `GET` | `/api/v1/workspaces/:workspaceId/media/[:assetId/access-url,:assetId/download-url]` | `VIEWER, EDITOR, ADMIN, OWNER` | Generate a short-lived download or preview signed URL |
| `DELETE` | `/api/v1/workspaces/:workspaceId/media/:assetId` | `EDITOR, ADMIN, OWNER` | Delete a media asset with safety protection against active scheduled posts |
| `POST` | `/api/v1/workspaces/:workspaceId/media/:assetId/retry-processing` | `EDITOR, ADMIN, OWNER` | Retry processing for a failed upload |

### `apps/api/src/occasions/occasions.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/occasions` | `PUBLIC` | List curated festival and occasion catalog |
| `GET` | `/api/v1/occasions/:slug` | `JWT_AUTH` | Retrieve festival occasion details by slug |

### `apps/api/src/publishing/controllers/bulk-schedule.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/bulk-schedule/template` | `VIEWER` | Download sample RFC 4180 CSV bulk scheduling template |
| `POST` | `/api/v1/workspaces/:workspaceId/bulk-schedule/validate` | `EDITOR` | Perform dry-run pre-flight validation on CSV post content |
| `POST` | `/api/v1/workspaces/:workspaceId/bulk-schedule/import` | `EDITOR` | Commit validated batch rows into scheduled calendar posts |

### `apps/api/src/publishing/controllers/scheduled-posts.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/scheduled-posts` | `EDITOR` | Schedule an approved content draft for publication |
| `POST` | `/api/v1/workspaces/:workspaceId/scheduled-posts/bulk-publish` | `EDITOR` | Bulk publish or schedule one or more approved campaign drafts across multiple social accounts |
| `GET` | `/api/v1/workspaces/:workspaceId/scheduled-posts` | `VIEWER` | List scheduled posts with filters and pagination |
| `GET` | `/api/v1/workspaces/:workspaceId/scheduled-posts/calendar` | `VIEWER` | Query scheduled posts for calendar date range |
| `GET` | `/api/v1/workspaces/:workspaceId/scheduled-posts/:id` | `VIEWER` | Get details of a specific scheduled post |
| `PATCH` | `/api/v1/workspaces/:workspaceId/scheduled-posts/:id/reschedule` | `EDITOR` | Reschedule a pending or failed post to a new timestamp |
| `DELETE` | `/api/v1/workspaces/:workspaceId/scheduled-posts/:id/cancel` | `EDITOR` | Cancel a pending scheduled post |
| `POST` | `/api/v1/workspaces/:workspaceId/scheduled-posts/:id/cancel` | `EDITOR` | Cancel a pending scheduled post (POST alias) |
| `POST` | `/api/v1/workspaces/:workspaceId/scheduled-posts/:id/targets/:targetId/retry` | `EDITOR` | Manually retry publishing an eligible failed or ambiguous target |

### `apps/api/src/push-notifications/push-notifications.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications/push/vapid-public-key` | `PUBLIC` | Get application VAPID public key for browser push subscription |
| `POST` | `/api/v1/notifications/push/subscribe` | `JWT_AUTH` | Get application VAPID public key for browser push subscription |
| `POST` | `/api/v1/notifications/push/unsubscribe` | `JWT_AUTH` | Unsubscribe browser endpoint from Web Push notifications |
| `GET` | `/api/v1/notifications/push/subscriptions` | `JWT_AUTH` | List active push subscriptions for current user |
| `POST` | `/api/v1/notifications/push/test` | `JWT_AUTH` | List active push subscriptions for current user |

### `apps/api/src/reports/controllers/executive-reports.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/reports/schedules` | `ADMIN` | Create an automated executive report schedule |
| `GET` | `/api/v1/workspaces/:workspaceId/reports/schedules` | `VIEWER` | List all executive report delivery schedules |
| `GET` | `/api/v1/workspaces/:workspaceId/reports/schedules/:id` | `VIEWER` | List all executive report delivery schedules |
| `PUT` | `/api/v1/workspaces/:workspaceId/reports/schedules/:id` | `ADMIN` | Update an executive report schedule |
| `DELETE` | `/api/v1/workspaces/:workspaceId/reports/schedules/:id` | `ADMIN` | Delete an executive report schedule |
| `POST` | `/api/v1/workspaces/:workspaceId/reports/generate` | `EDITOR` | Synthesize and generate an executive report on demand |
| `GET` | `/api/v1/workspaces/:workspaceId/reports/history` | `VIEWER` | Retrieve archive of generated executive reports |
| `GET` | `/api/v1/workspaces/:workspaceId/reports/history/:id` | `VIEWER` | Retrieve archive of generated executive reports |
| `DELETE` | `/api/v1/workspaces/:workspaceId/reports/history/:id` | `ADMIN` | Delete a generated executive report |

### `apps/api/src/reports/controllers/white-label.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/white-label` | `VIEWER` | Get white-label branding configuration for workspace |
| `PUT` | `/api/v1/workspaces/:workspaceId/white-label` | `ADMIN` | Get white-label branding configuration for workspace |
| `DELETE` | `/api/v1/workspaces/:workspaceId/white-label` | `ADMIN` | Reset white-label branding to system default |
| `GET` | `/api/v1/workspaces/:workspaceId/white-label/verify-cname` | `VIEWER` | Reset white-label branding to system default |
| `GET` | `/api/v1/white-label/caddy-ask` | `PUBLIC` | Caddy On-Demand TLS verification hook |
| `GET` | `/api/v1/white-label/public/:domainOrSlug` | `PUBLIC` | Public endpoint to load agency branding tokens for custom domains or client portal |

### `apps/api/src/social-accounts/oauth.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/oauth/meta/callback` | `PUBLIC` | Official Meta OAuth 2.0 redirect callback endpoint |
| `GET` | `/api/v1/oauth/linkedin/callback` | `PUBLIC` | Official LinkedIn OAuth 2.0 redirect callback endpoint |
| `GET` | `/api/v1/oauth/twitter/callback` | `PUBLIC` | Official Twitter / X OAuth 2.0 redirect callback endpoint |
| `GET` | `/api/v1/oauth/pinterest/callback` | `PUBLIC` | Pinterest OAuth 2.0 redirect callback endpoint |
| `GET` | `/api/v1/oauth/youtube/callback` | `PUBLIC` | YouTube OAuth 2.0 redirect callback endpoint |
| `GET` | `/api/v1/oauth/tiktok/callback` | `PUBLIC` | TikTok OAuth 2.0 redirect callback endpoint |
| `GET` | `/api/v1/oauth/threads/callback` | `PUBLIC` | Threads OAuth 2.0 redirect callback endpoint |

### `apps/api/src/social-accounts/social-accounts.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces/:workspaceId/social-accounts` | `JWT_AUTH` | List connected social accounts for the workspace |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/meta/connect` | `ADMIN` | Initiate Meta OAuth 2.0 flow (ADMIN or OWNER only) |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/linkedin/connect` | `ADMIN` | Initiate LinkedIn OAuth 2.0 flow (ADMIN or OWNER only) |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/twitter/connect` | `ADMIN` | Initiate Twitter / X OAuth 2.0 flow (ADMIN or OWNER only) |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/pinterest/connect` | `ADMIN` | Initiate Pinterest OAuth 2.0 flow (ADMIN or OWNER only) |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/youtube/connect` | `ADMIN` | Initiate YouTube OAuth 2.0 flow (ADMIN or OWNER only) |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/tiktok/connect` | `ADMIN` | Initiate TikTok OAuth 2.0 flow (ADMIN or OWNER only) |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/threads/connect` | `ADMIN` | Initiate Threads OAuth 2.0 flow (ADMIN or OWNER only) |
| `GET` | `/api/v1/workspaces/:workspaceId/social-accounts/candidates` | `ADMIN` | Retrieve discovered candidate accounts awaiting selection |
| `GET` | `/api/v1/workspaces/:workspaceId/social-accounts/meta/candidates` | `ADMIN` | Retrieve discovered Meta candidate accounts awaiting selection |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/select` | `ADMIN` | Save selected social accounts |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/meta/select` | `ADMIN` | Save selected Facebook Pages or Instagram accounts |
| `POST` | `/api/v1/workspaces/:workspaceId/social-accounts/:accountId/reconnect` | `ADMIN` | Reconnect an expired or revoked social account |
| `DELETE` | `/api/v1/workspaces/:workspaceId/social-accounts/:accountId` | `ADMIN` | Disconnect and delete a social account |

### `apps/api/src/webhooks/controllers/webhooks.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces/:workspaceId/webhooks` | `ADMIN` | Register a new outbound webhook subscription |
| `GET` | `/api/v1/workspaces/:workspaceId/webhooks` | `VIEWER` | List all webhook subscriptions for the workspace |
| `GET` | `/api/v1/workspaces/:workspaceId/webhooks/deliveries` | `VIEWER` | List all webhook subscriptions for the workspace |
| `POST` | `/api/v1/workspaces/:workspaceId/webhooks/deliveries/:deliveryId/retry` | `ADMIN` | Manually retry an outbound webhook delivery attempt |
| `GET` | `/api/v1/workspaces/:workspaceId/webhooks/:id` | `VIEWER` | Get details for a specific webhook subscription |
| `PATCH` | `/api/v1/workspaces/:workspaceId/webhooks/:id` | `ADMIN` | Update webhook subscription configuration |
| `DELETE` | `/api/v1/workspaces/:workspaceId/webhooks/:id` | `ADMIN` | Delete a webhook subscription |
| `POST` | `/api/v1/workspaces/:workspaceId/webhooks/:id/rotate-secret` | `ADMIN` | Rotate secret signing key for webhook subscription |
| `POST` | `/api/v1/workspaces/:workspaceId/webhooks/:id/test-ping` | `ADMIN` | Send an immediate test ping event to destination endpoint |

### `apps/api/src/workspaces/invitations.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/invitations/info` | `PUBLIC` | Retrieve public workspace info for an invitation token |
| `POST` | `/api/v1/invitations/accept` | `JWT_AUTH` | Accept a workspace invitation |

### `apps/api/src/workspaces/workspaces.controller.ts`

| Method | Endpoint | Access / Role | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces` | `JWT_AUTH` | Create a new business workspace (caller becomes OWNER) |
| `GET` | `/api/v1/workspaces` | `JWT_AUTH` | List all accessible workspaces for current user |
| `GET` | `/api/v1/workspaces/:workspaceId` | `JWT_AUTH` | List all accessible workspaces for current user |
| `PATCH` | `/api/v1/workspaces/:workspaceId` | `ADMIN` | Update permitted workspace settings (ADMIN or OWNER only) |
| `GET` | `/api/v1/workspaces/:workspaceId/members` | `JWT_AUTH` | List all members of this workspace |
| `PATCH` | `/api/v1/workspaces/:workspaceId/members/:memberId` | `ADMIN` | Update member role or status (ADMIN or OWNER only) |
| `DELETE` | `/api/v1/workspaces/:workspaceId/members/:memberId` | `JWT_AUTH` | Remove a member from the workspace (or voluntarily leave) |
| `POST` | `/api/v1/workspaces/:workspaceId/transfer-ownership` | `OWNER` | Transfer workspace ownership to another member (OWNER only) |
| `POST` | `/api/v1/workspaces/:workspaceId/invitations` | `ADMIN` | Invite a new team member to this workspace (ADMIN or OWNER) |
| `GET` | `/api/v1/workspaces/:workspaceId/invitations` | `ADMIN` | List active invitations for this workspace |
| `POST` | `/api/v1/workspaces/:workspaceId/invitations/:invitationId/revoke` | `ADMIN` | Revoke an invitation (ADMIN or OWNER) |

---

## API Gaps Identified for Upcoming Redesign Phases

| Needed Capability | Current Backend Status | Required Action |
| :--- | :--- | :--- |
| Public Contact Form (`/contact`) | Missing | Add `POST /api/v1/public/contact` with DTO validation, throttling & persistence/mail dispatch (Phase 2) |
| Public Pricing Plans (`/pricing`) | Existing `GET /api/v1/billing/plans` requires JWT | Verify if public or add `@Public()` read-only plans endpoint (Phase 2) |
| Password Recovery & Reset (`/forgot-password`, `/reset-password`) | Missing endpoints | Add `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password` with expiring hashed tokens & MailService (Phase 3) |
| Email Verification | Missing endpoints | Add `POST /api/v1/auth/verify-email` & resend endpoint (Phase 3) |
| User Theme Preference Persistence | Missing column/endpoint | Add optional `themePreference` on `User` + `PATCH /api/v1/users/me/preferences` (Phase 1) |
| Global Dashboard Search | Missing unified search endpoint | Add workspace-scoped search endpoint or aggregate queries across drafts, posts, accounts, links (Phase 4) |
| Pinterest Boards Selection | OAuth implemented; board picker endpoint not yet exposed | Add `GET /api/v1/workspaces/:workspaceId/social-accounts/:accountId/boards` when live Pinterest OAuth is active (Phase 5) |
| Public Blog / Help Articles | Not persisted in DB | Keep static/MDX or add lightweight CMS table if dynamic editing is desired (Phase 2) |
