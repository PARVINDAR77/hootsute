import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { ApprovalWorkflowsService } from '../services/approval-workflows.service';
import { CreateApprovalWorkflowDto } from '../dto/create-approval-workflow.dto';

@ApiTags('Approval Workflows & Matrix')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/approval-workflows')
export class ApprovalWorkflowsController {
  constructor(private readonly workflowsService: ApprovalWorkflowsService) {}

  @Post()
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Create a new multi-stage approval workflow' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Approval workflow created successfully' })
  async createWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateApprovalWorkflowDto,
  ) {
    return this.workflowsService.createWorkflow(workspaceId, dto);
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all approval workflows configured for the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async getWorkflows(@Param('workspaceId') workspaceId: string) {
    return this.workflowsService.getWorkflows(workspaceId);
  }

  @Get(':id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get details for a specific approval workflow' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Workflow UUID' })
  async getWorkflowById(
    @Param('workspaceId') workspaceId: string,
    @Param('id') workflowId: string,
  ) {
    return this.workflowsService.getWorkflowById(workspaceId, workflowId);
  }

  @Put(':id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing approval workflow' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Workflow UUID' })
  async updateWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Param('id') workflowId: string,
    @Body() dto: Partial<CreateApprovalWorkflowDto>,
  ) {
    return this.workflowsService.updateWorkflow(workspaceId, workflowId, dto);
  }

  @Delete(':id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an approval workflow' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Workflow UUID' })
  async deleteWorkflow(
    @Param('workspaceId') workspaceId: string,
    @Param('id') workflowId: string,
  ) {
    return this.workflowsService.deleteWorkflow(workspaceId, workflowId);
  }
}
