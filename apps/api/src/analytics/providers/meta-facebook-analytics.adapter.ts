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
export class MetaFacebookAnalyticsAdapter implements SocialAnalyticsAdapter {
  private readonly logger = new Logger(MetaFacebookAnalyticsAdapter.name);
  private readonly apiVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.apiVersion = this.configService.get<string>('META_API_VERSION') || 'v21.0';
  }

  async fetchAccountMetrics(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; until?: Date },
  ): Promise<AccountMetricsResult> {
    const pageId = account.providerAccountId;
    const hasInsightsScope = (account.grantedScopes || []).includes('read_insights');

    // 1. Fetch public profile fields (Tier 1)
    const publicUrl = `https://graph.facebook.com/${this.apiVersion}/${pageId}?fields=followers_count,fan_count&access_token=${encodeURIComponent(decryptedToken)}`;
    const publicRes = await fetch(publicUrl);
    const rateLimit = parseMetaRateLimitHeader(publicRes.headers);
    const publicData = await publicRes.json().catch(() => null);

    if (!publicRes.ok || publicData?.error) {
      this.logger.warn(`Failed to fetch Facebook public account metrics: ${publicData?.error?.message}`);
      throw new Error(publicData?.error?.message || 'Failed to fetch Facebook Page metrics');
    }

    const followersCount = publicData.followers_count ?? publicData.fan_count ?? null;
    let impressions: number | null = null;
    let reach: number | null = null;
    let engagementTotal: number | null = null;

    // 2. Fetch deep insights if read_insights is granted (Tier 2)
    if (hasInsightsScope) {
      try {
        const insightsUrl = `https://graph.facebook.com/${this.apiVersion}/${pageId}/insights?metric=page_impressions,page_post_engagements&period=day&access_token=${encodeURIComponent(decryptedToken)}`;
        const insRes = await fetch(insightsUrl);
        const insData = await insRes.json().catch(() => null);

        if (insRes.ok && insData?.data) {
          for (const item of insData.data) {
            const latestValue = item.values?.[item.values.length - 1]?.value;
            if (item.name === 'page_impressions' && latestValue != null) {
              impressions = Number(latestValue);
            } else if (item.name === 'page_post_engagements' && latestValue != null) {
              engagementTotal = Number(latestValue);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch Facebook Page deep insights: ${err.message}`);
      }
    }

    return {
      platform: SocialPlatform.FACEBOOK,
      followersCount,
      followersNetChange: null, // Facebook page net follower change requires extended analytics
      impressions,
      reach,
      profileViews: null,
      websiteClicks: null,
      engagementTotal,
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
    const hasInsightsScope = (account.grantedScopes || []).includes('read_insights');

    // 1. Fetch public interaction fields (Tier 1: reactions, comments, shares)
    const publicUrl = `https://graph.facebook.com/${this.apiVersion}/${externalPostId}?fields=shares,comments.summary(true),reactions.summary(true)&access_token=${encodeURIComponent(decryptedToken)}`;
    const publicRes = await fetch(publicUrl);
    const publicData = await publicRes.json().catch(() => null);

    if (!publicRes.ok || publicData?.error) {
      throw new Error(publicData?.error?.message || `Failed to fetch Facebook post [${externalPostId}]`);
    }

    const likesCount = publicData.reactions?.summary?.total_count ?? null;
    const commentsCount = publicData.comments?.summary?.total_count ?? null;
    const sharesCount = publicData.shares?.count ?? null;

    let impressions: number | null = null;
    let reach: number | null = null;
    let clicks: number | null = null;

    // 2. Fetch post insights if read_insights granted (Tier 2)
    if (hasInsightsScope) {
      try {
        const insUrl = `https://graph.facebook.com/${this.apiVersion}/${externalPostId}/insights?metric=post_impressions,post_impressions_unique,post_clicks&access_token=${encodeURIComponent(decryptedToken)}`;
        const insRes = await fetch(insUrl);
        const insData = await insRes.json().catch(() => null);

        if (insRes.ok && insData?.data) {
          for (const item of insData.data) {
            const val = item.values?.[0]?.value;
            if (item.name === 'post_impressions' && val != null) {
              impressions = Number(val);
            } else if (item.name === 'post_impressions_unique' && val != null) {
              reach = Number(val);
            } else if (item.name === 'post_clicks' && val != null) {
              clicks = Number(val);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch Facebook post insights: ${err.message}`);
      }
    }

    return {
      externalPostId,
      platform: SocialPlatform.FACEBOOK,
      postType: PostAnalyticsType.POST,
      likesCount,
      commentsCount,
      sharesCount,
      savesCount: null, // Facebook Page API does not expose post-level saves
      impressions,
      reach,
      clicks,
      videoViews: null,
      watchTimeMs: null,
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
    const pageId = account.providerAccountId;
    const limit = Math.min(100, Math.max(1, options?.limit || 25));
    let url = `https://graph.facebook.com/${this.apiVersion}/${pageId}/published_posts?fields=id,created_time,permalink_url,attachments{media_type}&limit=${limit}&access_token=${encodeURIComponent(decryptedToken)}`;

    if (options?.since) {
      url += `&since=${Math.floor(options.since.getTime() / 1000)}`;
    }

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.error) {
      throw new Error(data?.error?.message || 'Failed to fetch Facebook published posts');
    }

    const items: RecentPostItem[] = [];
    for (const post of data?.data || []) {
      let postType: PostAnalyticsType = PostAnalyticsType.POST;
      const mediaType = post.attachments?.data?.[0]?.media_type;
      if (mediaType === 'video') postType = PostAnalyticsType.VIDEO;
      else if (mediaType === 'photo') postType = PostAnalyticsType.IMAGE;
      else if (mediaType === 'album') postType = PostAnalyticsType.CAROUSEL;

      items.push({
        externalPostId: post.id,
        publishedAt: new Date(post.created_time),
        postType,
        permalink: post.permalink_url,
      });
    }

    return items;
  }
}
