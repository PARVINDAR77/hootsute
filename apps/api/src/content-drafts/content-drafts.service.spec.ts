import { Test, TestingModule } from '@nestjs/testing';
import { ContentDraftsService } from './content-drafts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromptSynthesisService } from '../content-generation/prompt-synthesis/prompt-synthesis.service';
import { BrandProfileService } from '../brand-profile/brand-profile.service';
import { TEXT_GENERATION_PROVIDER } from '../content-generation/ai-provider/text-generation-provider.interface';
import { IMAGE_GENERATION_PROVIDER } from '../content-generation/ai-provider/image-generation-provider.interface';
import { MockTextProvider } from '../content-generation/ai-provider/mock-text.provider';
import { MockImageProvider } from '../content-generation/ai-provider/mock-image.provider';
import {
  DraftStatus,
  CampaignObjective,
  ContentType,
  SocialPlatform,
  WorkspaceRole,
} from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('ContentDraftsService', () => {
  let service: ContentDraftsService;
  let prisma: any;
  let mockTextProvider: MockTextProvider;
  let mockImageProvider: MockImageProvider;

  const mockPrisma = {
    contentDraft: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contentVariant: {
      create: jest.fn(),
      update: jest.fn(),
    },
    contentRevision: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockBrandProfileService = {
    getBrandProfile: jest.fn().mockResolvedValue({
      businessName: 'Ethnic Studio',
      preferredLanguage: 'en',
      primaryColor: '#2E5BFF',
      secondaryColor: '#FF6B6B',
    }),
  };

  beforeEach(async () => {
    mockTextProvider = new MockTextProvider();
    mockImageProvider = new MockImageProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentDraftsService,
        PromptSynthesisService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BrandProfileService, useValue: mockBrandProfileService },
        { provide: TEXT_GENERATION_PROVIDER, useValue: mockTextProvider },
        { provide: IMAGE_GENERATION_PROVIDER, useValue: mockImageProvider },
      ],
    }).compile();

    service = module.get<ContentDraftsService>(ContentDraftsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDraft', () => {
    it('should create draft, variants, initial revision and audit log within transaction', async () => {
      const mockCreatedDraft = {
        id: 'draft-1',
        workspaceId: 'ws-1',
        title: 'Diwali Campaign',
        status: DraftStatus.DRAFT,
        variants: [
          {
            id: 'var-1',
            platform: SocialPlatform.INSTAGRAM,
            body: 'Celebrate with elegance',
            hashtags: ['#Diwali'],
          },
        ],
      };

      mockPrisma.contentDraft.create.mockResolvedValue(mockCreatedDraft);
      mockPrisma.contentRevision.create.mockResolvedValue({ id: 'rev-1' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.createDraft('ws-1', 'user-1', {
        title: 'Diwali Campaign',
        objective: CampaignObjective.FESTIVAL_WISHES,
        variants: [
          {
            platform: SocialPlatform.INSTAGRAM,
            body: 'Celebrate with elegance',
            hashtags: ['#Diwali'],
          },
        ],
      });

      expect(result).toEqual(mockCreatedDraft);
      expect(mockPrisma.contentDraft.create).toHaveBeenCalled();
      expect(mockPrisma.contentRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftId: 'draft-1',
            revisionNumber: 1,
            action: 'INITIAL_CREATION',
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CONTENT_DRAFT_CREATE',
            workspaceId: 'ws-1',
          }),
        }),
      );
    });
  });

  describe('getDraft & Cross-Workspace IDOR Defense', () => {
    it('should return draft when workspaceId matches', async () => {
      const draft = { id: 'draft-1', workspaceId: 'ws-1', title: 'Test' };
      mockPrisma.contentDraft.findUnique.mockResolvedValue(draft);

      const result = await service.getDraft('ws-1', 'draft-1');
      expect(result).toEqual(draft);
    });

    it('should throw NotFoundException if draft belongs to another workspace (IDOR defense)', async () => {
      const draft = { id: 'draft-1', workspaceId: 'ws-other', title: 'Test' };
      mockPrisma.contentDraft.findUnique.mockResolvedValue(draft);

      await expect(service.getDraft('ws-1', 'draft-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDraft', () => {
    it('should block modification if draft is already APPROVED', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.APPROVED,
        variants: [],
      });

      await expect(
        service.updateDraft('ws-1', 'draft-1', 'user-1', { title: 'New Title' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset REJECTED draft to DRAFT on edit and increment revision', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.REJECTED,
        rejectionReason: 'Needs work',
        variants: [],
      });
      mockPrisma.contentDraft.update.mockResolvedValue({
        id: 'draft-1',
        title: 'Fixed Title',
        status: DraftStatus.DRAFT,
      });
      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 2 });
      mockPrisma.contentRevision.create.mockResolvedValue({ id: 'rev-3' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-2' });

      await service.updateDraft('ws-1', 'draft-1', 'user-1', { title: 'Fixed Title' });

      expect(mockPrisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Fixed Title',
            status: DraftStatus.DRAFT,
            rejectionReason: null,
          }),
        }),
      );
      expect(mockPrisma.contentRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            revisionNumber: 3,
            action: 'REOPEN_AFTER_REJECTION',
          }),
        }),
      );
    });
  });

  describe('duplicateDraft', () => {
    it('should clone draft and all its platform variants into a new DRAFT', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        title: 'Original Promo',
        objective: CampaignObjective.SALES_LEADS,
        contentType: ContentType.POST,
        language: 'en',
        variants: [
          {
            platform: SocialPlatform.LINKEDIN,
            body: 'Original LinkedIn copy',
            hashtags: ['#B2B'],
          },
        ],
      });

      const cloned = {
        id: 'draft-copy-1',
        title: 'Original Promo (Copy)',
        status: DraftStatus.DRAFT,
        variants: [{ id: 'var-copy-1' }],
      };
      mockPrisma.contentDraft.create.mockResolvedValue(cloned);
      mockPrisma.contentRevision.create.mockResolvedValue({ id: 'rev-1' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.duplicateDraft('ws-1', 'draft-1', 'user-2');
      expect(result.title).toBe('Original Promo (Copy)');
      expect(mockPrisma.contentDraft.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Original Promo (Copy)',
            status: DraftStatus.DRAFT,
            createdByUserId: 'user-2',
          }),
        }),
      );
    });
  });

  describe('deleteDraft', () => {
    it('should prevent ordinary editors from deleting approved drafts', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.APPROVED,
        createdByUserId: 'user-1',
      });

      await expect(
        service.deleteDraft('ws-1', 'draft-1', WorkspaceRole.EDITOR, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to delete draft', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.DRAFT,
        createdByUserId: 'user-other',
      });
      mockPrisma.contentDraft.delete.mockResolvedValue({ id: 'draft-1' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.deleteDraft('ws-1', 'draft-1', WorkspaceRole.ADMIN, 'admin-user');
      expect(result.success).toBe(true);
      expect(mockPrisma.contentDraft.delete).toHaveBeenCalledWith({ where: { id: 'draft-1' } });
    });
  });

  describe('regenerateVariant (Targeted Field Preservation)', () => {
    it('should preserve unrelated fields when regenerating only the headline', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.DRAFT,
        language: 'en',
        variants: [
          {
            id: 'var-1',
            draftId: 'draft-1',
            platform: SocialPlatform.INSTAGRAM,
            headline: 'Old Headline',
            body: 'Preserved Body Text That Must Not Change',
            callToAction: 'Preserved CTA',
            hashtags: ['#KeepMe'],
            mediaBrief: 'Preserved Brief',
          },
        ],
      });

      mockTextProvider.customHeadline = 'New Vibrant Headline';
      mockPrisma.contentVariant.update.mockResolvedValue({
        id: 'var-1',
        headline: 'New Vibrant Headline',
        body: 'Preserved Body Text That Must Not Change',
        callToAction: 'Preserved CTA',
        hashtags: ['#KeepMe'],
      });
      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 1 });
      mockPrisma.contentRevision.create.mockResolvedValue({ id: 'rev-2' });

      await service.regenerateVariant('ws-1', 'draft-1', 'var-1', 'user-1', {
        field: 'headline',
      });

      // Verify that update was called with new headline while body and CTA were NOT overwritten
      expect(mockPrisma.contentVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'var-1' },
          data: {
            headline: 'New Vibrant Headline',
          },
        }),
      );

      // Verify revision creation
      expect(mockPrisma.contentRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            revisionNumber: 2,
            action: 'TARGETED_REGENERATION',
            variantId: 'var-1',
          }),
        }),
      );
    });
  });

  describe('Approval Workflow', () => {
    it('submitReview: should transition DRAFT to IN_REVIEW', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.DRAFT,
        variants: [{ id: 'var-1' }],
      });
      mockPrisma.contentDraft.update.mockResolvedValue({
        id: 'draft-1',
        status: DraftStatus.IN_REVIEW,
      });
      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 1 });
      mockPrisma.contentRevision.create.mockResolvedValue({ id: 'rev-2' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.submitReview('ws-1', 'draft-1', 'editor-user');
      expect(result.status).toBe(DraftStatus.IN_REVIEW);
      expect(mockPrisma.contentRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SUBMIT_FOR_REVIEW',
          }),
        }),
      );
    });

    it('approveDraft: should reject approval by EDITOR', async () => {
      await expect(
        service.approveDraft('ws-1', 'draft-1', 'editor-1', WorkspaceRole.EDITOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('approveDraft: should reject approval if draft is not in IN_REVIEW status', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.DRAFT,
        variants: [{ id: 'var-1' }],
      });

      await expect(
        service.approveDraft('ws-1', 'draft-1', 'admin-1', WorkspaceRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('approveDraft: should transition IN_REVIEW to APPROVED for ADMIN', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.IN_REVIEW,
        variants: [{ id: 'var-1' }],
      });
      mockPrisma.contentDraft.update.mockResolvedValue({
        id: 'draft-1',
        status: DraftStatus.APPROVED,
      });
      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 2 });
      mockPrisma.contentRevision.create.mockResolvedValue({ id: 'rev-3' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.approveDraft('ws-1', 'draft-1', 'admin-1', WorkspaceRole.ADMIN);
      expect(result.status).toBe(DraftStatus.APPROVED);
      expect(mockPrisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DraftStatus.APPROVED,
            approvedByUserId: 'admin-1',
          }),
        }),
      );
    });

    it('rejectDraft: should transition IN_REVIEW to REJECTED with mandatory reason', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.IN_REVIEW,
        variants: [{ id: 'var-1' }],
      });
      mockPrisma.contentDraft.update.mockResolvedValue({
        id: 'draft-1',
        status: DraftStatus.REJECTED,
        rejectionReason: 'Needs adjustment for brand tone',
      });
      mockPrisma.contentRevision.findFirst.mockResolvedValue({ revisionNumber: 2 });
      mockPrisma.contentRevision.create.mockResolvedValue({ id: 'rev-3' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.rejectDraft(
        'ws-1',
        'draft-1',
        'admin-1',
        WorkspaceRole.OWNER,
        { rejectionReason: 'Needs adjustment for brand tone' },
      );

      expect(result.status).toBe(DraftStatus.REJECTED);
      expect(mockPrisma.contentDraft.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DraftStatus.REJECTED,
            rejectionReason: 'Needs adjustment for brand tone',
          }),
        }),
      );
    });

    it('approveDraft: should PREVENT self-approval when ADMIN created the draft (four-eyes principle)', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        createdByUserId: 'admin-1',
        status: DraftStatus.IN_REVIEW,
        variants: [{ id: 'var-1' }],
      });

      await expect(
        service.approveDraft('ws-1', 'draft-1', 'admin-1', WorkspaceRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('approveDraft: should PREVENT self-approval when ADMIN requested approval', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        createdByUserId: 'editor-1',
        approvalRequestedByUserId: 'admin-1',
        status: DraftStatus.IN_REVIEW,
        variants: [{ id: 'var-1' }],
      });

      await expect(
        service.approveDraft('ws-1', 'draft-1', 'admin-1', WorkspaceRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });

    it('variants: should reject cross-variant access when variant does not belong to draft', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.DRAFT,
        variants: [{ id: 'var-legit' }],
      });

      await expect(
        service.regenerateVariant('ws-1', 'draft-1', 'foreign-var-999', 'user-1', {} as any),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.translateVariant('ws-1', 'draft-1', 'foreign-var-999', 'user-1', { targetLanguage: 'Spanish' }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.adaptVariant('ws-1', 'draft-1', 'foreign-var-999', 'user-1', { targetPlatform: SocialPlatform.LINKEDIN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('immutability: should forbid variant mutations on an APPROVED draft', async () => {
      mockPrisma.contentDraft.findUnique.mockResolvedValue({
        id: 'draft-1',
        workspaceId: 'ws-1',
        status: DraftStatus.APPROVED,
        variants: [{ id: 'var-1' }],
      });

      await expect(
        service.regenerateVariant('ws-1', 'draft-1', 'var-1', 'user-1', {} as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.translateVariant('ws-1', 'draft-1', 'var-1', 'user-1', { targetLanguage: 'Hindi' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.adaptVariant('ws-1', 'draft-1', 'var-1', 'user-1', { targetPlatform: SocialPlatform.TWITTER_X }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.generateCreativeBrief('ws-1', 'draft-1', 'var-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
