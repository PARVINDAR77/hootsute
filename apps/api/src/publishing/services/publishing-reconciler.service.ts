import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { PublisherFactoryService } from '../providers/publisher-factory.service';
import { ScheduledPostsRepository } from '../repositories/scheduled-posts.repository';
import {
  PublishTargetStatus,
  AttemptOutcome,
} from '@prisma/client';
import { ScheduledPostContentSnapshot } from '@packages/shared';

@Injectable()
export class PublishingReconcilerService {
  private readonly logger = new Logger(PublishingReconcilerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenVault: TokenVaultService,
    private readonly publisherFactory: PublisherFactoryService,
    private readonly repository: ScheduledPostsRepository,
  ) {}

  async reconcileTarget(targetId: string): Promise<{
    reconciled: boolean;
    status: PublishTargetStatus;
    externalPostId?: string;
  }> {
    const target = await this.prisma.scheduledPostTarget.findUnique({
      where: { id: targetId },
      include: {
        scheduledPost: true,
        socialAccount: true,
      },
    });

    if (!target) {
      throw new NotFoundException(`Target [${targetId}] not found for reconciliation`);
    }

    this.logger.log(`Starting reconciliation for target [${targetId}], account [${target.socialAccount.accountName}]`);

    // 1. Decrypt token safely
    let decryptedToken: string;
    try {
      decryptedToken = this.tokenVault.decrypt(target.socialAccount.encryptedAccessToken);
    } catch (err: any) {
      this.logger.error(`Failed to decrypt token for target [${targetId}]: ${err.message}`);
      await this.repository.updateTargetStatus(targetId, PublishTargetStatus.AUTH_REQUIRED, {
        errorCode: 'DECRYPTION_FAILED',
        errorMessage: 'Unable to decrypt social account access token',
      });
      await this.repository.recalculateParentStatus(target.scheduledPostId);
      return { reconciled: false, status: PublishTargetStatus.AUTH_REQUIRED };
    }

    // 2. Resolve publisher and verify with provider
    const publisher = this.publisherFactory.getPublisher(
      target.platform,
      target.socialAccount.provider,
    );

    const snapshot = target.scheduledPost.contentSnapshot as unknown as ScheduledPostContentSnapshot;

    const verification = await publisher.verifyExistingPost(
      target,
      snapshot,
      target.socialAccount,
      decryptedToken,
    );

    if (verification.found && verification.externalPostId) {
      this.logger.log(
        `[Reconciler] Post verified as already created on platform! Post ID: ${verification.externalPostId}. Marking target as PUBLISHED to prevent duplicate posting.`,
      );

      // Record successful reconciliation attempt
      await this.repository.recordAttempt(targetId, {
        attemptNumber: target.attemptCount + 1,
        outcome: AttemptOutcome.SUCCESS,
        externalPostId: verification.externalPostId,
        reconciliationStatus: 'RECONCILED_SUCCESS',
        metadata: {
          externalPostUrl: verification.externalPostUrl,
          postedAt: verification.postedAt?.toISOString(),
        },
      });

      // Update target to PUBLISHED
      await this.repository.updateTargetStatus(targetId, PublishTargetStatus.PUBLISHED, {
        externalPostId: verification.externalPostId,
        externalPostUrl: verification.externalPostUrl,
        publishedAt: verification.postedAt || new Date(),
      });

      // Recalculate parent
      await this.repository.recalculateParentStatus(target.scheduledPostId);

      return {
        reconciled: true,
        status: PublishTargetStatus.PUBLISHED,
        externalPostId: verification.externalPostId,
      };
    } else {
      this.logger.log(`[Reconciler] Post not found on platform for target [${targetId}]. Safe to retry or mark failed.`);

      // Not found on platform: record confirmed not found
      await this.repository.recordAttempt(targetId, {
        attemptNumber: target.attemptCount + 1,
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        reconciliationStatus: 'CONFIRMED_NOT_FOUND',
      });

      let nextStatus: PublishTargetStatus = PublishTargetStatus.RETRYING;
      let nextRetryAt = new Date(Date.now() + 5 * 60 * 1000);

      if (target.attemptCount >= target.maxAttempts) {
        nextStatus = PublishTargetStatus.FAILED;
      }

      await this.repository.updateTargetStatus(targetId, nextStatus, {
        nextRetryAt: nextStatus === PublishTargetStatus.RETRYING ? nextRetryAt : undefined,
      });

      await this.repository.recalculateParentStatus(target.scheduledPostId);

      return { reconciled: false, status: nextStatus };
    }
  }
}
