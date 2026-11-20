import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({
    enum: ['light', 'dark'],
    description: 'Preferred UI color theme (defaults to light)',
    example: 'light',
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark'])
  themePreference?: 'light' | 'dark';
}
