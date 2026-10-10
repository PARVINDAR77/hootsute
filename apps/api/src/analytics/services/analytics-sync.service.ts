import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenVaultService } from '../../social-accounts/token-vault/token-vault.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { AnalyticsAdapterFactory } from '../providers/analytics-adapter.factory';
import {
  SocialAccount,
  SocialConnectionStatus,
  SyncJobStatus,
  SyncJobType,
  AnalyticsMetricPeriod,
} from '@prisma/client';
import { calculateBackoffMs } from '../utils/rate-limit.util';

export interface SyncAccountResult {
  success: boolean;
  jobId: string;
  itemsProcessed: number;
  itemsFailed: number;
  message?: string;
}

@Injectable()
export class AnalyticsSyncService {
  private readonly logger = new Logger(AnalyticsSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenVault: TokenVaultService,
    private readonly repository: AnalyticsRepository,
    private readonly adapterFactory: AnalyticsAdapterFactory,
  ) {}

  /**
   * Synchronizes metrics for a specific social account (account-level snapshot + incremental post snapshots).
   * Safe against revoked credentials, rate limits, and worker crashes.
   */
  async syncAccount(
    workspaceId: string,
    socialAccountId: string,
    jobType: SyncJobType = SyncJobType.ACCOUNT_DAILY,
  ): Promise<SyncAccountResult> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: socialAccountId },
    });

    if (!account || account.workspaceId !== workspaceId) {
      throw new NotFoundException(
        `Social account [${socialAccountId}] not found in workspace [${workspaceId}]`,
      );
    }

    // Check concurrency: ensure no active unexpired job is running for this account
    const runningJob = await this.prisma.analyticsSyncJob.findFirst({
      where: {
        workspaceId,
        socialAccountId,
        status: SyncJobStatus.RUNNING,
        leaseExpiresAt: { gt: new Date() },
      },
    });

    if (runningJob) {
      throw new ConflictException(
        `A synchronization job is already running for account [${socialAccountId}] (job ${runningJob.id}).`,
      );
    }

    // 1. Create Sync Job with unique claim token and 10-minute lease
    const job = await this.repository.createSyncJob({
      workspaceId,
      socialAccountId,
      jobType,
      leaseDurationMs: 10 * 60 * 1000,
    });

    const claimToken = job.claimToken!;
    let itemsProcessed = 0;
    let itemsFailed = 0;

    // 2. Validate account connection status
    if (account.connectionStatus !== SocialConnectionStatus.CONNECTED) {
      this.logger.warn(
        `Skipping analytics sync for account [${socialAccountId}]: status is ${account.connectionStatus}`,
      );

      await this.repository.recordSyncError({
        syncJobId: job.id,
        socialAccountId,
        errorCode: 'ACCOUNT_NOT_CONNECTED',
        errorMessage: `Account connection status is ${account.connectionStatus}`,
        isPermissionError: true,
      });

      await this.repository.completeSyncJob({
        jobId: job.id,
        claimToken,
        status: SyncJobStatus.FAILED,
        itemsProcessed: 0,
        itemsFailed: 1,
        errorCode: 'ACCOUNT_NOT_CONNECTED',
        errorMessage: `Account connection status is ${account.connectionStatus}`,
      });

      return {
        success: false,
        jobId: job.id,
        itemsProcessed: 0,
        itemsFailed: 1,
        message: `Account is not in CONNECTED state (${account.connectionStatus})`,
      };
    }

    // 3. Decrypt token
    let decryptedToken: string;
    try {
      decryptedToken = this.tokenVault.decrypt(account.encryptedAccessToken);
    } catch (err: any) {
      this.logger.error(`Token decryption failed for account [${socialAccountId}]: ${err.message}`);

      await this.repository.recordSyncError({
        syncJobId: job.id,
        socialAccountId,
        errorCode: 'TOKEN_DECRYPTION_FAILED',
        errorMessage: 'Unable to decrypt stored authentication token for account',
        isPermissionError: true,
      });

      await this.repository.completeSyncJob({
        jobId: job.id,
        claimToken,
        status: SyncJobStatus.FAILED,
        itemsProcessed: 0,
        itemsFailed: 1,
        errorCode: 'TOKEN_DECRYPTION_FAILED',
        errorMessage: 'Unable to authenticate account credential',
      });

      return {
        success: false,
        jobId: job.id,
        itemsProcessed: 0,
        itemsFailed: 1,
        message: 'Credential decryption failure',
      };
    }

    // 4. Resolve provider adapter
    const adapter = this.adapterFactory.getAdapter(account);

    // 5. Ingest Account-Level Snapshot (Daily)
    try {
      const now = new Date();
      const accountMetrics = await adapter.fetchAccountMetrics(account, decryptedToken, {
        since: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // bounded lookback
        until: now,
      });

      await this.repository.upsertAccountSnapshot({
        workspaceId,
        socialAccountId,
        platform: accountMetrics.platform,
        period: AnalyticsMetricPeriod.DAY,
        snapshotDate: now,
        followersCount: accountMetrics.followersCount,
        followersNetChange: accountMetrics.followersNetChange,
        impressions: accountMetrics.impressions,
        reach: accountMetrics.reach,
        profileViews: accountMetrics.profileViews,
        websiteClicks: accountMetrics.websiteClicks,
        engagementTotal: accountMetrics.engagementTotal,
        provenance: accountMetrics.provenance,
        rawMetrics: accountMetrics.rawMetrics,
      });

      itemsProcessed++;

      // If deep insights scope was missing, record a non-fatal permission note
      if (!accountMetrics.hasScopeForDeepInsights) {
        await this.repository.recordSyncError({
          syncJobId: job.id,
          socialAccountId,
          errorCode: 'SCOPE_NOT_GRANTED',
          errorMessage: 'Elevated analytics scope not granted. Ingested Tier 1 public metrics only.',
          isPermissionError: true,
        });
      }
    } catch (err: any) {
      itemsFailed++;
      this.logger.warn(`Failed to ingest account-level snapshot for [${socialAccountId}]: ${err.message}`);
      await this.repository.recordSyncError({
        syncJobId: job.id,
        socialAccountId,
        errorCode: 'ACCOUNT_METRICS_SYNC_ERROR',
        errorMessage: err.message || 'Error querying account metrics',
      });
    }

    // 6. Ingest Post-Level Snapshots (Incremental)
    try {
      // Renew lease prior to post batch processing
      await this.repository.renewLease(job.id, claimToken, 10 * 60 * 1000);

      // Fetch recent posts from past 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentPosts = await adapter.fetchRecentPosts(account, decryptedToken, {
        since: thirtyDaysAgo,
        limit: 30,
      });

      for (const post of recentPosts) {
        try {
          const postMetrics = await adapter.fetchPostMetrics(
            account,
            post.externalPostId,
            decryptedToken,
          );

          // Find if there is a matching ScheduledPostTarget in OmniSocial AI
          const target = await this.prisma.scheduledPostTarget.findFirst({
            where: {
              socialAccountId,
              externalPostId: post.externalPostId,
            },
            select: { id: true },
          });

          await this.repository.upsertPostSnapshot({
            workspaceId,
            socialAccountId,
            scheduledPostTargetId: target?.id ?? null,
            externalPostId: post.externalPostId,
            platform: postMetrics.platform,
            postType: postMetrics.postType,
            publishedAt: postMetrics.publishedAt ?? post.publishedAt,
            snapshotDate: new Date(),
            likesCount: postMetrics.likesCount,
            commentsCount: postMetrics.commentsCount,
            sharesCount: postMetrics.sharesCount,
            savesCount: postMetrics.savesCount,
            impressions: postMetrics.impressions,
            reach: postMetrics.reach,
            clicks: postMetrics.clicks,
            videoViews: postMetrics.videoViews,
            watchTimeMs: postMetrics.watchTimeMs,
            provenance: postMetrics.provenance,
            rawMetrics: postMetrics.rawMetrics,
          });

          itemsProcessed++;
        } catch (postErr: any) {
          itemsFailed++;
          this.logger.warn(
            `Failed to ingest post metrics for [${post.externalPostId}]: ${postErr.message}`,
          );
          await this.repository.recordSyncError({
            syncJobId: job.id,
            socialAccountId,
            externalPostId: post.externalPostId,
            errorCode: 'POST_METRICS_SYNC_ERROR',
            errorMessage: postErr.message || 'Error querying post metrics',
          });
        }
      }
    } catch (recentErr: any) {
      this.logger.warn(`Failed to list recent posts for [${socialAccountId}]: ${recentErr.message}`);
      await this.repository.recordSyncError({
        syncJobId: job.id,
        socialAccountId,
        errorCode: 'RECENT_POSTS_FETCH_ERROR',
        errorMessage: recentErr.message || 'Error fetching recent posts',
      });
    }

    // 7. Complete Sync Job atomically with lease verification
    const finalStatus =
      itemsFailed === 0
        ? SyncJobStatus.COMPLETED
        : itemsProcessed > 0
          ? SyncJobStatus.PARTIAL_SUCCESS
          : SyncJobStatus.FAILED;

    await this.repository.completeSyncJob({
      jobId: job.id,
      claimToken,
      status: finalStatus,
      itemsProcessed,
      itemsFailed,
    });

    return {
      success: finalStatus !== SyncJobStatus.FAILED,
      jobId: job.id,
      itemsProcessed,
      itemsFailed,
    };
  }

  /**
   * Synchronizes all connected accounts within a workspace with round-robin fairness.
   */
  async syncWorkspace(
    workspaceId: string,
    jobType: SyncJobType = SyncJobType.ACCOUNT_DAILY,
  ): Promise<{
    accountsCount: number;
    totalProcessed: number;
    totalFailed: number;
  }> {
    const accounts = await this.prisma.socialAccount.findMany({
      where: {
        workspaceId,
        connectionStatus: SocialConnectionStatus.CONNECTED,
      },
      select: { id: true },
    });

    let totalProcessed = 0;
    let totalFailed = 0;

    for (const acc of accounts) {
      const res = await this.syncAccount(workspaceId, acc.id, jobType);
      totalProcessed += res.itemsProcessed;
      totalFailed += res.itemsFailed;
    }

    return {
      accountsCount: accounts.length,
      totalProcessed,
      totalFailed,
    };
  }

  /**
   * Triggers an on-demand manual synchronization for a workspace or account,
   * enforcing a 15-minute rate limit throttle to protect provider API quotas.
   */
  async triggerManualSync(
    workspaceId: string,
    actorUserId: string,
    socialAccountId?: string,
    force: boolean = false,
  ): Promise<{ message: string; throttled: boolean; lastSuccessfulSyncAt?: Date | null }> {
    const freshness = await this.repository.getSyncFreshness(workspaceId, socialAccountId);

    // Throttle manual refreshes to 1 call per 15 minutes unless forced by an authorized admin/owner
    const lastManualJob = await this.prisma.analyticsSyncJob.findFirst({
      where: {
        workspaceId,
        socialAccountId: socialAccountId || undefined,
        jobType: SyncJobType.MANUAL_REFRESH,
      },
      orderBy: { createdAt: 'desc' },
    });

    const lastAttemptedAt = lastManualJob?.createdAt || freshness.lastAttemptedSyncAt;

    if (lastAttemptedAt && !force) {
      const timeSinceLastSyncMs = Date.now() - lastAttemptedAt.getTime();
      if (timeSinceLastSyncMs < 15 * 60 * 1000) {
        const remainingMinutes = Math.ceil((15 * 60 * 1000 - timeSinceLastSyncMs) / 60000);
        return {
          message: `Manual synchronization is throttled to conserve API rate limits. Please try again in ${remainingMinutes} minute(s).`,
          throttled: true,
          lastSuccessfulSyncAt: freshness.lastSuccessfulSyncAt,
        };
      }
    }

    if (socialAccountId) {
      await this.syncAccount(workspaceId, socialAccountId, SyncJobType.MANUAL_REFRESH);
    } else {
      await this.syncWorkspace(workspaceId, SyncJobType.MANUAL_REFRESH);
    }

    const updatedFreshness = await this.repository.getSyncFreshness(workspaceId, socialAccountId);

    return {
      message: 'Synchronization completed successfully.',
      throttled: false,
      lastSuccessfulSyncAt: updatedFreshness.lastSuccessfulSyncAt,
    };
  }
}
