import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecordReviewDecisionDto {
  @ApiProperty({
    description: 'Decision action for this approval step',
    enum: ['APPROVE', 'REQUEST_CHANGES'],
    example: 'APPROVE',
  })
  @IsEnum(['APPROVE', 'REQUEST_CHANGES'])
  @IsNotEmpty()
  decision!: 'APPROVE' | 'REQUEST_CHANGES';

  @ApiPropertyOptional({
    description: 'Contextual feedback, comments, or rejection rationale',
    example: 'Copy is great, but please replace second image with high-res version.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
