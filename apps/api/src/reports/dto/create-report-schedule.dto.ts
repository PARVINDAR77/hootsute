import { IsString, IsNotEmpty, IsEnum, IsArray, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportFrequency, CreateReportScheduleDto as ICreateReportScheduleDto } from '@packages/shared';

export class CreateReportScheduleDto implements ICreateReportScheduleDto {
  @ApiProperty({ description: 'Descriptive title for automated reporting schedule', example: 'Weekly Stakeholder Executive Brief' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: ReportFrequency, description: 'Reporting cadence', example: ReportFrequency.WEEKLY })
  @IsEnum(ReportFrequency)
  frequency!: ReportFrequency;

  @ApiProperty({ description: 'List of stakeholder recipient email addresses', example: ['cmo@client.com', 'team@agency.com'] })
  @IsArray()
  @IsEmail({}, { each: true })
  recipients!: string[];

  @ApiPropertyOptional({ description: 'Whether to include social account impressions, reach, and follower change', default: true })
  @IsOptional()
  @IsBoolean()
  includeSocial?: boolean;

  @ApiPropertyOptional({ description: 'Whether to include link tracking and attribution clicks', default: true })
  @IsOptional()
  @IsBoolean()
  includeLinks?: boolean;

  @ApiPropertyOptional({ description: 'Whether to include brand listening and sentiment analysis', default: true })
  @IsOptional()
  @IsBoolean()
  includeListening?: boolean;

  @ApiPropertyOptional({ description: 'Whether this automated schedule is currently active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
