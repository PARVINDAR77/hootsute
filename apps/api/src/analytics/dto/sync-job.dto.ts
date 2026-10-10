import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { SyncJobStatus, SyncJobType } from '@prisma/client';

export class CreateSyncJobDto {
  @IsUUID()
  workspaceId: string;

  @IsOptional()
  @IsUUID()
  socialAccountId?: string | null;

  @IsEnum(SyncJobType)
  jobType: SyncJobType;

  @IsOptional()
  @IsInt()
  @Min(1000)
  leaseDurationMs?: number = 10 * 60 * 1000; // default 10 minutes

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CompleteSyncJobDto {
  @IsString()
  claimToken: string;

  @IsEnum(SyncJobStatus)
  status: SyncJobStatus;

  @IsInt()
  @Min(0)
  itemsProcessed: number;

  @IsInt()
  @Min(0)
  itemsFailed: number;

  @IsOptional()
  @IsString()
  errorCode?: string | null;

  @IsOptional()
  @IsString()
  errorMessage?: string | null;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class RecordSyncErrorDto {
  @IsUUID()
  syncJobId: string;

  @IsOptional()
  @IsUUID()
  socialAccountId?: string | null;

  @IsOptional()
  @IsString()
  externalPostId?: string | null;

  @IsString()
  errorCode: string;

  @IsString()
  errorMessage: string;

  @IsOptional()
  @IsInt()
  httpStatus?: number | null;

  @IsOptional()
  @IsBoolean()
  isPermissionError?: boolean = false;
}
