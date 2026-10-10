import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishingDispatcherService } from './publishing-dispatcher.service';
import { PublishingReconcilerService } from './publishing-reconciler.service';
import {
  PublishTargetStatus,
  ScheduledPostStatus,
} from '@prisma/client';

@Injectable()
export class ScheduledPostSweeperService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduledPostSweeperService.name);
  private isSweeping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: PublishingDispatcherService,
    private readonly reconciler: PublishingReconcilerService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('ScheduledPostSweeperService initialized. Running initial startup check for due scheduled posts...');
    this.sweepDuePosts();
  }

  /**
   * Sweeps PostgreSQL every 30 seconds for due posts and executes them.
   * Completely independent of external Redis availability.
   */
  @Interval(30000)
  async sweepDuePosts() {
    if (this.isSweeping) return;
    this.isSweeping = true;

    try {
      const now = new Date();

      // 0. Recover abandoned DISPATCHING targets (stuck > 5 minutes from crash/restart)
      const abandonedThreshold = new Date(Date.now() - 5 * 60 * 1000);
      const abandonedTargets = await this.prisma.scheduledPostTarget.findMany({
        where: {
          status: PublishTargetStatus.DISPATCHING,
          lastAttemptAt: { lte: abandonedThreshold },
        },
        take: 10,
      });

      for (const abandoned of abandonedTargets) {
        this.logger.warn(
          `Recovering abandoned target [${abandoned.id}] stuck in DISPATCHING since ${abandoned.lastAttemptAt?.toISOString()}`,
        );
        await this.prisma.scheduledPostTarget.update({
          where: { id: abandoned.id },
          data: {
            status: PublishTargetStatus.AMBIGUOUS_TIMEOUT,
            errorCode: 'WORKER_CRASH_OR_RESTART',
            errorMessage: 'Worker restarted while dispatching. Reconciling with platform before retry.',
          },
        });
      }

      // 1. Reconcile any targets stuck in AMBIGUOUS_TIMEOUT first
      const ambiguousTargets = await this.prisma.scheduledPostTarget.findMany({
        where: {
          status: PublishTargetStatus.AMBIGUOUS_TIMEOUT,
        },
        take: 10,
      });

      for (const t of ambiguousTargets) {
        try {
          await this.reconciler.reconcileTarget(t.id);
        } catch (err: any) {
          this.logger.warn(`Error during reconciliation of target [${t.id}]: ${err.message}`);
        }
      }

      // 2. Query targets that are due for publication
      const dueTargets = await this.prisma.scheduledPostTarget.findMany({
        where: {
          status: { in: [PublishTargetStatus.PENDING, PublishTargetStatus.RETRYING] },
          scheduledPost: {
            status: { in: [ScheduledPostStatus.SCHEDULED, ScheduledPostStatus.PROCESSING] },
            scheduledAt: { lte: now },
          },
          OR: [
            { nextRetryAt: null },
            { nextRetryAt: { lte: now } },
          ],
        },
        orderBy: {
          scheduledPost: { scheduledAt: 'asc' },
        },
        take: 20,
      });

      if (dueTargets.length > 0) {
        this.logger.log(`Found ${dueTargets.length} due publishing target(s). Dispatching...`);
        for (const target of dueTargets) {
          try {
            await this.dispatcher.dispatchTarget(target.id);
          } catch (err: any) {
            this.logger.error(`Error dispatching target [${target.id}]: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Sweeper run error: ${err.message}`);
    } finally {
      this.isSweeping = false;
    }
  }
}
