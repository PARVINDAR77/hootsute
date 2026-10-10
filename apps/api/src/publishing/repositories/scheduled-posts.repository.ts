import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ScheduledPost,
  ScheduledPostTarget,
  ScheduledPostStatus,
  PublishTargetStatus,
  AttemptOutcome,
  SocialPlatform,
  Prisma,
} from '@prisma/client';

export interface CreateScheduledPostData {
  workspaceId: string;
  draftId: string;
  createdById: string;
  scheduledAt: Date;
  timezone: string;
  approvedRevisionNumber: number;
  contentSnapshot: any;
  snapshotHash: string;
  targets: {
    socialAccountId: string;
    platform: SocialPlatform;
    variantId?: string;
    idempotencyKey?: string;
  }[];
}

@Injectable()
export class ScheduledPostsRepository {
  private readonly logger = new Logger(ScheduledPostsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createScheduledPost(data: CreateScheduledPostData) {
    return this.prisma.$transaction(async (tx) => {
      const scheduledPost = await tx.scheduledPost.create({
        data: {
          workspaceId: data.workspaceId,
          draftId: data.draftId,
          createdById: data.createdById,
          scheduledAt: data.scheduledAt,
          timezone: data.timezone,
          status: ScheduledPostStatus.SCHEDULED,
          approvedRevisionNumber: data.approvedRevisionNumber,
          contentSnapshot: data.contentSnapshot,
          snapshotHash: data.snapshotHash,
          targets: {
            create: data.targets.map((t) => ({
              socialAccountId: t.socialAccountId,
              platform: t.platform,
              variantId: t.variantId || null,
              status: PublishTargetStatus.PENDING,
              idempotencyKey: t.idempotencyKey || crypto.randomUUID(),
            })),
          },
        },
        include: {
          targets: {
            include: {
              socialAccount: {
                select: {
                  id: true,
                  accountName: true,
                  accountUsername: true,
                  accountType: true,
                  provider: true,
                  profileImageUrl: true,
                  connectionStatus: true,
                },
              },
            },
          },
          draft: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return scheduledPost;
    });
  }

  async findById(workspaceId: string, id: string) {
    return this.prisma.scheduledPost.findFirst({
      where: { id, workspaceId },
      include: {
        targets: {
          include: {
            socialAccount: {
              select: {
                id: true,
                accountName: true,
                accountUsername: true,
                accountType: true,
                provider: true,
                profileImageUrl: true,
                connectionStatus: true,
              },
            },
            attempts: {
              orderBy: { attemptNumber: 'desc' },
            },
          },
        },
        draft: {
          select: {
            id: true,
            title: true,
            status: true,
            objective: true,
            contentType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        cancelledBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findMany(
    workspaceId: string,
    filters: {
      status?: ScheduledPostStatus;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: { page: number; limit: number },
  ) {
    const where: Prisma.ScheduledPostWhereInput = {
      workspaceId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            scheduledAt: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
    };

    const skip = (pagination.page - 1) * pagination.limit;

    const [total, items] = await Promise.all([
      this.prisma.scheduledPost.count({ where }),
      this.prisma.scheduledPost.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          targets: {
            include: {
              socialAccount: {
                select: {
                  id: true,
                  accountName: true,
                  accountUsername: true,
                  accountType: true,
                  provider: true,
                },
              },
            },
          },
          draft: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return { total, page: pagination.page, limit: pagination.limit, items };
  }

  async findForCalendar(workspaceId: string, startDate: Date, endDate: Date) {
    return this.prisma.scheduledPost.findMany({
      where: {
        workspaceId,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        targets: {
          include: {
            socialAccount: {
              select: {
                id: true,
                accountName: true,
                accountType: true,
                provider: true,
                profileImageUrl: true,
              },
            },
          },
        },
        draft: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async reschedulePost(id: string, newScheduledAt: Date, timezone?: string) {
    return this.prisma.scheduledPost.update({
      where: { id },
      data: {
        scheduledAt: newScheduledAt,
        ...(timezone ? { timezone } : {}),
        status: ScheduledPostStatus.SCHEDULED,
      },
      include: {
        targets: true,
      },
    });
  }

  async cancelPost(id: string, cancelledById: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.scheduledPost.update({
        where: { id },
        data: {
          status: ScheduledPostStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById,
          cancellationReason: reason || null,
        },
      });

      await tx.scheduledPostTarget.updateMany({
        where: {
          scheduledPostId: id,
          status: { in: [PublishTargetStatus.PENDING, PublishTargetStatus.RETRYING] },
        },
        data: {
          status: PublishTargetStatus.CANCELLED,
        },
      });

      return updated;
    });
  }

  async atomicClaimDueTarget(targetId: string): Promise<ScheduledPostTarget | null> {
    // Atomically claim target if still in claimable status (PENDING or RETRYING)
    const result = await this.prisma.$transaction(async (tx) => {
      const target = await tx.scheduledPostTarget.findUnique({
        where: { id: targetId },
        include: { scheduledPost: true },
      });

      if (!target) return null;

      if (
        target.status !== PublishTargetStatus.PENDING &&
        target.status !== PublishTargetStatus.RETRYING
      ) {
        return null;
      }

      if (target.scheduledPost.status === ScheduledPostStatus.CANCELLED) {
        return null;
      }

      const updated = await tx.scheduledPostTarget.update({
        where: { id: targetId },
        data: {
          status: PublishTargetStatus.DISPATCHING,
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
        include: {
          scheduledPost: true,
          socialAccount: true,
        },
      });

      // Update parent status to PROCESSING if currently SCHEDULED
      if (target.scheduledPost.status === ScheduledPostStatus.SCHEDULED) {
        await tx.scheduledPost.update({
          where: { id: target.scheduledPostId },
          data: { status: ScheduledPostStatus.PROCESSING },
        });
      }

      return updated;
    });

    return result;
  }

  async recordAttempt(
    targetId: string,
    data: {
      attemptNumber: number;
      outcome: AttemptOutcome;
      sanitizedErrorCode?: string;
      sanitizedErrorMessage?: string;
      externalPostId?: string;
      reconciliationStatus?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.prisma.publishingAttempt.create({
      data: {
        targetId,
        attemptNumber: data.attemptNumber,
        outcome: data.outcome,
        sanitizedErrorCode: data.sanitizedErrorCode || null,
        sanitizedErrorMessage: data.sanitizedErrorMessage || null,
        externalPostId: data.externalPostId || null,
        reconciliationStatus: data.reconciliationStatus || null,
        reconciledAt: data.reconciliationStatus ? new Date() : null,
        completedAt: new Date(),
        metadata: data.metadata || null,
      },
    });
  }

  async updateTargetStatus(
    targetId: string,
    status: PublishTargetStatus,
    data?: {
      externalPostId?: string;
      externalPostUrl?: string;
      publishedAt?: Date;
      nextRetryAt?: Date;
      errorCode?: string;
      errorMessage?: string;
      rawResponse?: Record<string, any>;
    },
  ) {
    return this.prisma.scheduledPostTarget.update({
      where: { id: targetId },
      data: {
        status,
        ...(data?.externalPostId ? { externalPostId: data.externalPostId } : {}),
        ...(data?.externalPostUrl ? { externalPostUrl: data.externalPostUrl } : {}),
        ...(data?.publishedAt ? { publishedAt: data.publishedAt } : {}),
        ...(data?.nextRetryAt !== undefined ? { nextRetryAt: data.nextRetryAt } : {}),
        ...(data?.errorCode ? { errorCode: data.errorCode } : {}),
        ...(data?.errorMessage ? { errorMessage: data.errorMessage } : {}),
        ...(data?.rawResponse ? { rawResponse: data.rawResponse } : {}),
      },
    });
  }

  async updatePostStatus(id: string, status: ScheduledPostStatus) {
    return this.prisma.scheduledPost.update({
      where: { id },
      data: { status },
    });
  }

  async recalculateParentStatus(scheduledPostId: string): Promise<ScheduledPostStatus> {
    return this.prisma.$transaction(async (tx) => {
      const targets = await tx.scheduledPostTarget.findMany({
        where: { scheduledPostId },
        select: { status: true },
      });

      if (!targets.length) return ScheduledPostStatus.FAILED;

      const statuses = targets.map((t) => t.status);

      let newStatus: ScheduledPostStatus;

      const allPublished = statuses.every((s) => s === PublishTargetStatus.PUBLISHED);
      const somePublished = statuses.some((s) => s === PublishTargetStatus.PUBLISHED);
      const allFailed = statuses.every(
        (s) =>
          s === PublishTargetStatus.FAILED ||
          s === PublishTargetStatus.AUTH_REQUIRED ||
          s === PublishTargetStatus.CANCELLED,
      );
      const anyDispatching = statuses.some(
        (s) =>
          s === PublishTargetStatus.DISPATCHING ||
          s === PublishTargetStatus.RETRYING ||
          s === PublishTargetStatus.AMBIGUOUS_TIMEOUT,
      );

      if (allPublished) {
        newStatus = ScheduledPostStatus.PUBLISHED;
      } else if (somePublished && allFailed) {
        newStatus = ScheduledPostStatus.PARTIALLY_PUBLISHED;
      } else if (somePublished) {
        newStatus = ScheduledPostStatus.PARTIALLY_PUBLISHED;
      } else if (allFailed) {
        newStatus = ScheduledPostStatus.FAILED;
      } else if (anyDispatching) {
        newStatus = ScheduledPostStatus.PROCESSING;
      } else {
        newStatus = ScheduledPostStatus.SCHEDULED;
      }

      await tx.scheduledPost.update({
        where: { id: scheduledPostId },
        data: { status: newStatus },
      });

      return newStatus;
    });
  }
}
