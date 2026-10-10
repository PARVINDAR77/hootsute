import {
  Injectable,
  Logger,
  Inject,
  Optional,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import {
  GrowthInsight,
  GrowthInsightCategory,
  PostAnalyticsType,
  SocialPlatform,
  Prisma,
} from '@prisma/client';
import {
  TEXT_GENERATION_PROVIDER,
  TextGenerationProvider,
} from '../../content-generation/ai-provider/text-generation-provider.interface';

export interface GenerateInsightsOptions {
  force?: boolean;
  useAiEnrichment?: boolean;
}

export interface RuleEvaluationResult {
  ruleId: string;
  category: GrowthInsightCategory;
  eligible: boolean;
  reason?: string;
  insight?: {
    title: string;
    summary: string;
    suggestedAction: string;
    evidence: Record<string, any>;
    confidenceScore: number;
    expiresAt?: Date | null;
  };
}

export interface InsightsGenerationReport {
  workspaceId: string;
  evaluatedAt: string;
  generatedCount: number;
  skippedCount: number;
  activeInsightsCount: number;
  results: RuleEvaluationResult[];
}

@Injectable()
export class GrowthInsightsEngineService {
  private readonly logger = new Logger(GrowthInsightsEngineService.name);
  private readonly activeLocks = new Set<string>();
  private readonly lastRunTimestamps = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AnalyticsRepository,
    @Optional()
    @Inject(TEXT_GENERATION_PROVIDER)
    private readonly textProvider?: TextGenerationProvider,
  ) {}

  /**
   * Orchestrates the deterministic evaluation of all 5 insight categories,
   * applies deduplication & dismissal preservation, and optionally enriches phrasing with AI.
   */
  async generateInsights(
    workspaceId: string,
    options: GenerateInsightsOptions = {},
  ): Promise<InsightsGenerationReport> {
    // 1. Concurrency control per workspace
    if (this.activeLocks.has(workspaceId)) {
      throw new ConflictException(
        `Growth insights generation is already executing for workspace [${workspaceId}].`,
      );
    }

    // 2. Throttling: 5-minute window between manual runs unless forced
    const nowMs = Date.now();
    const lastRun = this.lastRunTimestamps.get(workspaceId);
    if (!options.force && lastRun && nowMs - lastRun < 5 * 60 * 1000) {
      const waitMinutes = Math.ceil((5 * 60 * 1000 - (nowMs - lastRun)) / 60000);
      throw new ConflictException(
        `Insights generation is throttled. Please try again in ${waitMinutes} minute(s).`,
      );
    }

    this.activeLocks.add(workspaceId);
    this.lastRunTimestamps.set(workspaceId, nowMs);

    try {
      // 3. Check data freshness & permissions
      const freshness = await this.repository.getSyncFreshness(workspaceId);
      if (
        freshness.hasActivePermissionErrors &&
        freshness.lastSuccessfulSyncAt &&
        nowMs - freshness.lastSuccessfulSyncAt.getTime() > 14 * 24 * 60 * 60 * 1000
      ) {
        this.logger.warn(
          `Suppressing insights for workspace [${workspaceId}]: Active permission errors and data > 14 days stale.`,
        );
        return {
          workspaceId,
          evaluatedAt: new Date().toISOString(),
          generatedCount: 0,
          skippedCount: 5,
          activeInsightsCount: (await this.repository.listGrowthInsights(workspaceId)).length,
          results: [
            {
              ruleId: 'GLOBAL_SUPPRESSION',
              category: GrowthInsightCategory.ENGAGEMENT,
              eligible: false,
              reason: 'Data is stale (>14 days) and active Meta permission errors are present.',
            },
          ],
        };
      }

      // 4. Fetch snapshots
      const thirtyDaysAgo = new Date(nowMs - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(nowMs - 60 * 24 * 60 * 60 * 1000);

      const [accountSnapshots, postSnapshots] = await Promise.all([
        this.prisma.accountAnalyticsSnapshot.findMany({
          where: {
            workspaceId,
            snapshotDate: { gte: thirtyDaysAgo },
          },
          orderBy: { snapshotDate: 'asc' },
        }),
        this.prisma.postAnalyticsSnapshot.findMany({
          where: {
            workspaceId,
            publishedAt: { gte: sixtyDaysAgo },
          },
          orderBy: { publishedAt: 'desc' },
        }),
      ]);

      // 5. Evaluate deterministic rules
      const ruleResults: RuleEvaluationResult[] = [
        this.evaluateEngagementTrend(accountSnapshots),
        this.evaluateFormatEfficiency(postSnapshots),
        this.evaluateOptimalTiming(postSnapshots),
        this.evaluateTopicResonance(postSnapshots),
        this.evaluateCadenceAndConsistency(postSnapshots, accountSnapshots),
      ];

      // 6. Existing insights for deduplication & dismissal audit
      const [existingActive, recentlyDismissed] = await Promise.all([
        this.prisma.growthInsight.findMany({
          where: {
            workspaceId,
            dismissedAt: null,
          },
        }),
        this.prisma.growthInsight.findMany({
          where: {
            workspaceId,
            dismissedAt: {
              gte: new Date(nowMs - 14 * 24 * 60 * 60 * 1000), // dismissed in last 14 days
            },
          },
        }),
      ]);

      let generatedCount = 0;
      let skippedCount = 0;

      for (const res of ruleResults) {
        if (!res.eligible || !res.insight) {
          skippedCount++;
          continue;
        }

        const ruleId = res.ruleId;

        // Check if recently dismissed by user (preserve dismissal choice for 14 days)
        const isRecentlyDismissed = recentlyDismissed.some(
          (d) => (d.evidence as any)?.ruleId === ruleId,
        );
        if (isRecentlyDismissed) {
          res.eligible = false;
          res.reason = `Suppressed: User dismissed recommendation for rule [${ruleId}] within the last 14 days.`;
          skippedCount++;
          continue;
        }

        // Check if an active insight already exists for this rule
        const existing = existingActive.find(
          (a) => (a.evidence as any)?.ruleId === ruleId,
        );

        if (existing) {
          const ageDays = (nowMs - existing.createdAt.getTime()) / (24 * 60 * 60 * 1000);
          if (ageDays < 7) {
            // Duplicate within 7 days: skip creation
            res.eligible = false;
            res.reason = `Skipped duplicate: Active insight for [${ruleId}] exists (created ${Math.round(ageDays)}d ago).`;
            skippedCount++;
            continue;
          } else {
            // Update existing insight with fresh data
            await this.prisma.growthInsight.update({
              where: { id: existing.id },
              data: {
                title: res.insight.title,
                summary: res.insight.summary,
                suggestedAction: res.insight.suggestedAction,
                evidence: res.insight.evidence as Prisma.InputJsonValue,
                confidenceScore: res.insight.confidenceScore,
                expiresAt: res.insight.expiresAt ?? null,
                updatedAt: new Date(),
              },
            });
            generatedCount++;
            continue;
          }
        }

        // Optional AI phrasing enrichment (strictly preserving evidence & metrics)
        let finalSummary = res.insight.summary;
        let finalAction = res.insight.suggestedAction;

        if (options.useAiEnrichment && this.textProvider) {
          try {
            const enriched = await this.enrichPhrasingWithAi(res.insight);
            if (enriched.summary) finalSummary = enriched.summary;
            if (enriched.suggestedAction) finalAction = enriched.suggestedAction;
          } catch (aiErr: any) {
            this.logger.warn(`AI enrichment fallback to deterministic phrasing: ${aiErr.message}`);
          }
        }

        // Persist new insight
        await this.repository.createGrowthInsight({
          workspaceId,
          category: res.category,
          title: res.insight.title,
          summary: finalSummary,
          suggestedAction: finalAction,
          evidence: res.insight.evidence,
          confidenceScore: res.insight.confidenceScore,
          expiresAt: res.insight.expiresAt,
        });

        generatedCount++;
      }

      const activeTotal = await this.repository.listGrowthInsights(workspaceId);

      return {
        workspaceId,
        evaluatedAt: new Date().toISOString(),
        generatedCount,
        skippedCount,
        activeInsightsCount: activeTotal.length,
        results: ruleResults,
      };
    } finally {
      this.activeLocks.delete(workspaceId);
    }
  }

  // ---------------------------------------------------------------------------
  // Deterministic Analysis Rules
  // ---------------------------------------------------------------------------

  /**
   * Rule 1: ENGAGEMENT — Evaluates interaction rate shifts over comparable 14-day windows.
   */
  evaluateEngagementTrend(
    snapshots: Array<{
      snapshotDate: Date;
      engagementTotal: number | null;
      reach: number | null;
      impressions: number | null;
      followersCount: number | null;
    }>,
  ): RuleEvaluationResult {
    const ruleId = 'ENGAGEMENT_RATE_TREND_14D';
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const recentSnapshots = snapshots.filter(
      (s) => now - s.snapshotDate.getTime() <= fourteenDaysMs,
    );
    const priorSnapshots = snapshots.filter(
      (s) =>
        now - s.snapshotDate.getTime() > fourteenDaysMs &&
        now - s.snapshotDate.getTime() <= 2 * fourteenDaysMs,
    );

    // Safeguard: Need >= 4 days with data in both windows
    if (recentSnapshots.length < 4 || priorSnapshots.length < 4) {
      return {
        ruleId,
        category: GrowthInsightCategory.ENGAGEMENT,
        eligible: false,
        reason: `Insufficient observation days (recent: ${recentSnapshots.length}, prior: ${priorSnapshots.length}; minimum 4 required per window).`,
      };
    }

    const sumMetric = (arr: typeof snapshots, key: 'engagementTotal' | 'reach' | 'impressions') =>
      arr.reduce((acc, s) => acc + (s[key] ?? 0), 0);

    const recentEngagements = sumMetric(recentSnapshots, 'engagementTotal');
    const priorEngagements = sumMetric(priorSnapshots, 'engagementTotal');
    const recentReach = sumMetric(recentSnapshots, 'reach') || sumMetric(recentSnapshots, 'impressions');
    const priorReach = sumMetric(priorSnapshots, 'reach') || sumMetric(priorSnapshots, 'impressions');

    // Safeguard: Baseline must be valid and non-zero
    if (priorEngagements < 10 || priorReach < 50 || recentReach < 50) {
      return {
        ruleId,
        category: GrowthInsightCategory.ENGAGEMENT,
        eligible: false,
        reason: 'Baseline engagement or reach volume too low for statistically valid comparison.',
      };
    }

    const recentRate = parseFloat((recentEngagements / recentReach).toFixed(4));
    const priorRate = parseFloat((priorEngagements / priorReach).toFixed(4));

    if (priorRate <= 0) {
      return {
        ruleId,
        category: GrowthInsightCategory.ENGAGEMENT,
        eligible: false,
        reason: 'Zero prior engagement rate baseline prevents percentage change calculation.',
      };
    }

    const deltaPct = Math.round(((recentRate - priorRate) / priorRate) * 100);

    // Significance threshold: absolute change >= 15%
    if (Math.abs(deltaPct) < 15) {
      return {
        ruleId,
        category: GrowthInsightCategory.ENGAGEMENT,
        eligible: false,
        reason: `Engagement rate shift of ${deltaPct > 0 ? '+' : ''}${deltaPct}% is within normal variance (< 15%).`,
      };
    }

    const isPositive = deltaPct > 0;
    const confidenceScore = parseFloat(
      Math.min(0.92, 0.7 + (recentSnapshots.length + priorSnapshots.length) * 0.008).toFixed(2),
    );

    return {
      ruleId,
      category: GrowthInsightCategory.ENGAGEMENT,
      eligible: true,
      insight: {
        title: isPositive
          ? `Rising Audience Engagement (+${deltaPct}%)`
          : `Audience Engagement Contraction (${deltaPct}%)`,
        summary: isPositive
          ? `Your audience interaction rate grew from ${(priorRate * 100).toFixed(1)}% to ${(recentRate * 100).toFixed(1)}% over the last 14 days across ${recentSnapshots.length} tracked days.`
          : `Engagement rate decreased from ${(priorRate * 100).toFixed(1)}% to ${(recentRate * 100).toFixed(1)}% compared to the prior 14-day window.`,
        suggestedAction: isPositive
          ? 'Analyze your top-performing posts from this 14-day window to identify and replicate recurring hooks and creative styles.'
          : 'Introduce conversation-oriented post formats, such as questions, carousels, or polls, to stimulate comments and shares.',
        evidence: {
          ruleId,
          metric: 'engagementRate',
          recentRate,
          priorRate,
          percentageChange: deltaPct,
          recentEngagements,
          priorEngagements,
          recentReach,
          priorReach,
          recentDaysObserved: recentSnapshots.length,
          priorDaysObserved: priorSnapshots.length,
        },
        confidenceScore,
        expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * Rule 2: CONTENT_FORMAT — Compares post formats with minimum 3 samples per format.
   */
  evaluateFormatEfficiency(
    posts: Array<{
      postType: PostAnalyticsType;
      engagementRate: number | null;
      reach: number | null;
      impressions: number | null;
      likesCount: number | null;
      commentsCount: number | null;
    }>,
  ): RuleEvaluationResult {
    const ruleId = 'FORMAT_EFFICIENCY_COMPARISON';

    // Group posts by postType
    const byType = new Map<PostAnalyticsType, Array<{ rate: number; reach: number }>>();

    for (const p of posts) {
      if (p.engagementRate != null && p.engagementRate > 0) {
        const list = byType.get(p.postType) || [];
        list.push({ rate: p.engagementRate, reach: p.reach || p.impressions || 0 });
        byType.set(p.postType, list);
      }
    }

    // Filter formats with at least 3 samples to avoid single-post bias
    const eligibleFormats = Array.from(byType.entries()).filter(
      ([_, items]) => items.length >= 3,
    );

    if (eligibleFormats.length < 2) {
      return {
        ruleId,
        category: GrowthInsightCategory.CONTENT_FORMAT,
        eligible: false,
        reason: 'Requires at least two distinct post formats with at least 3 published posts each.',
      };
    }

    // Calculate average rate per format
    const formatStats = eligibleFormats.map(([type, items]) => {
      const avgRate = items.reduce((acc, i) => acc + i.rate, 0) / items.length;
      const avgReach = items.reduce((acc, i) => acc + i.reach, 0) / items.length;
      return {
        type,
        count: items.length,
        avgRate: parseFloat(avgRate.toFixed(4)),
        avgReach: Math.round(avgReach),
      };
    });

    formatStats.sort((a, b) => b.avgRate - a.avgRate);
    const top = formatStats[0];
    const second = formatStats[1];

    if (second.avgRate <= 0) {
      return {
        ruleId,
        category: GrowthInsightCategory.CONTENT_FORMAT,
        eligible: false,
        reason: 'Secondary format baseline rate is zero.',
      };
    }

    const advantagePct = Math.round(((top.avgRate - second.avgRate) / second.avgRate) * 100);

    // Significance threshold: top format must outperform by >= 20%
    if (advantagePct < 20) {
      return {
        ruleId,
        category: GrowthInsightCategory.CONTENT_FORMAT,
        eligible: false,
        reason: `Performance advantage between ${top.type} and ${second.type} (+${advantagePct}%) is below the 20% threshold.`,
      };
    }

    const formatLabel = (t: PostAnalyticsType) => {
      if (t === PostAnalyticsType.REEL) return 'Reels';
      if (t === PostAnalyticsType.CAROUSEL) return 'Carousels';
      if (t === PostAnalyticsType.VIDEO) return 'Videos';
      return 'Static Posts';
    };

    const confidenceScore = parseFloat(
      Math.min(0.92, 0.65 + (top.count + second.count) * 0.025).toFixed(2),
    );

    return {
      ruleId,
      category: GrowthInsightCategory.CONTENT_FORMAT,
      eligible: true,
      insight: {
        title: `${formatLabel(top.type)} Outperform ${formatLabel(second.type)} (+${advantagePct}%)`,
        summary: `Across ${top.count} published ${formatLabel(top.type)} and ${second.count} ${formatLabel(second.type)}, ${formatLabel(top.type)} averaged a ${(top.avgRate * 100).toFixed(1)}% engagement rate compared to ${(second.avgRate * 100).toFixed(1)}%.`,
        suggestedAction: `Allocate a higher proportion of your upcoming content calendar to ${formatLabel(top.type)} to capitalize on higher organic interaction.`,
        evidence: {
          ruleId,
          topFormat: top.type,
          topFormatCount: top.count,
          topFormatAvgRate: top.avgRate,
          comparisonFormat: second.type,
          comparisonFormatCount: second.count,
          comparisonFormatAvgRate: second.avgRate,
          advantagePct,
        },
        confidenceScore,
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * Rule 3: TIMING — Analyzes day/time correlation when sample size >= 8 posts.
   * Avoids causal claims; explicitly frames as historical correlation.
   */
  evaluateOptimalTiming(
    posts: Array<{
      publishedAt: Date | null;
      likesCount: number | null;
      commentsCount: number | null;
      sharesCount: number | null;
      savesCount: number | null;
    }>,
  ): RuleEvaluationResult {
    const ruleId = 'OPTIMAL_POSTING_TIME';

    const validPosts = posts.filter((p) => p.publishedAt != null);

    // Safeguard: Need >= 8 published posts with known timestamp
    if (validPosts.length < 8) {
      return {
        ruleId,
        category: GrowthInsightCategory.TIMING,
        eligible: false,
        reason: `Insufficient published posts for timing analysis (found ${validPosts.length}, minimum 8 required).`,
      };
    }

    // Partition by time-of-day blocks (UTC hours)
    // Morning (06-11), Afternoon (12-17), Evening (18-23), Night (00-05)
    type TimeWindow = 'Morning (6 AM - 12 PM)' | 'Afternoon (12 PM - 6 PM)' | 'Evening (6 PM - 12 AM)' | 'Night (12 AM - 6 AM)';

    const windows = new Map<TimeWindow, number[]>();

    let totalInteractionsAll = 0;

    for (const p of validPosts) {
      const pubDate = new Date(p.publishedAt!);
      const hour = pubDate.getUTCHours();
      const interactions =
        (p.likesCount ?? 0) +
        (p.commentsCount ?? 0) +
        (p.sharesCount ?? 0) +
        (p.savesCount ?? 0);

      totalInteractionsAll += interactions;

      let win: TimeWindow = 'Afternoon (12 PM - 6 PM)';
      if (hour >= 6 && hour < 12) win = 'Morning (6 AM - 12 PM)';
      else if (hour >= 12 && hour < 18) win = 'Afternoon (12 PM - 6 PM)';
      else if (hour >= 18 && hour < 24) win = 'Evening (6 PM - 12 AM)';
      else win = 'Night (12 AM - 6 AM)';

      const list = windows.get(win) || [];
      list.push(interactions);
      windows.set(win, list);
    }

    const overallAvg = totalInteractionsAll / validPosts.length;
    if (overallAvg <= 2) {
      return {
        ruleId,
        category: GrowthInsightCategory.TIMING,
        eligible: false,
        reason: 'Average interaction volume too low to identify meaningful timing patterns.',
      };
    }

    // Find peak window with at least 3 posts
    let peakWindow: TimeWindow | null = null;
    let peakAvg = 0;
    let peakCount = 0;

    for (const [win, counts] of windows.entries()) {
      if (counts.length >= 3) {
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        if (avg > peakAvg) {
          peakAvg = avg;
          peakWindow = win;
          peakCount = counts.length;
        }
      }
    }

    if (!peakWindow) {
      return {
        ruleId,
        category: GrowthInsightCategory.TIMING,
        eligible: false,
        reason: 'No time window has the minimum sample size of 3 posts.',
      };
    }

    const advantagePct = Math.round(((peakAvg - overallAvg) / overallAvg) * 100);

    if (advantagePct < 25) {
      return {
        ruleId,
        category: GrowthInsightCategory.TIMING,
        eligible: false,
        reason: `Peak window (${peakWindow}) advantage of +${advantagePct}% is below the 25% significance threshold.`,
      };
    }

    const confidenceScore = parseFloat(
      Math.min(0.85, 0.60 + validPosts.length * 0.02).toFixed(2),
    );

    return {
      ruleId,
      category: GrowthInsightCategory.TIMING,
      eligible: true,
      insight: {
        title: `Higher Engagement Observed on ${peakWindow}`,
        summary: `Posts published during ${peakWindow} averaged ${Math.round(peakAvg)} interactions, outperforming your workspace average of ${Math.round(overallAvg)} interactions by +${advantagePct}%.`,
        suggestedAction: `Consider scheduling priority campaign announcements during ${peakWindow} to capture peak audience attention.`,
        evidence: {
          ruleId,
          peakWindow,
          peakAvgInteractions: Math.round(peakAvg),
          peakPostCount: peakCount,
          overallAvgInteractions: Math.round(overallAvg),
          totalPostsAnalyzed: validPosts.length,
          advantagePct,
          isCorrelational: true,
        },
        confidenceScore,
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * Rule 4: TOPIC_AUDIENCE — Identifies recurring hashtag performance when sample >= 3 tagged posts.
   */
  evaluateTopicResonance(
    posts: Array<{
      engagementRate: number | null;
      reach: number | null;
      impressions: number | null;
      rawMetrics: any;
    }>,
  ): RuleEvaluationResult {
    const ruleId = 'HASHTAG_TOPIC_RESONANCE';

    // Extract hashtags from caption/message
    const hashtagMap = new Map<string, number[]>();
    const allRates: number[] = [];

    for (const p of posts) {
      if (p.engagementRate != null && p.engagementRate > 0) {
        allRates.push(p.engagementRate);
        const text =
          p.rawMetrics?.message ||
          p.rawMetrics?.caption ||
          '';

        const matches = text.match(/#([a-zA-Z0-9_]+)/g);
        if (matches) {
          const uniqueTags: string[] = Array.from(new Set(matches.map((m: string) => m.toLowerCase())));
          for (const tag of uniqueTags) {
            const list = hashtagMap.get(tag) || [];
            list.push(p.engagementRate);
            hashtagMap.set(tag, list);
          }
        }
      }
    }

    if (allRates.length < 5) {
      return {
        ruleId,
        category: GrowthInsightCategory.TOPIC_AUDIENCE,
        eligible: false,
        reason: 'Insufficient posts with engagement data for topic analysis (minimum 5 required).',
      };
    }

    // Filter tags with at least 3 occurrences
    const eligibleTags = Array.from(hashtagMap.entries()).filter(
      ([_, rates]) => rates.length >= 3,
    );

    if (eligibleTags.length === 0) {
      return {
        ruleId,
        category: GrowthInsightCategory.TOPIC_AUDIENCE,
        eligible: false,
        reason: 'No recurring hashtag found in at least 3 posts.',
      };
    }

    const overallAvgRate = allRates.reduce((a, b) => a + b, 0) / allRates.length;

    // Find best performing tag
    let topTag = '';
    let topAvg = 0;
    let topCount = 0;

    for (const [tag, rates] of eligibleTags) {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      if (avg > topAvg) {
        topAvg = avg;
        topTag = tag;
        topCount = rates.length;
      }
    }

    const advantagePct = Math.round(((topAvg - overallAvgRate) / overallAvgRate) * 100);

    if (advantagePct < 20) {
      return {
        ruleId,
        category: GrowthInsightCategory.TOPIC_AUDIENCE,
        eligible: false,
        reason: `Top hashtag (${topTag}) advantage of +${advantagePct}% is below the 20% significance threshold.`,
      };
    }

    const confidenceScore = parseFloat(
      Math.min(0.86, 0.65 + topCount * 0.03).toFixed(2),
    );

    return {
      ruleId,
      category: GrowthInsightCategory.TOPIC_AUDIENCE,
      eligible: true,
      insight: {
        title: `Topic Resonance: ${topTag} Boosts Engagement (+${advantagePct}%)`,
        summary: `Posts containing ${topTag} (${topCount} posts) achieved an average engagement rate of ${(topAvg * 100).toFixed(1)}%, compared to the workspace average of ${(overallAvgRate * 100).toFixed(1)}%.`,
        suggestedAction: `Incorporate ${topTag} and related subject matter into upcoming content drafts in the AI Studio.`,
        evidence: {
          ruleId,
          hashtag: topTag,
          taggedPostCount: topCount,
          taggedAvgEngagementRate: parseFloat(topAvg.toFixed(4)),
          overallAvgEngagementRate: parseFloat(overallAvgRate.toFixed(4)),
          advantagePct,
        },
        confidenceScore,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * Rule 5: CONSISTENCY — Identifies publishing gaps (> 7 days) or sustained cadence benefits.
   */
  evaluateCadenceAndConsistency(
    posts: Array<{ publishedAt: Date | null }>,
    accountSnapshots: Array<{ snapshotDate: Date; reach: number | null }>,
  ): RuleEvaluationResult {
    const ruleId = 'CONSISTENCY_PUBLISHING_CADENCE';
    const now = Date.now();

    const sortedPosts = posts
      .filter((p) => p.publishedAt != null)
      .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime());

    if (sortedPosts.length === 0) {
      return {
        ruleId,
        category: GrowthInsightCategory.CONSISTENCY,
        eligible: false,
        reason: 'No publication history available to analyze consistency.',
      };
    }

    const latestPostTime = sortedPosts[0].publishedAt!.getTime();
    const daysSinceLastPost = Math.floor((now - latestPostTime) / (24 * 60 * 60 * 1000));

    // Case A: Meaningful inactivity gap (>= 7 days)
    if (daysSinceLastPost >= 7) {
      return {
        ruleId: 'CONSISTENCY_INACTIVITY_GAP',
        category: GrowthInsightCategory.CONSISTENCY,
        eligible: true,
        insight: {
          title: `Publishing Inactivity Detected (${daysSinceLastPost}-Day Gap)`,
          summary: `No new content has been published in the last ${daysSinceLastPost} days. Extended gaps often result in reduced algorithmic visibility and audience retention.`,
          suggestedAction: 'Schedule 2–3 posts for the upcoming week using the Publishing Calendar to restore account momentum.',
          evidence: {
            ruleId: 'CONSISTENCY_INACTIVITY_GAP',
            daysSinceLastPost,
            lastPublishedAt: sortedPosts[0].publishedAt!.toISOString(),
            gapThresholdDays: 7,
          },
          confidenceScore: 0.92,
          expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
        },
      };
    }

    // Case B: Consistent cadence check over last 21 days
    const twentyOneDaysAgo = now - 21 * 24 * 60 * 60 * 1000;
    const recentPosts = sortedPosts.filter(
      (p) => p.publishedAt!.getTime() >= twentyOneDaysAgo,
    );

    const weeklyAvg = parseFloat((recentPosts.length / 3).toFixed(1));

    if (weeklyAvg >= 2.5) {
      // Check reach correlation in account snapshots
      const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
      const recentReachSum = accountSnapshots
        .filter((s) => s.snapshotDate.getTime() >= fourteenDaysAgo)
        .reduce((acc, s) => acc + (s.reach ?? 0), 0);
      const priorReachSum = accountSnapshots
        .filter(
          (s) =>
            s.snapshotDate.getTime() < fourteenDaysAgo &&
            s.snapshotDate.getTime() >= now - 28 * 24 * 60 * 60 * 1000,
        )
        .reduce((acc, s) => acc + (s.reach ?? 0), 0);

      if (priorReachSum > 50 && recentReachSum > priorReachSum) {
        const reachGrowthPct = Math.round(
          ((recentReachSum - priorReachSum) / priorReachSum) * 100,
        );

        if (reachGrowthPct >= 10) {
          return {
            ruleId: 'CONSISTENCY_CADENCE_GROWTH',
            category: GrowthInsightCategory.CONSISTENCY,
            eligible: true,
            insight: {
              title: 'Consistent Cadence Correlates with Reach Growth',
              summary: `Maintaining a steady cadence of ${weeklyAvg} posts/week over the last 3 weeks coincided with a +${reachGrowthPct}% lift in 14-day total reach.`,
              suggestedAction: `Preserve this ${weeklyAvg} posts/week rhythm by queueing draft content in your publishing calendar.`,
              evidence: {
                ruleId: 'CONSISTENCY_CADENCE_GROWTH',
                weeklyPostAverage: weeklyAvg,
                totalPosts: recentPosts.length,
                recentReachSum,
                priorReachSum,
                reachGrowthPct,
                isCorrelational: true,
              },
              confidenceScore: 0.84,
              expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
            },
          };
        }
      }
    }

    return {
      ruleId,
      category: GrowthInsightCategory.CONSISTENCY,
      eligible: false,
      reason: 'Publishing cadence is stable and no extended gap was observed.',
    };
  }

  // ---------------------------------------------------------------------------
  // Optional AI Phrasing Enrichment
  // ---------------------------------------------------------------------------

  private async enrichPhrasingWithAi(insight: {
    title: string;
    summary: string;
    suggestedAction: string;
    evidence: Record<string, any>;
  }): Promise<{ summary?: string; suggestedAction?: string }> {
    if (!this.textProvider) return {};

    const prompt = `You are an expert social media growth analytics advisor.
Given the verified evidence and observations below, write an articulate, professional 2-sentence summary and 1 direct suggested action.
DO NOT fabricate any metrics, numbers, dates, or causal claims. Keep all numbers identical to the evidence.

Evidence: ${JSON.stringify(insight.evidence)}
Existing Summary: ${insight.summary}
Existing Action: ${insight.suggestedAction}

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "...",
  "suggestedAction": "..."
}`;

    const raw = await this.textProvider.generateText({
      systemPrompt: 'You are an expert social media growth analytics advisor.',
      userPrompt: prompt,
      temperature: 0.2,
      maxTokens: 250,
    });

    const parsed = JSON.parse(
      raw.rawText.replace(/```json/g, '').replace(/```/g, '').trim(),
    );

    return {
      summary: parsed.summary || insight.summary,
      suggestedAction: parsed.suggestedAction || insight.suggestedAction,
    };
  }
}
