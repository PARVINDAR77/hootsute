import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole, PublishTargetStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ScheduledPostsService } from '../services/scheduled-posts.service';
import { PublishingDispatcherService } from '../services/publishing-dispatcher.service';
import { PublishingReconcilerService } from '../services/publishing-reconciler.service';
import { ScheduledPostsRepository } from '../repositories/scheduled-posts.repository';
import { CreateScheduledPostDto } from '../dto/create-scheduled-post.dto';
import { ReschedulePostDto } from '../dto/reschedule-post.dto';
import { CancelScheduledPostDto } from '../dto/cancel-scheduled-post.dto';
import { QueryScheduledPostsDto } from '../dto/query-scheduled-posts.dto';
import { QueryCalendarDto } from '../dto/query-calendar.dto';

@ApiTags('Scheduled Posts & Publishing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/scheduled-posts')
export class ScheduledPostsController {
  constructor(
    private readonly scheduledPostsService: ScheduledPostsService,
    private readonly dispatcher: PublishingDispatcherService,
    private readonly reconciler: PublishingReconcilerService,
    private readonly repository: ScheduledPostsRepository,
  ) {}

  @Post()
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Schedule an approved content draft for publication' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Post scheduled successfully' })
  async schedulePost(
    @Param('workspaceId') workspaceId: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduledPostDto,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.EDITOR;
    const post = await this.scheduledPostsService.schedulePost(
      workspaceId,
      user.id,
      memberRole,
      dto,
    );
    return {
      success: true,
      message: 'Post scheduled successfully',
      data: post,
    };
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List scheduled posts with filters and pagination' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async listScheduledPosts(
    @Param('workspaceId') workspaceId: string,
    @Query() query: QueryScheduledPostsDto,
  ) {
    const result = await this.scheduledPostsService.listScheduledPosts(workspaceId, query);
    return {
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Get('calendar')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Query scheduled posts for calendar date range' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getCalendarPosts(
    @Param('workspaceId') workspaceId: string,
    @Query() query: QueryCalendarDto,
  ) {
    const posts = await this.scheduledPostsService.getCalendarPosts(workspaceId, query);
    return {
      success: true,
      data: posts,
    };
  }

  @Get(':id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get details of a specific scheduled post' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'id', description: 'Scheduled Post ID' })
  async getScheduledPost(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    const post = await this.scheduledPostsService.getScheduledPost(workspaceId, id);
    return {
      success: true,
      data: post,
    };
  }

  @Patch(':id/reschedule')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Reschedule a pending or failed post to a new timestamp' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'id', description: 'Scheduled Post ID' })
  async reschedulePost(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReschedulePostDto,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.EDITOR;
    const updated = await this.scheduledPostsService.reschedulePost(
      workspaceId,
      id,
      user.id,
      memberRole,
      dto,
    );
    return {
      success: true,
      message: 'Post rescheduled successfully',
      data: updated,
    };
  }

  @Delete(':id/cancel')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending scheduled post' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'id', description: 'Scheduled Post ID' })
  async cancelScheduledPost(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelScheduledPostDto,
  ) {
    return this.handleCancel(workspaceId, id, req, user, dto);
  }

  @Post(':id/cancel')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending scheduled post (POST alias)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'id', description: 'Scheduled Post ID' })
  async cancelScheduledPostAlias(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelScheduledPostDto,
  ) {
    return this.handleCancel(workspaceId, id, req, user, dto);
  }

  private async handleCancel(
    workspaceId: string,
    id: string,
    req: any,
    user: AuthenticatedUser,
    dto: CancelScheduledPostDto,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.EDITOR;
    const cancelled = await this.scheduledPostsService.cancelScheduledPost(
      workspaceId,
      id,
      user.id,
      memberRole,
      dto,
    );
    return {
      success: true,
      message: 'Scheduled post cancelled successfully',
      data: cancelled,
    };
  }

  @Post(':id/targets/:targetId/retry')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Manually retry publishing an eligible failed or ambiguous target' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'id', description: 'Scheduled Post ID' })
  @ApiParam({ name: 'targetId', description: 'Target ID' })
  async retryTarget(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const post = await this.scheduledPostsService.getScheduledPost(workspaceId, id);
    const target = post.targets?.find((t: any) => t.id === targetId);
    if (!target) {
      throw new NotFoundException(`Target [${targetId}] not found on scheduled post [${id}]`);
    }

    if (target.status === PublishTargetStatus.PUBLISHED) {
      throw new BadRequestException('Target is already published');
    }

    if (target.status === PublishTargetStatus.DISPATCHING) {
      throw new BadRequestException('Target is currently being published');
    }

    if (target.status === PublishTargetStatus.AMBIGUOUS_TIMEOUT) {
      const rec = await this.reconciler.reconcileTarget(targetId);
      if (rec.reconciled) {
        return {
          success: true,
          message: 'Target reconciled successfully as already published on platform',
          data: await this.scheduledPostsService.getScheduledPost(workspaceId, id),
        };
      }
    }

    await this.repository.updateTargetStatus(targetId, PublishTargetStatus.PENDING, {
      nextRetryAt: null,
    });

    const dispatchResult = await this.dispatcher.dispatchTarget(targetId);

    return {
      success: true,
      message: dispatchResult.success ? 'Target published successfully' : 'Target retry executed',
      data: await this.scheduledPostsService.getScheduledPost(workspaceId, id),
    };
  }
}

