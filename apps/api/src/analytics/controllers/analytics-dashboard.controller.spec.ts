import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsDashboardController } from './analytics-dashboard.controller';
import { AnalyticsDataService } from '../services/analytics-data.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialPlatform } from '@prisma/client';

import { GrowthInsightsEngineService } from '../services/growth-insights-engine.service';

describe('AnalyticsDashboardController', () => {
  let controller: AnalyticsDashboardController;
  let service: any;
  let engine: any;

  const mockAnalyticsDataService = {
    getOverview: jest.fn(),
    getTimeseries: jest.fn(),
    getDashboardPosts: jest.fn(),
    getTopPerforming: jest.fn(),
    listGrowthInsights: jest.fn(),
    dismissGrowthInsight: jest.fn(),
  };

  const mockGrowthInsightsEngine = {
    generateInsights: jest.fn(),
  };

  const mockPrismaService = {
    workspaceMember: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsDashboardController],
      providers: [
        {
          provide: AnalyticsDataService,
          useValue: mockAnalyticsDataService,
        },
        {
          provide: GrowthInsightsEngineService,
          useValue: mockGrowthInsightsEngine,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsDashboardController>(AnalyticsDashboardController);
    service = module.get(AnalyticsDataService);
    engine = module.get(GrowthInsightsEngineService);
  });

  describe('getOverview', () => {
    it('returns overview data from service wrapped in success envelope', async () => {
      mockAnalyticsDataService.getOverview.mockResolvedValueOnce({
        metrics: {
          totalFollowers: { value: 1500, previousValue: 1200, percentageChange: 25 },
        },
      });

      const res = await controller.getOverview('ws-1', {
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-07T00:00:00Z',
      });

      expect(res.success).toBe(true);
      expect(res.data.metrics.totalFollowers.value).toBe(1500);
      expect(service.getOverview).toHaveBeenCalledWith('ws-1', {
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-07T00:00:00Z',
      });
    });
  });

  describe('getTimeseries', () => {
    it('returns timeseries points from service', async () => {
      mockAnalyticsDataService.getTimeseries.mockResolvedValueOnce({
        dataPoints: [{ date: '2026-10-01', impressions: 50 }],
      });

      const res = await controller.getTimeseries('ws-1', {
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-02T00:00:00Z',
      });

      expect(res.success).toBe(true);
      expect(res.data.dataPoints).toHaveLength(1);
    });
  });

  describe('getDashboardPosts', () => {
    it('returns paginated items and metadata envelope', async () => {
      mockAnalyticsDataService.getDashboardPosts.mockResolvedValueOnce({
        items: [{ id: 'p-1', externalPostId: 'fb-1' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const res = await controller.getDashboardPosts('ws-1', {
        page: 1,
        limit: 10,
      });

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.pagination.total).toBe(1);
    });
  });

  describe('getTopPerforming', () => {
    it('returns ranked posts list', async () => {
      mockAnalyticsDataService.getTopPerforming.mockResolvedValueOnce({
        rankingMetric: 'engagementRate',
        items: [{ id: 'p-1', metricValue: 0.15 }],
      });

      const res = await controller.getTopPerforming('ws-1', {
        metric: 'engagementRate',
      });

      expect(res.success).toBe(true);
      expect(res.data.items).toHaveLength(1);
    });
  });

  describe('insights', () => {
    it('lists growth insights', async () => {
      mockAnalyticsDataService.listGrowthInsights.mockResolvedValueOnce([
        { id: 'ins-1', title: 'Optimal Post Time' },
      ]);

      const res = await controller.listInsights('ws-1');

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
    });

    it('dismisses growth insight with current user ID', async () => {
      mockAnalyticsDataService.dismissGrowthInsight.mockResolvedValueOnce({
        id: 'ins-1',
        dismissedById: 'user-1',
      });

      const res = await controller.dismissInsight(
        'ws-1',
        'ins-1',
        { id: 'user-1' } as any,
      );

      expect(res.success).toBe(true);
      expect(res.message).toBe('Growth insight successfully dismissed');
      expect(service.dismissGrowthInsight).toHaveBeenCalledWith('ws-1', 'ins-1', 'user-1');
    });

    it('triggers deterministic insight generation via generateInsights', async () => {
      mockGrowthInsightsEngine.generateInsights.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        generatedCount: 2,
        skippedCount: 3,
        results: [],
      });

      const res = await controller.generateInsights(
        'ws-1',
        { force: true, useAiEnrichment: false },
        { workspaceMember: { role: 'ADMIN' } },
      );

      expect(res.success).toBe(true);
      expect(res.message).toContain('Evaluated 5 growth insight rules');
      expect(engine.generateInsights).toHaveBeenCalledWith('ws-1', {
        force: true,
        useAiEnrichment: false,
      });
    });
  });
});
