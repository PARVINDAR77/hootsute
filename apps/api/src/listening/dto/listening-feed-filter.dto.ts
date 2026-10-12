import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SocialPlatform } from '@packages/shared';

export class ListeningFeedFilterDto {
  @ApiPropertyOptional({ description: 'Filter mentions by listening query ID' })
  @IsOptional()
  @IsString()
  queryId?: string;

  @ApiPropertyOptional({
    description: 'Filter mentions by sentiment',
    enum: ['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'],
  })
  @IsOptional()
  @IsEnum(['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'])
  sentiment?: 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

  @ApiPropertyOptional({
    description: 'Filter mentions by social platform',
    enum: SocialPlatform,
  })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiPropertyOptional({ description: 'Text search query matching content or author' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Return only starred mentions' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyStarred?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size limit', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
