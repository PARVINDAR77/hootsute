import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { SocialPlatform } from '@prisma/client';

export class SendPreviewDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'Array of registered recipient consent IDs to receive WhatsApp preview',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Must specify at least one recipient' })
  @ArrayMaxSize(10, { message: 'Cannot dispatch preview to more than 10 reviewers at once' })
  @IsUUID('4', { each: true, message: 'Each recipientConsentId must be a valid UUID' })
  recipientConsentIds: string[];

  @ApiPropertyOptional({
    enum: SocialPlatform,
    description: 'Target platform variant to feature in the preview (defaults to first variant)',
  })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;
}
