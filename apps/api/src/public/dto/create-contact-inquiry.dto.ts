import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactInquiryDto {
  @ApiProperty({ example: 'Alex Rivera' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'alex@company.com' })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiPropertyOptional({ example: 'Acme Brands Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  company?: string;

  @ApiProperty({ example: 'Enterprise multi-brand onboarding' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(180)
  subject!: string;

  @ApiProperty({ example: 'We manage 25 brand channels and would like to schedule a walkthrough.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;
}
