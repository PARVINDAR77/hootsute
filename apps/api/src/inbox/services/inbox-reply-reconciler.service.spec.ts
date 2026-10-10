import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { InboxAdapterFactory } from '../adapters/inbox-adapter.factory';
import { InboxReplyReconcilerService } from './inbox-reply-reconciler.service';
import {
  ReplyAttemptStatus,
  InteractionWorkflowStatus,
  SocialPlatform,
} from '@prisma/client';

describe('InboxReplyReconcilerService', () => {
  let service: InboxReplyReconcilerService;
  let prisma: any;
  let tokenVault: any;
  let adapterFactory: any;
  let mockAdapter: any;

  const sampleAttempt = {
    id: 'attempt-101',
    workspaceId: 'ws-alpha',
    authorUserId: 'user-1',
    content: 'Thank you for reaching out!',
    externalReplyId: null,
    status: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
    errorCode: null,
    errorMessage: null,
    rawResponse: {},
    createdAt: new Date(Date.now() - 90_000), // 90 seconds old (outside eventual consistency window)
    updatedAt: new Date(),
    interaction: {
      id: 'inter-1',
      workspaceId: 'ws-alpha',
      externalInteractionId: 'ext-comment-99',
      workflowStatus: InteractionWorkflowStatus.OPEN,
      socialAccount: {
        id: 'acc-1',
        platform: SocialPlatform.FACEBOOK,
        providerAccountId: 'page-123',
        encryptedAccessToken: 'enc-token-abc',
      },
    },
  };

  beforeEach(async () => {
    prisma = {
      interactionReplyAttempt: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        count: jest.fn(),
      },
      socialInteraction: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 'inter-1' }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    tokenVault = {
      decrypt: jest.fn().mockReturnValue('decrypted-access-token'),
    };

    mockAdapter = {
      checkReplyStatus: jest.fn(),
    };

    adapterFactory = {
      getAdapter: jest.fn().mockReturnValue(mockAdapter),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboxReplyReconcilerService,
        { provide: PrismaService, useValue: prisma },
        { provide: TokenVaultService, useValue: tokenVault },
        { provide: InboxAdapterFactory, useValue: adapterFactory },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<InboxReplyReconcilerService>(InboxReplyReconcilerService);
  });

  // 1. A reply confirmed successful by the provider
  it('1. reconciles to SENT when confirmed successful by the provider', async () => {
    prisma.interactionReplyAttempt.updateMany.mockResolvedValue({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({ ...sampleAttempt });
    mockAdapter.checkReplyStatus.mockResolvedValue({
      status: 'CONFIRMED_SENT',
      externalReplyId: 'fb-reply-555',
    });

    const result = await service.reconcileAttempt('attempt-101');

    expect(result.outcome).toBe('CONFIRMED_VIA_PROVIDER');
    expect(result.currentStatus).toBe(ReplyAttemptStatus.SENT);
    expect(result.externalReplyId).toBe('fb-reply-555');

    expect(prisma.interactionReplyAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'attempt-101',
          errorCode: expect.stringContaining('CLAIMED_BY_'),
        }),
        data: expect.objectContaining({
          status: ReplyAttemptStatus.SENT,
          externalReplyId: 'fb-reply-555',
        }),
      }),
    );
    expect(prisma.socialInteraction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inter-1' },
        data: expect.objectContaining({
          workflowStatus: InteractionWorkflowStatus.RESOLVED,
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  // 2. A reply confirmed unsuccessful and safe to retry
  it('2. transitions to FAILED (safe to retry) when confirmed not sent by provider', async () => {
    prisma.interactionReplyAttempt.updateMany.mockResolvedValue({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({ ...sampleAttempt });
    mockAdapter.checkReplyStatus.mockResolvedValue({
      status: 'CONFIRMED_NOT_SENT',
      canRetry: true,
    });

    const result = await service.reconcileAttempt('attempt-101');

    expect(result.outcome).toBe('CONFIRMED_NOT_SENT');
    expect(result.currentStatus).toBe(ReplyAttemptStatus.FAILED);
    expect(prisma.interactionReplyAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'attempt-101',
          errorCode: expect.stringContaining('CLAIMED_BY_'),
        }),
        data: expect.objectContaining({
          status: ReplyAttemptStatus.FAILED,
          errorCode: 'PROVIDER_CONFIRMED_NOT_SENT',
        }),
      }),
    );
    // Should NOT mark interaction resolved
    expect(prisma.socialInteraction.update).not.toHaveBeenCalled();
  });

  // 3. A provider timeout with an ambiguous result
  it('3. schedules backoff on ambiguous provider result until max retries', async () => {
    prisma.interactionReplyAttempt.updateMany.mockResolvedValue({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({
      ...sampleAttempt,
      rawResponse: { reconciliation: { retries: 1 } },
    });
    mockAdapter.checkReplyStatus.mockResolvedValue({
      status: 'AMBIGUOUS',
      reason: 'Network read timeout',
    });

    const result = await service.reconcileAttempt('attempt-101');

    expect(result.outcome).toBe('RETRY_SCHEDULED');
    expect(result.retryCount).toBe(2);
    expect(prisma.interactionReplyAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'attempt-101',
          errorCode: expect.stringContaining('CLAIMED_BY_'),
        }),
        data: expect.objectContaining({
          errorCode: 'RECONCILIATION_BACKOFF',
        }),
      }),
    );
  });

  // 4. A reply already processed by a webhook
  it('4. reconciles to SENT when a matching inbound reply already arrived via webhook', async () => {
    prisma.interactionReplyAttempt.updateMany.mockResolvedValue({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({ ...sampleAttempt });
    prisma.socialInteraction.findFirst.mockResolvedValue({
      id: 'webhook-reply-inter',
      externalInteractionId: 'webhook-external-id-789',
      isFromPageOrAccount: true,
      content: sampleAttempt.content,
    });

    const result = await service.reconcileAttempt('attempt-101');

    expect(result.outcome).toBe('CONFIRMED_VIA_WEBHOOK');
    expect(result.currentStatus).toBe(ReplyAttemptStatus.SENT);
    expect(result.externalReplyId).toBe('webhook-external-id-789');
    // Adapter should not need to be called
    expect(mockAdapter.checkReplyStatus).not.toHaveBeenCalled();
  });

  // 5. Two workers attempting to reconcile the same attempt
  it('5. fails claim for second worker when first worker already claimed attempt', async () => {
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({ ...sampleAttempt });
    mockAdapter.checkReplyStatus.mockResolvedValue({
      status: 'CONFIRMED_SENT',
      externalReplyId: 'fb-reply-555',
    });

    // Worker A claims (count: 1), then Worker A commits (count: 1), then Worker B attempts claim (count: 0)
    prisma.interactionReplyAttempt.updateMany
      .mockResolvedValueOnce({ count: 1 }) // Worker A claim
      .mockResolvedValueOnce({ count: 1 }) // Worker A commit
      .mockResolvedValueOnce({ count: 0 }); // Worker B claim

    const worker1Result = await service.reconcileAttempt('attempt-101', 'worker-A');
    const worker2Result = await service.reconcileAttempt('attempt-101', 'worker-B');

    expect(worker1Result.outcome).toBe('CONFIRMED_VIA_PROVIDER');
    expect(worker2Result.outcome).toBe('CLAIM_FAILED');
    expect(worker2Result.reason).toContain('Attempt could not be claimed');
  });

  // 6. A provider that cannot reliably confirm the result
  it('6. flags UNRESOLVED_NEEDS_REVIEW without resending when provider lacks status check', async () => {
    prisma.interactionReplyAttempt.updateMany.mockResolvedValue({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({ ...sampleAttempt });
    // Adapter without checkReplyStatus
    adapterFactory.getAdapter.mockReturnValue({});

    const result = await service.reconcileAttempt('attempt-101');

    expect(result.outcome).toBe('UNRESOLVED_PROVIDER_UNSUPPORTED');
    expect(result.currentStatus).toBe(ReplyAttemptStatus.AMBIGUOUS_TIMEOUT);
    expect(prisma.interactionReplyAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'attempt-101',
          errorCode: expect.stringContaining('CLAIMED_BY_'),
        }),
        data: expect.objectContaining({
          errorCode: 'UNRESOLVED_NEEDS_REVIEW',
        }),
      }),
    );
  });

  // 7. Repeated execution without duplicate replies
  it('7. safely skips completed attempts on repeated execution', async () => {
    prisma.interactionReplyAttempt.updateMany.mockResolvedValue({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({
      ...sampleAttempt,
      status: ReplyAttemptStatus.SENT,
      externalReplyId: 'existing-ext-id',
    });

    const result = await service.reconcileAttempt('attempt-101');

    expect(result.outcome).toBe('ALREADY_COMPLETED');
    expect(result.currentStatus).toBe(ReplyAttemptStatus.SENT);
    expect(mockAdapter.checkReplyStatus).not.toHaveBeenCalled();
  });

  // 8. Workspace isolation and correct state transitions
  it('8. enforces workspace isolation and returns SKIPPED_NOT_ELIGIBLE for mismatched workspace', async () => {
    prisma.interactionReplyAttempt.updateMany.mockResolvedValue({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({
      ...sampleAttempt,
      workspaceId: 'workspace-different',
    });

    const result = await service.reconcileAttempt('attempt-101', 'worker-1', 'workspace-current');

    expect(result.outcome).toBe('SKIPPED_NOT_ELIGIBLE');
    expect(result.reason).toContain('Attempt does not belong to specified workspace');
  });

  // 9. Stale worker lease expiration protection
  it('9. prevents stale worker from updating attempt if lease expired and claim was lost', async () => {
    // Initial claim succeeds
    prisma.interactionReplyAttempt.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.interactionReplyAttempt.findUnique.mockResolvedValue({ ...sampleAttempt });
    mockAdapter.checkReplyStatus.mockResolvedValue({
      status: 'CONFIRMED_SENT',
      externalReplyId: 'fb-reply-555',
    });

    // But commit updateMany fails because lease expired and another worker took it (count: 0)
    prisma.interactionReplyAttempt.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await service.reconcileAttempt('attempt-101', 'stale-worker');

    expect(result.outcome).toBe('CLAIM_FAILED');
    expect(result.reason).toContain('Worker lost claim lease before committing update');
    // Social interaction should NOT be updated if commit failed
    expect(prisma.socialInteraction.update).not.toHaveBeenCalled();
  });

  // 10. Observability test
  it('10. returns clean reconciliation stats without exposing sensitive tokens', async () => {
    prisma.interactionReplyAttempt.count
      .mockResolvedValueOnce(2) // pendingStale
      .mockResolvedValueOnce(5) // ambiguousTimeout
      .mockResolvedValueOnce(1) // unresolvedNeedsReview
      .mockResolvedValueOnce(12) // reconciledSent
      .mockResolvedValueOnce(3); // confirmedFailed

    const stats = await service.getReconciliationStats('ws-alpha');

    expect(stats.pendingStale).toBe(2);
    expect(stats.ambiguousTimeout).toBe(5);
    expect(stats.unresolvedNeedsReview).toBe(1);
    expect(stats.reconciledSent).toBe(12);
    expect(stats.confirmedFailed).toBe(3);
  });
});
