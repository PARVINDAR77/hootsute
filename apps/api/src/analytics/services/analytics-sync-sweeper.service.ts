import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { AnalyticsSyncService } from './analytics-sync.service';
import { GrowthInsightsEngineService } from './growth-insights-engine.service';
import { WorkspaceStatus, SyncJobType } from '@prisma/client';

@Injectable()
export class AnalyticsSyncSweeperService {
  private readonly logger = new Logger(AnalyticsSyncSweeperService.name);
  private isDailyRunning: boolean = false;
  private isRecoveryRunning: boolean = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AnalyticsRepository,
    private readonly syncService: AnalyticsSyncService,
    private readonly insightsEngine: GrowthInsightsEngineService,
  ) {}

  /**
   * Scheduled daily synchronization at 02:00 UTC for all active workspaces.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyAnalyticsCollection(): Promise<void> {
    if (this.isDailyRunning) {
      this.logger.warn('Daily analytics sync is already executing. Skipping duplicate tick.');
      return;
    }

    this.isDailyRunning = true;
    this.logger.log('Starting daily scheduled analytics collection across active workspaces...');

    try {
      const activeWorkspaces = await this.prisma.workspace.findMany({
        where: { status: WorkspaceStatus.ACTIVE },
        select: { id: true, name: true },
      });

      for (const ws of activeWorkspaces) {
        try {
          await this.syncService.syncWorkspace(ws.id, SyncJobType.ACCOUNT_DAILY);
          await this.insightsEngine.generateInsights(ws.id, { force: true });
        } catch (err: any) {
          this.logger.error(`Error syncing workspace [${ws.id}] (${ws.name}): ${err.message}`);
        }
      }

      this.logger.log(`Completed daily analytics sync for ${activeWorkspaces.length} workspace(s).`);
    } catch (err: any) {
      this.logger.error(`Fatal error in daily analytics sweeper: ${err.message}`);
    } finally {
      this.isDailyRunning = false;
    }
  }

  /**
   * Background lease sweeper executing every 5 minutes to recover crashed or timed-out worker jobs.
   */
  @Cron('*/5 * * * *')
  async handleStaleWorkerRecovery(): Promise<void> {
    if (this.isRecoveryRunning) return;

    this.isRecoveryRunning = true;
    try {
      const recovered = await this.repository.recoverExpiredLeases();
      if (recovered > 0) {
        this.logger.warn(`Sweeper recovered ${recovered} expired analytics sync job lease(s).`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to execute stale lease recovery: ${err.message}`);
    } finally {
      this.isRecoveryRunning = false;
    }
  }
}
