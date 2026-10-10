import { IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIanaTimezone, IsMinFiveMinutesInFuture } from './validators';

export class ReschedulePostDto {
  @ApiProperty({
    description: 'New scheduled execution time in ISO-8601 format (must be at least 5 minutes in future)',
    example: '2026-10-18T18:00:00.000Z',
  })
  @IsISO8601()
  @IsMinFiveMinutesInFuture()
  scheduledAt: string;

  @ApiPropertyOptional({
    description: 'Updated IANA timezone for calendar display context',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsIanaTimezone()
  timezone?: string;
}
