import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AutomationTriggerType,
  AutomationActionType,
  AutomationConditions,
  AutomationActionConfig,
} from '@packages/shared';

export class CreateAutomationRuleDto {
  @ApiProperty({ description: 'Human-readable name of the automation rule' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Optional explanation of rule purpose' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: AutomationTriggerType,
    description: 'Trigger event type',
    example: AutomationTriggerType.INBOX_NEW_MESSAGE,
  })
  @IsEnum(AutomationTriggerType)
  triggerType: AutomationTriggerType;

  @ApiProperty({
    description: 'Conditions required to activate rule',
    example: { keywords: ['price', 'cost'], platform: 'INSTAGRAM' },
  })
  @IsObject()
  conditions: AutomationConditions;

  @ApiProperty({
    enum: AutomationActionType,
    description: 'Action to execute when conditions match',
    example: AutomationActionType.AUTO_REPLY,
  })
  @IsEnum(AutomationActionType)
  actionType: AutomationActionType;

  @ApiProperty({
    description: 'Action execution parameters',
    example: { replyTemplate: 'Hi there! Thanks for reaching out.' },
  })
  @IsObject()
  actionConfig: AutomationActionConfig;

  @ApiPropertyOptional({ description: 'Whether the rule is enabled', default: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
