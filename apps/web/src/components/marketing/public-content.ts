import { SupportedPlatformKey } from '@/components/ui/PlatformBadge';

export interface PlatformCapabilitySpec {
  key: SupportedPlatformKey;
  name: string;
  accountTypes: string;
  publishingCapabilities: string[];
  mediaRequirements: string;
  connectionRequirements: string;
  analyticsAvailable: string;
  apiLimitations: string;
}

export const PLATFORM_SPECS: PlatformCapabilitySpec[] = [
  {
    key: 'INSTAGRAM',
    name: 'Instagram',
    accountTypes: 'Instagram Business & Creator accounts linked to a Meta Facebook Page',
    publishingCapabilities: [
      'Single image posts, carousels, and Reels briefs',
      'Captions, hashtags, and first-comment scheduling workflows',
      'Unified inbox comment/DM ingestion & moderation',
    ],
    mediaRequirements: 'JPEG/PNG images (up to 8 MB, 4:5 to 1.91:1); MP4/MOV video for Reels',
    connectionRequirements: 'Meta Graph OAuth 2.0 with Instagram Professional account linked to a Facebook Page',
    analyticsAvailable: 'Impressions, reach, engagement, likes, comments, saves, follower snapshots',
    apiLimitations: 'Personal Instagram profiles cannot publish via official Meta Graph API; Story sticker interactivity is not exposed by API.',
  },
  {
    key: 'FACEBOOK',
    name: 'Facebook',
    accountTypes: 'Facebook Business Pages',
    publishingCapabilities: [
      'Text updates, link previews, single & multi-image posts, video posts',
      'Scheduled and immediate page publishing with UTM link shortening',
      'Page comment & message management inside Unified Social Inbox',
    ],
    mediaRequirements: 'JPG/PNG images, MP4 video; standard Meta Graph size caps apply',
    connectionRequirements: 'Meta OAuth 2.0 with Page admin role and pages_manage_posts scope',
    analyticsAvailable: 'Page reach, post impressions, reactions, shares, comments, audience trends',
    apiLimitations: 'Official Graph API supports Facebook Pages only — personal profiles and third-party Groups are restricted by Meta.',
  },
  {
    key: 'TWITTER_X',
    name: 'X (Twitter)',
    accountTypes: 'X / Twitter User & Brand Profiles',
    publishingCapabilities: [
      'Standard posts up to 280 characters with platform-calibrated AI variants',
      'Image media attachments and shortened tracked UTM links',
      'Bulk staggered dispatch across multiple brand handles',
    ],
    mediaRequirements: 'Images up to 5 MB (JPEG, PNG, WEBP, GIF); 280-character standard text cap',
    connectionRequirements: 'X OAuth 2.0 with PKCE (tweet.read, tweet.write, users.read, offline.access)',
    analyticsAvailable: 'Public post engagement metrics (likes, replies, reposts, impressions where tier-permitted)',
    apiLimitations: 'X API rate limits and analytics depth depend on your configured X Developer API tier.',
  },
  {
    key: 'LINKEDIN',
    name: 'LinkedIn',
    accountTypes: 'LinkedIn Company Pages & Personal Member Profiles',
    publishingCapabilities: [
      'Long-form thought-leadership posts up to 3,000 characters',
      'Single image & link shares for brand pages and executive profiles',
      'Multi-step team approval workflows before executive publishing',
    ],
    mediaRequirements: 'JPG/PNG/GIF images; professional aspect ratios recommended (1.91:1 or 1:1)',
    connectionRequirements: 'LinkedIn OAuth 2.0 (w_member_social, w_organization_social for Pages)',
    analyticsAvailable: 'Post impressions, clicks, reactions, comments, shares, engagement rate',
    apiLimitations: 'Company Page analytics and publishing require Super Admin role on the connected LinkedIn Organization.',
  },
  {
    key: 'PINTEREST',
    name: 'Pinterest',
    accountTypes: 'Pinterest Business Accounts',
    publishingCapabilities: [
      'Visual Pins with title, description, destination URL, and board selection',
      'Bulk campaign Pin scheduling across seasonal & occasion calendars',
      'AI-generated SEO Pin descriptions calibrated to Brand Kit',
    ],
    mediaRequirements: 'Vertical 2:3 images (recommended 1000×1500 px, PNG/JPEG) required per Pin',
    connectionRequirements: 'Pinterest API v5 OAuth 2.0 (pins:read, pins:write, boards:read)',
    analyticsAvailable: 'Pin impressions, saves, outbound clicks, engagement snapshots',
    apiLimitations: 'Pinterest API requires a valid media image/video and target Board ID for every published Pin.',
  },
  {
    key: 'YOUTUBE',
    name: 'YouTube',
    accountTypes: 'YouTube Brand & Creator Channels',
    publishingCapabilities: [
      'Video metadata scheduling (title, description, tags, privacy status)',
      'YouTube Shorts & long-form publishing metadata pipeline',
      'Multi-channel campaign coordination alongside Instagram & TikTok',
    ],
    mediaRequirements: 'MP4/MOV video asset required for video upload endpoints',
    connectionRequirements: 'Google OAuth 2.0 with YouTube Data API v3 (youtube.upload, youtube.readonly)',
    analyticsAvailable: 'Channel subscribers, video views, likes, comments via YouTube Analytics/Data API',
    apiLimitations: 'Quota units are enforced daily by Google Cloud; unverified OAuth apps default uploaded videos to private.',
  },
  {
    key: 'TIKTOK',
    name: 'TikTok',
    accountTypes: 'TikTok Business & Creator Accounts',
    publishingCapabilities: [
      'Direct video publishing or Creator Inbox draft handoff',
      'Caption, hashtag, privacy level, and duet/stitch/comment controls',
      'AI hook and short-form script generation in AI Studio',
    ],
    mediaRequirements: 'Vertical 9:16 MP4/WebM video required (official Content Posting API constraints apply)',
    connectionRequirements: 'TikTok OAuth 2.0 (user.info.basic, video.publish, video.upload)',
    analyticsAvailable: 'Video views, likes, comments, shares, and follower totals',
    apiLimitations: 'Public direct posting requires TikTok Content Posting API audit approval; unaudited apps post as private/draft.',
  },
  {
    key: 'THREADS',
    name: 'Threads',
    accountTypes: 'Meta Threads Public & Creator Profiles',
    publishingCapabilities: [
      'Conversational text posts (up to 500 chars) and media container publishing',
      'Two-step Meta container creation & publish pipeline',
      'Cross-posting approved brand updates alongside Instagram and X',
    ],
    mediaRequirements: 'Text up to 500 characters; optional JPEG/PNG image or short MP4 video',
    connectionRequirements: 'Meta Threads OAuth 2.0 (threads_basic, threads_content_publish)',
    analyticsAvailable: 'Views, likes, replies, reposts, quotes via Threads Insights API',
    apiLimitations: 'Threads publishing enforces a 250 API-published posts per 24-hour rolling window per profile.',
  },
];

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedDate: string;
  sections: { heading: string; body: string }[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'multi-platform-bulk-publishing-architecture',
    title: 'How to Scale Campaign Publishing Across 8 Social Networks Without Losing Brand Voice',
    excerpt:
      'A practical guide to combining Brand Kits, multi-stage team approvals, and staggered bulk publishing across Instagram, Facebook, X, LinkedIn, Pinterest, YouTube, TikTok, and Threads.',
    category: 'Publishing Strategy',
    readTime: '6 min read',
    publishedDate: '2026-11-10',
    sections: [
      {
        heading: 'Why Copy-Pasting One Caption Everywhere Fails',
        body: 'Each social network rewards distinct formatting: LinkedIn favors structured long-form insights up to 3,000 characters, X rewards punchy 280-character hooks, Threads excels at conversational prompts, and Pinterest requires keyword-rich Pin titles with destination URLs.',
      },
      {
        heading: 'Using Brand Kits & AI Variants Together',
        body: 'Inside OmniSocial AI, your workspace Brand Kit stores tone of voice, audience profile, mandatory disclaimers, and preferred hashtags. When you generate a campaign in AI Content Studio, every selected platform receives an adapted variant automatically.',
      },
      {
        heading: 'Approve Once, Dispatch Safely in Bulk',
        body: 'Instead of publishing unreviewed posts, teams can multi-select drafts for Bulk Approval and then schedule immediate, synchronized, or staggered multi-account delivery with per-target failure tracking and retries.',
      },
    ],
  },
  {
    slug: 'workspace-isolation-and-oauth-security-guide',
    title: 'Multi-Tenant Security for Agencies: Workspace Isolation & AES-256-GCM Token Encryption',
    excerpt:
      'Inside the security architecture protecting client social OAuth credentials, role-based approvals, and immutable audit logs.',
    category: 'Engineering & Security',
    readTime: '5 min read',
    publishedDate: '2026-11-04',
    sections: [
      {
        heading: 'Strict Backend Workspace Scoping',
        body: 'Every workspace-owned resource in OmniSocial AI—from social accounts and drafts to media libraries and webhook secrets—is verified server-side by NestJS WorkspaceAuthGuard against your active PostgreSQL membership and role.',
      },
      {
        heading: 'Encrypted OAuth Credential Vault',
        body: 'Social access tokens are never stored in plaintext or exposed to frontend clients. Tokens are encrypted at rest with AES-256-GCM and refreshed server-side with automatic token health status tracking.',
      },
      {
        heading: 'Immutable Audit Trail & Session Control',
        body: 'Authentication uses short-lived JWT access tokens paired with rotating HttpOnly refresh sessions featuring reuse detection, plus workspace audit logs for logins, approvals, and publishing actions.',
      },
    ],
  },
  {
    slug: 'approval-workflows-for-marketing-teams',
    title: 'Designing Zero-Bottleneck Content Approval Workflows for Distributed Teams',
    excerpt:
      'How to configure multi-step review chains, inline draft comments, and role permissions so stakeholders sign off faster.',
    category: 'Team Collaboration',
    readTime: '4 min read',
    publishedDate: '2026-10-28',
    sections: [
      {
        heading: 'Clear Role Separation: Owner, Admin, Editor, Viewer',
        body: 'Give content creators Editor permissions to draft and submit campaigns while keeping final publishing authority or brand sign-off with Workspace Admins and Owners.',
      },
      {
        heading: 'Draft Revision History & Threaded Comments',
        body: 'Every edit creates a tracked revision snapshot and threaded comment log so legal, brand, and regional reviewers can resolve feedback without messy external spreadsheets.',
      },
      {
        heading: 'Automated Notifications & Bulk Sign-Off',
        body: 'When a batch of seasonal posts is ready, approvers can inspect variants and approve multiple drafts in one pass before handing them directly to the Content Calendar or Bulk Publisher.',
      },
    ],
  },
  {
    slug: 'gemini-ai-brand-voice-calibration',
    title: 'How to Calibrate Gemini 1.5 Pro to Match Your Brand Voice with Zero Hallucinations',
    excerpt:
      'A deep dive into structured prompt engineering, negative keyword guardrails, and audience persona conditioning in OmniSocial AI Studio.',
    category: 'AI & Prompt Engineering',
    readTime: '5 min read',
    publishedDate: '2026-10-18',
    sections: [
      {
        heading: 'Why Generic Prompts Produce Generic Social Content',
        body: 'Standard chat models lack contextual grounding in your product catalog, tone of voice, and regulatory restrictions. Without guardrails, they generate clichéd hooks and emojis that fail to convert.',
      },
      {
        heading: 'Conditioning with Brand Kits & Audience Personas',
        body: 'OmniSocial AI injects your brand voice sliders (e.g. 70% Authoritative, 30% Witty) and audience demographic guidelines directly into every Gemini generation prompt, ensuring consistent brand tone across 8 channels.',
      },
      {
        heading: 'Negative Keyword Lists & Guardrail Enforcers',
        body: 'Define words, competitors, or controversial phrases that AI must strictly avoid. OmniSocial validates drafts against your negative dictionary before presenting them to content creators.',
      },
    ],
  },
  {
    slug: 'unified-social-inbox-listening-guide',
    title: 'Taming Omnichannel Social Inbox Ingestion with Real-Time Moderation Rules',
    excerpt:
      'Consolidate comments, replies, and mentions across Instagram, Facebook, X, and LinkedIn into a single triaged support queue.',
    category: 'Social Operations',
    readTime: '6 min read',
    publishedDate: '2026-10-12',
    sections: [
      {
        heading: 'The Cost of Dashboard Context-Switching',
        body: 'Marketing managers spend up to 40% of their workday toggling between native social apps just to reply to comments. Unified inbox ingestion pulls all inbound conversations into one central feed.',
      },
      {
        heading: 'Automated Spam Filters & Profanity Deflection',
        body: 'Configure automated rule engines that detect spam links, bot behavior, and offensive language, automatically archiving or hiding toxic interactions before they impact public brand perception.',
      },
      {
        heading: 'Saved Macro Responses & Internal Teammate Notes',
        body: 'Equip your social community managers with pre-approved responses and internal private notes to resolve customer inquiries faster without duplicate replies.',
      },
    ],
  },
  {
    slug: 'social-media-growth-analytics-playbook',
    title: 'Decoding Social Analytics: From Vanity Likes to Verified Revenue Lift',
    excerpt:
      'How to track meaningful reach, engagement velocity, and UTM outbound conversions across all 8 networks in one unified dashboard.',
    category: 'Analytics & Growth',
    readTime: '7 min read',
    publishedDate: '2026-10-05',
    sections: [
      {
        heading: 'Moving Beyond Simple Follower Counts',
        body: 'Follower totals often mask actual algorithmic reach. OmniSocial AI computes post-level viral velocity, engagement rates, and save-to-impression ratios to pinpoint what truly drives engagement.',
      },
      {
        heading: 'Automated UTM Tracking for Attribution',
        body: 'Every link published through OmniSocial AI can automatically append campaign, source, and medium UTM parameters, bridging the gap between social engagement and website conversions.',
      },
      {
        heading: 'Executive PDF Reports with Custom Branding',
        body: 'Generate white-labeled executive performance summaries for clients and internal leadership with one click, highlighting month-over-month growth and top-performing creative assets.',
      },
    ],
  },
];

