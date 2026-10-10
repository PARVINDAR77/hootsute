import {
  SocialAccount,
  SocialPlatform,
  PostAnalyticsType,
} from '@prisma/client';

export interface AccountMetricsResult {
  platform: SocialPlatform;
  followersCount?: number | null;
  followersNetChange?: number | null;
  impressions?: number | null;
  reach?: number | null;
  profileViews?: number | null;
  websiteClicks?: number | null;
  engagementTotal?: number | null;
  provenance: string;
  hasScopeForDeepInsights: boolean;
  rateLimitUsagePercent?: number;
  rawMetrics?: Record<string, any>;
}

export interface PostMetricsResult {
  externalPostId: string;
  platform: SocialPlatform;
  postType: PostAnalyticsType;
  publishedAt?: Date | null;
  likesCount?: number | null;
  commentsCount?: number | null;
  sharesCount?: number | null;
  savesCount?: number | null;
  impressions?: number | null;
  reach?: number | null;
  clicks?: number | null;
  videoViews?: number | null;
  watchTimeMs?: bigint | number | null;
  provenance: string;
  hasScopeForDeepInsights: boolean;
  rawMetrics?: Record<string, any>;
}

export interface RecentPostItem {
  externalPostId: string;
  publishedAt: Date;
  postType: PostAnalyticsType;
  permalink?: string;
}

export interface SocialAnalyticsAdapter {
  fetchAccountMetrics(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; until?: Date },
  ): Promise<AccountMetricsResult>;

  fetchPostMetrics(
    account: SocialAccount,
    externalPostId: string,
    decryptedToken: string,
  ): Promise<PostMetricsResult>;

  fetchRecentPosts(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; limit?: number },
  ): Promise<RecentPostItem[]>;
}
