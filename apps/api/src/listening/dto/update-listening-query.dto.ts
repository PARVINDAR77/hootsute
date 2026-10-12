import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { SocialPlatform } from '@packages/shared';

export class UpdateListeningQueryDto {
  @ApiPropertyOptional({ description: 'Updated query name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated target keywords',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'Updated excluded keywords',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedKeywords?: string[];

  @ApiPropertyOptional({
    description: 'Updated social platforms',
    enum: SocialPlatform,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  platforms?: SocialPlatform[];

  @ApiPropertyOptional({
    description: 'Updated languages',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Whether the query is currently active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sentiment filter preference',
    enum: ['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'],
  })
  @IsOptional()
  @IsEnum(['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'])
  sentimentFilter?: 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}
