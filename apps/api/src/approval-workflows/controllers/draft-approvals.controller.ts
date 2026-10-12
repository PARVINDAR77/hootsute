import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ApprovalWorkflowsService } from '../services/approval-workflows.service';
import { DraftCommentsService } from '../services/draft-comments.service';
import { RecordReviewDecisionDto } from '../dto/record-review-decision.dto';
import { CreateDraftCommentDto } from '../dto/create-draft-comment.dto';

@ApiTags('Draft Approvals & Collaborative Review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/drafts/:draftId')
export class DraftApprovalsController {
  constructor(
    private readonly workflowsService: ApprovalWorkflowsService,
    private readonly commentsService: DraftCommentsService,
  ) {}

  @Post('approval/init')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Initialize or submit draft to approval workflow matrix' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'draftId', description: 'ContentDraft UUID' })
  async initApproval(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Body('workflowId') workflowId?: string,
  ) {
    return this.workflowsService.ensureDraftApprovalSteps(workspaceId, draftId, workflowId);
  }

  @Get('approval/progress')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get multi-step approval progress matrix for a draft' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'draftId', description: 'ContentDraft UUID' })
  async getApprovalProgress(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
  ) {
    return this.workflowsService.getDraftApprovalProgress(workspaceId, draftId);
  }

  @Post('approval/steps/:stepId/decision')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Record approval or change request decision on a review step' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'draftId', description: 'ContentDraft UUID' })
  @ApiParam({ name: 'stepId', description: 'Step UUID' })
  async recordDecision(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: any,
    @Body() dto: RecordReviewDecisionDto,
  ) {
    // Determine effective workspace role from authenticated member or platform superadmin
    const effectiveRole =
      req.workspaceMember?.role ||
      (user.role === 'SUPER_ADMIN' ? WorkspaceRole.OWNER : WorkspaceRole.EDITOR);
    return this.workflowsService.recordReviewDecision(
      workspaceId,
      draftId,
      stepId,
      user.id,
      effectiveRole,
      dto,
    );
  }

  @Get('comments')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get contextual comments and review discussion threads' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'draftId', description: 'ContentDraft UUID' })
  async getComments(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
  ) {
    return this.commentsService.getComments(workspaceId, draftId);
  }

  @Post('comments')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Add a new in-line review comment or threaded reply' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'draftId', description: 'ContentDraft UUID' })
  async createComment(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDraftCommentDto,
  ) {
    return this.commentsService.createComment(workspaceId, draftId, user.id, dto);
  }

  @Patch('comments/:commentId/resolve')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Toggle resolved status of a comment thread' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'draftId', description: 'ContentDraft UUID' })
  @ApiParam({ name: 'commentId', description: 'Comment UUID' })
  async toggleResolveComment(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService.toggleResolveComment(workspaceId, draftId, commentId, user.id);
  }

  @Delete('comments/:commentId')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'draftId', description: 'ContentDraft UUID' })
  @ApiParam({ name: 'commentId', description: 'Comment UUID' })
  async deleteComment(
    @Param('workspaceId') workspaceId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: any,
  ) {
    const effectiveRole =
      req.workspaceMember?.role ||
      (user.role === 'SUPER_ADMIN' ? WorkspaceRole.OWNER : WorkspaceRole.EDITOR);
    return this.commentsService.deleteComment(workspaceId, commentId, user.id, effectiveRole);
  }
}
