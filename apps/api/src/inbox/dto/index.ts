import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Length,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SocialPlatform,
  InteractionType,
  InteractionWorkflowStatus,
} from '@prisma/client';

export class ListInteractionsQueryDto {
  @ApiPropertyOptional({ description: 'Search term matching comment content or author name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SocialPlatform, description: 'Filter by platform' })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiPropertyOptional({ description: 'Filter by connected social account ID' })
  @IsOptional()
  @IsString()
  socialAccountId?: string;

  @ApiPropertyOptional({ enum: InteractionWorkflowStatus, description: 'Filter by workflow status' })
  @IsOptional()
  @IsEnum(InteractionWorkflowStatus)
  workflowStatus?: InteractionWorkflowStatus;

  @ApiPropertyOptional({ enum: InteractionType, description: 'Filter by interaction type' })
  @IsOptional()
  @IsEnum(InteractionType)
  interactionType?: InteractionType;

  @ApiPropertyOptional({ description: 'Filter by read/unread state' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Filter to interactions assigned to current user' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  assignedToMe?: boolean;

  @ApiPropertyOptional({ description: 'ISO start date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO end date' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'publishedAt', enum: ['publishedAt', 'createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'publishedAt' | 'createdAt' = 'publishedAt';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PostReplyBodyDto {
  @ApiProperty({ description: 'Reply text to publish on provider', maxLength: 8000 })
  @IsString()
  @Length(1, 8000)
  content: string;

  @ApiProperty({ description: 'Client-generated idempotency key' })
  @IsString()
  @Length(1, 128)
  idempotencyKey: string;
}

export class UpdateWorkflowStatusDto {
  @ApiProperty({ enum: InteractionWorkflowStatus })
  @IsEnum(InteractionWorkflowStatus)
  status: InteractionWorkflowStatus;
}

export class AssignInteractionDto {
  @ApiPropertyOptional({ description: 'Workspace member User ID, or null to unassign' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string | null;
}

export class MarkReadDto {
  @ApiProperty({ description: 'Read state' })
  @IsBoolean()
  isRead: boolean;
}

export class AddInternalNoteDto {
  @ApiProperty({ description: 'Internal team note content', maxLength: 2000 })
  @IsString()
  @Length(1, 2000)
  content: string;
}

export class SyncInteractionsBodyDto {
  @ApiPropertyOptional({ description: 'Optional specific social account ID' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Force sync bypassing the 5-minute cooldown (ADMIN/OWNER only)' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
