import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alex@company.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Expiring cryptographic password reset token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewStrongPass1!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least 1 uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least 1 lowercase letter' })
  @Matches(/[\d\W]/, { message: 'Password must contain at least 1 number or symbol' })
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Expiring cryptographic email verification token' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
