import { Test, TestingModule } from '@nestjs/testing';
import {
  AnalyticsRepository,
  sanitizeLogString,
} from './analytics.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AnalyticsMetricPeriod,
  PostAnalyticsType,
  SocialPlatform,
  SyncJobStatus,
  SyncJobType,
  GrowthInsightCategory,
} from '@prisma/client';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('AnalyticsRepository', () => {
  let repository: AnalyticsRepository;
  let prisma: any;

  const mockPrisma = {
    accountAnalyticsSnapshot: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    postAnalyticsSnapshot: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    analyticsSyncJob: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
    },
    analyticsSyncError: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    growthInsight: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<AnalyticsRepository>(AnalyticsRepository);
    prisma = module.get(PrismaService);
  });

  describe('Sanitization utility', () => {
    it('redacts Bearer tokens, query tokens, and Meta tokens', () => {
      const sensitive =
        'Error: Unauthorized request Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz with access_token=EAAB1234567890abcdef and client_secret=secret123';
      const sanitized = sanitizeLogString(sensitive);

      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized).toContain('Bearer [REDACTED]');
      expect(sanitized).toContain('access_token=[REDACTED]');
      expect(sanitized).toContain('client_secret=[REDACTED]');
      expect(sanitized).not.toContain('EAAB1234567890abcdef');
    });

    it('handles empty or short strings safely', () => {
      expect(sanitizeLogString('')).toBe('');
      expect(sanitizeLogString('Simple failure')).toBe('Simple failure');
    });
  });

  describe('upsertAccountSnapshot', () => {
    it('normalizes snapshotDate to UTC midnight bucket and computes engagement rate safely', async () => {
      mockPrisma.accountAnalyticsSnapshot.upsert.mockResolvedValue({
        id: 'snapshot-1',
        socialAccountId: 'acc-1',
      });

      await repository.upsertAccountSnapshot({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: new Date('2026-10-10T14:35:00.000Z'),
        followersCount: 5000,
        engagementTotal: 250,
        reach: 1000,
      });

      expect(mockPrisma.accountAnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            socialAccountId_period_snapshotDate: {
              socialAccountId: 'acc-1',
              period: AnalyticsMetricPeriod.DAY,
              snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
            },
          },
          create: expect.objectContaining({
            engagementRate: 0.25, // 250 / 1000
            reach: 1000,
            followersCount: 5000,
            snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
          }),
        }),
      );
    });

    it('preserves null (missing) metrics without forcing them to zero', async () => {
      mockPrisma.accountAnalyticsSnapshot.upsert.mockResolvedValue({ id: 'snapshot-1' });

      await repository.upsertAccountSnapshot({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        platform: SocialPlatform.INSTAGRAM,
        snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
        followersCount: 1200,
        // reach and impressions are missing/unsupported in Tier 1
        reach: null,
        impressions: null,
      });

      expect(mockPrisma.accountAnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            followersCount: 1200,
            reach: null,
            impressions: null,
            engagementRate: null,
          }),
        }),
      );
    });

    it('distinguishes zero from null values correctly', async () => {
      mockPrisma.accountAnalyticsSnapshot.upsert.mockResolvedValue({ id: 'snapshot-1' });

      await repository.upsertAccountSnapshot({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
        followersNetChange: 0, // Genuine zero net change
        engagementTotal: 0,
        reach: 500,
      });

      expect(mockPrisma.accountAnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            followersNetChange: 0,
            engagementTotal: 0,
            reach: 500,
            engagementRate: 0, // 0 / 500 = 0, not null
          }),
        }),
      );
    });
  });

  describe('upsertPostSnapshot', () => {
    it('computes engagementRate safely when reach is available', async () => {
      mockPrisma.postAnalyticsSnapshot.upsert.mockResolvedValue({ id: 'post-snap-1' });

      await repository.upsertPostSnapshot({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        externalPostId: 'ext-post-123',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: new Date('2026-10-10T08:00:00.000Z'),
        likesCount: 40,
        commentsCount: 10,
        sharesCount: 5,
        savesCount: 5,
        reach: 600,
      });

      expect(mockPrisma.postAnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            externalPostId: 'ext-post-123',
            engagementRate: 0.1, // (40+10+5+5) / 600 = 60 / 600 = 0.1
            snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
          }),
        }),
      );
    });

    it('computes engagementRate safely from impressions when reach is null', async () => {
      mockPrisma.postAnalyticsSnapshot.upsert.mockResolvedValue({ id: 'post-snap-1' });

      await repository.upsertPostSnapshot({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        externalPostId: 'ext-post-123',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
        likesCount: 20,
        commentsCount: 5,
        sharesCount: 0,
        savesCount: 0,
        reach: null,
        impressions: 500,
      });

      expect(mockPrisma.postAnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            engagementRate: 0.05, // 25 / 500
          }),
        }),
      );
    });

    it('guards against division by zero when both reach and impressions are zero or null', async () => {
      mockPrisma.postAnalyticsSnapshot.upsert.mockResolvedValue({ id: 'post-snap-1' });

      await repository.upsertPostSnapshot({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        externalPostId: 'ext-post-123',
        platform: SocialPlatform.FACEBOOK,
        snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
        likesCount: 10,
        commentsCount: 2,
        reach: 0,
        impressions: 0,
      });

      expect(mockPrisma.postAnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            engagementRate: null, // Avoided division by zero!
          }),
        }),
      );
    });

    it('converts watchTimeMs to BigInt when supplied', async () => {
      mockPrisma.postAnalyticsSnapshot.upsert.mockResolvedValue({ id: 'post-snap-1' });

      await repository.upsertPostSnapshot({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        externalPostId: 'ext-video-456',
        platform: SocialPlatform.INSTAGRAM,
        postType: PostAnalyticsType.REEL,
        snapshotDate: new Date('2026-10-10T00:00:00.000Z'),
        watchTimeMs: 125000,
      });

      expect(mockPrisma.postAnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            watchTimeMs: BigInt(125000),
          }),
        }),
      );
    });
  });

  describe('Sync Jobs & Lease Management', () => {
    it('creates sync job with unique claimToken and future leaseExpiresAt', async () => {
      mockPrisma.analyticsSyncJob.create.mockImplementation((args: any) =>
        Promise.resolve({ id: 'job-1', ...args.data }),
      );

      const job = await repository.createSyncJob({
        workspaceId: 'ws-1',
        socialAccountId: 'acc-1',
        jobType: SyncJobType.ACCOUNT_DAILY,
        leaseDurationMs: 60000,
      });

      expect(job.status).toBe(SyncJobStatus.RUNNING);
      expect(job.claimToken).toBeDefined();
      expect(job.leaseExpiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('renews lease when claimToken matches', async () => {
      mockPrisma.analyticsSyncJob.updateMany.mockResolvedValue({ count: 1 });

      const renewed = await repository.renewLease('job-1', 'token-abc', 300000);
      expect(renewed).toBe(true);
      expect(mockPrisma.analyticsSyncJob.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'job-1',
            claimToken: 'token-abc',
            status: SyncJobStatus.RUNNING,
          },
        }),
      );
    });

    it('rejects completeSyncJob if claimToken is invalid or lease was revoked', async () => {
      mockPrisma.analyticsSyncJob.updateMany.mockResolvedValue({ count: 0 }); // 0 updated = token mismatch

      await expect(
        repository.completeSyncJob({
          jobId: 'job-1',
          claimToken: 'stale-token',
          status: SyncJobStatus.COMPLETED,
          itemsProcessed: 5,
          itemsFailed: 0,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('completes sync job and records lastSuccessfulSyncAt upon success', async () => {
      mockPrisma.analyticsSyncJob.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.analyticsSyncJob.findUniqueOrThrow.mockResolvedValue({
        id: 'job-1',
        status: SyncJobStatus.COMPLETED,
      });

      const res = await repository.completeSyncJob({
        jobId: 'job-1',
        claimToken: 'valid-token',
        status: SyncJobStatus.COMPLETED,
        itemsProcessed: 10,
        itemsFailed: 0,
      });

      expect(res.status).toBe(SyncJobStatus.COMPLETED);
      expect(mockPrisma.analyticsSyncJob.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SyncJobStatus.COMPLETED,
            lastSuccessfulSyncAt: expect.any(Date),
          }),
        }),
      );
    });

    it('recovers abandoned sync jobs when lease expires', async () => {
      mockPrisma.analyticsSyncJob.updateMany.mockResolvedValue({ count: 2 });

      const recovered = await repository.recoverExpiredLeases('ws-1');
      expect(recovered).toBe(2);
      expect(mockPrisma.analyticsSyncJob.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: SyncJobStatus.RUNNING,
            workspaceId: 'ws-1',
            leaseExpiresAt: { lt: expect.any(Date) },
          }),
          data: expect.objectContaining({
            status: SyncJobStatus.FAILED,
            errorCode: 'LEASE_EXPIRED_TIMEOUT',
          }),
        }),
      );
    });
  });

  describe('recordSyncError', () => {
    it('sanitizes sensitive tokens and identifies permission errors automatically', async () => {
      mockPrisma.analyticsSyncError.create.mockImplementation((args: any) =>
        Promise.resolve({ id: 'err-1', ...args.data }),
      );

      const error = await repository.recordSyncError({
        syncJobId: 'job-1',
        socialAccountId: 'acc-1',
        errorCode: 'OAuthException_190',
        errorMessage: 'Invalid OAuth access token Bearer EAAXyZ123456789 provided for post',
        httpStatus: 401,
      });

      expect(error.isPermissionError).toBe(true);
      expect(error.errorMessage).toContain('Bearer [REDACTED]');
      expect(error.errorMessage).not.toContain('EAAXyZ123456789');
    });
  });

  describe('Growth Insights', () => {
    it('creates growth insight with validated confidence bounds', async () => {
      mockPrisma.growthInsight.create.mockResolvedValue({
        id: 'insight-1',
        workspaceId: 'ws-1',
        confidenceScore: 0.85,
      });

      const insight = await repository.createGrowthInsight({
        workspaceId: 'ws-1',
        category: GrowthInsightCategory.TIMING,
        title: 'Optimal posting hour for Facebook',
        summary: 'Posts published on Wednesdays between 14:00 and 16:00 show 28% higher reach.',
        suggestedAction: 'Schedule your next promotional post for Wednesday afternoon.',
        evidence: { sampleSize: 24, liftPercentage: 28.4, baselineEngagement: 3.2 },
        confidenceScore: 0.85,
      });

      expect(insight.confidenceScore).toBe(0.85);
    });

    it('rejects confidence score out of bounds (< 0.0 or > 1.0)', async () => {
      await expect(
        repository.createGrowthInsight({
          workspaceId: 'ws-1',
          category: GrowthInsightCategory.ENGAGEMENT,
          title: 'Invalid confidence',
          summary: 'Test',
          suggestedAction: 'Test',
          evidence: {},
          confidenceScore: 1.25, // Out of bounds!
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        repository.createGrowthInsight({
          workspaceId: 'ws-1',
          category: GrowthInsightCategory.ENGAGEMENT,
          title: 'Invalid negative confidence',
          summary: 'Test',
          suggestedAction: 'Test',
          evidence: {},
          confidenceScore: -0.1, // Out of bounds!
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('dismisses insight enforcing workspace boundary', async () => {
      mockPrisma.growthInsight.findUnique.mockResolvedValue({
        id: 'insight-1',
        workspaceId: 'other-ws', // Belongs to different workspace
      });

      await expect(
        repository.dismissGrowthInsight('ws-1', 'insight-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
