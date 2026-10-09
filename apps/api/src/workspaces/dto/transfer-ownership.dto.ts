import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class TransferOwnershipDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The member ID (not user ID) of the target member to receive ownership',
  })
  @IsUUID('4', { message: 'targetMemberId must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Target member ID is required' })
  targetMemberId: string;
}
