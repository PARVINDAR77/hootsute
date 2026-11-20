# Official Meta & Instagram Graph API References

**Research Date:** November 2026  
**Target API Version:** Meta Graph API v21.0 / Instagram Graph API v21.0  
**Application Target:** OmniSocial AI SaaS Multi-Tenant Platform

---

## 1. Official Documentation Portals

| Portal / Documentation Hub | Official URL | Scope of Authority |
|---|---|---|
| **Meta for Developers** | https://developers.facebook.com/ | App registration, App Dashboard, App Review, Business Manager |
| **Instagram Platform Overview** | https://developers.facebook.com/docs/instagram-platform/ | Official entry point for Instagram Graph API & Instagram Login |
| **Instagram Graph API Reference** | https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/ | Account endpoints, media endpoints, insights, and comments |
| **Meta Graph API Explorer** | https://developers.facebook.com/tools/explorer/ | Interactive sandbox for testing token queries and graph nodes |
| **Meta App Review Hub** | https://developers.facebook.com/docs/app-review/ | Review requirements, screencast guidelines, Advanced Access |
| **Graph API Rate Limiting** | https://developers.facebook.com/docs/graph-api/overview/rate-limiting/ | Platform rate limits, BUC limits, header inspection |
| **Meta Webhooks Guide** | https://developers.facebook.com/docs/graph-api/webhooks/ | Real-time event notifications, verification, HMAC security |

---

## 2. Official Endpoints Verified

### OAuth & Token Exchange
- **Authorization Dialog:** `https://www.facebook.com/v21.0/dialog/oauth`
- **Short-Lived Token Exchange:** `https://graph.facebook.com/v21.0/oauth/access_token`
- **Long-Lived 60-Day Exchange:** `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token`
- **Instagram Login Host (Route A):** `https://api.instagram.com/oauth/authorize`
- **Instagram Login Token Host (Route A):** `https://api.instagram.com/oauth/access_token`
- **Instagram Login Long-Lived (Route A):** `https://graph.instagram.com/access_token?grant_type=ig_exchange_token`

### Content Publishing (2-Step Container Flow)
- **Step 1 (Create Container):** `POST https://graph.facebook.com/v21.0/{ig-user-id}/media`
  - Parameters: `image_url` (or `video_url`), `caption`, `is_carousel_item` (for carousels), `media_type` (for REELS / STORIES / CAROUSEL)
  - Returns: `{ "id": "<creation_id>" }`
- **Status Check (Video / Reels / Carousels):** `GET https://graph.facebook.com/v21.0/{creation_id}?fields=status_code`
  - Statuses: `IN_PROGRESS`, `FINISHED`, `ERROR`, `EXPIRED`
- **Step 2 (Publish Container):** `POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish`
  - Parameters: `creation_id`
  - Returns: `{ "id": "<published_media_id>" }`
- **Live URL Construction:** `https://www.instagram.com/p/{published_media_id}/`

### Insights & Telemetry
- **Media-Level Insights:** `GET https://graph.facebook.com/v21.0/{media-id}/insights?metric=reach,impressions,saved,total_interactions`
- **Account-Level Insights:** `GET https://graph.facebook.com/v21.0/{ig-user-id}/insights?metric=impressions,reach,follower_count&period=day`

### Webhooks & Security
- **Webhook Subscription Object:** `instagram`
- **Supported Fields:** `comments`, `mentions`, `messages`, `messaging_postbacks`
- **Verification Protocol:** `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`
- **Signature Header:** `X-Hub-Signature-256: sha256=<hmac_hash>` (computed using `META_APP_SECRET`)

---

## 3. Verified Permission Scopes (v21.0)

| Scope Identifier | Human-Readable Name | Purpose in OmniSocial AI | Review Level |
|---|---|---|---|
| `instagram_basic` | Instagram Basic | Discover account username, ID, profile picture | Standard &rarr; Advanced |
| `instagram_content_publish` | Content Publishing | Create media containers and publish photos/reels/carousels | Mandatory Review |
| `instagram_manage_comments` | Comment Moderation | Read, reply to, and hide incoming post comments | Mandatory Review |
| `instagram_manage_insights` | Insights Telemetry | Read reach, impressions, interactions, and follower metrics | Mandatory Review |
| `pages_show_list` | Pages Show List | Discover Facebook Pages managed by user to discover linked IG accounts | Mandatory Review |
| `pages_read_engagement` | Pages Read Engagement | Required to authenticate page-linked access | Mandatory Review |
| `instagram_manage_messages` | Messaging (Inbox) | Manage customer service direct message threads | Mandatory Review (High-friction) |

---

## 4. Policy & Deprecation Notes
1. **Legacy Basic Display API:** Fully deprecated by Meta. All new integrations must use the modern **Instagram Graph API** or **Instagram Login for Tech Providers**.
2. **Personal Accounts:** Meta does not permit API publishing to personal Instagram accounts under any circumstance.
3. **Publishing Frequency:** Strictly capped at 25 posts per rolling 24-hour period per Instagram account.
4. **Compliance Disclaimer:** Meta API policies, permission names, and dashboard UI layouts are subject to periodic updates. Check the official Meta Developer Changelog prior to major quarterly deployments.
