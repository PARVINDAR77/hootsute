import {
  Controller,
  Get,
  Post,
  Put,
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
import { InboxModerationService } from '../services/inbox-moderation.service';
import {
  CreateInboxModerationRuleDto,
  UpdateInboxModerationRuleDto,
  CreateInboxAutoReplyTemplateDto,
  UpdateInboxAutoReplyTemplateDto,
} from '../dto/inbox-moderation.dto';

@ApiTags('Inbox Auto-Moderation & Triage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/inbox')
export class InboxModerationController {
  constructor(private readonly moderationService: InboxModerationService) {}

  // ==========================================
  // Moderation Rules Endpoints
  // ==========================================

  @Post('moderation-rules')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Create a new inbox auto-moderation triage rule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Moderation rule created successfully' })
  async createRule(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateInboxModerationRuleDto,
  ) {
    return this.moderationService.createRule(workspaceId, dto);
  }

  @Get('moderation-rules')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all auto-moderation triage rules configured for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async getRules(@Param('workspaceId') workspaceId: string) {
    return this.moderationService.getRules(workspaceId);
  }

  @Get('moderation-rules/:id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get details for a specific moderation rule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  async getRuleById(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.moderationService.getRuleById(workspaceId, id);
  }

  @Put('moderation-rules/:id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing moderation rule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  async updateRule(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInboxModerationRuleDto,
  ) {
    return this.moderationService.updateRule(workspaceId, id, dto);
  }

  @Delete('moderation-rules/:id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a moderation rule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  async deleteRule(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.moderationService.deleteRule(workspaceId, id);
  }

  // ==========================================
  // Auto-Reply Templates Endpoints
  // ==========================================

  @Post('reply-templates')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Create an AI auto-reply template' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async createTemplate(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateInboxAutoReplyTemplateDto,
  ) {
    return this.moderationService.createTemplate(workspaceId, dto);
  }

  @Get('reply-templates')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all auto-reply templates in workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'category', required: false, description: 'Optional category filter' })
  async getTemplates(
    @Param('workspaceId') workspaceId: string,
    @Query('category') category?: string,
  ) {
    return this.moderationService.getTemplates(workspaceId, category);
  }

  @Get('reply-templates/:id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get details for a reply template' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async getTemplateById(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.moderationService.getTemplateById(workspaceId, id);
  }

  @Put('reply-templates/:id')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Update an auto-reply template' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async updateTemplate(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInboxAutoReplyTemplateDto,
  ) {
    return this.moderationService.updateTemplate(workspaceId, id, dto);
  }

  @Delete('reply-templates/:id')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an auto-reply template' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  async deleteTemplate(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.moderationService.deleteTemplate(workspaceId, id);
  }

  // ==========================================
  // Triage Evaluation Endpoint
  // ==========================================

  @Post('interactions/:interactionId/triage')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Evaluate an interaction against moderation rules and execute triage action' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'interactionId', description: 'Interaction UUID' })
  async evaluateInteraction(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
  ) {
    return this.moderationService.evaluateInteraction(workspaceId, interactionId);
  }
}
