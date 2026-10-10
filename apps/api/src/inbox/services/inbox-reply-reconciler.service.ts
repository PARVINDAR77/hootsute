import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { InboxAdapterFactory } from '../adapters/inbox-adapter.factory';
import {
  ReplyAttemptStatus,
  InteractionWorkflowStatus,
  Prisma,
} from '@prisma/client';
import * as crypto from 'crypto';

export type ReconciliationOutcome =
  | 'CONFIRMED_VIA_PROVIDER'
  | 'CONFIRMED_NOT_SENT'
  | 'CONFIRMED_VIA_WEBHOOK'
  | 'RETRY_SCHEDULED'
  | 'UNRESOLVED_MAX_RETRIES'
  | 'UNRESOLVED_PROVIDER_UNSUPPORTED'
  | 'CLAIM_FAILED'
  | 'ALREADY_COMPLETED'
  | 'SKIPPED_NOT_ELIGIBLE';

export interface ReconciliationResult {
  attemptId: string;
  outcome: ReconciliationOutcome;
  previousStatus: ReplyAttemptStatus;
  currentStatus: ReplyAttemptStatus;
  externalReplyId?: string | null;
  retryCount?: number;
  reason?: string;
}

export interface ReconciliationStats {
  pendingStale: number;
  ambiguousTimeout: number;
  unresolvedNeedsReview: number;
  reconciledSent: number;
  confirmedFailed: number;
  lastRunAt: string | null;
}

