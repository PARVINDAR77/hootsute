import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BulkScheduleRowDto } from '@packages/shared';

export class ImportBulkScheduleDto {
  @ApiProperty({ description: 'Array of validated post rows to commit to the calendar' })
  @IsArray()
  rows: BulkScheduleRowDto[];
}
