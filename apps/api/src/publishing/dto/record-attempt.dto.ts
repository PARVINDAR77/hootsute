import { IsEnum, IsOptional, IsString, IsInt, Min, IsObject } from 'class-validator';
import { AttemptOutcome } from '@prisma/client';

export class RecordPublishingAttemptDto {
  @IsEnum(AttemptOutcome)
  outcome: AttemptOutcome;

  @IsOptional()
  @IsString()
  sanitizedErrorCode?: string;

  @IsOptional()
  @IsString()
  sanitizedErrorMessage?: string;

  @IsOptional()
  @IsString()
  externalPostId?: string;

  @IsOptional()
  @IsString()
  externalPostUrl?: string;

  @IsOptional()
  @IsString()
  reconciliationStatus?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
