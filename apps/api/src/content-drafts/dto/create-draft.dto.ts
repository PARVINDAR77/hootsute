import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
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

export class CreateVariantDto {
  @ApiProperty({ enum: SocialPlatform, example: SocialPlatform.INSTAGRAM })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiPropertyOptional({ example: 'Discover Festive Radiance' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  headline?: string;

  @ApiProperty({ example: 'Celebrate traditions with our exclusive handcrafted collection.' })
  @IsString()
  @IsNotEmpty({ message: 'Variant body is required' })
  @MaxLength(10000, { message: 'Variant body cannot exceed 10000 characters' })
  body: string;

  @ApiPropertyOptional({ example: 'Shop now via link in bio' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  callToAction?: string;

  @ApiPropertyOptional({ example: ['#FestiveSeason', '#Handmade'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/festive' })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'Link URL must be a valid HTTP or HTTPS URL' },
  )
  linkUrl?: string;

  @ApiPropertyOptional({ example: 'Golden hour shot with warm earthen diyas' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mediaBrief?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/assets/banner.png' })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'Media asset URL must be a valid HTTP or HTTPS URL' },
  )
  mediaAssetUrl?: string;
}

export class CreateContentDraftDto {
  @ApiProperty({ description: 'Draft title for internal identification', example: 'Diwali 2026 Promo Campaign' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ enum: CampaignObjective, default: CampaignObjective.ENGAGEMENT })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective = CampaignObjective.ENGAGEMENT;

  @ApiPropertyOptional({ enum: ContentType, default: ContentType.POST })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType = ContentType.POST;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string = 'en';

  @ApiPropertyOptional({ type: [CreateVariantDto], description: 'Initial platform variants' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
