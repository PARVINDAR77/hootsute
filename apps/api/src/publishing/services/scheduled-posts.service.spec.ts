import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledPostsService } from './scheduled-posts.service';
import { ScheduledPostsRepository } from '../repositories/scheduled-posts.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WorkspaceRole,
  DraftStatus,
  SocialConnectionStatus,
  ScheduledPostStatus,
  PublishTargetStatus,
  AttemptOutcome,
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
} from '@prisma/client';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { computeSnapshotHash } from '../utils/canonical-json';

describe('ScheduledPostsService', () => {
  let service: ScheduledPostsService;
  let prisma: any;
  let repository: any;

  const mockWorkspaceId = 'ws-test-123';
  const mockUserId = 'user-test-456';
  const mockDraftId = 'draft-test-789';
  const mockAccountId1 = 'acc-test-111';
  const mockAccountId2 = 'acc-test-222';

  const mockApprovedDraft = {
    id: mockDraftId,
    workspaceId: mockWorkspaceId,
    title: 'Spring Festival Launch',
    objective: 'ENGAGEMENT',
    contentType: 'POST',
    language: 'en',
    status: DraftStatus.APPROVED,
    approvedByUserId: 'approver-123',
    approvedAt: new Date('2026-10-09T10:00:00Z'),
    variants: [
      {
        id: 'var-1',
        platform: SocialPlatform.FACEBOOK,
        headline: 'Celebrate with us!',
        body: 'Join our grand spring sale with exclusive discounts.',
        callToAction: 'Shop Now',
        hashtags: ['#SpringSale', '#Deals'],
        linkUrl: 'https://example.com/sale',
        mediaAssetUrl: 'https://example.com/banner.jpg',
      },
      {
        id: 'var-2',
        platform: SocialPlatform.INSTAGRAM,
        headline: null,
        body: 'Spring is in the air! Grab 30% off today only.',
        callToAction: 'Link in Bio',
        hashtags: ['#InstaSale'],
        linkUrl: null,
        mediaAssetUrl: 'https://example.com/ig-photo.jpg',
      },
    ],
    revisions: [
      {
        id: 'rev-2',
        revisionNumber: 2,
        action: 'APPROVE',
        createdAt: new Date('2026-10-09T10:00:00Z'),
      },
      {
        id: 'rev-1',
        revisionNumber: 1,
        action: 'INITIAL_CREATION',
        createdAt: new Date('2026-10-09T09:00:00Z'),
      },
    ],
  };

  const mockSocialAccount1 = {
    id: mockAccountId1,
    workspaceId: mockWorkspaceId,
    accountName: 'Acme Facebook Page',
    provider: SocialProvider.META_FACEBOOK,
    accountType: SocialAccountType.FACEBOOK_PAGE,
    connectionStatus: SocialConnectionStatus.CONNECTED,
  };

  const mockSocialAccount2 = {
    id: mockAccountId2,
    workspaceId: mockWorkspaceId,
    accountName: 'Acme Instagram',
    provider: SocialProvider.META_INSTAGRAM,
    accountType: SocialAccountType.INSTAGRAM_BUSINESS,
    connectionStatus: SocialConnectionStatus.CONNECTED,
  };

  beforeEach(async () => {
    prisma = {
      contentDraft: {
        findFirst: jest.fn(),
      },
      socialAccount: {
        findMany: jest.fn(),
      },
      scheduledPost: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      scheduledPostTarget: {
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    repository = {
      createScheduledPost: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      findForCalendar: jest.fn(),
      reschedulePost: jest.fn(),
      cancelPost: jest.fn(),
      atomicClaimDueTarget: jest.fn(),
      recordAttempt: jest.fn(),
      updateTargetStatus: jest.fn(),
      recalculateParentStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledPostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ScheduledPostsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<ScheduledPostsService>(ScheduledPostsService);
  });

  describe('schedulePost', () => {
    const validDto = {
      draftId: mockDraftId,
      scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      timezone: 'Asia/Kolkata',
      targets: [
        {
          socialAccountId: mockAccountId1,
          platform: SocialPlatform.FACEBOOK,
          variantId: 'var-1',
        },
      ],
    };

    it('should reject VIEWER role with ForbiddenException', async () => {
      await expect(
        service.schedulePost(mockWorkspaceId, mockUserId, WorkspaceRole.VIEWER, validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject scheduling if draft is not found', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue(null);

      await expect(
        service.schedulePost(mockWorkspaceId, mockUserId, WorkspaceRole.EDITOR, validDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject scheduling if draft is in DRAFT or IN_REVIEW status', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue({
        ...mockApprovedDraft,
        status: DraftStatus.DRAFT,
      });

      await expect(
        service.schedulePost(mockWorkspaceId, mockUserId, WorkspaceRole.EDITOR, validDto),
      ).rejects.toThrow(BadRequestException);

      prisma.contentDraft.findFirst.mockResolvedValue({
        ...mockApprovedDraft,
        status: DraftStatus.IN_REVIEW,
      });

      await expect(
        service.schedulePost(mockWorkspaceId, mockUserId, WorkspaceRole.EDITOR, validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject scheduling if duplicate targets for same account are specified', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue(mockApprovedDraft);

      const duplicateDto = {
        ...validDto,
        targets: [
          { socialAccountId: mockAccountId1, platform: SocialPlatform.FACEBOOK },
          { socialAccountId: mockAccountId1, platform: SocialPlatform.FACEBOOK },
        ],
      };

      await expect(
        service.schedulePost(mockWorkspaceId, mockUserId, WorkspaceRole.EDITOR, duplicateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cross-workspace social account with ForbiddenException', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue(mockApprovedDraft);
      prisma.socialAccount.findMany.mockResolvedValue([
        {
          ...mockSocialAccount1,
          workspaceId: 'other-rogue-workspace-id', // Cross-tenant IDOR attack
        },
      ]);

      await expect(
        service.schedulePost(mockWorkspaceId, mockUserId, WorkspaceRole.EDITOR, validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject disconnected social account with BadRequestException', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue(mockApprovedDraft);
      prisma.socialAccount.findMany.mockResolvedValue([
        {
          ...mockSocialAccount1,
          connectionStatus: SocialConnectionStatus.DISCONNECTED,
        },
      ]);

      await expect(
        service.schedulePost(mockWorkspaceId, mockUserId, WorkspaceRole.EDITOR, validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create scheduled post with immutable snapshot and sha256 hash', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue(mockApprovedDraft);
      prisma.socialAccount.findMany.mockResolvedValue([mockSocialAccount1, mockSocialAccount2]);

      const multiTargetDto = {
        ...validDto,
        targets: [
          { socialAccountId: mockAccountId1, platform: SocialPlatform.FACEBOOK },
          { socialAccountId: mockAccountId2, platform: SocialPlatform.INSTAGRAM },
        ],
      };

      const expectedSavedPost = {
        id: 'scheduled-post-1',
        workspaceId: mockWorkspaceId,
        draftId: mockDraftId,
        scheduledAt: new Date(validDto.scheduledAt),
        status: ScheduledPostStatus.SCHEDULED,
        targets: [{ id: 'target-1' }, { id: 'target-2' }],
      };

      repository.createScheduledPost.mockResolvedValue(expectedSavedPost);

      const result = await service.schedulePost(
        mockWorkspaceId,
        mockUserId,
        WorkspaceRole.EDITOR,
        multiTargetDto,
      );

      expect(repository.createScheduledPost).toHaveBeenCalledTimes(1);
      const callArgs = repository.createScheduledPost.mock.calls[0][0];

      expect(callArgs.workspaceId).toBe(mockWorkspaceId);
      expect(callArgs.approvedRevisionNumber).toBe(2);
      expect(callArgs.snapshotHash).toBeDefined();
      expect(callArgs.snapshotHash).toHaveLength(64); // SHA-256 hex string

      // Verify SHA-256 hash calculation matches contentSnapshot
      const expectedHash = computeSnapshotHash(callArgs.contentSnapshot);
      expect(callArgs.snapshotHash).toBe(expectedHash);

      expect(result).toBe(expectedSavedPost);
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('reschedulePost', () => {
    it('should allow rescheduling a SCHEDULED or FAILED post', async () => {
      const mockPost = {
        id: 'post-1',
        workspaceId: mockWorkspaceId,
        status: ScheduledPostStatus.SCHEDULED,
        scheduledAt: new Date(),
        timezone: 'UTC',
      };
      repository.findById.mockResolvedValue(mockPost);
      repository.reschedulePost.mockResolvedValue({
        ...mockPost,
        scheduledAt: new Date('2026-10-20T12:00:00Z'),
      });

      const result = await service.reschedulePost(
        mockWorkspaceId,
        'post-1',
        mockUserId,
        WorkspaceRole.ADMIN,
        { scheduledAt: '2026-10-20T12:00:00Z' },
      );

      expect(result.scheduledAt).toEqual(new Date('2026-10-20T12:00:00Z'));
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    });

    it('should reject rescheduling a post in PROCESSING or PUBLISHED status', async () => {
      repository.findById.mockResolvedValue({
        id: 'post-1',
        workspaceId: mockWorkspaceId,
        status: ScheduledPostStatus.PROCESSING,
      });

      await expect(
        service.reschedulePost(
          mockWorkspaceId,
          'post-1',
          mockUserId,
          WorkspaceRole.ADMIN,
          { scheduledAt: '2026-10-20T12:00:00Z' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelScheduledPost', () => {
    it('should reject cancellation if post is in PROCESSING status', async () => {
      repository.findById.mockResolvedValue({
        id: 'post-1',
        workspaceId: mockWorkspaceId,
        status: ScheduledPostStatus.PROCESSING,
      });

      await expect(
        service.cancelScheduledPost(
          mockWorkspaceId,
          'post-1',
          mockUserId,
          WorkspaceRole.EDITOR,
          { reason: 'Too late' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should cancel a SCHEDULED post and record audit log', async () => {
      repository.findById.mockResolvedValue({
        id: 'post-1',
        workspaceId: mockWorkspaceId,
        status: ScheduledPostStatus.SCHEDULED,
      });
      repository.cancelPost.mockResolvedValue({
        id: 'post-1',
        status: ScheduledPostStatus.CANCELLED,
      });

      const res = await service.cancelScheduledPost(
        mockWorkspaceId,
        'post-1',
        mockUserId,
        WorkspaceRole.EDITOR,
        { reason: 'User requested cancellation' },
      );

      expect(repository.cancelPost).toHaveBeenCalledWith(
        'post-1',
        mockUserId,
        'User requested cancellation',
      );
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDraftModifiedOrUnapproved', () => {
    it('should mark all pending scheduled posts as NEEDS_REAPPROVAL when draft is edited', async () => {
      prisma.scheduledPost.findMany.mockResolvedValue([
        { id: 'post-1', status: ScheduledPostStatus.SCHEDULED },
        { id: 'post-2', status: ScheduledPostStatus.SCHEDULED },
      ]);
      prisma.scheduledPost.update.mockResolvedValue({});

      const count = await service.handleDraftModifiedOrUnapproved(
        mockWorkspaceId,
        mockDraftId,
        'Draft body was modified by author',
      );

      expect(count).toBe(2);
      expect(prisma.scheduledPost.update).toHaveBeenCalledTimes(2);
      expect(prisma.scheduledPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: ScheduledPostStatus.NEEDS_REAPPROVAL },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('recordAttemptAndTransition', () => {
    it('should mark target as PUBLISHED and update parent when attempt succeeds', async () => {
      prisma.scheduledPostTarget.findUnique.mockResolvedValue({
        id: 'target-1',
        scheduledPostId: 'post-1',
        attemptCount: 1,
        maxAttempts: 3,
      });
      repository.recordAttempt.mockResolvedValue({ id: 'attempt-1' });
      repository.recalculateParentStatus.mockResolvedValue(ScheduledPostStatus.PUBLISHED);

      const result = await service.recordAttemptAndTransition('target-1', {
        outcome: AttemptOutcome.SUCCESS,
        externalPostId: 'fb_123456789',
        externalPostUrl: 'https://facebook.com/post/123456789',
      });

      expect(repository.updateTargetStatus).toHaveBeenCalledWith(
        'target-1',
        PublishTargetStatus.PUBLISHED,
        expect.objectContaining({ externalPostId: 'fb_123456789' }),
      );
      expect(result.targetStatus).toBe(PublishTargetStatus.PUBLISHED);
      expect(result.parentStatus).toBe(ScheduledPostStatus.PUBLISHED);
    });

    it('should mark target as RETRYING with exponential backoff on transient failure', async () => {
      prisma.scheduledPostTarget.findUnique.mockResolvedValue({
        id: 'target-1',
        scheduledPostId: 'post-1',
        attemptCount: 1,
        maxAttempts: 3,
      });
      repository.recordAttempt.mockResolvedValue({ id: 'attempt-1' });
      repository.recalculateParentStatus.mockResolvedValue(ScheduledPostStatus.PROCESSING);

      const result = await service.recordAttemptAndTransition('target-1', {
        outcome: AttemptOutcome.RATE_LIMITED,
        sanitizedErrorCode: 'RATE_LIMIT_EXCEEDED',
        sanitizedErrorMessage: 'Provider temporarily rate limited the request',
      });

      expect(repository.updateTargetStatus).toHaveBeenCalledWith(
        'target-1',
        PublishTargetStatus.RETRYING,
        expect.objectContaining({
          errorCode: 'RATE_LIMIT_EXCEEDED',
          nextRetryAt: expect.any(Date),
        }),
      );
      expect(result.targetStatus).toBe(PublishTargetStatus.RETRYING);
    });

    it('should mark target as FAILED when max attempts are reached', async () => {
      prisma.scheduledPostTarget.findUnique.mockResolvedValue({
        id: 'target-1',
        scheduledPostId: 'post-1',
        attemptCount: 3,
        maxAttempts: 3,
      });
      repository.recordAttempt.mockResolvedValue({ id: 'attempt-3' });
      repository.recalculateParentStatus.mockResolvedValue(ScheduledPostStatus.FAILED);

      const result = await service.recordAttemptAndTransition('target-1', {
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'MEDIA_INVALID',
      });

      expect(repository.updateTargetStatus).toHaveBeenCalledWith(
        'target-1',
        PublishTargetStatus.FAILED,
        expect.objectContaining({ errorCode: 'MEDIA_INVALID' }),
      );
      expect(result.targetStatus).toBe(PublishTargetStatus.FAILED);
      expect(result.parentStatus).toBe(ScheduledPostStatus.FAILED);
    });
  });
});
