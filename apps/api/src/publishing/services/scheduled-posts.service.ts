import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScheduledPostsRepository } from '../repositories/scheduled-posts.repository';
import { CreateScheduledPostDto } from '../dto/create-scheduled-post.dto';
import { ReschedulePostDto } from '../dto/reschedule-post.dto';
import { CancelScheduledPostDto } from '../dto/cancel-scheduled-post.dto';
import { QueryScheduledPostsDto } from '../dto/query-scheduled-posts.dto';
import { QueryCalendarDto } from '../dto/query-calendar.dto';
import { RecordPublishingAttemptDto } from '../dto/record-attempt.dto';
import { BulkPublishCampaignDto } from '../dto/bulk-publish.dto';
import {
  WorkspaceRole,
  DraftStatus,
  SocialConnectionStatus,
  ScheduledPostStatus,
  PublishTargetStatus,
  AttemptOutcome,
  SocialPlatform,
} from '@prisma/client';
import { BulkPublishItemResultDto, BulkPublishResponseDto } from '@packages/shared';
import * as crypto from 'crypto';
import { computeSnapshotHash } from '../utils/canonical-json';

@Injectable()
export class ScheduledPostsService {
  private readonly logger = new Logger(ScheduledPostsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: ScheduledPostsRepository,
  ) {}

  async schedulePost(
    workspaceId: string,
    userId: string,
    userRole: WorkspaceRole,
    dto: CreateScheduledPostDto,
  ) {
    if (userRole === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Viewers do not have permission to schedule social media posts');
    }

    // 1. Verify Draft exists and belongs to workspace
    const draft = await this.prisma.contentDraft.findFirst({
      where: { id: dto.draftId, workspaceId },
      include: {
        variants: true,
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 5,
        },
      },
    });

    if (!draft) {
      throw new NotFoundException('Content draft not found in this workspace');
    }

    // 2. Strict Approval Verification: Only APPROVED drafts can be scheduled
    if (draft.status !== DraftStatus.APPROVED) {
      throw new BadRequestException(
        `Draft must be in APPROVED status to be scheduled. Current status: ${draft.status}`,
      );
    }

    // 3. Prevent duplicate target accounts in a single scheduled post
    const accountIds = dto.targets.map((t) => t.socialAccountId);
    const uniqueAccountIds = new Set(accountIds);
    if (uniqueAccountIds.size !== accountIds.length) {
      throw new BadRequestException(
        'Duplicate social accounts detected in targets. A post can only target a social account once.',
      );
    }

    // 4. Verify all selected SocialAccounts belong to this workspace and are active
    const socialAccounts = await this.prisma.socialAccount.findMany({
      where: {
        id: { in: accountIds },
      },
    });

    if (socialAccounts.length !== accountIds.length) {
      throw new NotFoundException('One or more selected social accounts were not found');
    }

    for (const acc of socialAccounts) {
      if (acc.workspaceId !== workspaceId) {
        throw new ForbiddenException(
          `Security violation: Social account [${acc.id}] does not belong to workspace [${workspaceId}]`,
        );
      }
      if (acc.connectionStatus !== SocialConnectionStatus.CONNECTED) {
        throw new BadRequestException(
          `Social account [${acc.accountName}] is not in CONNECTED status (current: ${acc.connectionStatus})`,
        );
      }
    }

    // 4b. Verify any referenced media assets are in READY status and belong to workspace
    for (const v of draft.variants) {
      if (v.mediaAssetId) {
        const media = await this.prisma.mediaAsset.findFirst({
          where: { id: v.mediaAssetId, workspaceId, deletedAt: null },
        });
        if (!media) {
          throw new BadRequestException(`Referenced media asset [${v.mediaAssetId}] not found in this workspace`);
        }
        if (media.processingStatus !== 'READY') {
          throw new BadRequestException(
            `Referenced media asset [${media.originalFilename}] is not ready for publishing (status: ${media.processingStatus})`,
          );
        }
      }
    }

    // 5. Resolve approved revision and build immutable content snapshot
    const approvedRevision =
      draft.revisions.find((r) => r.action === 'APPROVE') || draft.revisions[0];
    const approvedRevisionNumber = approvedRevision ? approvedRevision.revisionNumber : 1;

