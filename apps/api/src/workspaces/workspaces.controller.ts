import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../common/guards/workspace-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { RequireWorkspaceRole } from '../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';

@ApiTags('Workspaces')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business workspace (caller becomes OWNER)' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Slug collision' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all accessible workspaces for current user' })
  @ApiResponse({ status: 200, description: 'Accessible workspaces list' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.findAllForUser(user.id);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceAuthGuard)
  @ApiOperation({ summary: 'Retrieve authorized workspace details' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 403, description: 'Not a member of this workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.findById(workspaceId, user.id);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceAuthGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update permitted workspace settings (ADMIN or OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace settings updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.update(workspaceId, dto, user.id);
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceAuthGuard)
  @ApiOperation({ summary: 'List all members of this workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Members list' })
  async listMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.listMembers(workspaceId);
  }

  @Patch(':workspaceId/members/:memberId')
  @UseGuards(WorkspaceAuthGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update member role or status (ADMIN or OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Target member record UUID' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @ApiResponse({ status: 403, description: 'Cannot modify OWNER or another ADMIN' })
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, memberId, dto, user.id);
  }

  @Delete(':workspaceId/members/:memberId')
  @UseGuards(WorkspaceAuthGuard)
  @ApiOperation({ summary: 'Remove a member from the workspace (or voluntarily leave)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Target member record UUID' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Final-owner protection or insufficient permissions' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.removeMember(workspaceId, memberId, user.id);
  }

  @Post(':workspaceId/transfer-ownership')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkspaceAuthGuard)
  @RequireWorkspaceRole(WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Transfer workspace ownership to another member (OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Ownership transferred' })
  @ApiResponse({ status: 403, description: 'Only current OWNER can transfer' })
  async transferOwnership(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TransferOwnershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.transferOwnership(
      workspaceId,
      dto.targetMemberId,
      user.id,
    );
  }

  @Post(':workspaceId/invitations')
  @UseGuards(WorkspaceAuthGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Invite a new team member to this workspace (ADMIN or OWNER)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async createInvitation(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.createInvitation(workspaceId, dto, user.id);
  }

  @Get(':workspaceId/invitations')
  @UseGuards(WorkspaceAuthGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'List active invitations for this workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Active invitations list' })
  async listInvitations(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.listInvitations(workspaceId);
  }

  @Post(':workspaceId/invitations/:invitationId/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkspaceAuthGuard)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Revoke an invitation (ADMIN or OWNER)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.revokeInvitation(workspaceId, invitationId, user.id);
  }
}
