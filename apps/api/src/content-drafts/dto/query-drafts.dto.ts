import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DraftStatus, CampaignObjective, ContentType } from '@prisma/client';

export class QueryDraftsDto {
  @ApiPropertyOptional({ enum: DraftStatus, description: 'Filter by lifecycle status' })
  @IsOptional()
  @IsEnum(DraftStatus)
  status?: DraftStatus;

  @ApiPropertyOptional({ enum: CampaignObjective, description: 'Filter by objective' })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @ApiPropertyOptional({ enum: ContentType, description: 'Filter by content format' })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({ description: 'Search term for title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
