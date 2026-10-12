import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { UtmParametersDto as IUtmParametersDto } from '@packages/shared';

export class UtmParametersDto implements IUtmParametersDto {
  @ApiPropertyOptional({ description: 'The referrer or social platform (e.g. facebook, twitter, linkedin)', example: 'linkedin' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'utmSource must contain only letters, numbers, underscores, dashes, or dots',
  })
  utmSource?: string;

  @ApiPropertyOptional({ description: 'Marketing medium (e.g. social, cpc, email, post)', example: 'social' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'utmMedium must contain only letters, numbers, underscores, dashes, or dots',
  })
  utmMedium?: string;

  @ApiPropertyOptional({ description: 'Product, campaign name or promo code', example: 'summer_promo_2026' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'utmCampaign must contain only letters, numbers, underscores, dashes, or dots',
  })
  utmCampaign?: string;

  @ApiPropertyOptional({ description: 'Paid search keywords or targeted audience', example: 'saas_automation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmTerm?: string;

  @ApiPropertyOptional({ description: 'Used to differentiate similar content or links in the same ad', example: 'banner_cta' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmContent?: string;
}
