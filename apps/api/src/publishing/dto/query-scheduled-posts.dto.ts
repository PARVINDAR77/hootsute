import { IsOptional, IsEnum, IsISO8601, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduledPostStatus } from '@prisma/client';

export class QueryScheduledPostsDto {
  @ApiPropertyOptional({ enum: ScheduledPostStatus, description: 'Filter by scheduling status' })
  @IsOptional()
  @IsEnum(ScheduledPostStatus)
  status?: ScheduledPostStatus;

  @ApiPropertyOptional({ description: 'Filter by minimum scheduled date (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by maximum scheduled date (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Page limit (default 20, max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
