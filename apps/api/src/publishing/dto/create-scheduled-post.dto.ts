import {
  IsUUID,
  IsISO8601,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialPlatform } from '@prisma/client';
import { IsIanaTimezone, IsMinFiveMinutesInFuture } from './validators';

export class CreateScheduledPostTargetDto {
  @ApiProperty({ description: 'ID of the connected SocialAccount in this workspace' })
  @IsUUID('4')
  @IsNotEmpty()
  socialAccountId: string;

  @ApiProperty({ enum: SocialPlatform, description: 'Target social platform' })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiPropertyOptional({ description: 'Optional specific variant ID from the draft to publish' })
  @IsOptional()
  @IsUUID('4')
  variantId?: string;
}

export class CreateScheduledPostDto {
  @ApiProperty({ description: 'ID of the approved ContentDraft to schedule' })
  @IsUUID('4')
  @IsNotEmpty()
  draftId: string;

  @ApiProperty({
    description: 'Scheduled execution time in ISO-8601 format (must be at least 5 minutes in future)',
    example: '2026-10-15T15:00:00.000Z',
  })
  @IsISO8601()
  @IsMinFiveMinutesInFuture()
  scheduledAt: string;

  @ApiPropertyOptional({
    description: 'IANA timezone for calendar display context',
    example: 'Asia/Kolkata',
    default: 'UTC',
  })
  @IsOptional()
  @IsIanaTimezone()
  timezone?: string = 'UTC';

  @ApiProperty({
    type: [CreateScheduledPostTargetDto],
    description: 'List of platform targets and connected social accounts (minimum 1, maximum 10)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one publishing target must be specified' })
  @ArrayMaxSize(10, { message: 'Cannot schedule more than 10 targets per post' })
  @ValidateNested({ each: true })
  @Type(() => CreateScheduledPostTargetDto)
  targets: CreateScheduledPostTargetDto[];
}
