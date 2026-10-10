import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectReviewActionDto {
  @ApiProperty({
    example: 'Please adjust the promotional discount and add #FestivalVibes hashtag',
    description: 'Mandatory reason explaining why changes are requested or why the draft was rejected',
  })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason cannot be empty' })
  @MinLength(3, { message: 'Rejection reason must be at least 3 characters' })
  @MaxLength(1000, { message: 'Rejection reason cannot exceed 1000 characters' })
  reason: string;
}
