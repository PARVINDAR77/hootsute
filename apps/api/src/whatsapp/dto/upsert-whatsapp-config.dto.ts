import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertWhatsAppConfigDto {
  @ApiProperty({ example: '109823478912345', description: 'Meta WhatsApp Business Account ID (WABA)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  wabaId: string;

  @ApiProperty({ example: '102938475610293', description: 'Meta WhatsApp Phone Number ID' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  phoneNumberId: string;

  @ApiProperty({ description: 'Meta System User Permanent Access Token with whatsapp_business_messaging scope' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  systemUserAccessToken: string;

  @ApiPropertyOptional({ example: '+15551234567', description: 'Display business phone number in E.164 format' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  businessPhoneNumber?: string;
}
