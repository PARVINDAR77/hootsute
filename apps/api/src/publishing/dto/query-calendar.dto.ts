import { IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIanaTimezone } from './validators';

export class QueryCalendarDto {
  @ApiProperty({ description: 'Start date of the calendar window (ISO-8601)' })
  @IsISO8601()
  startDate: string;

  @ApiProperty({ description: 'End date of the calendar window (ISO-8601)' })
  @IsISO8601()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Timezone for date bucketing in calendar views',
    default: 'UTC',
  })
  @IsOptional()
  @IsIanaTimezone()
  timezone?: string = 'UTC';
}
