import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsDataService } from './analytics-data.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AnalyticsMetricPeriod,
  SocialPlatform,
  SyncJobStatus,
  SyncJobType,
  GrowthInsightCategory,
} from '@prisma/client';

describe('AnalyticsDataService', () => {
  let service: AnalyticsDataService;
  let repository: any;
  let prisma: any;

  const mockRepo = {
    queryAccountSnapshots: jest.fn(),
    upsertAccountSnapshot: jest.fn(),
    queryPostSnapshots: jest.fn(),
    upsertPostSnapshot: jest.fn(),
    createSyncJob: jest.fn(),
    completeSyncJob: jest.fn(),
    recordSyncError: jest.fn(),
    recoverExpiredLeases: jest.fn(),
    getSyncFreshness: jest.fn(),
    createGrowthInsight: jest.fn(),
    listGrowthInsights: jest.fn(),
    dismissGrowthInsight: jest.fn(),
  };

  const mockPrisma = {
    socialAccount: {
      findUnique: jest.fn(),
    },
    scheduledPostTarget: {
      findUnique: jest.fn(),
    },
    analyticsSyncJob: {
      findUnique: jest.fn(),
    },
    postAnalyticsSnapshot: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsDataService,
        {
          provide: AnalyticsRepository,
          useValue: mockRepo,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsDataService>(AnalyticsDataService);
    repository = module.get(AnalyticsRepository);
    prisma = module.get(PrismaService);
  });

  describe('Workspace & Account Isolation', () => {
    it('throws NotFoundException when social account does not belong to the workspace', async () => {
      mockPrisma.socialAccount.findUnique.mockResolvedValue({
        id: 'acc-1',
        workspaceId: 'other-ws',
      });

      await expect(
        service.validateSocialAccountInWorkspace('ws-1', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when target does not match account or workspace', async () => {
      mockPrisma.scheduledPostTarget.findUnique.mockResolvedValue({
        id: 'target-1',
        socialAccountId: 'other-acc',
        scheduledPost: { workspaceId: 'ws-1' },
      });

      await expect(
        service.validateTargetInWorkspace('ws-1', 'acc-1', 'target-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cross-workspace upsert attempts with ForbiddenException', async () => {
      await expect(
        service.upsertAccountSnapshot('ws-1', {
          workspaceId: 'diff-ws', // Attempted cross-tenant write!
          socialAccountId: 'acc-1',
          platform: SocialPlatform.FACEBOOK,
          snapshotDate: new Date(),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAccountSnapshots date-range validation', () => {
    it('rejects when startDate is after endDate', async () => {
      await expect(
        service.getAccountSnapshots('ws-1', {
          startDate: '2026-10-15T00:00:00Z',
          endDate: '2026-10-10T00:00:00Z', // Inverted range
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects malformed date strings', async () => {
      await expect(
        service.getAccountSnapshots('ws-1', {
          startDate: 'not-a-date',
          endDate: '2026-10-10T00:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('queries repository when dates are valid', async () => {
      mockRepo.queryAccountSnapshots.mockResolvedValue([]);

      const result = await service.getAccountSnapshots('ws-1', {
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-10T00:00:00Z',
      });

      expect(result).toEqual([]);
      expect(mockRepo.queryAccountSnapshots).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-1',
          startDate: new Date('2026-10-01T00:00:00Z'),
          endDate: new Date('2026-10-10T00:00:00Z'),
        }),
      );
    });
  });

  describe('Sync Jobs tenant boundaries', () => {
    it('rejects startSyncJob if workspaceId in DTO mismatches URL context', async () => {
      await expect(
        service.startSyncJob('ws-1', {
          workspaceId: 'other-ws',
          jobType: SyncJobType.ACCOUNT_DAILY,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects completeSyncJob if job belongs to another workspace', async () => {
      mockPrisma.analyticsSyncJob.findUnique.mockResolvedValue({
        id: 'job-1',
        workspaceId: 'other-ws',
      });

      await expect(
        service.completeSyncJob('ws-1', 'job-1', {
          claimToken: 'token',
          status: SyncJobStatus.COMPLETED,
          itemsProcessed: 1,
          itemsFailed: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Growth Insights', () => {
    it('creates growth insight delegating to repository after tenant validation', async () => {
      mockRepo.createGrowthInsight.mockResolvedValue({ id: 'insight-1' });

      const res = await service.createGrowthInsight('ws-1', {
        workspaceId: 'ws-1',
        category: GrowthInsightCategory.TIMING,
        title: 'Best time to post',
        summary: 'Wednesdays at 2 PM',
        suggestedAction: 'Schedule for Wednesday',
        evidence: { test: true },
        confidenceScore: 0.9,
      });

      expect(res).toEqual({ id: 'insight-1' });
      expect(mockRepo.createGrowthInsight).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-1',
          confidenceScore: 0.9,
        }),
      );
    });
  });

  describe('Dashboard Aggregations', () => {
    it('computes overview metrics with valid previous-period percentage deltas and point-in-time followers', async () => {
      // Setup current snapshots
      mockRepo.queryAccountSnapshots
        .mockResolvedValueOnce([
          {
            socialAccountId: 'acc-fb',
            platform: SocialPlatform.FACEBOOK,
            snapshotDate: new Date('2026-10-05T00:00:00Z'),
            followersCount: 1000,
            impressions: 500,
            reach: 400,
            engagementTotal: 80,
            profileViews: 20,
            websiteClicks: 10,
          },
          {
            socialAccountId: 'acc-ig',
            platform: SocialPlatform.INSTAGRAM,
            snapshotDate: new Date('2026-10-05T00:00:00Z'),
            followersCount: 2000,
            impressions: 1500,
            reach: 1200,
            engagementTotal: 240,
            profileViews: 50,
            websiteClicks: 30,
          },
        ])
        // Previous period snapshots
        .mockResolvedValueOnce([
          {
            socialAccountId: 'acc-fb',
            platform: SocialPlatform.FACEBOOK,
            snapshotDate: new Date('2026-09-28T00:00:00Z'),
            followersCount: 900,
            impressions: 400,
            reach: 300,
            engagementTotal: 60,
            profileViews: 15,
            websiteClicks: 5,
          },
          {
            socialAccountId: 'acc-ig',
            platform: SocialPlatform.INSTAGRAM,
            snapshotDate: new Date('2026-09-28T00:00:00Z'),
            followersCount: 1800,
            impressions: 1200,
            reach: 1000,
            engagementTotal: 200,
            profileViews: 40,
            websiteClicks: 20,
          },
        ]);

      const res = await service.getOverview('ws-1', {
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-07T00:00:00Z',
      });

      expect(res.metrics.totalFollowers.value).toBe(3000);
      expect(res.metrics.totalFollowers.previousValue).toBe(2700);
      expect(res.metrics.totalFollowers.percentageChange).toBe(11.1);
      expect(res.metrics.totalFollowers.changeDirection).toBe('up');
      expect(res.metrics.totalFollowers.status).toBe('AVAILABLE');

      expect(res.metrics.impressions.value).toBe(2000);
      expect(res.metrics.impressions.previousValue).toBe(1600);
      expect(res.metrics.impressions.percentageChange).toBe(25);

      expect(res.metrics.reach.value).toBe(1600);
      expect(res.metrics.reach.previousValue).toBe(1300);

      // Platform breakdown
      expect(res.platformBreakdown.followers.facebook).toBe(1000);
      expect(res.platformBreakdown.followers.instagram).toBe(2000);
      expect(res.platformBreakdown.impressions.facebook).toBe(500);
      expect(res.platformBreakdown.impressions.instagram).toBe(1500);
    });

    it('returns status NO_BASELINE and null percentageChange when previous period is zero or empty', async () => {
      mockRepo.queryAccountSnapshots
        .mockResolvedValueOnce([
          {
            socialAccountId: 'acc-1',
            platform: SocialPlatform.FACEBOOK,
            snapshotDate: new Date('2026-10-05T00:00:00Z'),
            followersCount: 500,
            impressions: 200,
            reach: 150,
            engagementTotal: 30,
          },
        ])
        .mockResolvedValueOnce([]); // no previous data

      const res = await service.getOverview('ws-1', {
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-07T00:00:00Z',
      });

      expect(res.metrics.impressions.value).toBe(200);
      expect(res.metrics.impressions.previousValue).toBeNull();
      expect(res.metrics.impressions.percentageChange).toBeNull();
      expect(res.metrics.impressions.status).toBe('NO_BASELINE');
    });

    it('generates timeseries with null gaps rather than false zeroes for missing days', async () => {
      mockRepo.queryAccountSnapshots.mockResolvedValueOnce([
        {
          socialAccountId: 'acc-1',
          platform: SocialPlatform.FACEBOOK,
          snapshotDate: new Date('2026-10-01T00:00:00Z'),
          impressions: 100,
          reach: 80,
          engagementTotal: 10,
          followersCount: 500,
        },
        // 2026-10-02 has NO snapshot
        {
          socialAccountId: 'acc-1',
          platform: SocialPlatform.FACEBOOK,
          snapshotDate: new Date('2026-10-03T00:00:00Z'),
          impressions: 120,
          reach: 90,
          engagementTotal: 15,
          followersCount: 502,
        },
      ]);

      const res = await service.getTimeseries('ws-1', {
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-03T00:00:00Z',
      });

      expect(res.dataPoints).toHaveLength(3);
      expect(res.dataPoints[0].date).toBe('2026-10-01');
      expect(res.dataPoints[0].impressions).toBe(100);

      // Missing day: must be null, not 0!
      expect(res.dataPoints[1].date).toBe('2026-10-02');
      expect(res.dataPoints[1].impressions).toBeNull();
      expect(res.dataPoints[1].reach).toBeNull();
      expect(res.dataPoints[1].engagements).toBeNull();

      expect(res.dataPoints[2].date).toBe('2026-10-03');
      expect(res.dataPoints[2].impressions).toBe(120);
    });

    it('returns paginated posts with OmniSocial linkage flag and preview text', async () => {
      mockPrisma.postAnalyticsSnapshot.findMany.mockResolvedValueOnce([
        {
          id: 'snap-1',
          externalPostId: 'fb-p-1',
          platform: SocialPlatform.FACEBOOK,
          postType: 'POST',
          publishedAt: new Date('2026-10-05T12:00:00Z'),
          snapshotDate: new Date('2026-10-05T00:00:00Z'),
          likesCount: 25,
          commentsCount: 5,
          sharesCount: 2,
          savesCount: 1,
          impressions: 300,
          reach: 250,
          engagementRate: 0.132,
          scheduledPostTargetId: 'target-1',
          scheduledPostTarget: {
            id: 'target-1',
            scheduledPostId: 'post-1',
            externalPostUrl: 'https://facebook.com/123/posts/456',
          },
          socialAccount: {
            id: 'acc-1',
            accountName: 'Test Page',
            accountUsername: 'testpage',
            provider: 'META_FACEBOOK',
            profileImageUrl: null,
          },
          rawMetrics: {
            message: 'Hello OmniSocial World!',
          },
        },
      ]);
      mockPrisma.postAnalyticsSnapshot.count.mockResolvedValueOnce(1);

      const res = await service.getDashboardPosts('ws-1', {
        page: 1,
        limit: 10,
      });

      expect(res.items).toHaveLength(1);
      expect(res.items[0].isScheduledViaOmniSocial).toBe(true);
      expect(res.items[0].previewText).toBe('Hello OmniSocial World!');
      expect(res.items[0].externalPostUrl).toBe('https://facebook.com/123/posts/456');
      expect(res.pagination.total).toBe(1);
    });

    it('ranks top-performing posts by selected metric excluding nulls/zeroes', async () => {
      mockPrisma.postAnalyticsSnapshot.findMany.mockResolvedValueOnce([
        {
          id: 'snap-top',
          externalPostId: 'ig-p-top',
          platform: SocialPlatform.INSTAGRAM,
          postType: 'POST',
          publishedAt: new Date('2026-10-04T12:00:00Z'),
          engagementRate: 0.285,
          reach: 500,
          impressions: 600,
          likesCount: 140,
          scheduledPostTargetId: null,
          scheduledPostTarget: null,
          socialAccount: {
            id: 'acc-2',
            accountName: 'IG Brand',
            accountUsername: 'igbrand',
            provider: 'META_INSTAGRAM',
            profileImageUrl: null,
          },
          rawMetrics: {
            caption: 'Viral Instagram Reel',
          },
        },
      ]);

      const res = await service.getTopPerforming('ws-1', {
        metric: 'engagementRate',
        limit: 3,
      });

      expect(res.rankingMetric).toBe('engagementRate');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].metricValue).toBe(0.285);
      expect(res.items[0].previewText).toBe('Viral Instagram Reel');
      expect(res.items[0].isScheduledViaOmniSocial).toBe(false);
    });
  });
});

