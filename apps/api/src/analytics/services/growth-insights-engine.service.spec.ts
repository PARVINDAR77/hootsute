import { Test, TestingModule } from '@nestjs/testing';
import { GrowthInsightsEngineService } from './growth-insights-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import {
  GrowthInsightCategory,
  PostAnalyticsType,
  SocialPlatform,
} from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { TEXT_GENERATION_PROVIDER } from '../../content-generation/ai-provider/text-generation-provider.interface';

describe('GrowthInsightsEngineService', () => {
  let service: GrowthInsightsEngineService;
  let prisma: any;
  let repository: any;
  let mockTextProvider: any;

  const mockPrisma = {
    accountAnalyticsSnapshot: {
      findMany: jest.fn(),
    },
    postAnalyticsSnapshot: {
      findMany: jest.fn(),
    },
    growthInsight: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockRepo = {
    getSyncFreshness: jest.fn(),
    listGrowthInsights: jest.fn(),
    createGrowthInsight: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTextProvider = {
      providerName: 'mock',
      generateText: jest.fn().mockResolvedValue({
        rawText: JSON.stringify({
          summary: 'AI enriched summary.',
          suggestedAction: 'AI enriched action.',
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrowthInsightsEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AnalyticsRepository, useValue: mockRepo },
        { provide: TEXT_GENERATION_PROVIDER, useValue: mockTextProvider },
      ],
    }).compile();

    service = module.get<GrowthInsightsEngineService>(GrowthInsightsEngineService);
    prisma = module.get(PrismaService);
    repository = module.get(AnalyticsRepository);
  });

  describe('Rule 1: Engagement Trend (evaluateEngagementTrend)', () => {
    it('detects rising engagement with sufficient sample size and non-zero baseline', () => {
      const now = Date.now();
      const snapshots: any[] = [
        // 5 snapshots in recent 14 days
        { snapshotDate: new Date(now - 2 * 86400000), engagementTotal: 80, reach: 1000 },
        { snapshotDate: new Date(now - 4 * 86400000), engagementTotal: 75, reach: 1000 },
        { snapshotDate: new Date(now - 6 * 86400000), engagementTotal: 85, reach: 1000 },
        { snapshotDate: new Date(now - 8 * 86400000), engagementTotal: 90, reach: 1000 },
        { snapshotDate: new Date(now - 10 * 86400000), engagementTotal: 80, reach: 1000 },
        // 5 snapshots in prior 14 days (lower engagement)
        { snapshotDate: new Date(now - 16 * 86400000), engagementTotal: 50, reach: 1000 },
        { snapshotDate: new Date(now - 18 * 86400000), engagementTotal: 45, reach: 1000 },
        { snapshotDate: new Date(now - 20 * 86400000), engagementTotal: 55, reach: 1000 },
        { snapshotDate: new Date(now - 22 * 86400000), engagementTotal: 50, reach: 1000 },
        { snapshotDate: new Date(now - 24 * 86400000), engagementTotal: 50, reach: 1000 },
      ];

      const res = service.evaluateEngagementTrend(snapshots);

      expect(res.eligible).toBe(true);
      expect(res.category).toBe(GrowthInsightCategory.ENGAGEMENT);
      expect(res.insight?.title).toContain('Rising Audience Engagement');
      expect(res.insight?.evidence.percentageChange).toBeGreaterThanOrEqual(15);
      expect(res.insight?.confidenceScore).toBeGreaterThanOrEqual(0.7);
    });

    it('rejects when observation history is insufficient (< 4 days in either window)', () => {
      const now = Date.now();
      const snapshots: any[] = [
        { snapshotDate: new Date(now - 2 * 86400000), engagementTotal: 50, reach: 500 },
        { snapshotDate: new Date(now - 4 * 86400000), engagementTotal: 50, reach: 500 },
      ];

      const res = service.evaluateEngagementTrend(snapshots);

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('Insufficient observation days');
    });

    it('rejects when baseline volume is too low to avoid small-number distortion', () => {
      const now = Date.now();
      const snapshots: any[] = [
        { snapshotDate: new Date(now - 2 * 86400000), engagementTotal: 4, reach: 20 },
        { snapshotDate: new Date(now - 4 * 86400000), engagementTotal: 3, reach: 20 },
        { snapshotDate: new Date(now - 6 * 86400000), engagementTotal: 4, reach: 20 },
        { snapshotDate: new Date(now - 8 * 86400000), engagementTotal: 3, reach: 20 },
        { snapshotDate: new Date(now - 16 * 86400000), engagementTotal: 1, reach: 20 },
        { snapshotDate: new Date(now - 18 * 86400000), engagementTotal: 1, reach: 20 },
        { snapshotDate: new Date(now - 20 * 86400000), engagementTotal: 1, reach: 20 },
        { snapshotDate: new Date(now - 22 * 86400000), engagementTotal: 1, reach: 20 },
      ];

      const res = service.evaluateEngagementTrend(snapshots);

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('too low for statistically valid comparison');
    });
  });

  describe('Rule 2: Format Efficiency (evaluateFormatEfficiency)', () => {
    it('compares formats with minimum 3 samples per format and avoids single-post bias', () => {
      const posts: any[] = [
        // 3 Reels with high engagement
        { postType: PostAnalyticsType.REEL, engagementRate: 0.12, reach: 500 },
        { postType: PostAnalyticsType.REEL, engagementRate: 0.14, reach: 600 },
        { postType: PostAnalyticsType.REEL, engagementRate: 0.10, reach: 550 },
        // 3 Static Posts with lower engagement
        { postType: PostAnalyticsType.POST, engagementRate: 0.05, reach: 300 },
        { postType: PostAnalyticsType.POST, engagementRate: 0.06, reach: 320 },
        { postType: PostAnalyticsType.POST, engagementRate: 0.04, reach: 290 },
      ];

      const res = service.evaluateFormatEfficiency(posts);

      expect(res.eligible).toBe(true);
      expect(res.category).toBe(GrowthInsightCategory.CONTENT_FORMAT);
      expect(res.insight?.title).toContain('Reels Outperform Static Posts');
      expect(res.insight?.evidence.advantagePct).toBeGreaterThanOrEqual(20);
    });

    it('rejects when only 1 post exists in a format (preventing single anomalous post bias)', () => {
      const posts: any[] = [
        // 1 viral Reel
        { postType: PostAnalyticsType.REEL, engagementRate: 0.35, reach: 5000 },
        // 3 Static posts
        { postType: PostAnalyticsType.POST, engagementRate: 0.04, reach: 300 },
        { postType: PostAnalyticsType.POST, engagementRate: 0.05, reach: 300 },
        { postType: PostAnalyticsType.POST, engagementRate: 0.04, reach: 300 },
      ];

      const res = service.evaluateFormatEfficiency(posts);

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('at least 3 published posts each');
    });
  });

  describe('Rule 3: Optimal Timing (evaluateOptimalTiming)', () => {
    it('analyzes time windows with correlational framing when sample size >= 8 posts', () => {
      const now = Date.now();
      const posts: any[] = [
        // 4 Afternoon posts (14:00 UTC) with high interactions
        { publishedAt: new Date(now - 2 * 86400000 - 14 * 3600000), likesCount: 50, commentsCount: 15, sharesCount: 5, savesCount: 5 },
        { publishedAt: new Date(now - 4 * 86400000 - 14 * 3600000), likesCount: 45, commentsCount: 20, sharesCount: 5, savesCount: 5 },
        { publishedAt: new Date(now - 6 * 86400000 - 15 * 3600000), likesCount: 55, commentsCount: 10, sharesCount: 5, savesCount: 5 },
        { publishedAt: new Date(now - 8 * 86400000 - 16 * 3600000), likesCount: 60, commentsCount: 15, sharesCount: 5, savesCount: 5 },
        // 4 Morning posts (08:00 UTC) with lower interactions
        { publishedAt: new Date(now - 3 * 86400000 - 8 * 3600000), likesCount: 15, commentsCount: 5, sharesCount: 1, savesCount: 1 },
        { publishedAt: new Date(now - 5 * 86400000 - 8 * 3600000), likesCount: 18, commentsCount: 4, sharesCount: 1, savesCount: 1 },
        { publishedAt: new Date(now - 7 * 86400000 - 9 * 3600000), likesCount: 12, commentsCount: 3, sharesCount: 1, savesCount: 1 },
        { publishedAt: new Date(now - 9 * 86400000 - 9 * 3600000), likesCount: 15, commentsCount: 3, sharesCount: 1, savesCount: 1 },
      ];

      const res = service.evaluateOptimalTiming(posts);

      expect(res.eligible).toBe(true);
      expect(res.category).toBe(GrowthInsightCategory.TIMING);
      expect(res.insight?.title).toContain('Afternoon (12 PM - 6 PM)');
      expect(res.insight?.evidence.isCorrelational).toBe(true); // Non-causal
    });

    it('rejects when published post sample is below 8 posts', () => {
      const posts: any[] = [
        { publishedAt: new Date(), likesCount: 50, commentsCount: 10, sharesCount: 2, savesCount: 2 },
      ];

      const res = service.evaluateOptimalTiming(posts);

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('minimum 8 required');
    });
  });

  describe('Rule 4: Topic Resonance (evaluateTopicResonance)', () => {
    it('identifies hashtag resonance when hashtag appears in at least 3 posts', () => {
      const posts: any[] = [
        // 3 posts with #festivedeals and high engagement
        { engagementRate: 0.16, reach: 400, rawMetrics: { caption: 'Check out our #festivedeals today!' } },
        { engagementRate: 0.18, reach: 450, rawMetrics: { caption: 'Exclusive #festivedeals for loyal fans' } },
        { engagementRate: 0.14, reach: 420, rawMetrics: { caption: 'Final hours of #festivedeals' } },
        // 3 untagged posts with lower engagement
        { engagementRate: 0.05, reach: 250, rawMetrics: { caption: 'General office update' } },
        { engagementRate: 0.06, reach: 260, rawMetrics: { caption: 'Behind the scenes' } },
        { engagementRate: 0.04, reach: 240, rawMetrics: { caption: 'Weekly newsletter' } },
      ];

      const res = service.evaluateTopicResonance(posts);

      expect(res.eligible).toBe(true);
      expect(res.category).toBe(GrowthInsightCategory.TOPIC_AUDIENCE);
      expect(res.insight?.evidence.hashtag).toBe('#festivedeals');
      expect(res.insight?.evidence.taggedPostCount).toBe(3);
    });

    it('rejects when no hashtag appears in at least 3 distinct posts', () => {
      const posts: any[] = [
        { engagementRate: 0.12, rawMetrics: { caption: 'Only one post has #unique' } },
        { engagementRate: 0.05, rawMetrics: { caption: 'Post two' } },
        { engagementRate: 0.04, rawMetrics: { caption: 'Post three' } },
        { engagementRate: 0.06, rawMetrics: { caption: 'Post four' } },
        { engagementRate: 0.05, rawMetrics: { caption: 'Post five' } },
      ];

      const res = service.evaluateTopicResonance(posts);

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('No recurring hashtag found in at least 3 posts');
    });
  });

  describe('Rule 5: Cadence & Consistency (evaluateCadenceAndConsistency)', () => {
    it('detects inactivity gap when last post was >= 7 days ago', () => {
      const now = Date.now();
      const posts: any[] = [
        { publishedAt: new Date(now - 9 * 86400000) }, // 9 days ago
      ];

      const res = service.evaluateCadenceAndConsistency(posts, []);

      expect(res.eligible).toBe(true);
      expect(res.category).toBe(GrowthInsightCategory.CONSISTENCY);
      expect(res.insight?.title).toContain('Publishing Inactivity Detected (9-Day Gap)');
      expect(res.insight?.evidence.daysSinceLastPost).toBe(9);
    });

    it('detects consistent cadence reach growth over 3+ weeks', () => {
      const now = Date.now();
      // 9 posts in last 21 days (3 posts/week)
      const posts: any[] = Array.from({ length: 9 }).map((_, idx) => ({
        publishedAt: new Date(now - (idx * 2 + 1) * 86400000),
      }));

      // Account snapshots showing reach growth
      const accountSnapshots: any[] = [
        // Recent 14 days (higher reach)
        { snapshotDate: new Date(now - 3 * 86400000), reach: 500 },
        { snapshotDate: new Date(now - 7 * 86400000), reach: 600 },
        // Prior 14 days (lower reach)
        { snapshotDate: new Date(now - 18 * 86400000), reach: 200 },
        { snapshotDate: new Date(now - 22 * 86400000), reach: 200 },
      ];

      const res = service.evaluateCadenceAndConsistency(posts, accountSnapshots);

      expect(res.eligible).toBe(true);
      expect(res.insight?.title).toContain('Consistent Cadence Correlates with Reach Growth');
      expect(res.insight?.evidence.isCorrelational).toBe(true);
    });
  });

  describe('Engine Lifecycle & Deduplication (generateInsights)', () => {
    it('skips duplicate active insights created within the last 7 days', async () => {
      mockRepo.getSyncFreshness.mockResolvedValue({
        hasActivePermissionErrors: false,
        lastSuccessfulSyncAt: new Date(),
      });
      mockPrisma.accountAnalyticsSnapshot.findMany.mockResolvedValue([]);
      mockPrisma.postAnalyticsSnapshot.findMany.mockResolvedValue([
        { publishedAt: new Date(Date.now() - 10 * 86400000) }, // 10-day gap
      ]);

      // Active insight already exists from 2 days ago
      mockPrisma.growthInsight.findMany.mockResolvedValueOnce([
        {
          id: 'existing-gap',
          category: GrowthInsightCategory.CONSISTENCY,
          createdAt: new Date(Date.now() - 2 * 86400000),
          evidence: { ruleId: 'CONSISTENCY_INACTIVITY_GAP' },
        },
      ]);
      // Recently dismissed
      mockPrisma.growthInsight.findMany.mockResolvedValueOnce([]);

      mockRepo.listGrowthInsights.mockResolvedValue([{ id: 'existing-gap' }]);

      const report = await service.generateInsights('ws-1', { force: true });

      expect(report.generatedCount).toBe(0);
      expect(mockRepo.createGrowthInsight).not.toHaveBeenCalled();
    });

    it('respects user dismissal choice and suppresses rule for 14 days', async () => {
      mockRepo.getSyncFreshness.mockResolvedValue({
        hasActivePermissionErrors: false,
        lastSuccessfulSyncAt: new Date(),
      });
      mockPrisma.accountAnalyticsSnapshot.findMany.mockResolvedValue([]);
      mockPrisma.postAnalyticsSnapshot.findMany.mockResolvedValue([
        { publishedAt: new Date(Date.now() - 10 * 86400000) },
      ]);

      mockPrisma.growthInsight.findMany
        .mockResolvedValueOnce([]) // No active
        .mockResolvedValueOnce([
          // Recently dismissed by user 3 days ago!
          {
            id: 'dismissed-gap',
            category: GrowthInsightCategory.CONSISTENCY,
            dismissedAt: new Date(Date.now() - 3 * 86400000),
            evidence: { ruleId: 'CONSISTENCY_INACTIVITY_GAP' },
          },
        ]);

      mockRepo.listGrowthInsights.mockResolvedValue([]);

      const report = await service.generateInsights('ws-1', { force: true });

      expect(report.generatedCount).toBe(0);
      expect(mockRepo.createGrowthInsight).not.toHaveBeenCalled();
    });

    it('rejects concurrent executions on the same workspace with ConflictException', async () => {
      // Simulate lock
      (service as any).activeLocks.add('ws-busy');

      await expect(
        service.generateInsights('ws-busy', { force: true }),
      ).rejects.toThrow(ConflictException);

      (service as any).activeLocks.delete('ws-busy');
    });

    it('throttles generation runs made within 5 minutes unless force is true', async () => {
      (service as any).lastRunTimestamps.set('ws-throttled', Date.now() - 2 * 60 * 1000); // 2m ago

      await expect(
        service.generateInsights('ws-throttled', { force: false }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
