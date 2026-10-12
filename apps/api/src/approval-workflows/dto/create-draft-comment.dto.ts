import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDraftCommentDto {
  @ApiProperty({
    description: 'Comment content / feedback text',
    example: 'Could we adjust the call to action to link directly to the pricing page?',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description: 'Optional parent comment ID if this is a threaded reply',
  })
  @IsOptional()
  @IsString()
  parentCommentId?: string;
}
