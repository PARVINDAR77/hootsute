import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRecipientConsentDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Reviewer mobile number in strict international E.164 format (+ followed by country code and digits)',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().replace(/[\s\-\(\)\.]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone number must be in strict international E.164 format (e.g. +919876543210 or +15551234567)',
  })
  phoneNumber: string;

  @ApiProperty({ example: 'Pooja Patel (Head of Brand)', description: 'Display name and role of the reviewer' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({ description: 'Optional User ID if this reviewer is already a registered workspace member' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    example: true,
    description: 'Explicit administrative confirmation that recipient has agreed to receive WhatsApp review notifications',
  })
  @IsBoolean()
  consentAcknowledged: boolean;
}
