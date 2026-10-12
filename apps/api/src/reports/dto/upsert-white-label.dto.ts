import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpsertWhiteLabelConfigDto as IUpsertWhiteLabelConfigDto } from '@packages/shared';

export class UpsertWhiteLabelConfigDto implements IUpsertWhiteLabelConfigDto {
  @ApiProperty({ description: 'Agency or brand name displayed across the client portal', example: 'Apex Media Agency' })
  @IsString()
  @IsNotEmpty()
  brandName!: string;

  @ApiPropertyOptional({ description: 'Custom domain or CNAME for client access', example: 'portal.apexmedia.com' })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiPropertyOptional({ description: 'URL to agency brand logo', example: 'https://cdn.apex.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'URL to agency favicon icon', example: 'https://cdn.apex.com/favicon.ico' })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({ description: 'Hex code for primary brand theme', example: '#6366f1' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Hex code for secondary brand theme', example: '#4f46e5' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Hex code for accent brand highlight', example: '#06b6d4' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional({ description: 'Agency client support email address', example: 'support@apexmedia.com' })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({ description: 'Custom browser page title and portal header', example: 'Apex Client Intelligence Portal' })
  @IsOptional()
  @IsString()
  portalTitle?: string;

  @ApiPropertyOptional({ description: 'Custom CSS stylesheet rules injected into portal layout', example: ':root { --radius: 12px; }' })
  @IsOptional()
  @IsString()
  customCss?: string;

  @ApiPropertyOptional({ description: 'Whether to hide the default powered-by attribution badge', default: false })
  @IsOptional()
  @IsBoolean()
  hidePoweredBy?: boolean;

  @ApiPropertyOptional({ description: 'Full URL for clients to access white-label portal', example: 'https://portal.apexmedia.com/login' })
  @IsOptional()
  @IsString()
  clientAccessUrl?: string;

  @ApiPropertyOptional({ description: 'Whether white-label portal features are enabled', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
