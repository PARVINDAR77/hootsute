import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class InitiateOAuthDto {
  @ApiPropertyOptional({
    description: 'Custom frontend callback or redirect URL after OAuth completion',
    example: 'http://localhost:3000/settings/social-accounts',
  })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}
