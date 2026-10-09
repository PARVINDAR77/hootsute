import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Media Labs', description: 'Business or workspace name' })
  @IsString()
  @IsNotEmpty({ message: 'Workspace name is required' })
  @MinLength(2, { message: 'Workspace name must be at least 2 characters' })
  @MaxLength(100, { message: 'Workspace name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'acme-media',
    description: 'Custom unique URL slug (alphanumeric and hyphens only). If omitted, automatically generated from name.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters separated by single hyphens',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  slug?: string;

  @ApiPropertyOptional({ example: 'Full-service social media marketing agency' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Website URL must be a valid URL' })
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'Marketing & Advertising' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ example: 'America/New_York', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultLanguage?: string;
}
