import { Injectable } from '@nestjs/common';
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

@Injectable()
export class MockSocialAnalyticsAdapter implements SocialAnalyticsAdapter {
  private customAccountMetrics?: Partial<AccountMetricsResult>;
  private customPostMetrics?: Partial<PostMetricsResult>;
  private customRecentPosts?: RecentPostItem[];

  setMockAccountMetrics(metrics: Partial<AccountMetricsResult>) {
    this.customAccountMetrics = metrics;
  }

  setMockPostMetrics(metrics: Partial<PostMetricsResult>) {
    this.customPostMetrics = metrics;
  }

  setMockRecentPosts(posts: RecentPostItem[]) {
    this.customRecentPosts = posts;
  }

  async fetchAccountMetrics(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; until?: Date },
  ): Promise<AccountMetricsResult> {
    const isFb = account.provider === 'META_FACEBOOK';
    const platform = isFb ? SocialPlatform.FACEBOOK : SocialPlatform.INSTAGRAM;
    const hasInsights = (account.grantedScopes || []).includes(
      isFb ? 'read_insights' : 'instagram_manage_insights',
    );

    return {
      platform,
      followersCount: this.customAccountMetrics?.followersCount ?? 2500,
      followersNetChange: this.customAccountMetrics?.followersNetChange ?? 15,
      impressions: hasInsights ? (this.customAccountMetrics?.impressions ?? 8000) : null,
      reach: hasInsights ? (this.customAccountMetrics?.reach ?? 3500) : null,
      profileViews: hasInsights ? (this.customAccountMetrics?.profileViews ?? 120) : null,
      websiteClicks: hasInsights ? (this.customAccountMetrics?.websiteClicks ?? 45) : null,
      engagementTotal: this.customAccountMetrics?.engagementTotal ?? 350,
      provenance: hasInsights
        ? 'MOCK_TIER2_INSIGHTS'
        : 'MOCK_TIER1_PUBLIC',
      hasScopeForDeepInsights: hasInsights,
      rateLimitUsagePercent: 10,
      rawMetrics: { mock: true },
      ...this.customAccountMetrics,
    };
  }

  async fetchPostMetrics(
    account: SocialAccount,
    externalPostId: string,
    decryptedToken: string,
  ): Promise<PostMetricsResult> {
    const isFb = account.provider === 'META_FACEBOOK';
    const platform = isFb ? SocialPlatform.FACEBOOK : SocialPlatform.INSTAGRAM;
    const hasInsights = (account.grantedScopes || []).includes(
      isFb ? 'read_insights' : 'instagram_manage_insights',
    );

    return {
      externalPostId,
      platform,
      postType: PostAnalyticsType.POST,
      publishedAt: new Date(),
      likesCount: this.customPostMetrics?.likesCount ?? 85,
      commentsCount: this.customPostMetrics?.commentsCount ?? 14,
      sharesCount: this.customPostMetrics?.sharesCount ?? 6,
      savesCount: hasInsights ? (this.customPostMetrics?.savesCount ?? 12) : null,
      impressions: hasInsights ? (this.customPostMetrics?.impressions ?? 1200) : null,
      reach: hasInsights ? (this.customPostMetrics?.reach ?? 850) : null,
      clicks: this.customPostMetrics?.clicks ?? 20,
      videoViews: this.customPostMetrics?.videoViews ?? null,
      watchTimeMs: this.customPostMetrics?.watchTimeMs ?? null,
      provenance: hasInsights ? 'MOCK_TIER2_INSIGHTS' : 'MOCK_TIER1_PUBLIC',
      hasScopeForDeepInsights: hasInsights,
      rawMetrics: { mock: true },
      ...this.customPostMetrics,
    };
  }

  async fetchRecentPosts(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; limit?: number },
  ): Promise<RecentPostItem[]> {
    if (this.customRecentPosts) {
      return this.customRecentPosts;
    }

    return [
      {
        externalPostId: 'mock-post-1',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        postType: PostAnalyticsType.POST,
        permalink: 'https://example.com/post/1',
      },
      {
        externalPostId: 'mock-post-2',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        postType: PostAnalyticsType.IMAGE,
        permalink: 'https://example.com/post/2',
      },
    ];
  }
}
