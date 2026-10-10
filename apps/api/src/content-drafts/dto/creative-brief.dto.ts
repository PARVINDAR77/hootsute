import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateCreativeBriefDto {
  @ApiPropertyOptional({
    description: 'Specific visual preferences or constraints for imagery generation',
    example: 'Minimalist studio photography with warm golden hour backlighting',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  visualPreferences?: string;
}
