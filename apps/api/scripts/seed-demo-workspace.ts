import {
  PrismaClient,
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
  SocialPlatform,
  DraftStatus,
  CampaignObjective,
  ContentType,
  ListeningSentiment,
  CompetitorCategory,
  InboxModerationAction,
  WebhookDeliveryStatus,
  PublishTargetStatus,
  AnalyticsMetricPeriod,
  GrowthInsightCategory,
  InteractionType,
  InteractionWorkflowStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function encryptToken(plaintext: string): string {
  const keyHex =
    process.env.TOKEN_ENCRYPTION_KEY ||
    '58567a8a10abd9a90621a3e926f3d050f863c1f81fd65e1e87947801b502e299';
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

async function seed() {
  console.log('--- Starting Demo Data Seeding for OmniSocial AI ---');

  // 1. Locate or create admin user
  let user = await prisma.user.findUnique({
    where: { email: 'admin@omnisocial.ai' },
  });

  if (!user) {
    console.error('admin@omnisocial.ai not found! Run create-super-admin first.');
    return;
  }

  console.log(`Found user: ${user.name} (${user.email})`);

  // 2. Locate or create demo workspace
  let workspace = await prisma.workspace.findFirst({
    where: {
      members: { some: { userId: user.id } },
    },
  });

  if (!workspace) {
    const slug = `acme-global-${Date.now().toString().slice(-4)}`;
    workspace = await prisma.workspace.create({
      data: {
        name: 'Acme Global Brands',
        slug,
        description: 'Global multi-brand social media marketing workspace & creative hub.',
        industry: 'Technology & E-Commerce',
        websiteUrl: 'https://acmebrand.com',
        timezone: 'Asia/Kolkata',
        defaultLanguage: 'en',
        planTier: 'ENTERPRISE',
        createdById: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
    });
    console.log(`Created Workspace: "${workspace.name}" (slug: ${workspace.slug})`);
  } else {
    console.log(`Using existing Workspace: "${workspace.name}" (${workspace.id})`);
  }

  const workspaceId = workspace.id;

  // 3. Upsert Brand Profile
  await prisma.workspaceBrandProfile.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      businessName: 'Acme Global Brands',
      websiteUrl: 'https://acmebrand.com',
      industry: 'Technology & E-Commerce',
      slogan: 'Leading the future of digital commerce & smart experiences.',
      brandVoice: 'PROFESSIONAL, INSPIRATIONAL, AUTHORITATIVE',
      primaryColor: '#4f46e5',
      secondaryColor: '#06b6d4',
      targetAudience: 'Digital leaders, marketers, and fast-growing online businesses worldwide.',
      brandGuidelines: 'Use clear, engaging messaging with bold visuals. Maintain high brand integrity and customer obsession.',
    },
    update: {},
  });
  console.log('✔ Brand Profile configured');

  // 4. Create Connected Social Accounts
  const fbAccount = await prisma.socialAccount.upsert({
    where: {
      workspaceId_provider_providerAccountId: {
        workspaceId,
        provider: SocialProvider.META_FACEBOOK,
        providerAccountId: 'fb_acme_official_page',
      },
    },
    create: {
      workspaceId,
      provider: SocialProvider.META_FACEBOOK,
      providerAccountId: 'fb_acme_official_page',
      accountName: 'Acme Corporation (Global Page)',
      accountUsername: 'acme.official',
      accountType: SocialAccountType.FACEBOOK_PAGE,
      connectionStatus: SocialConnectionStatus.CONNECTED,
      encryptedAccessToken: encryptToken('eaab_mock_fb_access_token_60d'),
      grantedScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
      connectedByUserId: user.id,
    },
    update: {},
  });

  const igAccount = await prisma.socialAccount.upsert({
    where: {
      workspaceId_provider_providerAccountId: {
        workspaceId,
        provider: SocialProvider.META_INSTAGRAM,
        providerAccountId: 'ig_acme_official_business',
      },
    },
    create: {
      workspaceId,
      provider: SocialProvider.META_INSTAGRAM,
      providerAccountId: 'ig_acme_official_business',
      accountName: 'Acme Brands Official',
      accountUsername: 'acme_official',
      accountType: SocialAccountType.INSTAGRAM_BUSINESS,
      connectionStatus: SocialConnectionStatus.CONNECTED,
      encryptedAccessToken: encryptToken('eaab_mock_ig_access_token_60d'),
      grantedScopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments'],
      connectedByUserId: user.id,
    },
    update: {},
  });

  const liAccount = await prisma.socialAccount.upsert({
    where: {
      workspaceId_provider_providerAccountId: {
        workspaceId,
        provider: SocialProvider.LINKEDIN,
        providerAccountId: 'urn:li:organization:98765432',
      },
    },
    create: {
      workspaceId,
      provider: SocialProvider.LINKEDIN,
      providerAccountId: 'urn:li:organization:98765432',
      accountName: 'Acme Enterprises',
      accountUsername: 'acme-enterprises',
      accountType: SocialAccountType.LINKEDIN_PAGE,
      connectionStatus: SocialConnectionStatus.CONNECTED,
      encryptedAccessToken: encryptToken('aq_mock_linkedin_token_enterprise'),
      grantedScopes: ['r_organization_social', 'w_organization_social', 'rw_organization_admin'],
      connectedByUserId: user.id,
    },
    update: {},
  });

  const twAccount = await prisma.socialAccount.upsert({
    where: {
      workspaceId_provider_providerAccountId: {
        workspaceId,
        provider: SocialProvider.TWITTER_X,
        providerAccountId: 'tw_acme_official_handle',
      },
    },
    create: {
      workspaceId,
      provider: SocialProvider.TWITTER_X,
      providerAccountId: 'tw_acme_official_handle',
      accountName: 'Acme Media & Tech',
      accountUsername: 'AcmeMedia',
      accountType: SocialAccountType.TWITTER_PROFILE,
      connectionStatus: SocialConnectionStatus.CONNECTED,
      encryptedAccessToken: encryptToken('tw_mock_bearer_token_v2_active'),
      grantedScopes: ['tweet.read', 'tweet.write', 'users.read'],
      connectedByUserId: user.id,
    },
    update: {},
  });
  console.log('✔ Connected 4 Social Accounts (Facebook, Instagram, LinkedIn, Twitter/X)');

  // 5. Create Content Drafts with Variants
  const draft1 = await prisma.contentDraft.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      title: 'Q4 Global Product Keynote Teaser',
      objective: CampaignObjective.ANNOUNCEMENT,
      contentType: ContentType.POST,
      status: DraftStatus.APPROVED,
      variants: {
        create: [
          {
            platform: SocialPlatform.LINKEDIN,
            body:
              '🚀 The next chapter in digital commerce begins now.\n\nJoin 25,000+ industry leaders next Tuesday as we unveil our AI-native workflow engine live from San Francisco.\n\nRegister for early keynote stream access below. #Innovation #FutureOfWork #Leadership #TechKeynote',
            hashtags: ['#Innovation', '#FutureOfWork', '#Leadership', '#TechKeynote'],
          },
          {
            platform: SocialPlatform.TWITTER_X,
            body:
              'Big news incoming. 🚀 Next Tuesday, we unveil what our engineering squad has been building for the past 9 months.\n\nSecure your virtual front-row seat: https://acmebrand.com/keynote #OmniSocial',
            hashtags: ['#OmniSocial', '#Innovation'],
          },
          {
            platform: SocialPlatform.INSTAGRAM,
            body:
              'Something groundbreaking is on the horizon. ✨\n\nMark your calendars for October 20th. We are taking the wraps off our next-generation creative platform. Drop a 💡 in the comments if you want VIP early access!\n\n#AcmeGlobal #ProductLaunch #BehindTheBuild #DesignTech',
            hashtags: ['#AcmeGlobal', '#ProductLaunch', '#BehindTheBuild', '#DesignTech'],
          },
          {
            platform: SocialPlatform.FACEBOOK,
            body:
              'We are thrilled to officially announce our 2026 Virtual Product Summit! Tune in for exclusive live reveals, founder interviews, and a hands-on preview of our upcoming tools. Link in the comments to reserve your complimentary pass.',
            hashtags: ['#AcmeGlobal', '#ProductSummit'],
          },
        ],
      },
    },
  });

  const draft2 = await prisma.contentDraft.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      title: 'Behind the Scenes: How our AI Moderation Engine Works',
      objective: CampaignObjective.EDUCATIONAL,
      contentType: ContentType.POST,
      status: DraftStatus.IN_REVIEW,
      variants: {
        create: [
          {
            platform: SocialPlatform.LINKEDIN,
            body:
              'How do you manage 100,000 customer interactions across 4 networks without burning out your team?\n\nOur engineering team open-sourced the architectural principles behind sentiment-driven auto-moderation. Read our engineering blog breakdown: https://acmebrand.com/eng/nlp-moderation #AI #SoftwareArchitecture #CustomerExperience',
            hashtags: ['#AI', '#SoftwareArchitecture', '#CustomerExperience'],
          },
        ],
      },
    },
  });

  const draft3 = await prisma.contentDraft.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      title: 'Community Weekend Giveaway & Poll',
      objective: CampaignObjective.ENGAGEMENT,
      contentType: ContentType.POST,
      status: DraftStatus.DRAFT,
      variants: {
        create: [
          {
            platform: SocialPlatform.TWITTER_X,
            body:
              'Quick poll for social managers: What takes the most time in your week?\n\nA) Copywriting\nB) Approvals\nC) Replying to DMs\nD) Analytics\n\nTell us below! 👇',
            hashtags: ['#SocialMediaPoll', '#MarketingLife'],
          },
        ],
      },
    },
  });
  console.log('✔ Created 3 Content Drafts with multi-platform copy variants');

  // 6. Create Scheduled Posts for Calendar
  const now = new Date();
  const scheduleDates = [
    new Date(now.getTime() + 2 * 60 * 60 * 1000), // Today in 2 hours
    new Date(now.getTime() + 26 * 60 * 60 * 1000), // Tomorrow
    new Date(now.getTime() + 50 * 60 * 60 * 1000), // In 2 days
    new Date(now.getTime() + 96 * 60 * 60 * 1000), // In 4 days
    new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday (Published)
    new Date(now.getTime() - 72 * 60 * 60 * 1000), // 3 days ago (Published)
  ];

  await prisma.scheduledPost.create({
    data: {
      workspaceId,
      createdById: user.id,
      draftId: draft1.id,
      scheduledAt: scheduleDates[0],
      status: 'SCHEDULED',
      timezone: 'Asia/Kolkata',
      approvedRevisionNumber: 1,
      contentSnapshot: { text: 'Q4 Product Keynote Teaser' },
      snapshotHash: crypto.createHash('sha256').update('Q4 Product Keynote Teaser').digest('hex'),
      targets: {
        create: [
          {
            socialAccountId: fbAccount.id,
            platform: 'FACEBOOK',
            status: PublishTargetStatus.PENDING,
          },
          {
            socialAccountId: igAccount.id,
            platform: 'INSTAGRAM',
            status: PublishTargetStatus.PENDING,
          },
          {
            socialAccountId: liAccount.id,
            platform: 'LINKEDIN',
            status: PublishTargetStatus.PENDING,
          },
        ],
      },
    },
  });

  await prisma.scheduledPost.create({
    data: {
      workspaceId,
      createdById: user.id,
      draftId: draft1.id,
      scheduledAt: scheduleDates[1],
      status: 'SCHEDULED',
      timezone: 'Asia/Kolkata',
      approvedRevisionNumber: 1,
      contentSnapshot: { text: 'Keynote Twitter Teaser' },
      snapshotHash: crypto.createHash('sha256').update('Keynote Twitter Teaser').digest('hex'),
      targets: {
        create: [
          {
            socialAccountId: twAccount.id,
            platform: 'TWITTER_X',
            status: PublishTargetStatus.PENDING,
          },
        ],
      },
    },
  });

  await prisma.scheduledPost.create({
    data: {
      workspaceId,
      createdById: user.id,
      draftId: draft2.id,
      scheduledAt: scheduleDates[4],
      status: 'PUBLISHED',
      timezone: 'Asia/Kolkata',
      approvedRevisionNumber: 1,
      contentSnapshot: { text: 'Engineering Blog BTS' },
      snapshotHash: crypto.createHash('sha256').update('Engineering Blog BTS').digest('hex'),
      targets: {
        create: [
          {
            socialAccountId: liAccount.id,
            platform: 'LINKEDIN',
            status: PublishTargetStatus.PUBLISHED,
            externalPostId: 'urn:li:share:123456789',
          },
        ],
      },
    },
  });
  console.log('✔ Scheduled Calendar Posts (Upcoming & Published)');

  // 7. Seed Analytics Historical Snapshots (30 days)
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayFactor = (30 - i) * 15;

    await prisma.accountAnalyticsSnapshot.upsert({
      where: {
        socialAccountId_period_snapshotDate: {
          socialAccountId: liAccount.id,
          period: AnalyticsMetricPeriod.DAY,
          snapshotDate: new Date(dateStr),
        },
      },
      create: {
        workspaceId,
        socialAccountId: liAccount.id,
        platform: SocialPlatform.LINKEDIN,
        period: AnalyticsMetricPeriod.DAY,
        snapshotDate: new Date(dateStr),
        followersCount: 14200 + dayFactor,
        followersNetChange: Math.floor(Math.random() * 25) + 10,
        impressions: 8500 + dayFactor * 3,
        reach: 6200 + dayFactor * 2,
        engagementTotal: 420 + Math.floor(Math.random() * 60),
        engagementRate: 4.65 + (Math.random() * 0.8 - 0.4),
      },
      update: {},
    });
  }

  await prisma.growthInsight.createMany({
    data: [
      {
        workspaceId,
        title: 'Peak LinkedIn Engagement Window',
        summary: 'Your LinkedIn company page experiences 38% higher comment interaction between 9:30 AM and 11:00 AM on Wednesdays.',
        category: GrowthInsightCategory.TIMING,
        confidenceScore: 0.94,
        suggestedAction: 'Schedule your upcoming keynote teaser post for Wednesday at 10:00 AM.',
        evidence: { peakHour: '10:00', delta: '+38%' },
      },
      {
        workspaceId,
        title: 'High-Impact Content Format',
        summary: 'Technical breakdown carousels on LinkedIn and Twitter/X generated 2.4x more external impressions than single-image updates.',
        category: GrowthInsightCategory.CONTENT_FORMAT,
        confidenceScore: 0.88,
        suggestedAction: 'Turn the upcoming AI moderation engineering article into a 5-slide visual carousel.',
        evidence: { multiplier: '2.4x' },
      },
    ],
    skipDuplicates: true,
  });
  console.log('✔ Populated 30 Days of Historical Analytics & AI Growth Recommendations');

  // 8. Seed Unified Social Inbox Interactions
  await prisma.socialInteraction.createMany({
    data: [
      {
        workspaceId,
        socialAccountId: fbAccount.id,
        platform: SocialPlatform.FACEBOOK,
        externalInteractionId: 'fb_comm_101',
        interactionType: InteractionType.COMMENT,
        authorProviderId: 'fb_user_101',
        authorName: 'Sarah Jenkins',
        authorUsername: 'sarah.jenkins.design',
        content: 'Loved the product demo! Will this support automated bulk scheduling for agencies managing multiple client brands?',
        workflowStatus: InteractionWorkflowStatus.OPEN,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        workspaceId,
        socialAccountId: igAccount.id,
        platform: SocialPlatform.INSTAGRAM,
        externalInteractionId: 'ig_dm_202',
        interactionType: InteractionType.COMMENT,
        authorProviderId: 'ig_user_202',
        authorName: 'Alex Rivera',
        authorUsername: 'arivera_tech',
        content: 'Hey team, I was trying to connect our Instagram Creator account yesterday and hit an OAuth permission notice. Any advice?',
        workflowStatus: InteractionWorkflowStatus.OPEN,
        publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        workspaceId,
        socialAccountId: twAccount.id,
        platform: SocialPlatform.TWITTER_X,
        externalInteractionId: 'tw_ment_303',
        interactionType: InteractionType.MENTION,
        authorProviderId: 'tw_user_303',
        authorName: 'Marcus Cole',
        authorUsername: '@mcole_marketing',
        content: 'The new analytics UI in @AcmeMedia is ridiculously clean. Huge shoutout to whoever designed the comparison dashboards!',
        workflowStatus: InteractionWorkflowStatus.RESOLVED,
        publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });
  console.log('✔ Populated Unified Inbox Interactions (Comments, DMs, Mentions)');

  // 9. Seed Social Listening Queries & Mentions
  const query = await prisma.listeningQuery.create({
    data: {
      workspaceId,
      createdById: user.id,
      name: 'Acme Brand & Competitor Buzz',
      keywords: ['acme', 'acmeglobal', 'omnisocial'],
      excludedKeywords: ['spam', 'giveaway_bot'],
      platforms: [SocialPlatform.TWITTER_X, SocialPlatform.LINKEDIN, SocialPlatform.INSTAGRAM],
    },
  });

  await prisma.listeningMention.createMany({
    data: [
      {
        workspaceId,
        queryId: query.id,
        platform: SocialPlatform.TWITTER_X,
        externalId: 'list_tw_1',
        authorName: 'TechRadar Reviews',
        authorHandle: '@TechRadarTrends',
        content: 'Just tested the new OmniSocial AI multi-account scheduler by Acme. Game changer for social teams juggling multiple profiles.',
        sentiment: ListeningSentiment.POSITIVE,
        sentimentScore: 0.92,
        reachEstimate: 45000,
        engagementCount: 184,
        url: 'https://twitter.com/TechRadarTrends/status/1234567890',
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        workspaceId,
        queryId: query.id,
        platform: SocialPlatform.LINKEDIN,
        externalId: 'list_li_2',
        authorName: 'David Zhang',
        authorHandle: 'davidzhang-growth',
        content: 'Is anyone else using Acme for social listening and sentiment monitoring? Looking for benchmark comparisons versus Sprout Social.',
        sentiment: ListeningSentiment.NEUTRAL,
        sentimentScore: 0.1,
        reachEstimate: 12000,
        engagementCount: 42,
        url: 'https://linkedin.com/posts/davidzhang-growth_123',
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });
  console.log('✔ Populated Social Listening Buzz Stream');

  // 10. Seed Competitor Benchmarking Hub
  const comp1 = await prisma.competitorProfile.create({
    data: {
      workspaceId,
      name: 'Buffer',
      websiteUrl: 'https://buffer.com',
      category: CompetitorCategory.DIRECT,
      notes: 'Leading simple scheduler brand with strong small-business presence.',
      socialAccounts: {
        create: [
          {
            platform: 'TWITTER_X',
            handle: '@buffer',
            publicUrl: 'https://twitter.com/buffer',
            followersCount: 940000,
            followingCount: 320,
            postsCount: 18500,
          },
          {
            platform: 'LINKEDIN',
            handle: 'buffer-app',
            publicUrl: 'https://linkedin.com/company/buffer-app',
            followersCount: 185000,
            followingCount: 50,
            postsCount: 2400,
          },
        ],
      },
    },
  });

  await prisma.competitorBenchmarkSnapshot.create({
    data: {
      competitorProfileId: comp1.id,
      platform: 'TWITTER_X',
      period: 'DAYS_28',
      snapshotDate: new Date(),
      followersCount: 940000,
      followerGrowthRate: 1.8,
      engagementRate: 2.45,
      postingFrequencyWeekly: 14,
      estReach: 320000,
      estImpressions: 540000,
      sentimentScore: 0.65,
      sentimentDistribution: { positive: 65, neutral: 25, negative: 10 },
      topPostExcerpt: 'Transparent salary calculator update: How we think about remote pay in 2026.',
      topPostEngagementRate: 6.2,
    },
  });

  const comp2 = await prisma.competitorProfile.create({
    data: {
      workspaceId,
      name: 'Hootsuite',
      websiteUrl: 'https://hootsuite.com',
      category: CompetitorCategory.DIRECT,
      notes: 'Enterprise incumbent in social listening, analytics, and bulk posting.',
      socialAccounts: {
        create: [
          {
            platform: 'LINKEDIN',
            handle: 'hootsuite',
            publicUrl: 'https://linkedin.com/company/hootsuite',
            followersCount: 1250000,
            followingCount: 210,
            postsCount: 4200,
          },
        ],
      },
    },
  });

  await prisma.competitorBenchmarkSnapshot.create({
    data: {
      competitorProfileId: comp2.id,
      platform: 'LINKEDIN',
      period: 'DAYS_28',
      snapshotDate: new Date(),
      followersCount: 1250000,
      followerGrowthRate: 0.9,
      engagementRate: 1.85,
      postingFrequencyWeekly: 22,
      estReach: 680000,
      estImpressions: 1120000,
      sentimentScore: 0.52,
      sentimentDistribution: { positive: 50, neutral: 35, negative: 15 },
      topPostExcerpt: 'The 2026 Social Trends Report is live: What 5,000 CMOs told us about AI content.',
      topPostEngagementRate: 4.8,
    },
  });
  console.log('✔ Populated Competitor Profiles (Buffer, Hootsuite) & Benchmarks');

  // 11. Seed Shortened Links & Telemetry Clicks
  const originalUrl = 'https://acmebrand.com/annual-summit?source=social_campaign';
  const shortLink = await prisma.shortenedLink.create({
    data: {
      workspace: { connect: { id: workspaceId } },
      createdBy: { connect: { id: user.id } },
      originalUrl,
      destinationUrl: originalUrl,
      shortCode: 'summit26',
      title: 'Global Summit 2026 Registration',
      utmSource: 'linkedin',
      utmMedium: 'social',
      utmCampaign: 'summit_keynote_launch',
      totalClicks: 25,
    },
  });

  const referrers = ['linkedin.com', 't.co', 'instagram.com', 'google.com', 'direct'];
  const devices = ['mobile', 'desktop', 'tablet'];

  for (let c = 0; c < 25; c++) {
    await prisma.linkClickEvent.create({
      data: {
        shortenedLinkId: shortLink.id,
        ipHash: crypto.createHash('sha256').update(`ip_${c}`).digest('hex'),
        referrer: referrers[c % referrers.length],
        deviceType: devices[c % devices.length],
        browser: 'Chrome 128',
        os: 'Windows 11',
        clickedAt: new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      },
    });
  }
  console.log('✔ Populated Branded Links with Click Attribution Events');

  // 12. Seed White-Label Agency Settings
  await prisma.whiteLabelConfig.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      brandName: 'Vertex Media Agency',
      customDomain: 'portal.vertexagency.com',
      portalTitle: 'Vertex Client Command Center',
      primaryColor: '#4f46e5',
      secondaryColor: '#3730a3',
      accentColor: '#06b6d4',
      supportEmail: 'support@vertexagency.com',
      hidePoweredBy: false,
      isEnabled: true,
    },
    update: {},
  });
  console.log('✔ Configured White-Label Agency Portal Settings');

  // 13. Seed Outbound Webhooks Subscription & Logs
  await prisma.webhookSubscription.create({
    data: {
      workspaceId,
      name: 'Slack Alerts & Zapier Sync',
      targetUrl: 'https://hooks.zapier.com/hooks/catch/9876543/abc1234',
      secretKey: crypto.randomBytes(24).toString('hex'),
      eventTypes: ['POST_PUBLISHED', 'INBOX_MESSAGE_RECEIVED', 'DRAFT_APPROVED'],
      isActive: true,
      description: 'Dispatches real-time events to agency Slack workspace channel.',
      deliveries: {
        create: [
          {
            workspaceId,
            eventType: 'POST_PUBLISHED',
            payload: { postId: 'post-101', platform: 'LINKEDIN', title: 'Product Summit Reveal' },
            statusCode: 200,
            durationMs: 142,
            status: WebhookDeliveryStatus.SUCCESS,
            responseBody: '{"ok": true}',
            attemptNumber: 1,
          },
          {
            workspaceId,
            eventType: 'DRAFT_APPROVED',
            payload: { draftId: draft1.id, approvedBy: 'Super Administrator' },
            statusCode: 200,
            durationMs: 118,
            status: WebhookDeliveryStatus.SUCCESS,
            responseBody: '{"ok": true}',
            attemptNumber: 1,
          },
        ],
      },
    },
  });
  console.log('✔ Configured Outbound Webhook Subscriptions and Delivery Logs');

  // 14. Seed Inbox Auto-Moderation Rules & Templates
  await prisma.inboxModerationRule.createMany({
    data: [
      {
        workspaceId,
        name: 'Auto-Flag Negative Sentiment & Crisis Keywords',
        description: 'Immediately flags messages with negative polarity and critical service keywords for priority agent response.',
        keywords: ['broken', 'scam', 'terrible', 'refund', 'urgent', 'down'],
        action: InboxModerationAction.AUTO_FLAG,
        isEnabled: true,
        priority: 10,
        executionCount: 14,
      },
      {
        workspaceId,
        name: 'Auto-Hide Spam & Promo Links',
        description: 'Hides spam bot comments containing external Telegram or crypto promotion links.',
        keywords: ['t.me/', 'crypto', 'airdrop', 'whatsapp me', 'dm for promo'],
        action: InboxModerationAction.AUTO_HIDE,
        isEnabled: true,
        priority: 20,
        executionCount: 38,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.inboxAutoReplyTemplate.createMany({
    data: [
      {
        workspaceId,
        title: 'Office Hours Greeting',
        category: 'Support',
        content: 'Hello! Thank you for reaching out to Acme Brands. Our team is available Mon-Fri 9am-6pm IST and we will respond shortly.',
      },
      {
        workspaceId,
        title: 'Keynote Registration Link',
        category: 'Marketing',
        content: 'Hey there! You can grab complimentary passes to our upcoming Virtual Keynote right here: https://acmebrand.com/keynote. See you there!',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✔ Populated Inbox Moderation Rules & Auto-Reply Templates');

  console.log('\n======================================================');
  console.log('🎉 SEEDING COMPLETE! All sections are fully populated:');
  console.log(`- Workspace: ${workspace.name} (id: ${workspace.id})`);
  console.log('- 4 Connected Social Accounts (FB, IG, LinkedIn, Twitter/X)');
  console.log('- 3 Content Drafts & Copy Variants');
  console.log('- 6 Calendar Scheduled & Published Posts');
  console.log('- 30 Days of Historical Analytics & AI Growth Recommendations');
  console.log('- Unified Inbox Comments, DMs, and Mentions');
  console.log('- Social Listening Buzz Stream & Sentiment polarity');
  console.log('- Competitor Benchmarking (Buffer, Hootsuite) with 28-day snapshots');
  console.log('- Branded Links with Click Analytics');
  console.log('- White-Label Agency Settings & CNAME Diagnostic');
  console.log('- Outbound Webhook Delivery Stream');
  console.log('- AI Auto-Moderation Rules & Templates');
  console.log('======================================================\n');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
