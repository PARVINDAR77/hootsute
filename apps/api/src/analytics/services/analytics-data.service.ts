import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import {
  DateRangeFilterDto,
  PaginationQueryDto,
} from '../dto/analytics-query.dto';
import {
  UpsertAccountSnapshotDto,
  UpsertPostSnapshotDto,
} from '../dto/snapshot-upsert.dto';
import {
  CreateSyncJobDto,
  CompleteSyncJobDto,
  RecordSyncErrorDto,
} from '../dto/sync-job.dto';
import { CreateGrowthInsightDto } from '../dto/growth-insight.dto';
import {
  AccountAnalyticsSnapshot,
  PostAnalyticsSnapshot,
  AnalyticsSyncJob,
  AnalyticsSyncError,
  GrowthInsight,
  SocialPlatform,
  Prisma,
} from '@prisma/client';
import {
  OverviewQueryDto,
  TimeseriesQueryDto,
  DashboardPostsQueryDto,
  TopPerformingQueryDto,
} from '../dto/analytics-dashboard.dto';

@Injectable()
export class AnalyticsDataService {
  private readonly logger = new Logger(AnalyticsDataService.name);

  constructor(
    private readonly repository: AnalyticsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Validates that the requested social account exists and belongs strictly to the workspace.
   */
  async validateSocialAccountInWorkspace(
    workspaceId: string,
    socialAccountId: string,
  ): Promise<void> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
      select: { id: true, workspaceId: true },
    });

    if (!account || account.workspaceId !== workspaceId) {
      throw new NotFoundException(
        `Social account [${socialAccountId}] not found in workspace [${workspaceId}]`,
      );
    }
  }

  /**
   * Validates that an optional ScheduledPostTarget belongs strictly to the requested workspace and social account.
   */
  async validateTargetInWorkspace(
    workspaceId: string,
    socialAccountId: string,
    targetId: string,
  ): Promise<void> {
    const target = await this.prisma.scheduledPostTarget.findUnique({
      where: { id: targetId },
      include: {
        scheduledPost: {
          select: { workspaceId: true },
        },
      },
    });

    if (
      !target ||
      target.scheduledPost.workspaceId !== workspaceId ||
      target.socialAccountId !== socialAccountId
    ) {
      throw new BadRequestException(
        `Target [${targetId}] does not match workspace [${workspaceId}] and account [${socialAccountId}]`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Account Snapshots
  // ---------------------------------------------------------------------------

  async getAccountSnapshots(
    workspaceId: string,
    filter: DateRangeFilterDto,
  ): Promise<AccountAnalyticsSnapshot[]> {
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range format');
    }
    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    if (filter.socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, filter.socialAccountId);
    }

    return this.repository.queryAccountSnapshots({
      workspaceId,
      socialAccountId: filter.socialAccountId,
      platform: filter.platform,
      period: filter.period,
      startDate: start,
      endDate: end,
    });
  }

  async upsertAccountSnapshot(
    workspaceId: string,
    dto: UpsertAccountSnapshotDto,
  ): Promise<AccountAnalyticsSnapshot> {
    if (dto.workspaceId !== workspaceId) {
      throw new ForbiddenException('Tenant boundary violation: workspaceId mismatch');
    }

    await this.validateSocialAccountInWorkspace(workspaceId, dto.socialAccountId);

    return this.repository.upsertAccountSnapshot({
      ...dto,
      snapshotDate: new Date(dto.snapshotDate),
    });
  }

  // ---------------------------------------------------------------------------
  // Post Snapshots
  // ---------------------------------------------------------------------------

  async getPostSnapshots(
    workspaceId: string,
    filter: DateRangeFilterDto,
    pagination: PaginationQueryDto,
  ): Promise<{
    items: PostAnalyticsSnapshot[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let start: Date | undefined;
    let end: Date | undefined;

    if (filter.startDate) {
      start = new Date(filter.startDate);
      if (isNaN(start.getTime())) throw new BadRequestException('Invalid startDate');
    }
    if (filter.endDate) {
      end = new Date(filter.endDate);
      if (isNaN(end.getTime())) throw new BadRequestException('Invalid endDate');
    }
    if (start && end && start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    if (filter.socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, filter.socialAccountId);
    }

    return this.repository.queryPostSnapshots({
      workspaceId,
      socialAccountId: filter.socialAccountId,
      platform: filter.platform,
      startDate: start,
      endDate: end,
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  async upsertPostSnapshot(
    workspaceId: string,
    dto: UpsertPostSnapshotDto,
  ): Promise<PostAnalyticsSnapshot> {
    if (dto.workspaceId !== workspaceId) {
      throw new ForbiddenException('Tenant boundary violation: workspaceId mismatch');
    }

    await this.validateSocialAccountInWorkspace(workspaceId, dto.socialAccountId);

    if (dto.scheduledPostTargetId) {
      await this.validateTargetInWorkspace(
        workspaceId,
        dto.socialAccountId,
        dto.scheduledPostTargetId,
      );
    }

    return this.repository.upsertPostSnapshot({
      ...dto,
      snapshotDate: new Date(dto.snapshotDate),
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
    });
  }

  // ---------------------------------------------------------------------------
  // Sync Operations
  // ---------------------------------------------------------------------------

  async startSyncJob(
    workspaceId: string,
    dto: CreateSyncJobDto,
  ): Promise<AnalyticsSyncJob> {
    if (dto.workspaceId !== workspaceId) {
      throw new ForbiddenException('Tenant boundary violation: workspaceId mismatch');
    }

    if (dto.socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, dto.socialAccountId);
    }

    return this.repository.createSyncJob({
      workspaceId,
      socialAccountId: dto.socialAccountId,
      jobType: dto.jobType,
      leaseDurationMs: dto.leaseDurationMs,
      metadata: dto.metadata,
    });
  }

  async completeSyncJob(
    workspaceId: string,
    jobId: string,
    dto: CompleteSyncJobDto,
  ): Promise<AnalyticsSyncJob> {
    const job = await this.prisma.analyticsSyncJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.workspaceId !== workspaceId) {
      throw new NotFoundException('Sync job not found in this workspace');
    }

    return this.repository.completeSyncJob({
      jobId,
      claimToken: dto.claimToken,
      status: dto.status,
      itemsProcessed: dto.itemsProcessed,
      itemsFailed: dto.itemsFailed,
      errorCode: dto.errorCode,
      errorMessage: dto.errorMessage,
      metadata: dto.metadata,
    });
  }

  async recordSyncError(
    workspaceId: string,
    dto: RecordSyncErrorDto,
  ): Promise<AnalyticsSyncError> {
    const job = await this.prisma.analyticsSyncJob.findUnique({
      where: { id: dto.syncJobId },
    });

    if (!job || job.workspaceId !== workspaceId) {
      throw new NotFoundException('Sync job not found in this workspace');
    }

    if (dto.socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, dto.socialAccountId);
    }

    return this.repository.recordSyncError({
      syncJobId: dto.syncJobId,
      socialAccountId: dto.socialAccountId,
      externalPostId: dto.externalPostId,
      errorCode: dto.errorCode,
      errorMessage: dto.errorMessage,
      httpStatus: dto.httpStatus,
      isPermissionError: dto.isPermissionError,
    });
  }

  async recoverStaleSyncJobs(workspaceId?: string): Promise<number> {
    return this.repository.recoverExpiredLeases(workspaceId);
  }

  async getSyncFreshness(workspaceId: string, socialAccountId?: string) {
    if (socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, socialAccountId);
    }
    return this.repository.getSyncFreshness(workspaceId, socialAccountId);
  }

  // ---------------------------------------------------------------------------
  // Growth Insights
  // ---------------------------------------------------------------------------

  async createGrowthInsight(
    workspaceId: string,
    dto: CreateGrowthInsightDto,
  ): Promise<GrowthInsight> {
    if (dto.workspaceId !== workspaceId) {
      throw new ForbiddenException('Tenant boundary violation: workspaceId mismatch');
    }

    return this.repository.createGrowthInsight({
      workspaceId,
      category: dto.category,
      title: dto.title,
      summary: dto.summary,
      suggestedAction: dto.suggestedAction,
      evidence: dto.evidence,
      confidenceScore: dto.confidenceScore,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
  }

  async listGrowthInsights(workspaceId: string): Promise<GrowthInsight[]> {
    return this.repository.listGrowthInsights(workspaceId);
  }

  async dismissGrowthInsight(
    workspaceId: string,
    insightId: string,
    actorUserId: string,
  ): Promise<GrowthInsight> {
    return this.repository.dismissGrowthInsight(workspaceId, insightId, actorUserId);
  }

  // ---------------------------------------------------------------------------
  // Dashboard Aggregations (Stage 7 Phase D)
  // ---------------------------------------------------------------------------

  /**
   * Computes KPI overview cards with strict preceding period comparisons.
   * Total followers is point-in-time (latest snapshot per account).
   * Cross-platform totals are explicitly separated from platform-specific breakdowns.
   */
  async getOverview(workspaceId: string, query: OverviewQueryDto) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range format');
    }
    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }
    if (query.socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, query.socialAccountId);
    }

    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = new Date(start.getTime());

    const [currentSnapshots, previousSnapshots] = await Promise.all([
      this.repository.queryAccountSnapshots({
        workspaceId,
        socialAccountId: query.socialAccountId,
        platform: query.platform,
        startDate: start,
        endDate: end,
      }),
      this.repository.queryAccountSnapshots({
        workspaceId,
        socialAccountId: query.socialAccountId,
        platform: query.platform,
        startDate: prevStart,
        endDate: prevEnd,
      }),
    ]);

    // 1. Total Followers (Point-in-time: latest snapshot per account in each period)
    const computeLatestFollowers = (snapshots: typeof currentSnapshots) => {
      const latestByAccount = new Map<string, { date: Date; count: number }>();
      for (const s of snapshots) {
        if (s.followersCount != null) {
          const existing = latestByAccount.get(s.socialAccountId);
          if (!existing || s.snapshotDate >= existing.date) {
            latestByAccount.set(s.socialAccountId, {
              date: s.snapshotDate,
              count: s.followersCount,
            });
          }
        }
      }
      if (latestByAccount.size === 0) return null;
      let total = 0;
      for (const item of latestByAccount.values()) {
        total += item.count;
      }
      return total;
    };

    const currentFollowers = computeLatestFollowers(currentSnapshots);
    const previousFollowers = computeLatestFollowers(previousSnapshots);

    const computeFollowersByPlatform = (snapshots: typeof currentSnapshots) => {
      const latestByAccount = new Map<string, { date: Date; count: number; platform: string }>();
      for (const s of snapshots) {
        if (s.followersCount != null) {
          const existing = latestByAccount.get(s.socialAccountId);
          if (!existing || s.snapshotDate >= existing.date) {
            latestByAccount.set(s.socialAccountId, {
              date: s.snapshotDate,
              count: s.followersCount,
              platform: s.platform,
            });
          }
        }
      }
      let fb: number | null = null;
      let ig: number | null = null;
      for (const item of latestByAccount.values()) {
        if (item.platform === SocialPlatform.FACEBOOK) {
          fb = (fb ?? 0) + item.count;
        } else if (item.platform === SocialPlatform.INSTAGRAM) {
          ig = (ig ?? 0) + item.count;
        }
      }
      return { facebook: fb, instagram: ig };
    };

    const followersPlatformBreakdown = computeFollowersByPlatform(currentSnapshots);

    // Cumulative metric helper
    const computeMetricComparison = (
      metricKey: 'impressions' | 'reach' | 'engagementTotal' | 'profileViews' | 'websiteClicks',
    ) => {
      let currentSum = 0;
      let hasCurrent = false;
      let fbSum: number | null = null;
      let igSum: number | null = null;

      for (const s of currentSnapshots) {
        const val = s[metricKey];
        if (val != null) {
          currentSum += val;
          hasCurrent = true;
          if (s.platform === SocialPlatform.FACEBOOK) {
            fbSum = (fbSum ?? 0) + val;
          } else if (s.platform === SocialPlatform.INSTAGRAM) {
            igSum = (igSum ?? 0) + val;
          }
        }
      }

      let prevSum = 0;
      let hasPrev = false;
      for (const s of previousSnapshots) {
        const val = s[metricKey];
        if (val != null) {
          prevSum += val;
          hasPrev = true;
        }
      }

      const currVal = hasCurrent ? currentSum : null;
      const prevVal = hasPrev ? prevSum : null;

      let pctChange: number | null = null;
      let direction: 'up' | 'down' | 'neutral' | null = null;
      let status: 'AVAILABLE' | 'NO_BASELINE' | 'UNAVAILABLE' = 'UNAVAILABLE';

      if (currVal != null) {
        if (prevVal != null && prevVal > 0) {
          pctChange = parseFloat((((currVal - prevVal) / prevVal) * 100).toFixed(1));
          direction = currVal > prevVal ? 'up' : currVal < prevVal ? 'down' : 'neutral';
          status = 'AVAILABLE';
        } else {
          status = 'NO_BASELINE';
        }
      }

      return {
        comparison: {
          value: currVal,
          previousValue: prevVal,
          percentageChange: pctChange,
          changeDirection: direction,
          isAvailable: hasCurrent,
          status,
        },
        platform: { facebook: fbSum, instagram: igSum },
      };
    };

    const impressionsComp = computeMetricComparison('impressions');
    const reachComp = computeMetricComparison('reach');
    const engagementsComp = computeMetricComparison('engagementTotal');
    const profileViewsComp = computeMetricComparison('profileViews');
    const websiteClicksComp = computeMetricComparison('websiteClicks');

    // Followers comparison
    let followersPct: number | null = null;
    let followersDir: 'up' | 'down' | 'neutral' | null = null;
    let followersStatus: 'AVAILABLE' | 'NO_BASELINE' | 'UNAVAILABLE' = 'UNAVAILABLE';

    if (currentFollowers != null) {
      if (previousFollowers != null && previousFollowers > 0) {
        followersPct = parseFloat((((currentFollowers - previousFollowers) / previousFollowers) * 100).toFixed(1));
        followersDir = currentFollowers > previousFollowers ? 'up' : currentFollowers < previousFollowers ? 'down' : 'neutral';
        followersStatus = 'AVAILABLE';
      } else {
        followersStatus = 'NO_BASELINE';
      }
    }

    const followersComparison = {
      value: currentFollowers,
      previousValue: previousFollowers,
      percentageChange: followersPct,
      changeDirection: followersDir,
      isAvailable: currentFollowers != null,
      status: followersStatus,
    };

    // Engagement Rate calculation
    const computeEngagementRate = (
      engTotal: number | null,
      reachTotal: number | null,
      impressionsTotal: number | null,
      snapshots: typeof currentSnapshots,
    ) => {
      if (engTotal != null) {
        if (reachTotal != null && reachTotal > 0) {
          return parseFloat((engTotal / reachTotal).toFixed(4));
        }
        if (impressionsTotal != null && impressionsTotal > 0) {
          return parseFloat((engTotal / impressionsTotal).toFixed(4));
        }
      }
      const rates = snapshots
        .map((s) => s.engagementRate)
        .filter((r): r is number => r != null);
      if (rates.length > 0) {
        const sum = rates.reduce((a, b) => a + b, 0);
        return parseFloat((sum / rates.length).toFixed(4));
      }
      return null;
    };

    const currentRate = computeEngagementRate(
      engagementsComp.comparison.value,
      reachComp.comparison.value,
      impressionsComp.comparison.value,
      currentSnapshots,
    );
    const prevRate = computeEngagementRate(
      engagementsComp.comparison.previousValue,
      reachComp.comparison.previousValue,
      impressionsComp.comparison.previousValue,
      previousSnapshots,
    );

    let ratePct: number | null = null;
    let rateDir: 'up' | 'down' | 'neutral' | null = null;
    let rateStatus: 'AVAILABLE' | 'NO_BASELINE' | 'UNAVAILABLE' = 'UNAVAILABLE';

    if (currentRate != null) {
      if (prevRate != null && prevRate > 0) {
        ratePct = parseFloat((((currentRate - prevRate) / prevRate) * 100).toFixed(1));
        rateDir = currentRate > prevRate ? 'up' : currentRate < prevRate ? 'down' : 'neutral';
        rateStatus = 'AVAILABLE';
      } else {
        rateStatus = 'NO_BASELINE';
      }
    }

    return {
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        previousStartDate: prevStart.toISOString(),
        previousEndDate: prevEnd.toISOString(),
      },
      metrics: {
        totalFollowers: followersComparison,
        impressions: impressionsComp.comparison,
        reach: reachComp.comparison,
        engagements: engagementsComp.comparison,
        engagementRate: {
          value: currentRate,
          previousValue: prevRate,
          percentageChange: ratePct,
          changeDirection: rateDir,
          isAvailable: currentRate != null,
          status: rateStatus,
        },
        profileViews: profileViewsComp.comparison,
        websiteClicks: websiteClicksComp.comparison,
      },
      platformBreakdown: {
        followers: followersPlatformBreakdown,
        impressions: impressionsComp.platform,
        reach: reachComp.platform,
        engagements: engagementsComp.platform,
      },
    };
  }

  /**
   * Generates continuous daily time-series data points.
   * Never fabricates zeroes for missing dates: missing entries remain null.
   */
  async getTimeseries(workspaceId: string, query: TimeseriesQueryDto) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range format');
    }
    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }
    if (query.socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, query.socialAccountId);
    }

    const snapshots = await this.repository.queryAccountSnapshots({
      workspaceId,
      socialAccountId: query.socialAccountId,
      platform: query.platform,
      startDate: start,
      endDate: end,
    });

    const byDate = new Map<string, typeof snapshots>();
    for (const s of snapshots) {
      const dKey = s.snapshotDate.toISOString().slice(0, 10);
      const list = byDate.get(dKey) || [];
      list.push(s);
      byDate.set(dKey, list);
    }

    const points: Array<{
      date: string;
      impressions: number | null;
      reach: number | null;
      engagements: number | null;
      engagementRate: number | null;
      followers: number | null;
      platforms: {
        facebook: { impressions: number | null; reach: number | null; engagements: number | null };
        instagram: { impressions: number | null; reach: number | null; engagements: number | null };
      };
    }> = [];

    const cur = new Date(start);
    cur.setUTCHours(0, 0, 0, 0);
    const endUtc = new Date(end);
    endUtc.setUTCHours(0, 0, 0, 0);

    while (cur <= endUtc) {
      const dateKey = cur.toISOString().slice(0, 10);
      const daySnapshots = byDate.get(dateKey);

      if (!daySnapshots || daySnapshots.length === 0) {
        points.push({
          date: dateKey,
          impressions: null,
          reach: null,
          engagements: null,
          engagementRate: null,
          followers: null,
          platforms: {
            facebook: { impressions: null, reach: null, engagements: null },
            instagram: { impressions: null, reach: null, engagements: null },
          },
        });
      } else {
        let impSum = 0;
        let hasImp = false;
        let reachSum = 0;
        let hasReach = false;
        let engSum = 0;
        let hasEng = false;
        let fbImp: number | null = null;
        let fbReach: number | null = null;
        let fbEng: number | null = null;
        let igImp: number | null = null;
        let igReach: number | null = null;
        let igEng: number | null = null;

        const latestFollowersByAccount = new Map<string, number>();

        for (const s of daySnapshots) {
          if (s.impressions != null) {
            impSum += s.impressions;
            hasImp = true;
            if (s.platform === SocialPlatform.FACEBOOK) fbImp = (fbImp ?? 0) + s.impressions;
            if (s.platform === SocialPlatform.INSTAGRAM) igImp = (igImp ?? 0) + s.impressions;
          }
          if (s.reach != null) {
            reachSum += s.reach;
            hasReach = true;
            if (s.platform === SocialPlatform.FACEBOOK) fbReach = (fbReach ?? 0) + s.reach;
            if (s.platform === SocialPlatform.INSTAGRAM) igReach = (igReach ?? 0) + s.reach;
          }
          if (s.engagementTotal != null) {
            engSum += s.engagementTotal;
            hasEng = true;
            if (s.platform === SocialPlatform.FACEBOOK) fbEng = (fbEng ?? 0) + s.engagementTotal;
            if (s.platform === SocialPlatform.INSTAGRAM) igEng = (igEng ?? 0) + s.engagementTotal;
          }
          if (s.followersCount != null) {
            latestFollowersByAccount.set(s.socialAccountId, s.followersCount);
          }
        }

        let totalFollowers: number | null = null;
        if (latestFollowersByAccount.size > 0) {
          totalFollowers = 0;
          for (const count of latestFollowersByAccount.values()) {
            totalFollowers += count;
          }
        }

        let engRate: number | null = null;
        if (hasEng) {
          if (hasReach && reachSum > 0) {
            engRate = parseFloat((engSum / reachSum).toFixed(4));
          } else if (hasImp && impSum > 0) {
            engRate = parseFloat((engSum / impSum).toFixed(4));
          }
        }

        points.push({
          date: dateKey,
          impressions: hasImp ? impSum : null,
          reach: hasReach ? reachSum : null,
          engagements: hasEng ? engSum : null,
          engagementRate: engRate,
          followers: totalFollowers,
          platforms: {
            facebook: { impressions: fbImp, reach: fbReach, engagements: fbEng },
            instagram: { impressions: igImp, reach: igReach, engagements: igEng },
          },
        });
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return {
      workspaceId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      dataPoints: points,
    };
  }

  /**
   * Retrieves paginated post performance records with sorting and OmniSocial target linkage.
   */
  async getDashboardPosts(workspaceId: string, query: DashboardPostsQueryDto) {
    if (query.socialAccountId) {
      await this.validateSocialAccountInWorkspace(workspaceId, query.socialAccountId);
    }

    const ALLOWED_SORT_FIELDS = [
      'publishedAt',
      'snapshotDate',
      'likesCount',
      'commentsCount',
      'sharesCount',
      'savesCount',
      'impressions',
      'reach',
      'engagementRate',
    ];

    const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy || '')
      ? (query.sortBy as string)
      : 'publishedAt';
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PostAnalyticsSnapshotWhereInput = {
      workspaceId,
    };

    if (query.platform) {
      where.platform = query.platform;
    }
    if (query.socialAccountId) {
      where.socialAccountId = query.socialAccountId;
    }
    if (query.postType) {
      where.postType = query.postType;
    }
    if (query.startDate || query.endDate) {
      where.publishedAt = {};
      if (query.startDate) where.publishedAt.gte = new Date(query.startDate);
      if (query.endDate) where.publishedAt.lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.postAnalyticsSnapshot.findMany({
        where,
        orderBy: [{ [sortBy]: sortOrder }, { snapshotDate: 'desc' }],
        skip,
        take: limit,
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              accountUsername: true,
              provider: true,
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

    const formattedItems = items.map((p) => {
      const raw = (p.rawMetrics as Record<string, any>) || {};
      const previewText = raw.message || raw.caption || null;
      const permalink =
        p.scheduledPostTarget?.externalPostUrl ||
        raw.permalink ||
        raw.permalink_url ||
        null;

      return {
        id: p.id,
        externalPostId: p.externalPostId,
        platform: p.platform,
        postType: p.postType,
        publishedAt: p.publishedAt,
        snapshotDate: p.snapshotDate,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        sharesCount: p.sharesCount,
        savesCount: p.savesCount,
        impressions: p.impressions,
        reach: p.reach,
        engagementRate: p.engagementRate,
        isScheduledViaOmniSocial: !!p.scheduledPostTargetId,
        externalPostUrl: permalink,
        previewText,
        socialAccount: p.socialAccount,
      };
    });

    return {
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Ranks top-performing posts by user-selected metric (excluding posts where the metric is null/zero).
   */
  async getTopPerforming(workspaceId: string, query: TopPerformingQueryDto) {
    const ALLOWED_METRICS = [
      'engagementRate',
      'reach',
      'impressions',
      'likesCount',
      'commentsCount',
      'sharesCount',
    ];

    const metric = ALLOWED_METRICS.includes(query.metric || '')
      ? (query.metric as string)
      : 'engagementRate';

    const limit = Math.min(20, Math.max(1, query.limit || 5));

    const where: Prisma.PostAnalyticsSnapshotWhereInput = {
      workspaceId,
      [metric]: {
        not: null,
        gt: 0,
      },
    };

    if (query.platform) {
      where.platform = query.platform;
    }
    if (query.startDate || query.endDate) {
      where.publishedAt = {};
      if (query.startDate) where.publishedAt.gte = new Date(query.startDate);
      if (query.endDate) where.publishedAt.lte = new Date(query.endDate);
    }

    const items = await this.prisma.postAnalyticsSnapshot.findMany({
      where,
      orderBy: [{ [metric]: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      include: {
        socialAccount: {
          select: {
            id: true,
            accountName: true,
            accountUsername: true,
            provider: true,
            profileImageUrl: true,
          },
        },
        scheduledPostTarget: {
          select: {
            id: true,
            externalPostUrl: true,
          },
        },
      },
    });

    return {
      rankingMetric: metric,
      items: items.map((p) => {
        const raw = (p.rawMetrics as Record<string, any>) || {};
        const previewText = raw.message || raw.caption || null;
        const permalink =
          p.scheduledPostTarget?.externalPostUrl ||
          raw.permalink ||
          raw.permalink_url ||
          null;

        return {
          id: p.id,
          externalPostId: p.externalPostId,
          platform: p.platform,
          postType: p.postType,
          publishedAt: p.publishedAt,
          metricName: metric,
          metricValue: (p as any)[metric],
          isScheduledViaOmniSocial: !!p.scheduledPostTargetId,
          externalPostUrl: permalink,
          previewText,
          socialAccount: p.socialAccount,
        };
      }),
    };
  }
}

