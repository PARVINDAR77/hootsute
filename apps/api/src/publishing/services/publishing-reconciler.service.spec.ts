import { Test, TestingModule } from '@nestjs/testing';
import { PublishingReconcilerService } from './publishing-reconciler.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { PublisherFactoryService } from '../providers/publisher-factory.service';
import { ScheduledPostsRepository } from '../repositories/scheduled-posts.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PublishTargetStatus,
  ScheduledPostStatus,
  AttemptOutcome,
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
} from '@prisma/client';

describe('PublishingReconcilerService', () => {
  let reconciler: PublishingReconcilerService;
  let prisma: any;
  let tokenVault: any;
  let publisherFactory: any;
  let repository: any;
  let mockPublisher: any;

  const mockTargetId = 'target-rec-1';
  const mockPostId = 'post-rec-1';
  const mockAccountId = 'acc-rec-1';

  const mockTarget = {
    id: mockTargetId,
    scheduledPostId: mockPostId,
    socialAccountId: mockAccountId,
    platform: SocialPlatform.FACEBOOK,
    status: PublishTargetStatus.AMBIGUOUS_TIMEOUT,
    attemptCount: 1,
    maxAttempts: 3,
    scheduledPost: {
      id: mockPostId,
      contentSnapshot: { title: 'Test', variants: [] },
    },
    socialAccount: {
      id: mockAccountId,
      accountName: 'Reconcile Page',
      provider: SocialProvider.META_FACEBOOK,
      accountType: SocialAccountType.FACEBOOK_PAGE,
      encryptedAccessToken: 'v1:encrypted_token',
    },
  };

  beforeEach(async () => {
    prisma = {
      scheduledPostTarget: {
        findUnique: jest.fn().mockResolvedValue(mockTarget),
      },
    };

    tokenVault = {
      decrypt: jest.fn().mockReturnValue('decrypted_token'),
    };

    mockPublisher = {
      publish: jest.fn(),
      verifyExistingPost: jest.fn(),
    };

    publisherFactory = {
      getPublisher: jest.fn().mockReturnValue(mockPublisher),
    };

    repository = {
      recordAttempt: jest.fn(),
      updateTargetStatus: jest.fn(),
      recalculateParentStatus: jest.fn().mockResolvedValue(ScheduledPostStatus.PUBLISHED),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishingReconcilerService,
        { provide: PrismaService, useValue: prisma },
        { provide: TokenVaultService, useValue: tokenVault },
        { provide: PublisherFactoryService, useValue: publisherFactory },
        { provide: ScheduledPostsRepository, useValue: repository },
      ],
    }).compile();

    reconciler = module.get<PublishingReconcilerService>(PublishingReconcilerService);
  });

  it('should reconcile target as PUBLISHED if post already exists on provider (preventing duplicate post)', async () => {
    mockPublisher.verifyExistingPost.mockResolvedValue({
      found: true,
      externalPostId: 'fb_existing_12345',
      externalPostUrl: 'https://facebook.com/12345',
      postedAt: new Date(),
    });

    const result = await reconciler.reconcileTarget(mockTargetId);

    expect(result.reconciled).toBe(true);
    expect(result.status).toBe(PublishTargetStatus.PUBLISHED);
    expect(result.externalPostId).toBe('fb_existing_12345');

    // Verifies attempt was recorded with RECONCILED_SUCCESS
    expect(repository.recordAttempt).toHaveBeenCalledWith(
      mockTargetId,
      expect.objectContaining({
        outcome: AttemptOutcome.SUCCESS,
        externalPostId: 'fb_existing_12345',
        reconciliationStatus: 'RECONCILED_SUCCESS',
      }),
    );

    // Verifies target was updated to PUBLISHED
    expect(repository.updateTargetStatus).toHaveBeenCalledWith(
      mockTargetId,
      PublishTargetStatus.PUBLISHED,
      expect.objectContaining({
        externalPostId: 'fb_existing_12345',
      }),
    );

    // Recalculates parent status
    expect(repository.recalculateParentStatus).toHaveBeenCalledWith(mockPostId);
  });

  it('should mark target as RETRYING if provider confirms post was not created', async () => {
    mockPublisher.verifyExistingPost.mockResolvedValue({
      found: false,
    });

    const result = await reconciler.reconcileTarget(mockTargetId);

    expect(result.reconciled).toBe(false);
    expect(result.status).toBe(PublishTargetStatus.RETRYING);

    expect(repository.recordAttempt).toHaveBeenCalledWith(
      mockTargetId,
      expect.objectContaining({
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        reconciliationStatus: 'CONFIRMED_NOT_FOUND',
      }),
    );

    expect(repository.updateTargetStatus).toHaveBeenCalledWith(
      mockTargetId,
      PublishTargetStatus.RETRYING,
      expect.objectContaining({
        nextRetryAt: expect.any(Date),
      }),
    );
  });
});
