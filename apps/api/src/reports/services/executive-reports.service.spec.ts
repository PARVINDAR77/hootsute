import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveReportsService } from './executive-reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ReportFrequency } from '@packages/shared';

describe('ExecutiveReportsService', () => {
  let service: ExecutiveReportsService;
  let prisma: any;

  const mockWorkspaceId = 'ws-rep-111';
  const mockUserId = 'usr-rep-222';
  const mockScheduleId = 'sch-rep-333';
  const mockReportId = 'gen-rep-444';

  const mockSchedule = {
    id: mockScheduleId,
    workspaceId: mockWorkspaceId,
    createdById: mockUserId,
    name: 'Weekly Exec Brief',
    frequency: 'WEEKLY',
    recipients: ['exec@brand.com'],
    includeSocial: true,
    includeLinks: true,
    includeListening: true,
    isActive: true,
    lastRunAt: null,
    nextRunAt: new Date('2026-06-08T00:00:00Z'),
    createdAt: new Date('2026-06-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
  };

  const mockGeneratedReport = {
    id: mockReportId,
    workspaceId: mockWorkspaceId,
    scheduleId: mockScheduleId,
    title: 'Brand Weekly Executive Review',
    frequency: 'WEEKLY',
    periodStart: new Date('2026-05-25T00:00:00Z'),
    periodEnd: new Date('2026-06-01T00:00:00Z'),
    metricsSummary: {
      totalImpressions: 50000,
      totalReach: 32000,
      netFollowerGrowth: 450,
      totalLinkClicks: 1200,
      totalListeningMentions: 85,
      sentimentBreakdown: { positive: 60, neutral: 20, negative: 5 },
      topPosts: [],
    },
    htmlContent: '<html><body>Mock Executive Report</body></html>',
    pdfStorageUrl: null,
    recipientsSent: ['exec@brand.com'],
    sentAt: new Date('2026-06-01T00:05:00Z'),
    status: 'READY',
    createdAt: new Date('2026-06-01T00:05:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      workspace: {
        findUnique: jest.fn(),
      },
      executiveReportSchedule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      generatedExecutiveReport: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      accountAnalyticsSnapshot: {
        findMany: jest.fn().mockResolvedValue([
          { impressions: 25000, reach: 16000, followersNetChange: 220 },
          { impressions: 25000, reach: 16000, followersNetChange: 230 },
        ]),
      },
      postAnalyticsSnapshot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'snap-1',
            externalPostId: 'ext-post-1',
            scheduledPostTarget: {
              scheduledPostId: 'post-1',
              scheduledPost: {
                contentSnapshot: { baseText: 'Big announcement upcoming!' },
                draft: { title: 'Product Launch' },
              },
            },
            platform: 'TWITTER_X',
            impressions: 12000,
            likesCount: 500,
            commentsCount: 200,
            sharesCount: 140,
          },
        ]),
      },
      linkClickEvent: {
        count: jest.fn().mockResolvedValue(1200),
      },
      listeningMention: {
        findMany: jest.fn().mockResolvedValue([
          { sentiment: 'POSITIVE' },
          { sentiment: 'POSITIVE' },
          { sentiment: 'NEUTRAL' },
          { sentiment: 'NEGATIVE' },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutiveReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ExecutiveReportsService>(ExecutiveReportsService);
  });

  describe('createSchedule', () => {
    it('creates an automated report schedule and returns DTO', async () => {
      prisma.executiveReportSchedule.create.mockResolvedValue(mockSchedule);

      const result = await service.createSchedule(mockWorkspaceId, mockUserId, {
        name: 'Weekly Exec Brief',
        frequency: ReportFrequency.WEEKLY,
        recipients: ['exec@brand.com'],
      });

      expect(prisma.executiveReportSchedule.create).toHaveBeenCalled();
      expect(result.name).toBe('Weekly Exec Brief');
      expect(result.frequency).toBe(ReportFrequency.WEEKLY);
      expect(result.recipients).toEqual(['exec@brand.com']);
    });
  });

  describe('getSchedules', () => {
    it('returns all report schedules for workspace', async () => {
      prisma.executiveReportSchedule.findMany.mockResolvedValue([mockSchedule]);

      const result = await service.getSchedules(mockWorkspaceId);

      expect(prisma.executiveReportSchedule.findMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockScheduleId);
    });
  });

  describe('generateReport', () => {
    it('synthesizes social, links, and listening metrics into HTML report', async () => {
      prisma.workspace.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        name: 'Apex Brands',
        logoUrl: 'https://apex.com/logo.png',
        whiteLabelConfig: {
          brandName: 'Apex Brands Agency',
          primaryColor: '#6366f1',
          secondaryColor: '#4f46e5',
          accentColor: '#06b6d4',
          hidePoweredBy: true,
        },
      });

      prisma.generatedExecutiveReport.create.mockImplementation((args: any) =>
        Promise.resolve({
          id: mockReportId,
          ...args.data,
          createdAt: new Date(),
        }),
      );

      const result = await service.generateReport(mockWorkspaceId, {
        title: 'Monthly Omnichannel Review',
        periodDays: 30,
        recipients: ['cmo@apex.com'],
      });

      expect(prisma.accountAnalyticsSnapshot.findMany).toHaveBeenCalled();
      expect(prisma.linkClickEvent.count).toHaveBeenCalled();
      expect(prisma.listeningMention.findMany).toHaveBeenCalled();
      expect(prisma.generatedExecutiveReport.create).toHaveBeenCalled();
      expect(result.title).toBe('Monthly Omnichannel Review');
      expect(result.metricsSummary.totalImpressions).toBe(50000);
      expect(result.metricsSummary.totalReach).toBe(32000);
      expect(result.metricsSummary.netFollowerGrowth).toBe(450);
      expect(result.metricsSummary.totalLinkClicks).toBe(1200);
      expect(result.metricsSummary.sentimentBreakdown.positive).toBe(2);
      expect(result.htmlContent).toContain('Apex Brands Agency');
      expect(result.htmlContent).toContain('Impressions');
      expect(result.htmlContent).toContain('Brand Sentiment &amp; Voice Monitoring'.replace('&amp;', '&'));
    });

    it('throws NotFoundException if workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.generateReport('non-existent', { periodDays: 7 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGeneratedReports', () => {
    it('lists generated reports for the workspace', async () => {
      prisma.generatedExecutiveReport.findMany.mockResolvedValue([mockGeneratedReport]);

      const result = await service.getGeneratedReports(mockWorkspaceId);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockReportId);
      expect(result[0].status).toBe('READY');
    });
  });

  describe('getGeneratedReportById', () => {
    it('throws NotFoundException if report not found', async () => {
      prisma.generatedExecutiveReport.findFirst.mockResolvedValue(null);

      await expect(
        service.getGeneratedReportById(mockWorkspaceId, 'fake-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
