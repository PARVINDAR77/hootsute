import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { AutomationsService } from './automations.service';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';
import { TestAutomationRuleDto } from './dto/test-automation-rule.dto';

@ApiTags('Smart Automations & Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get('templates')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Get list of pre-built 1-click automation recipes' })
  getRecipes() {
    const templates = this.automationsService.getRecipes();
    return {
      success: true,
      data: templates,
    };
  }

  @Get('logs')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Get past execution audit logs for workspace automations' })
  @ApiQuery({ name: 'ruleId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getExecutionLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('ruleId') ruleId?: string,
    @Query('limit') limit?: number,
  ) {
    const logs = await this.automationsService.getExecutionLogs(
      workspaceId,
      ruleId,
      limit ? Number(limit) : 50,
    );
    return {
      success: true,
      data: logs,
    };
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Get all configured automation rules in the workspace' })
  async getRules(@Param('workspaceId') workspaceId: string) {
    const rules = await this.automationsService.getRules(workspaceId);
    return {
      success: true,
      data: rules,
    };
  }

  @Post()
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Create a new trigger-action automation rule' })
  @ApiResponse({ status: 201, description: 'Automation rule created' })
  async createRule(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateAutomationRuleDto,
  ) {
    const rule = await this.automationsService.createRule(workspaceId, dto);
    return {
      success: true,
      data: rule,
    };
  }

  @Get(':ruleId')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Get a specific automation rule by ID' })
  async getRuleById(
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
  ) {
    const rule = await this.automationsService.getRuleById(workspaceId, ruleId);
    return {
      success: true,
      data: rule,
    };
  }

  @Put(':ruleId')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Update an existing automation rule' })
  async updateRule(
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateAutomationRuleDto,
  ) {
    const rule = await this.automationsService.updateRule(workspaceId, ruleId, dto);
    return {
      success: true,
      data: rule,
    };
  }

  @Delete(':ruleId')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Delete an automation rule' })
  async deleteRule(
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
  ) {
    const result = await this.automationsService.deleteRule(workspaceId, ruleId);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':ruleId/toggle')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Toggle an automation rule enabled/disabled' })
  async toggleRule(
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
    @Body('enabled') enabled?: boolean,
  ) {
    const rule = await this.automationsService.toggleRule(workspaceId, ruleId, enabled);
    return {
      success: true,
      data: rule,
    };
  }

  @Post(':ruleId/test')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Dry-run test an automation rule against sample payload' })
  async testRule(
    @Param('workspaceId') workspaceId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: TestAutomationRuleDto,
  ) {
    const result = await this.automationsService.testRule(workspaceId, ruleId, dto);
    return {
      success: true,
      data: result,
    };
  }
}
