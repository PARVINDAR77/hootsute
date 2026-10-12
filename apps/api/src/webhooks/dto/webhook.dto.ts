import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WEBHOOK_EVENT_TYPES, WebhookDeliveryStatus } from '@packages/shared';

export class CreateWebhookSubscriptionDto {
  @ApiProperty({ description: 'Friendly name of the webhook endpoint', example: 'Slack Crisis Alerts' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Destination HTTP/HTTPS endpoint URL', example: 'https://api.company.com/webhooks/omnisocial' })
  @IsUrl({ require_tld: false })
  targetUrl: string;

  @ApiProperty({
    description: 'List of events this endpoint subscribes to',
    example: ['post.published', 'inbox.crisis_flagged'],
    enum: WEBHOOK_EVENT_TYPES,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsIn(WEBHOOK_EVENT_TYPES as unknown as string[], { each: true })
  eventTypes: string[];

  @ApiPropertyOptional({ description: 'Optional operational notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active toggle', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWebhookSubscriptionDto {
  @ApiPropertyOptional({ description: 'Friendly name of the webhook endpoint' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Destination HTTP/HTTPS endpoint URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  targetUrl?: string;

  @ApiPropertyOptional({
    description: 'List of events this endpoint subscribes to',
    enum: WEBHOOK_EVENT_TYPES,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(WEBHOOK_EVENT_TYPES as unknown as string[], { each: true })
  eventTypes?: string[];

  @ApiPropertyOptional({ description: 'Optional operational notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active toggle' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WebhookDeliveryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by subscription ID' })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiPropertyOptional({ enum: WebhookDeliveryStatus, description: 'Filter by delivery status' })
  @IsOptional()
  status?: WebhookDeliveryStatus;
}
