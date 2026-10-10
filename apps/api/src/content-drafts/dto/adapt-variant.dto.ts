import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SocialPlatform } from '@prisma/client';

export class AdaptVariantDto {
  @ApiProperty({ enum: SocialPlatform, description: 'Target platform to adapt content for', example: SocialPlatform.TWITTER_X })
  @IsEnum(SocialPlatform)
  @IsNotEmpty({ message: 'Target platform is required' })
  targetPlatform: SocialPlatform;
}
