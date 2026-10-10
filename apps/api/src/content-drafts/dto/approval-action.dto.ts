import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RejectDraftDto {
  @ApiProperty({
    description: 'Mandatory reason for rejecting the content draft',
    example: 'Please adjust the headline tone to be more festive and verify that the product name matches our catalog.',
  })
  @IsString()
  @IsNotEmpty({ message: 'A specific rejection reason is mandatory' })
  @MinLength(5, { message: 'Rejection reason must be at least 5 characters long' })
  @MaxLength(1000)
  rejectionReason: string;
}
