import { Test, TestingModule } from '@nestjs/testing';
import { PublishingDispatcherService } from './publishing-dispatcher.service';
import { ScheduledPostsRepository } from '../repositories/scheduled-posts.repository';
import { ScheduledPostsService } from './scheduled-posts.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { PublisherFactoryService } from '../providers/publisher-factory.service';
import { PublishingReconcilerService } from './publishing-reconciler.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PublishTargetStatus,
  ScheduledPostStatus,
  AttemptOutcome,
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
} from '@prisma/client';
import * as crypto from 'crypto';
import { computeSnapshotHash } from '../utils/canonical-json';

describe('PublishingDispatcherService', () => {
  let dispatcher: PublishingDispatcherService;
  let prisma: any;
  let repository: any;
  let scheduledPostsService: any;
  let tokenVault: any;
  let publisherFactory: any;
  let reconciler: any;
  let mockPublisher: any;

  const mockTargetId = 'target-test-123';
  const mockPostId = 'post-test-456';
  const mockAccountId = 'acc-test-789';

  const rawSnapshot = {
    draftId: 'draft-1',
    approvedRevisionNumber: 1,
    title: 'Test Post',
    variants: [
      {
        id: 'var-1',
        platform: SocialPlatform.FACEBOOK,
        body: 'Hello world Facebook post',
        hashtags: ['#Test'],
      },
    ],
  };

  const snapshotHash = computeSnapshotHash(rawSnapshot);

  const mockPost = {
    id: mockPostId,
    draftId: 'draft-1',
    contentSnapshot: rawSnapshot,
    snapshotHash,
    status: ScheduledPostStatus.SCHEDULED,
  };

  const mockAccount = {
    id: mockAccountId,
    accountName: 'Acme FB Page',
    provider: SocialProvider.META_FACEBOOK,
    accountType: SocialAccountType.FACEBOOK_PAGE,
    connectionStatus: 'CONNECTED',
    encryptedAccessToken: 'v1:encrypted_token',
  };

  const mockClaimedTarget = {
    id: mockTargetId,
    scheduledPostId: mockPostId,
    socialAccountId: mockAccountId,
    platform: SocialPlatform.FACEBOOK,
    status: PublishTargetStatus.DISPATCHING,
    attemptCount: 1,
  };

  const mockDraft = {
    id: 'draft-1',
    title: 'Test Draft',
    status: 'APPROVED',
  };

  beforeEach(async () => {
    prisma = {
      scheduledPost: {
        findUnique: jest.fn().mockResolvedValue(mockPost),
      },
      socialAccount: {
        findUnique: jest.fn().mockResolvedValue(mockAccount),
      },
      contentDraft: {
        findUnique: jest.fn().mockResolvedValue(mockDraft),
      },
      scheduledPostTarget: {
        findMany: jest.fn(),
      },
    };

    repository = {
      atomicClaimDueTarget: jest.fn(),
      updatePostStatus: jest.fn(),
    };

    scheduledPostsService = {
      recordAttemptAndTransition: jest.fn(),
    };

    tokenVault = {
      decrypt: jest.fn().mockReturnValue('decrypted_token_value'),
    };

    mockPublisher = {
      publish: jest.fn(),
      verifyExistingPost: jest.fn(),
    };

    publisherFactory = {
      getPublisher: jest.fn().mockReturnValue(mockPublisher),
    };

    reconciler = {
      reconcileTarget: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishingDispatcherService,
        { provide: PrismaService, useValue: prisma },
        { provide: ScheduledPostsRepository, useValue: repository },
        { provide: ScheduledPostsService, useValue: scheduledPostsService },
        { provide: TokenVaultService, useValue: tokenVault },
        { provide: PublisherFactoryService, useValue: publisherFactory },
        { provide: PublishingReconcilerService, useValue: reconciler },
      ],
    }).compile();

    dispatcher = module.get<PublishingDispatcherService>(PublishingDispatcherService);
  });

  it('should skip if target cannot be atomically claimed', async () => {
    repository.atomicClaimDueTarget.mockResolvedValue(null);

    const result = await dispatcher.dispatchTarget(mockTargetId);

    expect(result.claimed).toBe(false);
    expect(result.targetStatus).toBe(PublishTargetStatus.SKIPPED);
    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });

  it('should abort and mark failure if content snapshot hash does not match (cryptographic tampering check)', async () => {
    repository.atomicClaimDueTarget.mockResolvedValue(mockClaimedTarget);
    prisma.scheduledPost.findUnique.mockResolvedValue({
      ...mockPost,
      snapshotHash: 'tampered_invalid_sha256_hash_value_1234567890abcdef',
    });
    scheduledPostsService.recordAttemptAndTransition.mockResolvedValue({
      targetStatus: PublishTargetStatus.FAILED,
    });

    const result = await dispatcher.dispatchTarget(mockTargetId);

    expect(result.claimed).toBe(true);
    expect(result.success).toBe(false);
    expect(result.targetStatus).toBe(PublishTargetStatus.FAILED);
    expect(scheduledPostsService.recordAttemptAndTransition).toHaveBeenCalledWith(
      mockTargetId,
      expect.objectContaining({
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'SNAPSHOT_INTEGRITY_MISMATCH',
      }),
    );
    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });

  it('should abort and mark auth failure if token vault decryption fails', async () => {
    repository.atomicClaimDueTarget.mockResolvedValue(mockClaimedTarget);
    tokenVault.decrypt.mockImplementation(() => {
      throw new Error('Unsupported state or unable to authenticate data');
    });
    scheduledPostsService.recordAttemptAndTransition.mockResolvedValue({
      targetStatus: PublishTargetStatus.AUTH_REQUIRED,
    });

    const result = await dispatcher.dispatchTarget(mockTargetId);

    expect(result.claimed).toBe(true);
    expect(result.success).toBe(false);
    expect(result.targetStatus).toBe(PublishTargetStatus.AUTH_REQUIRED);
    expect(scheduledPostsService.recordAttemptAndTransition).toHaveBeenCalledWith(
      mockTargetId,
      expect.objectContaining({
        outcome: AttemptOutcome.AUTH_FAILURE,
        sanitizedErrorCode: 'TOKEN_DECRYPTION_ERROR',
      }),
    );
    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });

  it('should decrypt token and successfully publish with provider', async () => {
    repository.atomicClaimDueTarget.mockResolvedValue(mockClaimedTarget);
    mockPublisher.publish.mockResolvedValue({
      success: true,
      externalPostId: 'fb_post_999',
      externalPostUrl: 'https://facebook.com/post/999',
      outcome: AttemptOutcome.SUCCESS,
    });
    scheduledPostsService.recordAttemptAndTransition.mockResolvedValue({
      targetStatus: PublishTargetStatus.PUBLISHED,
      parentStatus: ScheduledPostStatus.PUBLISHED,
    });

    const result = await dispatcher.dispatchTarget(mockTargetId);

    expect(result.claimed).toBe(true);
    expect(result.success).toBe(true);
    expect(result.targetStatus).toBe(PublishTargetStatus.PUBLISHED);
    expect(result.externalPostId).toBe('fb_post_999');

    expect(tokenVault.decrypt).toHaveBeenCalledWith(mockAccount.encryptedAccessToken);
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      mockClaimedTarget,
      rawSnapshot,
      mockAccount,
      'decrypted_token_value',
    );
    expect(scheduledPostsService.recordAttemptAndTransition).toHaveBeenCalledWith(
      mockTargetId,
      expect.objectContaining({
        outcome: AttemptOutcome.SUCCESS,
        externalPostId: 'fb_post_999',
      }),
    );
  });

  it('should abort and flag re-approval if draft is not in APPROVED status', async () => {
    repository.atomicClaimDueTarget.mockResolvedValue(mockClaimedTarget);
    prisma.contentDraft.findUnique.mockResolvedValue({
      id: 'draft-1',
      title: 'Recalled Draft',
      status: 'REJECTED',
    });
    scheduledPostsService.recordAttemptAndTransition.mockResolvedValue({
      targetStatus: PublishTargetStatus.FAILED,
    });

    const result = await dispatcher.dispatchTarget(mockTargetId);

    expect(result.claimed).toBe(true);
    expect(result.success).toBe(false);
    expect(repository.updatePostStatus).toHaveBeenCalledWith(
      mockPostId,
      ScheduledPostStatus.NEEDS_REAPPROVAL,
    );
    expect(scheduledPostsService.recordAttemptAndTransition).toHaveBeenCalledWith(
      mockTargetId,
      expect.objectContaining({
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'DRAFT_APPROVAL_WITHDRAWN',
      }),
    );
    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });

  it('should abort and flag auth failure if social account is DISCONNECTED or REVOKED', async () => {
    repository.atomicClaimDueTarget.mockResolvedValue(mockClaimedTarget);
    prisma.socialAccount.findUnique.mockResolvedValue({
      ...mockAccount,
      connectionStatus: 'DISCONNECTED',
    });
    scheduledPostsService.recordAttemptAndTransition.mockResolvedValue({
      targetStatus: PublishTargetStatus.AUTH_REQUIRED,
    });

    const result = await dispatcher.dispatchTarget(mockTargetId);

    expect(result.claimed).toBe(true);
    expect(result.success).toBe(false);
    expect(scheduledPostsService.recordAttemptAndTransition).toHaveBeenCalledWith(
      mockTargetId,
      expect.objectContaining({
        outcome: AttemptOutcome.AUTH_FAILURE,
        sanitizedErrorCode: 'ACCOUNT_DISCONNECTED',
      }),
    );
    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });
});
