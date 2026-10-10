import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { BrandTone } from '@packages/shared';

export class RegenerateVariantDto {
  @ApiPropertyOptional({
    description: 'Specific field to regenerate, or "all" to recreate the whole variant',
    enum: ['all', 'headline', 'body', 'callToAction', 'hashtags'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'headline', 'body', 'callToAction', 'hashtags'])
  field?: 'all' | 'headline' | 'body' | 'callToAction' | 'hashtags' = 'all';

  @ApiPropertyOptional({ description: 'Additional instructions for regeneration', example: 'Make it more urgent and highlight limited festive stocks' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ enum: BrandTone, description: 'Optional tone override' })
  @IsOptional()
  @IsString()
  tone?: BrandTone;
}
