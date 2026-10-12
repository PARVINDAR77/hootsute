import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { WebhookDeliveryStatus } from '@packages/shared';
import { WebhooksService } from '../services/webhooks.service';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
  WebhookDeliveryQueryDto,
} from '../dto/webhook.dto';

@ApiTags('Outbound Webhooks & Developer Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Register a new outbound webhook subscription' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Webhook subscription created successfully' })
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWebhookSubscriptionDto,
  ) {
    return this.webhooksService.create(workspaceId, dto);
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all webhook subscriptions for the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async findAll(@Param('workspaceId') workspaceId: string) {
    return this.webhooksService.findAll(workspaceId);
  }

  @Get('deliveries')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Query outbound webhook delivery logs with status filtering' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'subscriptionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: WebhookDeliveryStatus })
  async getDeliveries(
    @Param('workspaceId') workspaceId: string,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('status') status?: WebhookDeliveryStatus,
  ) {
    return this.webhooksService.getDeliveries(workspaceId, subscriptionId, status);
  }

  @Post('deliveries/:deliveryId/retry')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually retry an outbound webhook delivery attempt' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'deliveryId', description: 'Delivery Log UUID' })
  async retryDelivery(
    @Param('workspaceId') workspaceId: string,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.webhooksService.retryDelivery(workspaceId, deliveryId);
  }

  @Get(':id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get details for a specific webhook subscription' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.findOne(workspaceId, id);
  }

  @Patch(':id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update webhook subscription configuration' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    return this.webhooksService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Delete a webhook subscription' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.remove(workspaceId, id);
  }

  @Post(':id/rotate-secret')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate secret signing key for webhook subscription' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async rotateSecret(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.rotateSecret(workspaceId, id);
  }

  @Post(':id/test-ping')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an immediate test ping event to destination endpoint' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  async sendTestPing(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.sendTestPing(workspaceId, id);
  }
}
