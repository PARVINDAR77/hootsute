import {
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GrowthInsightCategory } from '@prisma/client';

export class CreateGrowthInsightDto {
  @IsUUID()
  workspaceId: string;

  @IsEnum(GrowthInsightCategory)
  category: GrowthInsightCategory;

  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  suggestedAction: string;

  @IsObject()
  evidence: Record<string, any>;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  confidenceScore: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date | null;
}
