import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { InboxService } from '../services/inbox.service';
import { InboxSyncService } from '../services/inbox-sync.service';
import {
  ListInteractionsQueryDto,
  PostReplyBodyDto,
  UpdateWorkflowStatusDto,
  AssignInteractionDto,
  MarkReadDto,
  AddInternalNoteDto,
  SyncInteractionsBodyDto,
} from '../dto';

@ApiTags('Unified Social Inbox')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/inbox')
export class InboxController {
  constructor(
    private readonly inboxService: InboxService,
    private readonly syncService: InboxSyncService,
  ) {}

  @Get('interactions')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  @ApiOperation({ summary: 'List filterable, paginated social interactions' })
  async listInteractions(
    @Param('workspaceId') workspaceId: string,
    @Query() query: ListInteractionsQueryDto,
    @Req() req: any,
  ) {
    const data = await this.inboxService.listInteractions(workspaceId, query, req.user);
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
      counts: data.counts,
    };
  }

  @Get('interactions/:interactionId')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  @ApiOperation({ summary: 'Get interaction details and conversation thread' })
  async getInteraction(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
  ) {
    const data = await this.inboxService.getInteractionById(workspaceId, interactionId);
    return {
      success: true,
      data,
    };
  }

  @Post('interactions/:interactionId/replies')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Post public reply to comment or mention' })
  async postReply(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
    @Body() dto: PostReplyBodyDto,
    @Req() req: any,
  ) {
    const result = await this.inboxService.postReply(workspaceId, interactionId, dto, req.user);
    return {
      success: result.success,
      message: result.message,
      data: result.attempt,
    };
  }

  @Patch('interactions/:interactionId/status')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Update workflow triage status (OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, IGNORED)' })
  async updateStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
    @Body() dto: UpdateWorkflowStatusDto,
    @Req() req: any,
  ) {
    const data = await this.inboxService.updateWorkflowStatus(workspaceId, interactionId, dto, req.user);
    return {
      success: true,
      message: `Status updated to ${dto.status}`,
      data,
    };
  }

  @Patch('interactions/:interactionId/assignment')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Assign interaction to workspace team member' })
  async assignInteraction(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
    @Body() dto: AssignInteractionDto,
    @Req() req: any,
  ) {
    const data = await this.inboxService.assignInteraction(workspaceId, interactionId, dto, req.user);
    return {
      success: true,
      message: dto.assignedToUserId ? 'Interaction assigned successfully' : 'Assignment cleared',
      data,
    };
  }

  @Patch('interactions/:interactionId/read')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  @ApiOperation({ summary: 'Mark interaction read or unread' })
  async markRead(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
    @Body() dto: MarkReadDto,
  ) {
    const data = await this.inboxService.markRead(workspaceId, interactionId, dto.isRead);
    return {
      success: true,
      data,
    };
  }

  @Post('interactions/:interactionId/notes')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Add internal collaboration note visible only to workspace members' })
  async addNote(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
    @Body() dto: AddInternalNoteDto,
    @Req() req: any,
  ) {
    const data = await this.inboxService.addNote(workspaceId, interactionId, dto, req.user);
    return {
      success: true,
      message: 'Internal note added',
      data,
    };
  }

  @Get('interactions/:interactionId/notes')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  @ApiOperation({ summary: 'List internal team notes for an interaction' })
  async listNotes(
    @Param('workspaceId') workspaceId: string,
    @Param('interactionId') interactionId: string,
  ) {
    const data = await this.inboxService.listNotes(workspaceId, interactionId);
    return {
      success: true,
      data,
    };
  }

  @Post('sync')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Trigger manual synchronization of comments and mentions' })
  async syncInteractions(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SyncInteractionsBodyDto,
    @Req() req: any,
  ) {
    // Only ADMIN and OWNER can force sync
    if (dto.force) {
      const userRole = req.workspaceMember?.role;
      if (userRole !== WorkspaceRole.OWNER && userRole !== WorkspaceRole.ADMIN) {
        throw new ForbiddenException('Only workspace ADMIN or OWNER can force-refresh synchronization.');
      }
    }

    const result = await this.syncService.syncWorkspaceInteractions(workspaceId, {
      accountId: dto.accountId,
      force: dto.force,
    });

    return {
      success: result.success,
      message: result.message,
      data: {
        totalNew: result.totalNew,
        totalUpdated: result.totalUpdated,
        throttled: result.throttled,
        accounts: result.accounts,
      },
    };
  }

  @Get('sync-status')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  @ApiOperation({ summary: 'Get synchronization status and permission health per account' })
  async getSyncStatus(@Param('workspaceId') workspaceId: string) {
    const data = await this.syncService.getSyncStatus(workspaceId);
    return {
      success: true,
      data,
    };
  }

  @Get('notifications')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  @ApiOperation({ summary: 'List in-app inbox notifications for current user' })
  async listNotifications(@Param('workspaceId') workspaceId: string, @Req() req: any) {
    const data = await this.inboxService.listNotifications(workspaceId, req.user);
    return {
      success: true,
      data,
    };
  }

  @Patch('notifications/:notificationId/read')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  @ApiOperation({ summary: 'Mark in-app notification read' })
  async markNotificationRead(
    @Param('workspaceId') workspaceId: string,
    @Param('notificationId') notificationId: string,
    @Req() req: any,
  ) {
    const data = await this.inboxService.markNotificationRead(workspaceId, notificationId, req.user);
    return {
      success: true,
      data,
    };
  }
}
