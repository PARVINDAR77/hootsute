import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { PublisherFactoryService } from '../providers/publisher-factory.service';
import { ScheduledPostsRepository } from '../repositories/scheduled-posts.repository';
import { ScheduledPostsService } from './scheduled-posts.service';
import { PublishingReconcilerService } from './publishing-reconciler.service';
import {
  ScheduledPostTarget,
  PublishTargetStatus,
  ScheduledPostStatus,
  AttemptOutcome,
} from '@prisma/client';
import { ScheduledPostContentSnapshot } from '@packages/shared';
import * as crypto from 'crypto';
import { computeSnapshotHash } from '../utils/canonical-json';

@Injectable()
export class PublishingDispatcherService {
  private readonly logger = new Logger(PublishingDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: ScheduledPostsRepository,
    private readonly scheduledPostsService: ScheduledPostsService,
    private readonly tokenVault: TokenVaultService,
    private readonly publisherFactory: PublisherFactoryService,
    private readonly reconciler: PublishingReconcilerService,
  ) {}

  /**
   * Executes publishing for a single target with atomic claim, token decryption,
   * snapshot integrity verification, and reconciliation guards.
   */
  async dispatchTarget(targetId: string): Promise<{
    claimed: boolean;
    success: boolean;
    targetStatus: PublishTargetStatus;
    externalPostId?: string;
  }> {
    // 1. Atomic claim check
    const claimedTarget = await this.repository.atomicClaimDueTarget(targetId);

    if (!claimedTarget) {
      this.logger.warn(`Target [${targetId}] could not be claimed (already claimed, cancelled, or post not due)`);
      return { claimed: false, success: false, targetStatus: PublishTargetStatus.SKIPPED };
    }

    const post = await this.prisma.scheduledPost.findUnique({
      where: { id: claimedTarget.scheduledPostId },
    });
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: claimedTarget.socialAccountId },
    });
    const draft = post?.draftId
      ? await this.prisma.contentDraft.findUnique({ where: { id: post.draftId } })
      : null;

    if (!post || !account || !draft) {
      this.logger.error(`Orphaned target [${targetId}]: missing scheduled post, social account, or draft`);
      return { claimed: true, success: false, targetStatus: PublishTargetStatus.FAILED };
    }

    // Guard: Verify draft approval has not been withdrawn or altered
    if (draft.status !== 'APPROVED') {
      this.logger.warn(
        `Draft [${draft.id}] is in ${draft.status} status (not APPROVED). Aborting publication and flagging for re-approval.`,
      );
      await this.repository.updatePostStatus(post.id, ScheduledPostStatus.NEEDS_REAPPROVAL);
      const res = await this.scheduledPostsService.recordAttemptAndTransition(targetId, {
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'DRAFT_APPROVAL_WITHDRAWN',
        sanitizedErrorMessage: `Underlying content draft is not APPROVED (${draft.status}). Publication halted.`,
      });
      return { claimed: true, success: false, targetStatus: res.targetStatus };
    }

    // Guard: Verify social account is actively connected
    if (account.connectionStatus !== 'CONNECTED') {
      this.logger.warn(
        `Social account [${account.id}] connection status is ${account.connectionStatus}. Aborting publication.`,
      );
      const res = await this.scheduledPostsService.recordAttemptAndTransition(targetId, {
        outcome: AttemptOutcome.AUTH_FAILURE,
        sanitizedErrorCode: `ACCOUNT_${account.connectionStatus}`,
        sanitizedErrorMessage: `Connected social account is ${account.connectionStatus}. Please reconnect account.`,
      });
      return { claimed: true, success: false, targetStatus: res.targetStatus };
    }

    // 2. Snapshot integrity check (SHA-256) using canonical JSON
    const computedHash = computeSnapshotHash(post.contentSnapshot);

    if (computedHash !== post.snapshotHash) {
      this.logger.error(`Snapshot integrity violation for post [${post.id}]: Hash mismatch!`);
      const res = await this.scheduledPostsService.recordAttemptAndTransition(targetId, {
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'SNAPSHOT_INTEGRITY_MISMATCH',
        sanitizedErrorMessage: 'Content snapshot failed cryptographic integrity verification',
      });
      return { claimed: true, success: false, targetStatus: res.targetStatus };
    }

    // 3. Decrypt token safely in worker memory
    let decryptedToken: string;
    try {
      decryptedToken = this.tokenVault.decrypt(account.encryptedAccessToken);
    } catch (err: any) {
      this.logger.error(`Token decryption failed for account [${account.id}]: ${err.message}`);
      const res = await this.scheduledPostsService.recordAttemptAndTransition(targetId, {
        outcome: AttemptOutcome.AUTH_FAILURE,
        sanitizedErrorCode: 'TOKEN_DECRYPTION_ERROR',
        sanitizedErrorMessage: 'Failed to decrypt access token with vault key',
      });
      return { claimed: true, success: false, targetStatus: res.targetStatus };
    }

    // 4. Resolve publisher
    const publisher = this.publisherFactory.getPublisher(claimedTarget.platform, account.provider);
    const snapshot = post.contentSnapshot as unknown as ScheduledPostContentSnapshot;

    // 5. Execute publication with provider
    this.logger.log(`Dispatching target [${targetId}] to platform [${claimedTarget.platform}]...`);
    const result = await publisher.publish(claimedTarget, snapshot, account, decryptedToken);

    // 6. Record attempt outcome and transition status
    const transitionResult = await this.scheduledPostsService.recordAttemptAndTransition(targetId, {
      outcome: result.outcome,
      sanitizedErrorCode: result.sanitizedErrorCode,
      sanitizedErrorMessage: result.sanitizedErrorMessage,
      externalPostId: result.externalPostId,
      externalPostUrl: result.externalPostUrl,
      metadata: result.rawResponse,
    });

    this.logger.log(
      `Target [${targetId}] dispatch finished. Outcome: [${result.outcome}], Target Status: [${transitionResult.targetStatus}], Parent Post Status: [${transitionResult.parentStatus}]`,
    );

    return {
      claimed: true,
      success: result.success,
      targetStatus: transitionResult.targetStatus,
      externalPostId: result.externalPostId,
    };
  }

  /**
   * Dispatches all eligible targets for a scheduled post.
   */
  async dispatchScheduledPost(scheduledPostId: string) {
    const targets = await this.prisma.scheduledPostTarget.findMany({
      where: {
        scheduledPostId,
        status: { in: [PublishTargetStatus.PENDING, PublishTargetStatus.RETRYING] },
      },
    });

    const results = [];
    for (const target of targets) {
      const res = await this.dispatchTarget(target.id);
      results.push({ targetId: target.id, ...res });
    }

    return results;
  }
}
