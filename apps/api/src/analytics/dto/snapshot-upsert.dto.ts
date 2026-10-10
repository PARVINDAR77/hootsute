import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AnalyticsMetricPeriod,
  PostAnalyticsType,
  SocialPlatform,
} from '@prisma/client';

export class UpsertAccountSnapshotDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  socialAccountId: string;

  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @IsOptional()
  @IsEnum(AnalyticsMetricPeriod)
  period?: AnalyticsMetricPeriod = AnalyticsMetricPeriod.DAY;

  @Type(() => Date)
  @IsDate()
  snapshotDate: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  followersCount?: number | null;

  @IsOptional()
  @IsInt()
  followersNetChange?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  impressions?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  reach?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  profileViews?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  websiteClicks?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  engagementTotal?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  engagementRate?: number | null;

  @IsOptional()
  @IsString()
  provenance?: string | null;

  @IsOptional()
  rawMetrics?: Record<string, any> | null;
}

export class UpsertPostSnapshotDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  socialAccountId: string;

  @IsOptional()
  @IsUUID()
  scheduledPostTargetId?: string | null;

  @IsString()
  externalPostId: string;

  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @IsOptional()
  @IsEnum(PostAnalyticsType)
  postType?: PostAnalyticsType = PostAnalyticsType.POST;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;

  @Type(() => Date)
  @IsDate()
  snapshotDate: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  likesCount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  commentsCount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sharesCount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  savesCount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  impressions?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  reach?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  clicks?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  videoViews?: number | null;

  @IsOptional()
  watchTimeMs?: bigint | number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  engagementRate?: number | null;

  @IsOptional()
  @IsString()
  provenance?: string | null;

  @IsOptional()
  rawMetrics?: Record<string, any> | null;
}
