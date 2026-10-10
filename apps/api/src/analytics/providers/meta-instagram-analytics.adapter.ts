import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SocialAccount,
  SocialPlatform,
  PostAnalyticsType,
} from '@prisma/client';
import {
  SocialAnalyticsAdapter,
  AccountMetricsResult,
  PostMetricsResult,
  RecentPostItem,
} from './social-analytics.interface';
import { parseMetaRateLimitHeader } from '../utils/rate-limit.util';

@Injectable()
export class MetaInstagramAnalyticsAdapter implements SocialAnalyticsAdapter {
  private readonly logger = new Logger(MetaInstagramAnalyticsAdapter.name);
  private readonly apiVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.apiVersion = this.configService.get<string>('META_API_VERSION') || 'v21.0';
  }

  /**
   * Enforces Meta's strict 30-day lookback ceiling for Instagram insights.
   */
  private clampLookbackDate(date?: Date): Date {
    const maxLookback = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (!date || date < maxLookback) {
      return maxLookback;
    }
    return date;
  }

  async fetchAccountMetrics(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; until?: Date },
  ): Promise<AccountMetricsResult> {
    const igUserId = account.providerAccountId;
    const hasInsightsScope = (account.grantedScopes || []).includes('instagram_manage_insights');

    // 1. Fetch public profile counters (Tier 1)
    const publicUrl = `https://graph.facebook.com/${this.apiVersion}/${igUserId}?fields=followers_count,follows_count,media_count&access_token=${encodeURIComponent(decryptedToken)}`;
    const publicRes = await fetch(publicUrl);
    const rateLimit = parseMetaRateLimitHeader(publicRes.headers);
    const publicData = await publicRes.json().catch(() => null);

    if (!publicRes.ok || publicData?.error) {
      this.logger.warn(`Failed to fetch Instagram account metrics: ${publicData?.error?.message}`);
      throw new Error(publicData?.error?.message || 'Failed to fetch Instagram account profile');
    }

    const followersCount = publicData.followers_count ?? null;
    let reach: number | null = null;
    let profileViews: number | null = null;
    let websiteClicks: number | null = null;

    // 2. Fetch deep insights if instagram_manage_insights is granted (Tier 2)
    if (hasInsightsScope) {
      try {
        const sinceDate = this.clampLookbackDate(options?.since);
        const sinceEpoch = Math.floor(sinceDate.getTime() / 1000);
        const untilEpoch = options?.until ? Math.floor(options.until.getTime() / 1000) : Math.floor(Date.now() / 1000);

        const insUrl = `https://graph.facebook.com/${this.apiVersion}/${igUserId}/insights?metric=reach,profile_views,website_clicks&period=day&since=${sinceEpoch}&until=${untilEpoch}&access_token=${encodeURIComponent(decryptedToken)}`;
        const insRes = await fetch(insUrl);
        const insData = await insRes.json().catch(() => null);

        if (insRes.ok && insData?.data) {
          for (const item of insData.data) {
            const latestVal = item.values?.[item.values.length - 1]?.value;
            if (item.name === 'reach' && latestVal != null) {
              reach = Number(latestVal);
            } else if (item.name === 'profile_views' && latestVal != null) {
              profileViews = Number(latestVal);
            } else if (item.name === 'website_clicks' && latestVal != null) {
              websiteClicks = Number(latestVal);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch Instagram account deep insights: ${err.message}`);
      }
    }

    return {
      platform: SocialPlatform.INSTAGRAM,
      followersCount,
      followersNetChange: null,
      impressions: null, // Account-level impressions on IG are superseded by reach in v21.0
      reach,
      profileViews,
      websiteClicks,
      engagementTotal: null,
      provenance: hasInsightsScope
        ? 'META_GRAPH_V21_TIER2_INSIGHTS'
        : 'META_GRAPH_V21_TIER1_PUBLIC',
      hasScopeForDeepInsights: hasInsightsScope,
      rateLimitUsagePercent: rateLimit.usagePercent,
      rawMetrics: {
        publicData,
        hasInsightsScope,
      },
    };
  }

  async fetchPostMetrics(
    account: SocialAccount,
    externalPostId: string,
    decryptedToken: string,
  ): Promise<PostMetricsResult> {
    const hasInsightsScope = (account.grantedScopes || []).includes('instagram_manage_insights');

    // 1. Fetch public media counters (Tier 1: likes, comments, permalink)
    const publicUrl = `https://graph.facebook.com/${this.apiVersion}/${externalPostId}?fields=id,media_type,like_count,comments_count,timestamp,permalink&access_token=${encodeURIComponent(decryptedToken)}`;
    const publicRes = await fetch(publicUrl);
    const publicData = await publicRes.json().catch(() => null);

    if (!publicRes.ok || publicData?.error) {
      throw new Error(publicData?.error?.message || `Failed to fetch Instagram media [${externalPostId}]`);
    }

    let postType: PostAnalyticsType = PostAnalyticsType.POST;
    if (publicData.media_type === 'VIDEO') postType = PostAnalyticsType.VIDEO;
    else if (publicData.media_type === 'IMAGE') postType = PostAnalyticsType.IMAGE;
    else if (publicData.media_type === 'CAROUSEL_ALBUM') postType = PostAnalyticsType.CAROUSEL;

    const likesCount = publicData.like_count ?? null;
    const commentsCount = publicData.comments_count ?? null;
    const publishedAt = publicData.timestamp ? new Date(publicData.timestamp) : null;

    let impressions: number | null = null;
    let reach: number | null = null;
    let savesCount: number | null = null;
    let sharesCount: number | null = null;
    let videoViews: number | null = null;
    let watchTimeMs: bigint | null = null;

    // 2. Fetch media insights if instagram_manage_insights granted (Tier 2)
    if (hasInsightsScope) {
      try {
        let metrics = 'impressions,reach,saved,shares,total_interactions';
        if (postType === PostAnalyticsType.VIDEO) {
          metrics += ',plays';
        }

        const insUrl = `https://graph.facebook.com/${this.apiVersion}/${externalPostId}/insights?metric=${metrics}&access_token=${encodeURIComponent(decryptedToken)}`;
        const insRes = await fetch(insUrl);
        const insData = await insRes.json().catch(() => null);

        if (insRes.ok && insData?.data) {
          for (const item of insData.data) {
            const val = item.values?.[0]?.value;
            if (item.name === 'impressions' && val != null) impressions = Number(val);
            else if (item.name === 'reach' && val != null) reach = Number(val);
            else if (item.name === 'saved' && val != null) savesCount = Number(val);
            else if (item.name === 'shares' && val != null) sharesCount = Number(val);
            else if (item.name === 'plays' && val != null) videoViews = Number(val);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch Instagram media insights: ${err.message}`);
      }
    }

    return {
      externalPostId,
      platform: SocialPlatform.INSTAGRAM,
      postType,
      publishedAt,
      likesCount,
      commentsCount,
      sharesCount,
      savesCount,
      impressions,
      reach,
      clicks: null,
      videoViews,
      watchTimeMs,
      provenance: hasInsightsScope
        ? 'META_GRAPH_V21_TIER2_INSIGHTS'
        : 'META_GRAPH_V21_TIER1_PUBLIC',
      hasScopeForDeepInsights: hasInsightsScope,
      rawMetrics: publicData,
    };
  }

  async fetchRecentPosts(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; limit?: number },
  ): Promise<RecentPostItem[]> {
    const igUserId = account.providerAccountId;
    const limit = Math.min(100, Math.max(1, options?.limit || 25));
    const url = `https://graph.facebook.com/${this.apiVersion}/${igUserId}/media?fields=id,media_type,timestamp,permalink&limit=${limit}&access_token=${encodeURIComponent(decryptedToken)}`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      throw new Error(data?.error?.message || 'Failed to fetch Instagram media list');
    }

    const items: RecentPostItem[] = [];
    for (const item of data?.data || []) {
      let postType: PostAnalyticsType = PostAnalyticsType.POST;
      if (item.media_type === 'VIDEO') postType = PostAnalyticsType.VIDEO;
      else if (item.media_type === 'IMAGE') postType = PostAnalyticsType.IMAGE;
      else if (item.media_type === 'CAROUSEL_ALBUM') postType = PostAnalyticsType.CAROUSEL;

      items.push({
        externalPostId: item.id,
        publishedAt: new Date(item.timestamp),
        postType,
        permalink: item.permalink,
      });
    }

    return items;
  }
}
