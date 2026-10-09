import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({
    description: 'Refresh token (optional if provided via HttpOnly cookie)',
    example: 'd9b73489e2f4...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
