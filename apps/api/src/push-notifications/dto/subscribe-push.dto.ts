import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class PushSubscriptionKeysDto {
  @ApiProperty({ description: 'P256DH public key' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ description: 'Authentication secret' })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class SubscribePushDto {
  @ApiProperty({ description: 'Unique browser push endpoint URL' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty({ description: 'Encryption keys' })
  @IsObject()
  @IsNotEmpty()
  keys!: PushSubscriptionKeysDto;

  @ApiPropertyOptional({ description: 'Optional user agent or device identifier' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class UnsubscribePushDto {
  @ApiProperty({ description: 'Push endpoint to remove' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;
}

export class SendTestPushDto {
  @ApiPropertyOptional({ description: 'Notification title', default: 'OmniSocial AI Test' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Notification message body' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Target URL on click' })
  @IsOptional()
  @IsString()
  url?: string;
}
