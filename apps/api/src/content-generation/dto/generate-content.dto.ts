import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { CampaignObjective, SocialPlatform } from '@prisma/client';
import { BrandTone } from '@packages/shared';

export class GenerateContentDto {
  @ApiProperty({ enum: CampaignObjective, default: CampaignObjective.ENGAGEMENT })
  @IsEnum(CampaignObjective)
  objective: CampaignObjective = CampaignObjective.ENGAGEMENT;

  @ApiProperty({
    enum: SocialPlatform,
    isArray: true,
    example: [SocialPlatform.INSTAGRAM, SocialPlatform.FACEBOOK],
    description: 'Target platforms to generate native variants for',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one social platform must be selected' })
  @ArrayMaxSize(4, { message: 'Cannot generate for more than 4 platforms simultaneously' })
  @IsEnum(SocialPlatform, { each: true })
  platforms: SocialPlatform[];

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string = 'en';

  @ApiPropertyOptional({ enum: BrandTone, default: BrandTone.PROFESSIONAL })
  @IsOptional()
  @IsString()
  tone?: BrandTone = BrandTone.PROFESSIONAL;

  @ApiPropertyOptional({ description: 'Audience profile override', example: 'Modern Indian youth and working professionals' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'Slug of curated festival or occasion', example: 'diwali' })
  @IsOptional()
  @IsString()
  occasionSlug?: string;

  @ApiPropertyOptional({ description: 'Custom guidance or instructions', example: 'Highlight sustainable packaging and limited holiday collection' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  userInstructions?: string;

  @ApiPropertyOptional({ description: 'Specific call to action preference', example: 'Shop via link in bio' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  callToActionPreference?: string;

  @ApiPropertyOptional({ description: 'Draft title for database persistence', example: 'Diwali Festive Launch' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