@Injectable()
export class InboxReplyReconcilerService {
  private readonly logger = new Logger(InboxReplyReconcilerService.name);
  private readonly workerId: string;
  private readonly maxRetries = 3;
  private readonly lockTtlMs = 60_000; // 60 seconds claim lock
  private lastRunAt: Date | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenVault: TokenVaultService,
    private readonly adapterFactory: InboxAdapterFactory,
    private readonly configService: ConfigService,
  ) {
    this.workerId = `worker_${process.pid}_${crypto.randomBytes(4).toString('hex')}`;
    this.logger.log(`InboxReplyReconciler initialized with worker ID [${this.workerId}]`);
  }

  getWorkerId(): string {
    return this.workerId;
  }

  /**
   * Periodic reconciliation sweep every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleScheduledReconciliation() {
    const disabled =
      this.configService.get<boolean>('inbox.reconciler.disabled') ||
      process.env.DISABLE_REPLY_RECONCILER === 'true';

    if (disabled) {
      return;
    }

    try {
      await this.reconcileAllPending();
    } catch (err: any) {
      this.logger.error(`Error during scheduled inbox reply reconciliation: ${err.message}`, err.stack);
    }
  }

  /**
   * Reconciles all eligible pending or ambiguous reply attempts across workspaces (or for a single workspace)
   */
  async reconcileAllPending(workspaceId?: string): Promise<ReconciliationResult[]> {
    this.lastRunAt = new Date();
    const candidates = await this.findEligibleAttempts(workspaceId);
    const results: ReconciliationResult[] = [];

    for (const candidate of candidates) {
      const res = await this.reconcileAttempt(candidate.id, this.workerId, workspaceId);
      results.push(res);
    }

    return results;
  }

  /**
   * Finds candidate attempts eligible for reconciliation:
   * 1. Status is AMBIGUOUS_TIMEOUT, OR
   * 2. Status is PENDING and created more than 2 minutes ago (stale in-flight)
   * 3. Not already marked UNRESOLVED_NEEDS_REVIEW or permanently completed
   * 4. Lock has not been taken recently by another active worker
   */
  async findEligibleAttempts(workspaceId?: string) {
    const stalePendingCutoff = new Date(Date.now() - 2 * 60 * 1000);
    const lockExpiryCutoff = new Date(Date.now() - this.lockTtlMs);

    const where: Prisma.InteractionReplyAttemptWhereInput = {
      ...(workspaceId ? { workspaceId } : {}),
      OR: [
        { status: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT },
        {
          status: ReplyAttemptStatus.PENDING,
          createdAt: { lte: stalePendingCutoff },
        },
      ],
      // Exclude attempts already flagged for manual operator review
      NOT: [
        { errorCode: 'UNRESOLVED_NEEDS_REVIEW' },
        { errorCode: 'PROVIDER_CONFIRMED_NOT_SENT' },
        {
          errorCode: { startsWith: 'CLAIMED_BY_' },
          updatedAt: { gte: lockExpiryCutoff },
        },
      ],
    };

    return this.prisma.interactionReplyAttempt.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: {
        id: true,
        workspaceId: true,
        status: true,
        errorCode: true,
        rawResponse: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Atomically claims a reply attempt for a specific worker
   * Prevents race conditions and duplicate processing across concurrent workers/instances
   */
  async claimAttempt(attemptId: string, claimingWorkerId: string): Promise<boolean> {
    const lockExpiryCutoff = new Date(Date.now() - this.lockTtlMs);

    const updateResult = await this.prisma.interactionReplyAttempt.updateMany({
      where: {
        id: attemptId,
        status: { in: [ReplyAttemptStatus.AMBIGUOUS_TIMEOUT, ReplyAttemptStatus.PENDING] },
        OR: [
          { errorCode: null },
          { NOT: { errorCode: { startsWith: 'CLAIMED_BY_' } } },
          { updatedAt: { lt: lockExpiryCutoff } }, // previous claim expired
        ],
        NOT: [
          { errorCode: 'UNRESOLVED_NEEDS_REVIEW' },
          { errorCode: 'PROVIDER_CONFIRMED_NOT_SENT' },
        ],
      },
      data: {
        errorCode: `CLAIMED_BY_${claimingWorkerId}`,
      },
    });

    return updateResult.count > 0;
  }

  /**
   * Core reconciliation workflow for a single reply attempt
   */
  async reconcileAttempt(
    attemptId: string,
    workerId: string = this.workerId,
    enforceWorkspaceId?: string,
  ): Promise<ReconciliationResult> {
    // 1. Try to acquire atomic worker claim lock
    const claimed = await this.claimAttempt(attemptId, workerId);
    if (!claimed) {
      this.logger.debug(`Reconciliation claim skipped or failed for attempt [${attemptId}]: claimed by another worker or already finalized.`);
      return {
        attemptId,
        outcome: 'CLAIM_FAILED',
        previousStatus: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
        currentStatus: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
        reason: 'Attempt could not be claimed (already processing or finalized).',
      };
    }

    // 2. Fetch full attempt with associated interaction and social account
    const attempt = await this.prisma.interactionReplyAttempt.findUnique({
      where: { id: attemptId },
      include: {
        interaction: {
          include: {
            socialAccount: true,
          },
        },
      },
    });

    if (!attempt || !attempt.interaction || !attempt.interaction.socialAccount) {
      await this.releaseClaim(attemptId, 'ORPHANED_RECORD');
      return {
        attemptId,
        outcome: 'SKIPPED_NOT_ELIGIBLE',
        previousStatus: attempt?.status || ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
        currentStatus: attempt?.status || ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
        reason: 'Attempt or associated interaction/social account not found.',
      };
    }

    // Workspace isolation check
    if (enforceWorkspaceId && attempt.workspaceId !== enforceWorkspaceId) {
      await this.releaseClaim(attemptId, 'WORKSPACE_MISMATCH');
      return {
        attemptId,
        outcome: 'SKIPPED_NOT_ELIGIBLE',
        previousStatus: attempt.status,
        currentStatus: attempt.status,
        reason: 'Attempt does not belong to specified workspace.',
      };
    }

    // Safety: Never process already completed (SENT) attempts
    if (attempt.status === ReplyAttemptStatus.SENT) {
      await this.releaseClaim(attemptId, null);
      return {
        attemptId,
        outcome: 'ALREADY_COMPLETED',
        previousStatus: ReplyAttemptStatus.SENT,
        currentStatus: ReplyAttemptStatus.SENT,
        externalReplyId: attempt.externalReplyId,
        reason: 'Attempt was already marked SENT.',
      };
    }

    const { interaction } = attempt;
    const { socialAccount } = interaction;
    const previousStatus = attempt.status;

    // Extract retry count from rawResponse
    const rawObj = (attempt.rawResponse as Record<string, any>) || {};
    const retryCount = (rawObj.reconciliation?.retries || 0) + 1;

    // 3. STEP A: Check local webhook arrivals & interaction state
    // If webhook processed a reply or marked interaction resolved
    const existingInboundReply = await this.prisma.socialInteraction.findFirst({
      where: {
        workspaceId: attempt.workspaceId,
        socialAccountId: socialAccount.id,
        parentExternalId: interaction.externalInteractionId,
        isFromPageOrAccount: true,
        content: attempt.content,
      },
    });

    if (existingInboundReply || (interaction.workflowStatus === InteractionWorkflowStatus.RESOLVED && attempt.externalReplyId)) {
      const resolvedExternalId = existingInboundReply?.externalInteractionId || attempt.externalReplyId || 'webhook_confirmed';

      const commitRes = await this.prisma.interactionReplyAttempt.updateMany({
        where: { id: attemptId, errorCode: `CLAIMED_BY_${workerId}` },
        data: {
          status: ReplyAttemptStatus.SENT,
          externalReplyId: resolvedExternalId,
          errorCode: null,
          errorMessage: null,
          rawResponse: {
            ...rawObj,
            reconciliation: {
              reconciledAt: new Date().toISOString(),
              workerId,
              outcome: 'CONFIRMED_VIA_WEBHOOK',
              externalReplyId: resolvedExternalId,
            },
          },
        },
      });

      if (commitRes.count === 0) {
        this.logger.warn(`Stale worker [${workerId}] lost claim lease on attempt [${attemptId}]. Aborting update.`);
        return {
          attemptId,
          outcome: 'CLAIM_FAILED',
          previousStatus,
          currentStatus: previousStatus,
          reason: 'Worker lost claim lease before committing update.',
        };
      }

      // Ensure interaction is resolved
      await this.ensureInteractionResolved(interaction.id, attempt.authorUserId);

      // Audit log
      await this.createReconciliationAuditLog(
        attempt.workspaceId,
        attempt.authorUserId,
        attempt.id,
        'REPLY_RECONCILED_VIA_WEBHOOK',
        { externalReplyId: resolvedExternalId },
      );

      this.logger.log(`Attempt [${attemptId}] successfully reconciled via webhook data.`);
      return {
        attemptId,
        outcome: 'CONFIRMED_VIA_WEBHOOK',
        previousStatus,
        currentStatus: ReplyAttemptStatus.SENT,
        externalReplyId: resolvedExternalId,
      };
    }

    // 4. STEP B: Check with Provider via Adapter
    let decryptedToken: string;
    try {
      decryptedToken = this.tokenVault.decrypt(socialAccount.encryptedAccessToken);
    } catch (err: any) {
      await this.prisma.interactionReplyAttempt.updateMany({
        where: { id: attemptId, errorCode: `CLAIMED_BY_${workerId}` },
        data: {
          status: ReplyAttemptStatus.FAILED,
          errorCode: 'TOKEN_DECRYPTION_ERROR',
          errorMessage: 'Token decryption failed during reconciliation.',
        },
      });
      return {
        attemptId,
        outcome: 'CONFIRMED_NOT_SENT',
        previousStatus,
        currentStatus: ReplyAttemptStatus.FAILED,
        reason: 'Token decryption failed.',
      };
    }

    const adapter = this.adapterFactory.getAdapter(socialAccount);
    if (!adapter.checkReplyStatus) {
      // Provider does not support active status checking
      await this.prisma.interactionReplyAttempt.updateMany({
        where: { id: attemptId, errorCode: `CLAIMED_BY_${workerId}` },
        data: {
          status: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
          errorCode: 'UNRESOLVED_NEEDS_REVIEW',
          errorMessage: 'Provider does not support active reply verification. Manual review required to avoid duplicates.',
          rawResponse: {
            ...rawObj,
            reconciliation: {
              reconciledAt: new Date().toISOString(),
              workerId,
              outcome: 'UNRESOLVED_PROVIDER_UNSUPPORTED',
            },
          },
        },
      });

      this.logger.warn(`Attempt [${attemptId}] flagged UNRESOLVED_NEEDS_REVIEW: provider adapter lacks status check.`);
      return {
        attemptId,
        outcome: 'UNRESOLVED_PROVIDER_UNSUPPORTED',
        previousStatus,
        currentStatus: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
        reason: 'Provider does not support status verification.',
      };
    }

    const checkResult = await adapter.checkReplyStatus(
      socialAccount,
      decryptedToken,
      interaction,
      attempt.content,
      attempt.createdAt,
    );

    // 5. Evaluate Provider Check Result
    if (checkResult.status === 'CONFIRMED_SENT' && checkResult.externalReplyId) {
      // Confirmed posted on provider!
      const commitRes = await this.prisma.interactionReplyAttempt.updateMany({
        where: { id: attemptId, errorCode: `CLAIMED_BY_${workerId}` },
        data: {
          status: ReplyAttemptStatus.SENT,
          externalReplyId: checkResult.externalReplyId,
          errorCode: null,
          errorMessage: null,
          rawResponse: {
            ...rawObj,
            reconciliation: {
              reconciledAt: new Date().toISOString(),
              workerId,
              outcome: 'CONFIRMED_VIA_PROVIDER',
              externalReplyId: checkResult.externalReplyId,
            },
          },
        },
      });

      if (commitRes.count === 0) {
        this.logger.warn(`Stale worker [${workerId}] lost claim lease on attempt [${attemptId}]. Aborting update.`);
        return {
          attemptId,
          outcome: 'CLAIM_FAILED',
          previousStatus,
          currentStatus: previousStatus,
          reason: 'Worker lost claim lease before committing update.',
        };
      }

      await this.ensureInteractionResolved(interaction.id, attempt.authorUserId);

      await this.createReconciliationAuditLog(
        attempt.workspaceId,
        attempt.authorUserId,
        attempt.id,
        'REPLY_RECONCILED_CONFIRMED_SENT',
        { externalReplyId: checkResult.externalReplyId },
      );

      this.logger.log(`Attempt [${attemptId}] confirmed SENT on provider with external ID [${checkResult.externalReplyId}].`);
      return {
        attemptId,
        outcome: 'CONFIRMED_VIA_PROVIDER',
        previousStatus,
        currentStatus: ReplyAttemptStatus.SENT,
        externalReplyId: checkResult.externalReplyId,
      };
    }

    if (checkResult.status === 'CONFIRMED_NOT_SENT') {
      // Confirmed absent on provider! Mark failed and safe for manual retry
      const commitRes = await this.prisma.interactionReplyAttempt.updateMany({
        where: { id: attemptId, errorCode: `CLAIMED_BY_${workerId}` },
        data: {
          status: ReplyAttemptStatus.FAILED,
          errorCode: 'PROVIDER_CONFIRMED_NOT_SENT',
          errorMessage: 'Provider confirmed reply was not posted. Safe to retry manually.',
          rawResponse: {
            ...rawObj,
            reconciliation: {
              reconciledAt: new Date().toISOString(),
              workerId,
              outcome: 'CONFIRMED_NOT_SENT',
              canRetry: true,
            },
          },
        },
      });

      if (commitRes.count === 0) {
        this.logger.warn(`Stale worker [${workerId}] lost claim lease on attempt [${attemptId}]. Aborting update.`);
        return {
          attemptId,
          outcome: 'CLAIM_FAILED',
          previousStatus,
          currentStatus: previousStatus,
          reason: 'Worker lost claim lease before committing update.',
        };
      }

      await this.createReconciliationAuditLog(
        attempt.workspaceId,
        attempt.authorUserId,
        attempt.id,
        'REPLY_RECONCILED_CONFIRMED_NOT_SENT',
        { reason: 'Provider confirmed reply was not created.' },
      );

      this.logger.log(`Attempt [${attemptId}] confirmed NOT sent on provider. Safe to retry.`);
      return {
        attemptId,
        outcome: 'CONFIRMED_NOT_SENT',
        previousStatus,
        currentStatus: ReplyAttemptStatus.FAILED,
        reason: 'Provider confirmed reply was not created.',
      };
    }

    // 6. Ambiguous Provider Response — apply bounded retries and exponential backoff
    if (retryCount >= this.maxRetries) {
      // Bounded retries exhausted — retain status and flag for operator review
      await this.prisma.interactionReplyAttempt.updateMany({
        where: { id: attemptId, errorCode: `CLAIMED_BY_${workerId}` },
        data: {
          status: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
          errorCode: 'UNRESOLVED_NEEDS_REVIEW',
          errorMessage: `Maximum reconciliation retries (${this.maxRetries}) reached. Outcome remains ambiguous.`,
          rawResponse: {
            ...rawObj,
            reconciliation: {
              lastAttemptAt: new Date().toISOString(),
              workerId,
              retries: retryCount,
              outcome: 'UNRESOLVED_MAX_RETRIES',
              lastReason: checkResult.reason,
            },
          },
        },
      });

      this.logger.warn(`Attempt [${attemptId}] reached max reconciliation retries. Flagged UNRESOLVED_NEEDS_REVIEW.`);
      return {
        attemptId,
        outcome: 'UNRESOLVED_MAX_RETRIES',
        previousStatus,
        currentStatus: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
        retryCount,
        reason: checkResult.reason || 'Max retries exhausted.',
      };
    }

    // Backoff and release claim for next sweep
    await this.prisma.interactionReplyAttempt.updateMany({
      where: { id: attemptId, errorCode: `CLAIMED_BY_${workerId}` },
      data: {
        errorCode: 'RECONCILIATION_BACKOFF',
        rawResponse: {
          ...rawObj,
          reconciliation: {
            lastAttemptAt: new Date().toISOString(),
            workerId,
            retries: retryCount,
            outcome: 'RETRY_SCHEDULED',
            lastReason: checkResult.reason,
          },
        },
      },
    });

    this.logger.log(`Attempt [${attemptId}] remains ambiguous (retry ${retryCount}/${this.maxRetries}). Backoff scheduled.`);
    return {
      attemptId,
      outcome: 'RETRY_SCHEDULED',
      previousStatus,
      currentStatus: attempt.status,
      retryCount,
      reason: checkResult.reason || 'Provider outcome remains ambiguous.',
    };
  }

  private async releaseClaim(attemptId: string, newErrorCode: string | null, workerId?: string) {
    try {
      await this.prisma.interactionReplyAttempt.updateMany({
        where: {
          id: attemptId,
          ...(workerId ? { errorCode: `CLAIMED_BY_${workerId}` } : {}),
        },
        data: {
          errorCode: newErrorCode,
        },
      });
    } catch (err: any) {
      this.logger.debug(`Could not release claim on attempt [${attemptId}]: ${err.message}`);
    }
  }

  private async ensureInteractionResolved(interactionId: string, resolvedByUserId: string) {
    try {
      await this.prisma.socialInteraction.update({
        where: { id: interactionId },
        data: {
          workflowStatus: InteractionWorkflowStatus.RESOLVED,
          isRead: true,
          resolvedAt: new Date(),
          resolvedByUserId,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not update interaction status to RESOLVED: ${err.message}`);
    }
  }

  private async createReconciliationAuditLog(
    workspaceId: string,
    actorUserId: string,
    attemptId: string,
    action: string,
    metadata: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId,
          actorUserId,
          action,
          entityType: 'InteractionReplyAttempt',
          entityId: attemptId,
          metadata,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to create audit log for reconciliation: ${err.message}`);
    }
  }

  /**
   * Observability metrics for operators
   */
  async getReconciliationStats(workspaceId?: string): Promise<ReconciliationStats> {
    const stalePendingCutoff = new Date(Date.now() - 2 * 60 * 1000);
    const whereWorkspace = workspaceId ? { workspaceId } : {};

    const [pendingStale, ambiguousTimeout, unresolvedNeedsReview, reconciledSent, confirmedFailed] =
      await Promise.all([
        this.prisma.interactionReplyAttempt.count({
          where: {
            ...whereWorkspace,
            status: ReplyAttemptStatus.PENDING,
            createdAt: { lte: stalePendingCutoff },
          },
        }),
        this.prisma.interactionReplyAttempt.count({
          where: {
            ...whereWorkspace,
            status: ReplyAttemptStatus.AMBIGUOUS_TIMEOUT,
          },
        }),
        this.prisma.interactionReplyAttempt.count({
          where: {
            ...whereWorkspace,
            errorCode: 'UNRESOLVED_NEEDS_REVIEW',
          },
        }),
        this.prisma.interactionReplyAttempt.count({
          where: {
            ...whereWorkspace,
            status: ReplyAttemptStatus.SENT,
            rawResponse: { path: ['reconciliation', 'outcome'], not: Prisma.AnyNull },
          },
        }),
        this.prisma.interactionReplyAttempt.count({
          where: {
            ...whereWorkspace,
            errorCode: 'PROVIDER_CONFIRMED_NOT_SENT',
          },
        }),
      ]);

    return {
      pendingStale,
      ambiguousTimeout,
      unresolvedNeedsReview,
      reconciledSent,
      confirmedFailed,
      lastRunAt: this.lastRunAt ? this.lastRunAt.toISOString() : null,
    };
  }
}
