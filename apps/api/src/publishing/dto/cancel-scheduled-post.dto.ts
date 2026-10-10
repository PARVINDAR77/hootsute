import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelScheduledPostDto {
  @ApiPropertyOptional({
    description: 'Reason for cancelling the scheduled publication',
    maxLength: 500,
    example: 'Campaign date moved to next quarter',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
