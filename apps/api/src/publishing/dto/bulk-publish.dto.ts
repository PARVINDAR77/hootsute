import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsIn,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { BulkPublishDispatchMode } from '@packages/shared';

export class BulkPublishCampaignDto {
  @ApiProperty({ type: [String], description: 'Approved draft IDs to publish/schedule in bulk' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one approved campaign draft' })
  @IsString({ each: true })
  draftIds: string[];

  @ApiProperty({ type: [String], description: 'Connected social account IDs across any platforms' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one connected social account' })
  @IsString({ each: true })
  socialAccountIds: string[];

  @ApiProperty({ enum: ['IMMEDIATE', 'SCHEDULED', 'STAGGERED'], default: 'IMMEDIATE' })
  @IsIn(['IMMEDIATE', 'SCHEDULED', 'STAGGERED'])
  dispatchMode: BulkPublishDispatchMode;

  @ApiPropertyOptional({ description: 'ISO 8601 start timestamp for SCHEDULED or STAGGERED mode' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Interval in minutes between posts in STAGGERED mode', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  staggerMinutes?: number;

  @ApiPropertyOptional({
    description: 'Automatically fall back to primary variant when a platform-specific variant does not exist',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoAdaptMissingPlatform?: boolean;
}