    // Filter or match variants
    const canonicalVariants = draft.variants.map((v) => ({
      id: v.id,
      platform: v.platform,
      headline: v.headline || null,
      body: v.body,
      callToAction: v.callToAction || null,
      hashtags: v.hashtags || [],
      linkUrl: v.linkUrl || null,
      mediaAssetUrl: v.mediaAssetUrl || null,
      mediaAssetId: v.mediaAssetId || null,
    }));

    const contentSnapshot = {
      draftId: draft.id,
      approvedRevisionNumber,
      title: draft.title,
      objective: draft.objective,
      contentType: draft.contentType,
      language: draft.language,
      variants: canonicalVariants,
      approvedAt: draft.approvedAt ? draft.approvedAt.toISOString() : null,
      approvedByUserId: draft.approvedByUserId,
    };

    // Deterministic SHA-256 integrity hash using canonical JSON
    const snapshotHash = computeSnapshotHash(contentSnapshot);

    const scheduledAtDate = new Date(dto.scheduledAt);

    // 6. Persist in database
    const scheduledPost = await this.repository.createScheduledPost({
      workspaceId,
      draftId: draft.id,
      createdById: userId,
      scheduledAt: scheduledAtDate,
      timezone: dto.timezone || 'UTC',
      approvedRevisionNumber,
      contentSnapshot,
      snapshotHash,
      targets: dto.targets.map((t) => ({
        socialAccountId: t.socialAccountId,
        platform: t.platform,
        variantId: t.variantId,
      })),
    });

