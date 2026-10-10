import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  Matches,
  IsUrl,
  ValidateNested,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ContactDetailsDto {
  @ApiPropertyOptional({ example: 'support@business.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Contact email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Ahmedabad, Gujarat, India' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}

export class UpsertBrandProfileDto {
  @ApiProperty({ description: 'Business or brand name', example: 'Acme Retailers' })
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  @MaxLength(100)
  businessName: string;

  @ApiPropertyOptional({ description: 'Industry or niche', example: 'E-commerce & Fashion' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ description: 'Detailed overview of the business', example: 'Leading sustainable ethnic wear brand from Gujarat.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  businessDescription?: string;

  @ApiPropertyOptional({ description: 'Target customer demographic and profile', example: 'Modern Indian youth and working professionals aged 22-45' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'Core product offerings and services', example: 'Handwoven sarees, festive kurtas, designer dupattas' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  productsAndServices?: string;

  @ApiPropertyOptional({ description: 'Tone and personality of the brand voice', example: 'Warm, culturally respectful, friendly, and empowering' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  brandVoice?: string;

  @ApiPropertyOptional({ description: 'Primary preferred language code', example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLanguage?: string;

  @ApiPropertyOptional({ description: 'List of supported language codes', example: ['en', 'gu', 'hi'], default: ['en'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedLanguages?: string[];

  @ApiPropertyOptional({ description: 'Hex primary brand color', example: '#2E5BFF' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
    message: 'Primary color must be a valid hex color code (e.g. #2E5BFF or #FFF)',
  })
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Hex secondary brand color', example: '#FF6B6B' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
    message: 'Secondary color must be a valid hex color code (e.g. #FF6B6B or #000)',
  })
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Public URL to brand logo image', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'Logo URL must be a valid HTTP or HTTPS URL' },
  )
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Brand slogan or tagline', example: 'Crafted with tradition, designed for today' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slogan?: string;

  @ApiPropertyOptional({ description: 'Official company website URL', example: 'https://acmeretailers.com' })
  @IsOptional()
  @IsString()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'Website URL must be a valid HTTP or HTTPS URL' },
  )
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Structured business contact details', type: ContactDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDetailsDto)
  contactDetails?: ContactDetailsDto;

  @ApiPropertyOptional({ description: 'Do and Don’ts for copy generation and brand identity', example: 'Never mention competitors. Always highlight artisanal authenticity.' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  brandGuidelines?: string;
}
