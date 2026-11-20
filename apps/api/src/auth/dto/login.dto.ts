import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'alex@example.com', description: 'User account email' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123!', description: 'Account password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    example: 'crypto:1732000000:abcd:...',
    description: 'Anti-bot human verification token (Cloudflare Turnstile or cryptographic challenge)',
    required: false,
  })
  @IsString()
  botVerificationToken?: string;
}
