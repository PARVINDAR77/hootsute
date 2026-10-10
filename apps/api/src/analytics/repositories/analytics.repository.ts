import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AccountAnalyticsSnapshot,
  PostAnalyticsSnapshot,
  AnalyticsSyncJob,
  AnalyticsSyncError,
  GrowthInsight,
  AnalyticsMetricPeriod,
  PostAnalyticsType,
  SocialPlatform,
  SyncJobStatus,
  SyncJobType,
  GrowthInsightCategory,
  Prisma,
} from '@prisma/client';
import * as crypto from 'crypto';

export interface UpsertAccountSnapshotParams {
  workspaceId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  period?: AnalyticsMetricPeriod;
  snapshotDate: Date;
  followersCount?: number | null;
  followersNetChange?: number | null;
  impressions?: number | null;
  reach?: number | null;
  profileViews?: number | null;
  websiteClicks?: number | null;
  engagementTotal?: number | null;
  engagementRate?: number | null;
  provenance?: string | null;
  rawMetrics?: Record<string, any> | null;
}

export interface UpsertPostSnapshotParams {
  workspaceId: string;
  socialAccountId: string;
  scheduledPostTargetId?: string | null;
  externalPostId: string;
  platform: SocialPlatform;
  postType?: PostAnalyticsType;
  publishedAt?: Date | null;
  snapshotDate: Date;
  likesCount?: number | null;
  commentsCount?: number | null;
  sharesCount?: number | null;
  savesCount?: number | null;
  impressions?: number | null;
  reach?: number | null;
  clicks?: number | null;
  videoViews?: number | null;
  watchTimeMs?: bigint | number | null;
  engagementRate?: number | null;
  provenance?: string | null;
  rawMetrics?: Record<string, any> | null;
}

export interface QueryAccountSnapshotsParams {
  workspaceId: string;
  socialAccountId?: string;
  platform?: SocialPlatform;
  period?: AnalyticsMetricPeriod;
  startDate: Date;
  endDate: Date;
}

export interface QueryPostSnapshotsParams {
  workspaceId: string;
  socialAccountId?: string;
  platform?: SocialPlatform;
  externalPostId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreateSyncJobParams {
  workspaceId: string;
  socialAccountId?: string | null;
  jobType: SyncJobType;
  leaseDurationMs?: number;
  metadata?: Record<string, any>;
}

export interface CompleteSyncJobParams {
  jobId: string;
  claimToken: string;
  status: SyncJobStatus;
  itemsProcessed: number;
  itemsFailed: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any>;
}

export interface RecordSyncErrorParams {
  syncJobId: string;
  socialAccountId?: string | null;
  externalPostId?: string | null;
  errorCode: string;
  errorMessage: string;
  httpStatus?: number | null;
  isPermissionError?: boolean;
}

export interface CreateGrowthInsightParams {
  workspaceId: string;
  category: GrowthInsightCategory;
  title: string;
  summary: string;
  suggestedAction: string;
  evidence: Record<string, any>;
  confidenceScore: number;
  expiresAt?: Date | null;
}

/**
 * Sanitizes error messages by scrubbing potential credentials, access tokens, and authorization headers.
 */
export function sanitizeLogString(str: string): string {
  if (!str) return '';
  return str
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .replace(/(access_token|client_secret|api_key|token)=([^&\s]+)/gi, '$1=[REDACTED]')
    .replace(/EAA[A-Za-z0-9]+/g, '[REDACTED_META_TOKEN]')
    .slice(0, 1000); // cap length to prevent log bloat
}

@Injectable()
export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Account Analytics Snapshots
  // ---------------------------------------------------------------------------

