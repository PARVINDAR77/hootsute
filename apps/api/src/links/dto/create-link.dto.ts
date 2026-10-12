import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UtmParametersDto } from './utm-parameters.dto';
import { CreateShortenedLinkDto as ICreateShortenedLinkDto } from '@packages/shared';

export class CreateLinkDto implements ICreateShortenedLinkDto {
  @ApiProperty({
    description: 'Target destination URL (must be valid HTTP or HTTPS)',
    example: 'https://acmebrand.com/products/summer-sale',
  })
  @IsNotEmpty({ message: 'originalUrl is required' })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'originalUrl must be a valid HTTP or HTTPS URL' },
  )
  originalUrl: string;

  @ApiPropertyOptional({
    description: 'Optional custom slug/alias (alphanumeric, dashes, underscores)',
    example: 'summer-sale',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'customCode must be at least 3 characters' })
  @MaxLength(32, { message: 'customCode cannot exceed 32 characters' })
  @Matches(/^[a-zA-Z0-9_\-]+$/, {
    message: 'customCode can only contain letters, numbers, dashes, and underscores',
  })
  customCode?: string;

  @ApiPropertyOptional({
    description: 'Internal descriptive title for link cataloging',
    example: 'Summer 2026 Sale Campaign Link',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    description: 'UTM Tracking parameters to automatically inject into the destination URL',
    type: UtmParametersDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UtmParametersDto)
  utmParameters?: UtmParametersDto;
}