export interface FaqEntry {
  category: 'General' | 'Platforms' | 'Billing & Plans' | 'Security';
  question: string;
  answer: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    category: 'General',
    question: 'What is OmniSocial AI?',
    answer:
      'OmniSocial AI is a multi-tenant AI social media management platform built for brands, creators, and agencies. It unifies AI content generation, team approval workflows, a visual content calendar, bulk multi-account publishing, social inbox, analytics, and workspace management in one system.',
  },
  {
    category: 'Platforms',
    question: 'Which social media platforms are supported?',
    answer:
      'OmniSocial AI supports 8 major social networks: Instagram, Facebook, X (Twitter), LinkedIn, Pinterest, YouTube, TikTok, and Threads. Every connection uses official OAuth 2.0 flows.',
  },
  {
    category: 'Platforms',
    question: 'Can I connect multiple accounts per platform and publish in bulk?',
    answer:
      'Yes. Depending on your subscription plan limit, you can connect multiple accounts per network within each workspace, approve campaigns in batch, and publish immediately, at a scheduled time, or staggered across intervals.',
  },
  {
    category: 'General',
    question: 'How does the AI Content Studio work?',
    answer:
      'AI Content Studio uses your workspace Brand Kit (tone, target audience, keywords, and cultural occasion context) to generate tailored post copy, captions, hashtags, and structured visual creative briefs for each selected platform.',
  },
  {
    category: 'Billing & Plans',
    question: 'How are plans and limits enforced?',
    answer:
      'All subscription plans, storage quotas, media asset caps, connected account limits, and monthly AI generation allowances are pulled directly from the backend billing service and enforced per workspace.',
  },
  {
    category: 'Billing & Plans',
    question: 'Can I switch between monthly and yearly billing?',
    answer:
      'Yes. Paid plans offer both monthly and discounted annual billing (saving 2 months on Growth Pro and Enterprise Scale) directly through Stripe-backed workspace checkout and billing portal flows.',
  },
  {
    category: 'Security',
    question: 'How are my social media tokens and workspace data secured?',
    answer:
      'All workspace resources enforce server-side multi-tenant isolation via NestJS guards and PostgreSQL scoping. OAuth tokens are encrypted at rest with AES-256-GCM, and sessions use rotating HttpOnly refresh tokens with reuse detection.',
  },
  {
    category: 'Security',
    question: 'Does OmniSocial AI support light and dark themes?',
    answer:
      'Yes. Light mode is enabled by default for clean daytime clarity, and any user can switch to Cosmic Dark mode with one click—automatically saved to their browser and synced to their user account profile.',
  },
];
