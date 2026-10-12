import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { SocialPlatform } from '@packages/shared';

export class CreateListeningQueryDto {
  @ApiProperty({ description: 'Name or label for the listening query', example: 'Brand & Competitor Watch' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'List of target keywords, brand names, or hashtags to track',
    example: ['omnisocial', '#omnisocial', 'hootsuite'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keywords!: string[];

  @ApiPropertyOptional({
    description: 'Keywords to exclude to filter noise',
    example: ['jobs', 'careers', 'hiring'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedKeywords?: string[];

  @ApiProperty({
    description: 'Social platforms to monitor',
    enum: SocialPlatform,
    isArray: true,
    example: [SocialPlatform.TWITTER_X, SocialPlatform.LINKEDIN, SocialPlatform.INSTAGRAM],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(SocialPlatform, { each: true })
  platforms!: SocialPlatform[];

  @ApiPropertyOptional({
    description: 'Languages to filter by (ISO 639-1)',
    example: ['en', 'es'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Sentiment filter preference',
    enum: ['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'],
    default: 'ALL',
  })
  @IsOptional()
  @IsEnum(['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'])
  sentimentFilter?: 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}
