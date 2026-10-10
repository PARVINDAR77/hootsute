import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TranslateVariantDto {
  @ApiProperty({ description: 'Target language name or code (e.g. Gujarati, Hindi, es, fr)', example: 'Gujarati' })
  @IsString()
  @IsNotEmpty({ message: 'Target language is required' })
  @MaxLength(50)
  targetLanguage: string;
}
