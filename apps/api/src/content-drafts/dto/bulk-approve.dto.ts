import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class BulkApproveDraftsDto {
  @ApiProperty({ type: [String], description: 'Draft IDs to approve in bulk' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one draft to approve' })
  @IsString({ each: true })
  draftIds: string[];
}