  /**
   * Idempotently upserts an AccountAnalyticsSnapshot for a given account, period, and snapshotDate.
   * Preserves null (missing/unsupported) versus zero (genuine 0) distinctions.
   */
  async upsertAccountSnapshot(
    data: UpsertAccountSnapshotParams,
  ): Promise<AccountAnalyticsSnapshot> {
    const period = data.period || AnalyticsMetricPeriod.DAY;

    // Normalize snapshotDate to UTC midnight bucket
    const dateBucket = new Date(data.snapshotDate);
    dateBucket.setUTCHours(0, 0, 0, 0);

    // Calculate engagement rate safely if not explicitly given:
    // Rate = engagementTotal / reach (if reach > 0), else engagementTotal / followersCount (if followersCount > 0), else null
    let computedRate = data.engagementRate;
    if (computedRate === undefined || computedRate === null) {
      if (data.engagementTotal != null) {
        if (data.reach != null && data.reach > 0) {
          computedRate = parseFloat((data.engagementTotal / data.reach).toFixed(6));
        } else if (data.followersCount != null && data.followersCount > 0) {
          computedRate = parseFloat((data.engagementTotal / data.followersCount).toFixed(6));
        } else {
          computedRate = null;
        }
      } else {
        computedRate = null;
      }
    }

    return this.prisma.accountAnalyticsSnapshot.upsert({
      where: {
        socialAccountId_period_snapshotDate: {
          socialAccountId: data.socialAccountId,
          period,
          snapshotDate: dateBucket,
        },
      },
      create: {
        workspaceId: data.workspaceId,
        socialAccountId: data.socialAccountId,
        platform: data.platform,
        period,
        snapshotDate: dateBucket,
        followersCount: data.followersCount ?? null,
        followersNetChange: data.followersNetChange ?? null,
        impressions: data.impressions ?? null,
        reach: data.reach ?? null,
        profileViews: data.profileViews ?? null,
        websiteClicks: data.websiteClicks ?? null,
        engagementTotal: data.engagementTotal ?? null,
        engagementRate: computedRate,
        provenance: data.provenance ?? null,
        rawMetrics: data.rawMetrics ? (data.rawMetrics as Prisma.InputJsonValue) : Prisma.DbNull,
      },
      update: {
        followersCount: data.followersCount ?? undefined,
        followersNetChange: data.followersNetChange ?? undefined,
        impressions: data.impressions ?? undefined,
        reach: data.reach ?? undefined,
        profileViews: data.profileViews ?? undefined,
        websiteClicks: data.websiteClicks ?? undefined,
        engagementTotal: data.engagementTotal ?? undefined,
        engagementRate: computedRate ?? undefined,
        provenance: data.provenance ?? undefined,
        rawMetrics: data.rawMetrics ? (data.rawMetrics as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  /**
   * Retrieves account analytics snapshots within a date range with workspace isolation.
   */
  async queryAccountSnapshots(
    params: QueryAccountSnapshotsParams,
  ): Promise<AccountAnalyticsSnapshot[]> {
    const where: Prisma.AccountAnalyticsSnapshotWhereInput = {
      workspaceId: params.workspaceId,
      snapshotDate: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.socialAccountId) {
      where.socialAccountId = params.socialAccountId;
    }
    if (params.platform) {
      where.platform = params.platform;
    }
    if (params.period) {
      where.period = params.period;
    }

    return this.prisma.accountAnalyticsSnapshot.findMany({
      where,
      orderBy: { snapshotDate: 'asc' },
      include: {
        socialAccount: {
          select: {
            id: true,
            accountName: true,
            accountUsername: true,
            provider: true,
            accountType: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Post Analytics Snapshots
  // ---------------------------------------------------------------------------

  /**
   * Idempotently upserts a PostAnalyticsSnapshot for an account, externalPostId, and snapshotDate.
   * Preserves historical daily evolution without dividing by zero.
   */
  async upsertPostSnapshot(
    data: UpsertPostSnapshotParams,
  ): Promise<PostAnalyticsSnapshot> {
    const dateBucket = new Date(data.snapshotDate);
    dateBucket.setUTCHours(0, 0, 0, 0);

    // Compute engagement rate safely:
    // If not supplied: (likes + comments + shares + saves) / reach (or impressions if reach is absent)
    let computedRate = data.engagementRate;
    if (computedRate === undefined || computedRate === null) {
      const interactions =
        (data.likesCount ?? 0) +
        (data.commentsCount ?? 0) +
        (data.sharesCount ?? 0) +
        (data.savesCount ?? 0);

      const denominator =
        data.reach && data.reach > 0
          ? data.reach
          : data.impressions && data.impressions > 0
            ? data.impressions
            : null;

      if (denominator && denominator > 0) {
        computedRate = parseFloat((interactions / denominator).toFixed(6));
      } else {
        computedRate = null;
      }
    }

    // Convert watchTimeMs to BigInt if provided
    let watchTimeBigInt: bigint | null = null;
    if (data.watchTimeMs !== undefined && data.watchTimeMs !== null) {
      watchTimeBigInt = BigInt(data.watchTimeMs);
    }

    return this.prisma.postAnalyticsSnapshot.upsert({
      where: {
        socialAccountId_externalPostId_snapshotDate: {
          socialAccountId: data.socialAccountId,
          externalPostId: data.externalPostId,
          snapshotDate: dateBucket,
        },
      },
      create: {
        workspaceId: data.workspaceId,
        socialAccountId: data.socialAccountId,
        scheduledPostTargetId: data.scheduledPostTargetId ?? null,
        externalPostId: data.externalPostId,
        platform: data.platform,
        postType: data.postType || PostAnalyticsType.POST,
        publishedAt: data.publishedAt ?? null,
        snapshotDate: dateBucket,
        likesCount: data.likesCount ?? null,
        commentsCount: data.commentsCount ?? null,
        sharesCount: data.sharesCount ?? null,
        savesCount: data.savesCount ?? null,
        impressions: data.impressions ?? null,
        reach: data.reach ?? null,
        clicks: data.clicks ?? null,
        videoViews: data.videoViews ?? null,
        watchTimeMs: watchTimeBigInt,
        engagementRate: computedRate,
        provenance: data.provenance ?? null,
        rawMetrics: data.rawMetrics ? (data.rawMetrics as Prisma.InputJsonValue) : Prisma.DbNull,
      },
      update: {
        scheduledPostTargetId: data.scheduledPostTargetId ?? undefined,
        likesCount: data.likesCount ?? undefined,
        commentsCount: data.commentsCount ?? undefined,
        sharesCount: data.sharesCount ?? undefined,
        savesCount: data.savesCount ?? undefined,
        impressions: data.impressions ?? undefined,
        reach: data.reach ?? undefined,
        clicks: data.clicks ?? undefined,
        videoViews: data.videoViews ?? undefined,
        watchTimeMs: watchTimeBigInt ?? undefined,
        engagementRate: computedRate ?? undefined,
        provenance: data.provenance ?? undefined,
        rawMetrics: data.rawMetrics ? (data.rawMetrics as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  /**
   * Retrieves paginated post analytics snapshots with workspace isolation.
   */
  async queryPostSnapshots(params: QueryPostSnapshotsParams): Promise<{
    items: PostAnalyticsSnapshot[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.PostAnalyticsSnapshotWhereInput = {
      workspaceId: params.workspaceId,
    };

    if (params.socialAccountId) {
      where.socialAccountId = params.socialAccountId;
    }
    if (params.platform) {
      where.platform = params.platform;
    }
    if (params.externalPostId) {
      where.externalPostId = params.externalPostId;
    }
    if (params.startDate || params.endDate) {
      where.snapshotDate = {};
      if (params.startDate) where.snapshotDate.gte = params.startDate;
      if (params.endDate) where.snapshotDate.lte = params.endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.postAnalyticsSnapshot.findMany({
        where,
        orderBy: [{ snapshotDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              accountUsername: true,
              profileImageUrl: true,
            },
          },
          scheduledPostTarget: {
            select: {
              id: true,
              scheduledPostId: true,
              externalPostUrl: true,
            },
          },
        },
      }),
      this.prisma.postAnalyticsSnapshot.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  // ---------------------------------------------------------------------------
  // Analytics Synchronization Jobs & Safe Leases
  // ---------------------------------------------------------------------------

  /**
   * Creates an active sync job with a unique lease claim token and expiration timestamp.
   */
  async createSyncJob(params: CreateSyncJobParams): Promise<AnalyticsSyncJob> {
    const leaseDuration = params.leaseDurationMs || 10 * 60 * 1000;
    const claimToken = crypto.randomUUID();
    const leaseExpiresAt = new Date(Date.now() + leaseDuration);

    return this.prisma.analyticsSyncJob.create({
      data: {
        workspaceId: params.workspaceId,
        socialAccountId: params.socialAccountId ?? null,
        jobType: params.jobType,
        status: SyncJobStatus.RUNNING,
        startedAt: new Date(),
        claimToken,
        leaseExpiresAt,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }

  /**
   * Renews the lease for an active worker.
   * Rejects if the claim token does not match (preventing zombie workers from extending revoked leases).
   */
  async renewLease(
    jobId: string,
    claimToken: string,
    extensionMs: number = 5 * 60 * 1000,
  ): Promise<boolean> {
    const updated = await this.prisma.analyticsSyncJob.updateMany({
      where: {
        id: jobId,
        claimToken,
        status: SyncJobStatus.RUNNING,
      },
      data: {
        leaseExpiresAt: new Date(Date.now() + extensionMs),
      },
    });

    return updated.count > 0;
  }

  /**
   * Completes a sync job atomically if the worker still holds the valid claim token.
   * If the claim token was superseded due to lease timeout, update is rejected.
   */
  async completeSyncJob(params: CompleteSyncJobParams): Promise<AnalyticsSyncJob> {
    const now = new Date();
    const isSuccess =
      params.status === SyncJobStatus.COMPLETED ||
      params.status === SyncJobStatus.PARTIAL_SUCCESS;

    // Use updateMany to guarantee atomicity of claim token check
    const updated = await this.prisma.analyticsSyncJob.updateMany({
      where: {
        id: params.jobId,
        claimToken: params.claimToken,
        status: SyncJobStatus.RUNNING,
      },
      data: {
        status: params.status,
        completedAt: now,
        itemsProcessed: params.itemsProcessed,
        itemsFailed: params.itemsFailed,
        lastSuccessfulSyncAt: isSuccess ? now : undefined,
        errorCode: params.errorCode ? sanitizeLogString(params.errorCode) : null,
        errorMessage: params.errorMessage ? sanitizeLogString(params.errorMessage) : null,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    if (updated.count === 0) {
      throw new ConflictException(
        `Failed to complete sync job [${params.jobId}]: worker lease lost, expired, or claimed by another worker`,
      );
    }

    return this.prisma.analyticsSyncJob.findUniqueOrThrow({
      where: { id: params.jobId },
    });
  }

  /**
   * Recovers jobs that were abandoned mid-execution (worker crashes, container reboots).
   * Finds RUNNING jobs whose lease has expired and marks them FAILED with LEASE_EXPIRED_TIMEOUT.
   */
  async recoverExpiredLeases(workspaceId?: string): Promise<number> {
    const now = new Date();
    const where: Prisma.AnalyticsSyncJobWhereInput = {
      status: SyncJobStatus.RUNNING,
      leaseExpiresAt: {
        lt: now,
      },
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const result = await this.prisma.analyticsSyncJob.updateMany({
      where,
      data: {
        status: SyncJobStatus.FAILED,
        errorCode: 'LEASE_EXPIRED_TIMEOUT',
        errorMessage: 'Job worker crashed or failed to renew lease heartbeat before expiry',
        completedAt: now,
      },
    });

    if (result.count > 0) {
      this.logger.warn(`Recovered ${result.count} stale/abandoned analytics sync jobs`);
    }

    return result.count;
  }

  /**
   * Records a sanitized error associated with a sync job.
   */
  async recordSyncError(params: RecordSyncErrorParams): Promise<AnalyticsSyncError> {
    // Determine if error indicates permission failure based on status or code
    let isPermission = params.isPermissionError ?? false;
    const lowerCode = (params.errorCode || '').toLowerCase();
    const lowerMsg = (params.errorMessage || '').toLowerCase();

    if (
      params.httpStatus === 401 ||
      params.httpStatus === 403 ||
      lowerCode.includes('permission') ||
      lowerCode.includes('oauth') ||
      lowerCode.includes('scope') ||
      lowerMsg.includes('permission') ||
      lowerMsg.includes('scope') ||
      lowerMsg.includes('granted') ||
      lowerCode === '190' ||
      lowerCode === '200' ||
      lowerCode === '10'
    ) {
      isPermission = true;
    }

    return this.prisma.analyticsSyncError.create({
      data: {
        syncJobId: params.syncJobId,
        socialAccountId: params.socialAccountId ?? null,
        externalPostId: params.externalPostId ?? null,
        errorCode: sanitizeLogString(params.errorCode),
        errorMessage: sanitizeLogString(params.errorMessage),
        httpStatus: params.httpStatus ?? null,
        isPermissionError: isPermission,
      },
    });
  }

  /**
   * Retrieves freshness and synchronization health status for a workspace or social account.
   */
  async getSyncFreshness(
    workspaceId: string,
    socialAccountId?: string,
  ): Promise<{
    lastSuccessfulSyncAt: Date | null;
    lastAttemptedSyncAt: Date | null;
    lastJobStatus: SyncJobStatus | null;
    hasActivePermissionErrors: boolean;
  }> {
    const where: Prisma.AnalyticsSyncJobWhereInput = { workspaceId };
    if (socialAccountId) {
      where.socialAccountId = socialAccountId;
    }

    const [latestJob, latestSuccessfulJob, recentPermissionErrors] = await Promise.all([
      this.prisma.analyticsSyncJob.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.analyticsSyncJob.findFirst({
        where: {
          ...where,
          status: { in: [SyncJobStatus.COMPLETED, SyncJobStatus.PARTIAL_SUCCESS] },
        },
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.analyticsSyncError.findFirst({
        where: {
          isPermissionError: true,
          socialAccountId: socialAccountId || undefined,
          syncJob: { workspaceId },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
          },
        },
      }),
    ]);

    return {
      lastSuccessfulSyncAt: latestSuccessfulJob?.completedAt ?? null,
      lastAttemptedSyncAt: latestJob?.startedAt ?? null,
      lastJobStatus: latestJob?.status ?? null,
      hasActivePermissionErrors: !!recentPermissionErrors,
    };
  }

  // ---------------------------------------------------------------------------
  // Growth Insights
  // ---------------------------------------------------------------------------

  /**
   * Persists an evidence-based growth recommendation with validated confidence bounds (0.0 to 1.0).
   */
  async createGrowthInsight(params: CreateGrowthInsightParams): Promise<GrowthInsight> {
    if (params.confidenceScore < 0.0 || params.confidenceScore > 1.0) {
      throw new BadRequestException(
        `Confidence score [${params.confidenceScore}] must be strictly between 0.0 and 1.0`,
      );
    }

    return this.prisma.growthInsight.create({
      data: {
        workspaceId: params.workspaceId,
        category: params.category,
        title: params.title,
        summary: params.summary,
        suggestedAction: params.suggestedAction,
        evidence: params.evidence as Prisma.InputJsonValue,
        confidenceScore: params.confidenceScore,
        expiresAt: params.expiresAt ?? null,
      },
    });
  }

  /**
   * Lists active, non-dismissed, non-expired growth insights for a workspace.
   */
  async listGrowthInsights(workspaceId: string): Promise<GrowthInsight[]> {
    const now = new Date();
    return this.prisma.growthInsight.findMany({
      where: {
        workspaceId,
        dismissedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ confidenceScore: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Dismisses a growth insight with actor audit tracking and workspace isolation.
   */
  async dismissGrowthInsight(
    workspaceId: string,
    insightId: string,
    actorUserId: string,
  ): Promise<GrowthInsight> {
    const insight = await this.prisma.growthInsight.findUnique({
      where: { id: insightId },
    });

    if (!insight || insight.workspaceId !== workspaceId) {
      throw new NotFoundException('Growth insight not found in this workspace');
    }

    return this.prisma.growthInsight.update({
      where: { id: insightId },
      data: {
        dismissedAt: new Date(),
        dismissedById: actorUserId,
      },
    });
  }
}