    // 7. Audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: 'SCHEDULED_POST_CREATE',
        entityType: 'ScheduledPost',
        entityId: scheduledPost.id,
        metadata: {
          draftId: draft.id,
          scheduledAt: scheduledPost.scheduledAt.toISOString(),
          targetCount: scheduledPost.targets.length,
          snapshotHash,
        },
      },
    });

    return scheduledPost;
  }

  async getScheduledPost(workspaceId: string, id: string) {
    const post = await this.repository.findById(workspaceId, id);
    if (!post) {
      throw new NotFoundException('Scheduled post not found in this workspace');
    }
    return post;
  }

  async listScheduledPosts(workspaceId: string, query: QueryScheduledPostsDto) {
    const filters = {
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };
    const pagination = {
      page: query.page || 1,
      limit: query.limit || 20,
    };
    return this.repository.findMany(workspaceId, filters, pagination);
  }

  async getCalendarPosts(workspaceId: string, query: QueryCalendarDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate provided for calendar query');
    }
    return this.repository.findForCalendar(workspaceId, startDate, endDate);
  }

  async reschedulePost(
    workspaceId: string,
    id: string,
    userId: string,
    userRole: WorkspaceRole,
    dto: ReschedulePostDto,
  ) {
    if (userRole === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Viewers do not have permission to reschedule posts');
    }

    const post = await this.getScheduledPost(workspaceId, id);

    if (
      post.status !== ScheduledPostStatus.SCHEDULED &&
      post.status !== ScheduledPostStatus.FAILED &&
      post.status !== ScheduledPostStatus.NEEDS_REAPPROVAL
    ) {
      throw new BadRequestException(
        `Cannot reschedule post in ${post.status} status. Only SCHEDULED or FAILED posts can be rescheduled.`,
      );
    }

    const newScheduledAt = new Date(dto.scheduledAt);
    const updated = await this.repository.reschedulePost(id, newScheduledAt, dto.timezone);

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: 'SCHEDULED_POST_RESCHEDULE',
        entityType: 'ScheduledPost',
        entityId: id,
        metadata: {
          previousScheduledAt: post.scheduledAt.toISOString(),
          newScheduledAt: newScheduledAt.toISOString(),
          timezone: dto.timezone || post.timezone,
        },
      },
    });

    return updated;
  }

  async cancelScheduledPost(
    workspaceId: string,
    id: string,
    userId: string,
    userRole: WorkspaceRole,
    dto: CancelScheduledPostDto,
  ) {
    if (userRole === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Viewers do not have permission to cancel scheduled posts');
    }

    const post = await this.getScheduledPost(workspaceId, id);

    if (post.status === ScheduledPostStatus.PROCESSING) {
      throw new BadRequestException('Cannot cancel a post that is actively being dispatched');
    }

    if (post.status === ScheduledPostStatus.PUBLISHED) {
      throw new BadRequestException('Cannot cancel a post that has already been published');
    }

    if (post.status === ScheduledPostStatus.CANCELLED) {
      return post;
    }

    const cancelled = await this.repository.cancelPost(id, userId, dto.reason);

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: 'SCHEDULED_POST_CANCEL',
        entityType: 'ScheduledPost',
        entityId: id,
        metadata: {
          reason: dto.reason || null,
        },
      },
    });

    return cancelled;
  }

  /**
   * Domain Policy: If a draft is updated, unapproved, or rejected while scheduled,
   * all pending scheduled posts must be marked as NEEDS_REAPPROVAL to avoid publishing unreviewed changes.
   */
  async handleDraftModifiedOrUnapproved(workspaceId: string, draftId: string, reason: string) {
    const pendingPosts = await this.prisma.scheduledPost.findMany({
      where: {
        workspaceId,
        draftId,
        status: ScheduledPostStatus.SCHEDULED,
      },
    });

    for (const post of pendingPosts) {
      await this.prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: ScheduledPostStatus.NEEDS_REAPPROVAL },
      });

      await this.prisma.auditLog.create({
        data: {
          workspaceId,
          action: 'SCHEDULED_POST_NEEDS_REAPPROVAL',
          entityType: 'ScheduledPost',
          entityId: post.id,
          metadata: {
            draftId,
            reason,
          },
        },
      });
    }

    return pendingPosts.length;
  }

  /**
   * Atomically claims a due target for worker dispatching.
   * Safe against concurrent workers.
   */
  async claimTargetForDispatch(targetId: string) {
    return this.repository.atomicClaimDueTarget(targetId);
  }

  /**
   * Records an execution attempt and transitions target/parent status.
   */
  async recordAttemptAndTransition(targetId: string, dto: RecordPublishingAttemptDto) {
    const target = await this.prisma.scheduledPostTarget.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new NotFoundException(`Target [${targetId}] not found`);
    }

    // 1. Record immutable attempt entry
    const attempt = await this.repository.recordAttempt(targetId, {
      attemptNumber: target.attemptCount,
      outcome: dto.outcome,
      sanitizedErrorCode: dto.sanitizedErrorCode,
      sanitizedErrorMessage: dto.sanitizedErrorMessage,
      externalPostId: dto.externalPostId,
      reconciliationStatus: dto.reconciliationStatus,
      metadata: dto.metadata,
    });

    // 2. Compute target status based on outcome
    let nextTargetStatus: PublishTargetStatus;
    let nextRetryAt: Date | null = null;
    let publishedAt: Date | null = null;

    switch (dto.outcome) {
      case AttemptOutcome.SUCCESS:
        nextTargetStatus = PublishTargetStatus.PUBLISHED;
        publishedAt = new Date();
        break;
      case AttemptOutcome.AUTH_FAILURE:
        nextTargetStatus = PublishTargetStatus.AUTH_REQUIRED;
        break;
      case AttemptOutcome.AMBIGUOUS_TIMEOUT:
        nextTargetStatus = PublishTargetStatus.AMBIGUOUS_TIMEOUT;
        break;
      case AttemptOutcome.RATE_LIMITED:
      case AttemptOutcome.DEFINITIVE_FAILURE:
      default:
        if (target.attemptCount >= target.maxAttempts) {
          nextTargetStatus = PublishTargetStatus.FAILED;
        } else {
          nextTargetStatus = PublishTargetStatus.RETRYING;
          // Exponential backoff: 2^(attempt) * 5 minutes
          const backoffMinutes = Math.pow(2, target.attemptCount) * 5;
          nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        }
        break;
    }

    // 3. Update target
    await this.repository.updateTargetStatus(targetId, nextTargetStatus, {
      externalPostId: dto.externalPostId,
      externalPostUrl: dto.externalPostUrl,
      publishedAt: publishedAt || undefined,
      nextRetryAt: nextRetryAt || undefined,
      errorCode: dto.sanitizedErrorCode,
      errorMessage: dto.sanitizedErrorMessage,
    });

    // 4. Recalculate parent scheduled post status
    const parentStatus = await this.repository.recalculateParentStatus(target.scheduledPostId);

    return { attempt, targetStatus: nextTargetStatus, parentStatus };
  }

  async bulkPublishCampaigns(
    workspaceId: string,
    userId: string,
    userRole: WorkspaceRole,
    dto: BulkPublishCampaignDto,
    dispatchNowFn?: (targetId: string) => Promise<{ success: boolean }>,
  ): Promise<BulkPublishResponseDto> {
    if (userRole === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Viewers do not have permission to bulk publish campaigns');
    }

    const uniqueAccountIds = Array.from(new Set(dto.socialAccountIds));
    const uniqueDraftIds = Array.from(new Set(dto.draftIds));

    const accounts = await this.prisma.socialAccount.findMany({
      where: {
        id: { in: uniqueAccountIds },
        workspaceId,
        connectionStatus: SocialConnectionStatus.CONNECTED,
      },
    });

    if (accounts.length === 0) {
      throw new BadRequestException('No active connected social accounts matched the selection');
    }

    const baseStart =
      dto.dispatchMode === 'IMMEDIATE'
        ? new Date()
        : dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : new Date(Date.now() + 5 * 60 * 1000);

    if (isNaN(baseStart.getTime())) {
      throw new BadRequestException('Invalid scheduledAt timestamp');
    }

    const staggerMs = (dto.staggerMinutes || 10) * 60 * 1000;
    const autoAdapt = dto.autoAdaptMissingPlatform !== false;

    const results: BulkPublishItemResultDto[] = [];
    let totalTargetsQueued = 0;
    let publishedImmediately = 0;
    let scheduledCount = 0;
    let failedCount = 0;

    for (let index = 0; index < uniqueDraftIds.length; index++) {
      const draftId = uniqueDraftIds[index];
      const draft = await this.prisma.contentDraft.findFirst({
        where: { id: draftId, workspaceId },
        include: {
          variants: true,
          revisions: { orderBy: { revisionNumber: 'desc' }, take: 5 },
        },
      });

      if (!draft) {
        failedCount++;
        results.push({
          draftId,
          draftTitle: 'Unknown Draft',
          status: 'FAILED',
          targetCount: 0,
          publishedTargets: 0,
          failedTargets: 0,
          error: 'Draft not found in this workspace',
        });
        continue;
      }

      if (draft.status !== DraftStatus.APPROVED) {
        failedCount++;
        results.push({
          draftId: draft.id,
          draftTitle: draft.title,
          status: 'FAILED',
          targetCount: 0,
          publishedTargets: 0,
          failedTargets: 0,
          error: `Draft must be APPROVED before publishing (current: ${draft.status})`,
        });
        continue;
      }

      if (!draft.variants || draft.variants.length === 0) {
        failedCount++;
        results.push({
          draftId: draft.id,
          draftTitle: draft.title,
          status: 'FAILED',
          targetCount: 0,
          publishedTargets: 0,
          failedTargets: 0,
          error: 'Draft has no content variants',
        });
        continue;
      }

      const targetsInput: Array<{
        socialAccountId: string;
        platform: SocialPlatform;
        variantId?: string;
      }> = [];

      for (const acc of accounts) {
        const platform = this.providerToPlatform(acc.provider);
        const matchedVariant = draft.variants.find((v) => v.platform === platform);
        if (matchedVariant) {
          targetsInput.push({
            socialAccountId: acc.id,
            platform,
            variantId: matchedVariant.id,
          });
        } else if (autoAdapt) {
          targetsInput.push({
            socialAccountId: acc.id,
            platform,
            variantId: draft.variants[0].id,
          });
        }
      }

      if (targetsInput.length === 0) {
        failedCount++;
        results.push({
          draftId: draft.id,
          draftTitle: draft.title,
          status: 'FAILED',
          targetCount: 0,
          publishedTargets: 0,
          failedTargets: 0,
          error: 'No selected accounts matched the draft platforms',
        });
        continue;
      }

      const postScheduledAt =
        dto.dispatchMode === 'STAGGERED'
          ? new Date(baseStart.getTime() + index * staggerMs)
          : baseStart;

      const approvedRevision =
        draft.revisions.find((r) => r.action === 'APPROVE') || draft.revisions[0];
      const approvedRevisionNumber = approvedRevision ? approvedRevision.revisionNumber : 1;

      const canonicalVariants = draft.variants.map((v) => ({
        id: v.id,
        platform: v.platform,
        headline: v.headline || null,
        body: v.body,
        callToAction: v.callToAction || null,
        hashtags: v.hashtags || [],
        linkUrl: v.linkUrl || null,
        mediaAssetUrl: v.mediaAssetUrl || null,
        mediaAssetId: v.mediaAssetId || null,
      }));

      const contentSnapshot = {
        draftId: draft.id,
        approvedRevisionNumber,
        title: draft.title,
        objective: draft.objective,
        contentType: draft.contentType,
        language: draft.language,
        variants: canonicalVariants,
        approvedAt: draft.approvedAt ? draft.approvedAt.toISOString() : null,
        approvedByUserId: draft.approvedByUserId,
      };

      const snapshotHash = computeSnapshotHash(contentSnapshot);

      const scheduledPost = await this.repository.createScheduledPost({
        workspaceId,
        draftId: draft.id,
        createdById: userId,
        scheduledAt: postScheduledAt,
        timezone: dto.timezone || 'UTC',
        approvedRevisionNumber,
        contentSnapshot,
        snapshotHash,
        targets: targetsInput,
      });

      totalTargetsQueued += targetsInput.length;

      let pubCount = 0;
      let failTargetCount = 0;
      let itemStatus: BulkPublishItemResultDto['status'] = 'SCHEDULED';

      if (dto.dispatchMode === 'IMMEDIATE' && dispatchNowFn && scheduledPost.targets) {
        for (const t of scheduledPost.targets) {
          try {
            const res = await dispatchNowFn(t.id);
            if (res.success) pubCount++;
            else failTargetCount++;
          } catch {
            failTargetCount++;
          }
        }
        if (pubCount === scheduledPost.targets.length) {
          itemStatus = 'PUBLISHED';
          publishedImmediately++;
        } else if (pubCount > 0) {
          itemStatus = 'PARTIALLY_PUBLISHED';
          publishedImmediately++;
        } else {
          itemStatus = 'FAILED';
          failedCount++;
        }
      } else {
        scheduledCount++;
      }

      results.push({
        draftId: draft.id,
        draftTitle: draft.title,
        scheduledPostId: scheduledPost.id,
        scheduledAt: postScheduledAt.toISOString(),
        status: itemStatus,
        targetCount: targetsInput.length,
        publishedTargets: pubCount,
        failedTargets: failTargetCount,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: 'BULK_CAMPAIGN_PUBLISH',
        entityType: 'ScheduledPost',
        metadata: {
          dispatchMode: dto.dispatchMode,
          totalDraftsProcessed: uniqueDraftIds.length,
          totalTargetsQueued,
          publishedImmediately,
          scheduledCount,
          failedCount,
        },
      },
    });

    return {
      totalDraftsProcessed: uniqueDraftIds.length,
      totalTargetsQueued,
      publishedImmediately,
      scheduledCount,
      failedCount,
      results,
    };
  }

  private providerToPlatform(provider: string): SocialPlatform {
    switch (provider) {
      case 'META_FACEBOOK':
        return SocialPlatform.FACEBOOK;
      case 'META_INSTAGRAM':
        return SocialPlatform.INSTAGRAM;
      case 'LINKEDIN':
        return SocialPlatform.LINKEDIN;
      case 'TWITTER_X':
        return SocialPlatform.TWITTER_X;
      case 'PINTEREST':
        return SocialPlatform.PINTEREST;
      case 'YOUTUBE':
        return SocialPlatform.YOUTUBE;
      case 'TIKTOK':
        return SocialPlatform.TIKTOK;
      case 'THREADS':
        return SocialPlatform.THREADS;
      default:
        return SocialPlatform.FACEBOOK;
    }
  }
}
