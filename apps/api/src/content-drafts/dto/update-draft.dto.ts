import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CampaignObjective,
  ContentType,
  SocialPlatform,
} from '@prisma/client';

export class UpdateVariantDto {
  @ApiPropertyOptional({ description: 'ID of existing variant if updating, or omit if adding new', example: 'uuid-123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ enum: SocialPlatform, example: SocialPlatform.INSTAGRAM })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiPropertyOptional({ example: 'Updated Headline' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  headline?: string;

  @ApiPropertyOptional({ example: 'Updated body text...' })
  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Variant body cannot exceed 10000 characters' })
  body?: string;

  @ApiPropertyOptional({ example: 'Visit our store' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  callToAction?: string;

  @ApiPropertyOptional({ example: ['#Update', '#Sale'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'Link URL must be a valid HTTP or HTTPS URL' },
  )
  linkUrl?: string;

  @ApiPropertyOptional({ example: 'Updated brief' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mediaBrief?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/asset.png' })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'Media asset URL must be a valid HTTP or HTTPS URL' },
  )
  mediaAssetUrl?: string;

  @ApiPropertyOptional({ description: 'ID of verified workspace media asset', example: 'uuid-media-123' })
  @IsOptional()
  @IsString()
  mediaAssetId?: string;
}

export class UpdateContentDraftDto {
  @ApiPropertyOptional({ description: 'Draft title', example: 'Refined Diwali Campaign' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: CampaignObjective })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @ApiPropertyOptional({ enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ type: [UpdateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];
}
