import { IsString, IsOptional, IsNumber, IsArray, IsEmail, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GenerateReportRequestDto as IGenerateReportRequestDto } from '@packages/shared';

export class GenerateReportDto implements IGenerateReportRequestDto {
  @ApiPropertyOptional({ description: 'Optional custom title for the generated report', example: 'Q2 Multi-Network Performance Executive Review' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Linked report schedule ID if triggered by an existing schedule' })
  @IsOptional()
  @IsString()
  scheduleId?: string;

  @ApiPropertyOptional({ description: 'Lookback window in days (default: 7 for weekly, 30 for monthly)', default: 7 })
  @IsOptional()
  @IsNumber()
  periodDays?: number;

  @ApiPropertyOptional({ description: 'Recipients to record delivery / dispatch to', example: ['client-lead@domain.com'] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[];

  @ApiPropertyOptional({ description: 'Include social performance metrics', default: true })
  @IsOptional()
  @IsBoolean()
  includeSocial?: boolean;

  @ApiPropertyOptional({ description: 'Include link shortener attribution metrics', default: true })
  @IsOptional()
  @IsBoolean()
  includeLinks?: boolean;

  @ApiPropertyOptional({ description: 'Include brand sentiment and listening metrics', default: true })
  @IsOptional()
  @IsBoolean()
  includeListening?: boolean;
}
