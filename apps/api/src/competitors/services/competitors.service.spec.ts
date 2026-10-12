import { Test, TestingModule } from '@nestjs/testing';
import { CompetitorsService } from './competitors.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CompetitorCategory, SocialPlatform, AnalyticsMetricPeriod } from '@packages/shared';

describe('CompetitorsService', () => {
  let service: CompetitorsService;
  let prisma: any;

  const mockWorkspaceId = 'ws-comp-111';
  const mockCompetitorId = 'comp-profile-222';
  const mockAccountId = 'comp-acc-333';

  const mockCompetitor = {
    id: mockCompetitorId,
    workspaceId: mockWorkspaceId,
    name: 'Competitor Acme',
    websiteUrl: 'https://acme.example.com',
    avatarUrl: 'https://acme.example.com/logo.png',
    category: CompetitorCategory.DIRECT,
    notes: 'Direct market competitor in enterprise social space',
    isActive: true,
    createdAt: new Date('2026-06-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
    socialAccounts: [
      {
        id: mockAccountId,
        competitorProfileId: mockCompetitorId,
        platform: SocialPlatform.INSTAGRAM,
        handle: 'acme_social',
        publicUrl: 'https://instagram.com/acme_social',
        followersCount: 15400,
        followingCount: 420,
        postsCount: 310,
        isActive: true,
        lastSyncedAt: new Date('2026-06-01T00:00:00Z'),
        createdAt: new Date('2026-06-01T00:00:00Z'),
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      },
    ],
    snapshots: [
      {
        id: 'snap-1',
        competitorProfileId: mockCompetitorId,
        platform: null,
        period: AnalyticsMetricPeriod.DAY,
        snapshotDate: new Date('2026-06-01T00:00:00Z'),
        followerGrowthRate: 2.5,
        followersCount: 15400,
        engagementRate: 3.4,
        postingFrequencyWeekly: 4.5,
        estReach: 6468,
        estImpressions: 27720,
        sentimentScore: 72.0,
        sentimentDistribution: { positive: 72, neutral: 20, negative: 8 },
        topPostExcerpt: 'Keynote update #Innovation',
        topPostEngagementRate: 5.7,
        createdAt: new Date('2026-06-01T00:00:00Z'),
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      competitorProfile: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      competitorSocialAccount: {
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      competitorBenchmarkSnapshot: {
        create: jest.fn(),
      },
      socialAccount: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitorsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CompetitorsService>(CompetitorsService);
  });

  describe('create', () => {
    it('should create a new competitor profile and seed snapshots', async () => {
      prisma.competitorProfile.create.mockResolvedValue(mockCompetitor);
      prisma.competitorProfile.findUnique.mockResolvedValue(mockCompetitor);
      prisma.competitorBenchmarkSnapshot.create.mockResolvedValue({});
      prisma.competitorProfile.findFirst.mockResolvedValue(mockCompetitor);

      const result = await service.create(mockWorkspaceId, {
        name: 'Competitor Acme',
        websiteUrl: 'https://acme.example.com',
        category: CompetitorCategory.DIRECT,
        accounts: [
          {
            platform: SocialPlatform.INSTAGRAM,
            handle: 'acme_social',
            followersCount: 15400,
          },
        ],
      });

      expect(prisma.competitorProfile.create).toHaveBeenCalled();
      expect(prisma.competitorBenchmarkSnapshot.create).toHaveBeenCalledTimes(3); // DAY, WEEK, MONTH
      expect(result.name).toBe('Competitor Acme');
      expect(result.socialAccounts).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should list all competitors for a workspace with filters', async () => {
      prisma.competitorProfile.findMany.mockResolvedValue([mockCompetitor]);

      const result = await service.findAll(mockWorkspaceId, {
        isActive: true,
        category: CompetitorCategory.DIRECT,
      });

      expect(prisma.competitorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId: mockWorkspaceId,
            isActive: true,
            category: CompetitorCategory.DIRECT,
          },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockCompetitorId);
    });
  });

  describe('findOne', () => {
    it('should return a single competitor profile if found', async () => {
      prisma.competitorProfile.findFirst.mockResolvedValue(mockCompetitor);

      const result = await service.findOne(mockWorkspaceId, mockCompetitorId);

      expect(result.id).toBe(mockCompetitorId);
      expect(result.name).toBe('Competitor Acme');
    });

    it('should throw NotFoundException if competitor profile does not exist', async () => {
      prisma.competitorProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockWorkspaceId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the modified competitor profile', async () => {
      prisma.competitorProfile.findFirst.mockResolvedValue(mockCompetitor);
      const updatedMock = { ...mockCompetitor, name: 'Acme Global Brand' };
      prisma.competitorProfile.update.mockResolvedValue(updatedMock);

      const result = await service.update(mockWorkspaceId, mockCompetitorId, {
        name: 'Acme Global Brand',
      });

      expect(prisma.competitorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCompetitorId },
          data: expect.objectContaining({ name: 'Acme Global Brand' }),
        }),
      );
      expect(result.name).toBe('Acme Global Brand');
    });
  });

  describe('remove', () => {
    it('should delete the competitor profile', async () => {
      prisma.competitorProfile.findFirst.mockResolvedValue(mockCompetitor);
      prisma.competitorProfile.delete.mockResolvedValue(mockCompetitor);

      const result = await service.remove(mockWorkspaceId, mockCompetitorId);

      expect(prisma.competitorProfile.delete).toHaveBeenCalledWith({
        where: { id: mockCompetitorId },
      });
      expect(result.deleted).toBe(true);
    });
  });

  describe('addAccount', () => {
    it('should upsert a social channel on competitor profile and refresh snapshots', async () => {
      prisma.competitorProfile.findFirst.mockResolvedValue(mockCompetitor);
      prisma.competitorProfile.findUnique.mockResolvedValue(mockCompetitor);
      prisma.competitorSocialAccount.upsert.mockResolvedValue(mockCompetitor.socialAccounts[0]);

      const result = await service.addAccount(mockWorkspaceId, mockCompetitorId, {
        platform: SocialPlatform.INSTAGRAM,
        handle: 'acme_social',
        followersCount: 16000,
      });

      expect(prisma.competitorSocialAccount.upsert).toHaveBeenCalled();
      expect(result.handle).toBe('acme_social');
    });
  });

  describe('removeAccount', () => {
    it('should delete the competitor social account', async () => {
      prisma.competitorProfile.findFirst.mockResolvedValue(mockCompetitor);
      prisma.competitorSocialAccount.delete.mockResolvedValue({});

      const result = await service.removeAccount(mockWorkspaceId, mockCompetitorId, mockAccountId);

      expect(prisma.competitorSocialAccount.delete).toHaveBeenCalledWith({
        where: { id: mockAccountId },
      });
      expect(result.deleted).toBe(true);
    });
  });

  describe('getComparisonSummary', () => {
    it('should calculate brand vs competitor benchmarks and assemble leaderboard', async () => {
      prisma.socialAccount.findMany.mockResolvedValue([
        {
          id: 'brand-acc-1',
          platform: 'INSTAGRAM',
          connectionStatus: 'CONNECTED',
          accountAnalyticsSnapshots: [
            {
              period: AnalyticsMetricPeriod.DAY,
              followersCount: 22000,
              engagementRate: 4.2,
              snapshotDate: new Date(),
            },
          ],
        },
      ]);

      prisma.competitorProfile.findMany.mockResolvedValue([mockCompetitor]);

      const summary = await service.getComparisonSummary(mockWorkspaceId, AnalyticsMetricPeriod.DAY);

      expect(summary.brandSummary.totalFollowers).toBe(22000);
      expect(summary.brandSummary.avgEngagementRate).toBe(4.2);
      expect(summary.competitorBenchmarkAvg.totalFollowers).toBe(15400);
      expect(summary.leaderboard.length).toBeGreaterThanOrEqual(2);
      expect(summary.keyInsights.length).toBeGreaterThan(0);
      expect(summary.topPerformingPosts.length).toBeGreaterThan(0);
    });
  });

  describe('syncSnapshots', () => {
    it('should seed snapshots for all active competitors', async () => {
      prisma.competitorProfile.findMany.mockResolvedValue([{ id: mockCompetitorId }]);
      prisma.competitorProfile.findUnique.mockResolvedValue(mockCompetitor);
      prisma.competitorBenchmarkSnapshot.create.mockResolvedValue({});

      const result = await service.syncSnapshots(mockWorkspaceId);

      expect(result.syncedCount).toBe(1);
      expect(prisma.competitorBenchmarkSnapshot.create).toHaveBeenCalledTimes(3);
    });
  });
});
