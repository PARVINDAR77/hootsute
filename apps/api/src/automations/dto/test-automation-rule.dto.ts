import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TestAutomationRuleDto {
  @ApiPropertyOptional({ description: 'Sample message or post text to test conditions against' })
  @IsString()
  @IsOptional()
  sampleText?: string;

  @ApiPropertyOptional({ description: 'Social platform for testing (e.g. FACEBOOK, INSTAGRAM)' })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ description: 'Sample sender name or handle' })
  @IsString()
  @IsOptional()
  senderName?: string;
}
