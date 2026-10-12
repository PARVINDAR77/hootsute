import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  InboxModerationAction,
  CreateInboxModerationRuleDto as ICreateInboxModerationRuleDto,
  CreateInboxAutoReplyTemplateDto as ICreateInboxAutoReplyTemplateDto,
} from '@packages/shared';

export class CreateInboxModerationRuleDto implements ICreateInboxModerationRuleDto {
  @ApiProperty({ description: 'Name of the auto-moderation triage rule', example: 'Flag Crisis & Escalations' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Rule description / rationale', example: 'Flags interactions containing profanity or negative sentiment' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Sentiment condition filter: ALL, NEGATIVE, POSITIVE, NEUTRAL', default: 'ALL' })
  @IsOptional()
  @IsString()
  triggerSentiment?: string;

  @ApiPropertyOptional({ description: 'Keywords to match against interaction text', example: ['refund', 'scam', 'terrible', 'lawsuit'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiProperty({ enum: InboxModerationAction, description: 'Triage action to execute upon match', example: InboxModerationAction.AUTO_FLAG })
  @IsEnum(InboxModerationAction)
  action!: InboxModerationAction;

  @ApiPropertyOptional({ description: 'Action payload configuration (e.g. targetRole, replyTemplateId)', example: { targetRole: 'ADMIN' } })
  @IsOptional()
  @IsObject()
  actionPayload?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether rule is currently active', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Execution priority (higher executes first)', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateInboxModerationRuleDto extends PartialType(CreateInboxModerationRuleDto) {}

export class CreateInboxAutoReplyTemplateDto implements ICreateInboxAutoReplyTemplateDto {
  @ApiProperty({ description: 'Template display title', example: 'Friendly Support Greeting' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Template response message content', example: 'Hi there! Thanks for reaching out. A team specialist is looking into your inquiry.' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'Category: GENERAL, SUPPORT, PRICING, APOLOGY', default: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Optional sentiment match recommendation', example: 'POSITIVE' })
  @IsOptional()
  @IsString()
  sentimentMatch?: string;
}

export class UpdateInboxAutoReplyTemplateDto extends PartialType(CreateInboxAutoReplyTemplateDto) {}
