import { Test, TestingModule } from '@nestjs/testing';
import { BulkScheduleService } from './bulk-schedule.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WorkspaceRole,
  DraftStatus,
  SocialConnectionStatus,
  ScheduledPostStatus,
  PublishTargetStatus,
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
} from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('BulkScheduleService', () => {
  let service: BulkScheduleService;
  let prisma: any;

  const mockWorkspaceId = 'ws-bulk-123';
  const mockUserId = 'user-bulk-456';
  const mockFbAccountId = 'acc-fb-001';
  const mockTwAccountId = 'acc-tw-002';
  const mockLiAccountId = 'acc-li-003';

  const mockConnectedAccounts = [
    {
      id: mockFbAccountId,
      workspaceId: mockWorkspaceId,
      provider: SocialProvider.META_FACEBOOK,
      accountType: SocialAccountType.FACEBOOK_PAGE,
      accountName: 'Acme Facebook Page',
      accountUsername: 'acme_fb',
      connectionStatus: SocialConnectionStatus.CONNECTED,
    },
    {
      id: mockTwAccountId,
      workspaceId: mockWorkspaceId,
      provider: SocialProvider.TWITTER_X,
      accountType: SocialAccountType.TWITTER_PROFILE,
      accountName: 'Acme Official X',
      accountUsername: 'acme_hq',
      connectionStatus: SocialConnectionStatus.CONNECTED,
    },
    {
      id: mockLiAccountId,
      workspaceId: mockWorkspaceId,
      provider: SocialProvider.LINKEDIN,
      accountType: SocialAccountType.LINKEDIN_PAGE,
      accountName: 'Acme Corp LinkedIn',
      accountUsername: 'acme-corp',
      connectionStatus: SocialConnectionStatus.CONNECTED,
    },
  ];

  beforeEach(async () => {
    prisma = {
      socialAccount: {
        findMany: jest.fn().mockResolvedValue(mockConnectedAccounts),
      },
      contentDraft: {
        create: jest.fn().mockImplementation((args: any) =>
          Promise.resolve({
            id: 'draft-gen-123',
            workspaceId: args.data.workspaceId,
            title: args.data.title,
            objective: args.data.objective,
            contentType: args.data.contentType,
            status: args.data.status,
            approvedAt: args.data.approvedAt,
            approvedByUserId: args.data.approvedByUserId,
            variants: (args.data.variants.create || []).map((v: any, idx: number) => ({
              id: `variant-${idx + 1}`,
              platform: v.platform,
              body: v.body,
              hashtags: v.hashtags || [],
              mediaAssetUrl: v.mediaAssetUrl || null,
            })),
          }),
        ),
      },
      scheduledPost: {
        create: jest.fn().mockImplementation((args: any) =>
          Promise.resolve({
            id: 'sched-gen-999',
            workspaceId: args.data.workspaceId,
            draftId: args.data.draftId,
            scheduledAt: args.data.scheduledAt,
            timezone: args.data.timezone,
            status: args.data.status,
            snapshotHash: args.data.snapshotHash,
            targets: (args.data.targets.create || []).map((t: any, idx: number) => ({
              id: `target-${idx + 1}`,
              socialAccountId: t.socialAccountId,
              platform: t.platform,
              status: t.status,
            })),
          }),
        ),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-log-123' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkScheduleService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BulkScheduleService>(BulkScheduleService);
  });

  describe('generateCsvTemplate', () => {
    it('should generate RFC 4180 CSV template with expected headers and sample rows', () => {
      const template = service.generateCsvTemplate();
      expect(template).toBeDefined();
      expect(template).toContain('Scheduled Date');
      expect(template).toContain('Caption');
      expect(template).toContain('Platforms');
      expect(template).toContain('Product Launch Teaser');
      const lines = template.split('\r\n');
      expect(lines.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateBulkSchedule', () => {
    it('should throw BadRequestException if CSV content is empty', async () => {
      await expect(service.validateBulkSchedule(mockWorkspaceId, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if CSV lacks required headers', async () => {
      const invalidCsv = 'Title,UnknownCol\n"My Title","Value"';
      await expect(
        service.validateBulkSchedule(mockWorkspaceId, invalidCsv),
      ).rejects.toThrow('Missing required column');
    });

    it('should validate valid CSV rows successfully', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const csv = `Scheduled Date,Timezone,Title,Caption,Platforms,Accounts,Media URLs,Hashtags
"${futureDate}","UTC","Big Announcement","We are launching our revolutionary new feature!","FACEBOOK,TWITTER_X","acme_fb,acme_hq","https://example.com/image.png","#Launch #SaaS"`;

      const result = await service.validateBulkSchedule(mockWorkspaceId, csv);

      expect(result.totalRows).toBe(1);
      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(0);
      expect(result.rows[0].isValid).toBe(true);
      expect(result.rows[0].errors).toHaveLength(0);
      expect(result.rows[0].data.platforms).toContain(SocialPlatform.FACEBOOK);
      expect(result.rows[0].data.platforms).toContain(SocialPlatform.TWITTER_X);
      expect(result.rows[0].data.socialAccountIds).toContain(mockFbAccountId);
      expect(result.rows[0].data.socialAccountIds).toContain(mockTwAccountId);
    });

    it('should catch past dates and Twitter 280 character limit violations', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const longTwitterText = 'A'.repeat(290);
      const csv = `Scheduled Date,Caption,Platforms
"${pastDate}","${longTwitterText}","TWITTER_X"`;

      const result = await service.validateBulkSchedule(mockWorkspaceId, csv);

      expect(result.totalRows).toBe(1);
      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(1);
      const row = result.rows[0];
      expect(row.isValid).toBe(false);
      expect(row.errors.some((e) => e.includes('future'))).toBe(true);
      expect(row.errors.some((e) => e.includes('280 characters'))).toBe(true);
    });

    it('should catch missing or invalid social accounts', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const csv = `Scheduled Date,Caption,Platforms,Accounts
"${futureDate}","Hello World","FACEBOOK","non_existent_account"`;

      const result = await service.validateBulkSchedule(mockWorkspaceId, csv);

      expect(result.validCount).toBe(0);
      expect(result.rows[0].errors.some((e) => e.includes('not found'))).toBe(true);
    });

    it('should auto-map connected accounts if Accounts column is blank', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const csv = `Scheduled Date,Caption,Platforms,Accounts
"${futureDate}","Auto-mapped post","LINKEDIN",""`;

      const result = await service.validateBulkSchedule(mockWorkspaceId, csv);

      expect(result.validCount).toBe(1);
      expect(result.rows[0].data.socialAccountIds).toContain(mockLiAccountId);
    });
  });

  describe('importBulkSchedule', () => {
    it('should reject viewer role from importing posts', async () => {
      await expect(
        service.importBulkSchedule(mockWorkspaceId, mockUserId, WorkspaceRole.VIEWER, []),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should commit valid rows into drafts and scheduled posts with targets', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const rows = [
        {
          rowNumber: 2,
          scheduledAt: futureDate,
          timezone: 'UTC',
          title: 'Batch Imported Post',
          caption: 'Great news for our community!',
          platforms: [SocialPlatform.FACEBOOK],
          socialAccountIds: [mockFbAccountId],
          hashtags: ['#Community'],
          mediaUrls: ['https://example.com/pic.jpg'],
        },
      ];

      const response = await service.importBulkSchedule(
        mockWorkspaceId,
        mockUserId,
        WorkspaceRole.ADMIN,
        rows as any,
      );

      expect(response.importedCount).toBe(1);
      expect(response.failedCount).toBe(0);
      expect(response.scheduledPosts).toHaveLength(1);
      expect(prisma.contentDraft.create).toHaveBeenCalled();
      expect(prisma.scheduledPost.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
