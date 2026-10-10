import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnalyticsRepository } from '../src/analytics/repositories/analytics.repository';
import { AnalyticsDataService } from '../src/analytics/services/analytics-data.service';
import { TokenVaultService } from '../src/social-accounts/token-vault/token-vault.service';
import { AnalyticsAdapterFactory } from '../src/analytics/providers/analytics-adapter.factory';
import {
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
  AnalyticsMetricPeriod,
  PostAnalyticsType,
  SyncJobStatus,
  SyncJobType,
  GrowthInsightCategory,
  ScheduledPostStatus,
  PublishTargetStatus,
} from '@prisma/client';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('Stage 7 Phase B: Analytics Data Layer & Repositories (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let repository: AnalyticsRepository;
  let service: AnalyticsDataService;

  const timestamp = Date.now();
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let userId: string;
  let socialAccountId: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    repository = app.get<AnalyticsRepository>(AnalyticsRepository);
    service = app.get<AnalyticsDataService>(AnalyticsDataService);

    const tokenVault = app.get<TokenVaultService>(TokenVaultService);
    const adapterFactory = app.get<AnalyticsAdapterFactory>(AnalyticsAdapterFactory);
    adapterFactory.setUseMock(true);

    // Setup Test User & Workspace
    const testUser = {
      name: 'Analytics Admin',
      email: `analytics_owner_${timestamp}@test.com`,
      password: 'Password123!',
    };

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser);
    const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    userToken = loginRes.body.data.accessToken;
    userId = loginRes.body.data.user.id;

    // Create Main Workspace
    const ws = await prisma.workspace.create({
      data: {
        name: `Analytics Workspace ${timestamp}`,
        slug: `analytics-ws-${timestamp}`,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });
    workspaceId = ws.id;

    // Create Foreign Workspace
    const foreignWs = await prisma.workspace.create({
      data: {
        name: `Foreign Workspace ${timestamp}`,
        slug: `foreign-ws-${timestamp}`,
        createdById: userId,
      },
    });
    foreignWorkspaceId = foreignWs.id;

    // Create Connected Social Account
    const account = await prisma.socialAccount.create({
      data: {
        workspaceId,
        provider: SocialProvider.META_FACEBOOK,
        providerAccountId: `fb_page_${timestamp}`,
        accountName: 'Test Brand Facebook Page',
        accountType: SocialAccountType.FACEBOOK_PAGE,
        connectionStatus: SocialConnectionStatus.CONNECTED,
        encryptedAccessToken: tokenVault.encrypt('mock_page_access_token'),
        grantedScopes: ['pages_show_list', 'pages_read_engagement', 'read_insights'],
        connectedByUserId: userId,
      },
    });
    socialAccountId = account.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (workspaceId) {
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    }
    if (foreignWorkspaceId) {
      await prisma.workspace.delete({ where: { id: foreignWorkspaceId } }).catch(() => {});
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await app.close();
  });

  describe('1. AccountAnalyticsSnapshot Database Constraints & Idempotency', () => {
    it('creates account snapshot and distinguishes zero vs null values', async () => {
      const snapDate = new Date('2026-10-01T00:00:00.000Z');

      const snapshot = await repository.upsertAccountSnapshot({
        workspaceId,
        socialAccountId,
        platform: SocialPlatform.FACEBOOK,
        period: AnalyticsMetricPeriod.DAY,
        snapshotDate: snapDate,
        followersCount: 1500,
        followersNetChange: 0, // Genuine 0, not null
        reach: null, // Unsupported/missing metric, not 0
        impressions: 4000,
        engagementTotal: 200,
      });

      expect(snapshot.id).toBeDefined();
      expect(snapshot.followersCount).toBe(1500);
      expect(snapshot.followersNetChange).toBe(0);
      expect(snapshot.reach).toBeNull();
      expect(snapshot.impressions).toBe(4000);
      expect(snapshot.engagementRate).toBeDefined(); // computed safely from followersCount: 200 / 1500
    });

    it('idempotently updates the same account snapshot without duplicate rows', async () => {
      const snapDate = new Date('2026-10-01T00:00:00.000Z');

      // Resync later in the day with updated numbers
      const updated = await repository.upsertAccountSnapshot({
        workspaceId,
        socialAccountId,
        platform: SocialPlatform.FACEBOOK,
        period: AnalyticsMetricPeriod.DAY,
        snapshotDate: snapDate,
        followersCount: 1520,
        followersNetChange: 20,
        reach: 800,
        impressions: 4500,
        engagementTotal: 240,
      });

      expect(updated.followersCount).toBe(1520);
      expect(updated.followersNetChange).toBe(20);
      expect(updated.reach).toBe(800);
      expect(updated.engagementRate).toBe(0.3); // 240 / 800 = 0.3

      // Verify that there is still exactly 1 record for this account, period, and date
      const count = await prisma.accountAnalyticsSnapshot.count({
        where: {
          socialAccountId,
          period: AnalyticsMetricPeriod.DAY,
          snapshotDate: snapDate,
        },
      });
      expect(count).toBe(1);
    });

    it('enforces composite unique constraint at database level', async () => {
      const snapDate = new Date('2026-10-01T00:00:00.000Z');

      // Direct insert bypassing upsert must violate @@unique([socialAccountId, period, snapshotDate])
      await expect(
        prisma.accountAnalyticsSnapshot.create({
          data: {
            workspaceId,
            socialAccountId,
            platform: SocialPlatform.FACEBOOK,
            period: AnalyticsMetricPeriod.DAY,
            snapshotDate: snapDate,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('2. PostAnalyticsSnapshot Historical Preservation & Target Disconnect Retention', () => {
    it('preserves historical daily observations for the same post across multiple days', async () => {
      const day1 = new Date('2026-10-02T00:00:00.000Z');
      const day2 = new Date('2026-10-03T00:00:00.000Z');

      // Day 1 snapshot
      const snap1 = await repository.upsertPostSnapshot({
        workspaceId,
        socialAccountId,
        externalPostId: 'fb_post_999',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: day1,
        likesCount: 50,
        commentsCount: 10,
        reach: 500,
      });

      // Day 2 snapshot (accumulated metrics)
      const snap2 = await repository.upsertPostSnapshot({
        workspaceId,
        socialAccountId,
        externalPostId: 'fb_post_999',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: day2,
        likesCount: 85,
        commentsCount: 22,
        reach: 920,
      });

      expect(snap1.id).not.toBe(snap2.id);
      expect(snap1.likesCount).toBe(50);
      expect(snap2.likesCount).toBe(85);

      const snapshots = await prisma.postAnalyticsSnapshot.findMany({
        where: {
          socialAccountId,
          externalPostId: 'fb_post_999',
        },
        orderBy: { snapshotDate: 'asc' },
      });

      expect(snapshots.length).toBe(2);
      expect(snapshots[0].snapshotDate.toISOString()).toBe(day1.toISOString());
      expect(snapshots[1].snapshotDate.toISOString()).toBe(day2.toISOString());
    });

    it('preserves PostAnalyticsSnapshot when ScheduledPostTarget is removed (onDelete: SetNull)', async () => {
      // 1. Create a draft, scheduled post, and target
      const draft = await prisma.contentDraft.create({
        data: {
          workspaceId,
          createdByUserId: userId,
          title: 'Retention Test Draft',
          status: 'APPROVED',
        },
      });

      const sched = await prisma.scheduledPost.create({
        data: {
          workspaceId,
          draftId: draft.id,
          createdById: userId,
          scheduledAt: new Date(),
          approvedRevisionNumber: 1,
          contentSnapshot: {},
          snapshotHash: 'hash-test',
        },
      });

      const target = await prisma.scheduledPostTarget.create({
        data: {
          scheduledPostId: sched.id,
          socialAccountId,
          platform: SocialPlatform.FACEBOOK,
          externalPostId: 'retained_external_post_123',
        },
      });

      // 2. Create post snapshot linked to target
      const postSnapshot = await repository.upsertPostSnapshot({
        workspaceId,
        socialAccountId,
        scheduledPostTargetId: target.id,
        externalPostId: 'retained_external_post_123',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: new Date('2026-10-04T00:00:00.000Z'),
        likesCount: 150,
      });

      expect(postSnapshot.scheduledPostTargetId).toBe(target.id);

      // 3. Delete scheduled post (cascades to target)
      await prisma.scheduledPost.delete({ where: { id: sched.id } });

      // 4. Verify post snapshot is NOT deleted, and scheduledPostTargetId is cleanly SET NULL
      const foundSnapshot = await prisma.postAnalyticsSnapshot.findUnique({
        where: { id: postSnapshot.id },
      });

      expect(foundSnapshot).not.toBeNull();
      expect(foundSnapshot?.scheduledPostTargetId).toBeNull();
      expect(foundSnapshot?.likesCount).toBe(150);
      expect(foundSnapshot?.externalPostId).toBe('retained_external_post_123');
    });
  });

  describe('3. Sync Jobs, Leases & Worker Recovery', () => {
    it('handles worker lease recovery for abandoned jobs', async () => {
      // Create an abandoned job with lease in past
      const abandonedJob = await prisma.analyticsSyncJob.create({
        data: {
          workspaceId,
          socialAccountId,
          jobType: SyncJobType.ACCOUNT_DAILY,
          status: SyncJobStatus.RUNNING,
          startedAt: new Date(Date.now() - 30 * 60 * 1000),
          leaseExpiresAt: new Date(Date.now() - 15 * 60 * 1000), // Expired 15 mins ago
          claimToken: 'stale-worker-token',
        },
      });

      const recoveredCount = await repository.recoverExpiredLeases(workspaceId);
      expect(recoveredCount).toBeGreaterThanOrEqual(1);

      const recovered = await prisma.analyticsSyncJob.findUnique({
        where: { id: abandonedJob.id },
      });
      expect(recovered?.status).toBe(SyncJobStatus.FAILED);
      expect(recovered?.errorCode).toBe('LEASE_EXPIRED_TIMEOUT');
    });

    it('rejects completing a job if the claim token was superseded or expired', async () => {
      const activeJob = await repository.createSyncJob({
        workspaceId,
        socialAccountId,
        jobType: SyncJobType.MANUAL_REFRESH,
      });

      // Competing worker tries to complete with wrong token
      await expect(
        repository.completeSyncJob({
          jobId: activeJob.id,
          claimToken: 'wrong-token-abc',
          status: SyncJobStatus.COMPLETED,
          itemsProcessed: 10,
          itemsFailed: 0,
        }),
      ).rejects.toThrow(ConflictException);

      // Legitimate worker completes with correct token
      const completed = await repository.completeSyncJob({
        jobId: activeJob.id,
        claimToken: activeJob.claimToken!,
        status: SyncJobStatus.COMPLETED,
        itemsProcessed: 10,
        itemsFailed: 0,
      });

      expect(completed.status).toBe(SyncJobStatus.COMPLETED);
      expect(completed.lastSuccessfulSyncAt).toBeDefined();
    });

    it('records sanitized sync errors without credential leakage', async () => {
      const syncJob = await repository.createSyncJob({
        workspaceId,
        jobType: SyncJobType.ACCOUNT_DAILY,
      });

      const error = await repository.recordSyncError({
        syncJobId: syncJob.id,
        socialAccountId,
        errorCode: 'OAuthException_190',
        errorMessage: 'Invalid user token Bearer EAAtestsecret1234567890. Request rejected.',
        httpStatus: 401,
      });

      expect(error.isPermissionError).toBe(true);
      expect(error.errorMessage).toContain('Bearer [REDACTED]');
      expect(error.errorMessage).not.toContain('EAAtestsecret1234567890');
    });
  });

  describe('4. Growth Insights Persistence & RBAC / Bounds Validation', () => {
    it('persists growth insight with validated confidence bounds', async () => {
      const insight = await repository.createGrowthInsight({
        workspaceId,
        category: GrowthInsightCategory.TIMING,
        title: 'Midweek Engagement Spike',
        summary: 'Engagement is 22% higher on Thursdays at 11:00 AM.',
        suggestedAction: 'Schedule weekly product announcement for Thursday morning.',
        evidence: { sampleSize: 18, liftPercentage: 22.1 },
        confidenceScore: 0.88,
      });

      expect(insight.id).toBeDefined();
      expect(insight.confidenceScore).toBe(0.88);
      expect(insight.workspaceId).toBe(workspaceId);
    });

    it('rejects confidence score outside bounds (0.0 to 1.0)', async () => {
      await expect(
        repository.createGrowthInsight({
          workspaceId,
          category: GrowthInsightCategory.TIMING,
          title: 'Invalid',
          summary: 'Invalid',
          suggestedAction: 'Invalid',
          evidence: {},
          confidenceScore: 1.5, // > 1.0
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces workspace isolation on insight dismissal', async () => {
      const insight = await repository.createGrowthInsight({
        workspaceId,
        category: GrowthInsightCategory.ENGAGEMENT,
        title: 'Video formats outperform carousels',
        summary: 'Reels generated 40% more saves than static images.',
        suggestedAction: 'Convert static promotions into short-form Reels.',
        evidence: { sampleSize: 12, lift: 40.0 },
        confidenceScore: 0.92,
      });

      // Dismissal attempt with foreign workspace must be rejected with NotFoundException
      await expect(
        repository.dismissGrowthInsight(foreignWorkspaceId, insight.id, userId),
      ).rejects.toThrow(NotFoundException);

      // Legitimate dismissal from the correct workspace
      const dismissed = await repository.dismissGrowthInsight(workspaceId, insight.id, userId);
      expect(dismissed.dismissedAt).not.toBeNull();
      expect(dismissed.dismissedById).toBe(userId);
    });
  });

  describe('5. Analytics Sync Controller Endpoints (e2e)', () => {
    it('returns sync status via GET /workspaces/:workspaceId/analytics/sync-status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/analytics/sync-status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('triggers manual sync via POST /workspaces/:workspaceId/analytics/sync-now', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/analytics/sync-now`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ socialAccountId, force: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.throttled).toBe(false);
    });

    it('throttles subsequent manual sync calls within 15 minutes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/analytics/sync-now`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ socialAccountId });

      expect(res.status).toBe(200);
      expect(res.body.data.throttled).toBe(true);
      expect(res.body.message).toContain('throttled');
    });

    it('rejects cross-workspace sync-status request with 403 Forbidden', async () => {
      // User is not a member of foreignWorkspaceId
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${foreignWorkspaceId}/analytics/sync-status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('6. Analytics Dashboard Controller Endpoints (Stage 7 Phase D e2e)', () => {
    let testInsightId: string;

    beforeAll(async () => {
      // Seed a growth insight
      const insight = await repository.createGrowthInsight({
        workspaceId,
        category: GrowthInsightCategory.CONTENT_FORMAT,
        title: 'High Engagement on Video',
        summary: 'Video posts generate 45% higher engagement than static images.',
        suggestedAction: 'Increase video content mix to at least 2 reels per week.',
        evidence: { videoAvgRate: 0.18, photoAvgRate: 0.08 },
        confidenceScore: 0.88,
      });
      testInsightId = insight.id;
    });

    it('returns overview metrics via GET /workspaces/:workspaceId/analytics/overview', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/analytics/overview`)
        .query({
          startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalFollowers).toBeDefined();
      expect(res.body.data.metrics.impressions).toBeDefined();
      expect(res.body.data.metrics.reach).toBeDefined();
      expect(res.body.data.metrics.engagements).toBeDefined();
      expect(res.body.data.metrics.engagementRate).toBeDefined();
      expect(res.body.data.platformBreakdown).toBeDefined();
    });

    it('returns daily time-series via GET /workspaces/:workspaceId/analytics/timeseries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/analytics/timeseries`)
        .query({
          startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dataPoints).toBeDefined();
      expect(Array.isArray(res.body.data.dataPoints)).toBe(true);
    });

    it('returns paginated posts via GET /workspaces/:workspaceId/analytics/posts', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/analytics/posts`)
        .query({ page: 1, limit: 10, sortBy: 'publishedAt', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('returns top-performing posts via GET /workspaces/:workspaceId/analytics/top-performing', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/analytics/top-performing`)
        .query({ metric: 'engagementRate', limit: 5 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rankingMetric).toBe('engagementRate');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('lists growth insights via GET /workspaces/:workspaceId/analytics/insights', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/analytics/insights`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((i: any) => i.id === testInsightId)).toBe(true);
    });

    it('dismisses growth insight via POST /workspaces/:workspaceId/analytics/insights/:id/dismiss', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/analytics/insights/${testInsightId}/dismiss`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('dismissed');

      // Verify it is no longer listed in active insights
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/analytics/insights`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(listRes.body.data.some((i: any) => i.id === testInsightId)).toBe(false);
    });

    it('triggers deterministic insight generation via POST /workspaces/:workspaceId/analytics/insights/generate', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/analytics/insights/generate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ force: true, useAiEnrichment: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toBeDefined();
      expect(Array.isArray(res.body.data.results)).toBe(true);
      expect(res.body.data.results.length).toBe(5); // all 5 categories evaluated
    });

    it('rejects cross-workspace insights generation request with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${foreignWorkspaceId}/analytics/insights/generate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ force: true });

      expect(res.status).toBe(403);
    });

    it('enforces tenant boundary on dashboard endpoints (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${foreignWorkspaceId}/analytics/overview`)
        .query({
          startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});


