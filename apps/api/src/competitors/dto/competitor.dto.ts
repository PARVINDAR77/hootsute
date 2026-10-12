import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUrl,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialPlatform, CompetitorCategory, AnalyticsMetricPeriod } from '@packages/shared';

export class CreateCompetitorSocialAccountDto {
  @ApiProperty({ enum: SocialPlatform, description: 'Social platform of the competitor account' })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ description: 'Public handle or username of the competitor' })
  @IsString()
  handle: string;

  @ApiPropertyOptional({ description: 'Full public profile URL' })
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiPropertyOptional({ description: 'Public followers count estimate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  followersCount?: number;

  @ApiPropertyOptional({ description: 'Public following count estimate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  followingCount?: number;

  @ApiPropertyOptional({ description: 'Public posts count estimate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  postsCount?: number;
}

export class CreateCompetitorProfileDto {
  @ApiProperty({ description: 'Brand or competitor name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Competitor official website' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Logo or avatar image URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: CompetitorCategory, default: CompetitorCategory.DIRECT })
  @IsOptional()
  @IsEnum(CompetitorCategory)
  category?: CompetitorCategory;

  @ApiPropertyOptional({ description: 'Internal strategist notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateCompetitorSocialAccountDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompetitorSocialAccountDto)
  accounts?: CreateCompetitorSocialAccountDto[];
}

export class UpdateCompetitorProfileDto {
  @ApiPropertyOptional({ description: 'Brand or competitor name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Competitor official website' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Logo or avatar image URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: CompetitorCategory })
  @IsOptional()
  @IsEnum(CompetitorCategory)
  category?: CompetitorCategory;

  @ApiPropertyOptional({ description: 'Internal strategist notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Active monitoring toggle' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddCompetitorAccountDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ description: 'Public handle or username of the competitor' })
  @IsString()
  handle: string;

  @ApiPropertyOptional({ description: 'Full public profile URL' })
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiPropertyOptional({ description: 'Public followers count estimate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  followersCount?: number;

  @ApiPropertyOptional({ description: 'Public following count estimate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  followingCount?: number;

  @ApiPropertyOptional({ description: 'Public posts count estimate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  postsCount?: number;
}

export class CompetitorBenchmarkQueryDto {
  @ApiPropertyOptional({ enum: AnalyticsMetricPeriod, default: AnalyticsMetricPeriod.DAY })
  @IsOptional()
  @IsEnum(AnalyticsMetricPeriod)
  period?: AnalyticsMetricPeriod;
}
