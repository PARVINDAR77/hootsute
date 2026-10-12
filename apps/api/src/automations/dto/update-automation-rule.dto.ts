import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AutomationTriggerType,
  AutomationActionType,
  AutomationConditions,
  AutomationActionConfig,
} from '@packages/shared';

export class UpdateAutomationRuleDto {
  @ApiPropertyOptional({ description: 'Human-readable name of the automation rule' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Optional explanation of rule purpose' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: AutomationTriggerType,
    description: 'Trigger event type',
  })
  @IsEnum(AutomationTriggerType)
  @IsOptional()
  triggerType?: AutomationTriggerType;

  @ApiPropertyOptional({
    description: 'Conditions required to activate rule',
  })
  @IsObject()
  @IsOptional()
  conditions?: AutomationConditions;

  @ApiPropertyOptional({
    enum: AutomationActionType,
    description: 'Action to execute when conditions match',
  })
  @IsEnum(AutomationActionType)
  @IsOptional()
  actionType?: AutomationActionType;

  @ApiPropertyOptional({
    description: 'Action execution parameters',
  })
  @IsObject()
  @IsOptional()
  actionConfig?: AutomationActionConfig;

  @ApiPropertyOptional({ description: 'Whether the rule is enabled' })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
