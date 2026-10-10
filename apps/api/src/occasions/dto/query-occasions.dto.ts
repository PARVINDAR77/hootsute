import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOccasionsDto {
  @ApiPropertyOptional({ description: 'Filter by category (e.g. Major Festival, Cultural & Regional, National Observance)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by date calculation type (FIXED_GREGORIAN, LUNAR_CALENDAR, REGIONAL_SEASONAL)' })
  @IsOptional()
  @IsString()
  dateType?: string;

  @ApiPropertyOptional({ description: 'Search term for name, cultural context, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Pagination page number', default: 1 })
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
