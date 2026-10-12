import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateBulkScheduleDto {
  @ApiProperty({ description: 'Raw CSV text content to parse and validate' })
  @IsString()
  @IsNotEmpty()
  csvContent: string;
}
