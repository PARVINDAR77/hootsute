import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ListeningService } from '../services/listening.service';
import { CreateListeningQueryDto } from '../dto/create-listening-query.dto';
import { UpdateListeningQueryDto } from '../dto/update-listening-query.dto';
import { ListeningFeedFilterDto } from '../dto/listening-feed-filter.dto';

@ApiTags('Social Listening & Brand Mentions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/listening')
export class ListeningController {
  constructor(private readonly listeningService: ListeningService) {}

  @Post('queries')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Create a new brand/competitor listening query' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Listening query created successfully' })
  async createQuery(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListeningQueryDto,
  ) {
    return this.listeningService.createListeningQuery(workspaceId, user.id, dto);
  }

  @Get('queries')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all listening queries for the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async getQueries(@Param('workspaceId') workspaceId: string) {
    return this.listeningService.getListeningQueries(workspaceId);
  }

  @Get('queries/:id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get a single listening query by ID' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Query UUID' })
  async getQueryById(
    @Param('workspaceId') workspaceId: string,
    @Param('id') queryId: string,
  ) {
    return this.listeningService.getListeningQueryById(workspaceId, queryId);
  }

  @Put('queries/:id')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Update an existing listening query' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Query UUID' })
  async updateQuery(
    @Param('workspaceId') workspaceId: string,
    @Param('id') queryId: string,
    @Body() dto: UpdateListeningQueryDto,
  ) {
    return this.listeningService.updateListeningQuery(workspaceId, queryId, dto);
  }

  @Delete('queries/:id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a listening query and all its mentions' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Query UUID' })
  async deleteQuery(
    @Param('workspaceId') workspaceId: string,
    @Param('id') queryId: string,
  ) {
    return this.listeningService.deleteListeningQuery(workspaceId, queryId);
  }

  @Get('feed')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get paginated mentions stream with advanced filters' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async getFeed(
    @Param('workspaceId') workspaceId: string,
    @Query() filter: ListeningFeedFilterDto,
  ) {
    return this.listeningService.getListeningFeed(workspaceId, filter);
  }

  @Patch('mentions/:id/star')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Toggle starred status on a mention' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Mention UUID' })
  async toggleStar(
    @Param('workspaceId') workspaceId: string,
    @Param('id') mentionId: string,
  ) {
    return this.listeningService.toggleStarMention(workspaceId, mentionId);
  }

  @Patch('mentions/:id/read')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Mark mention as read or unread' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Mention UUID' })
  async markRead(
    @Param('workspaceId') workspaceId: string,
    @Param('id') mentionId: string,
    @Body('isRead') isRead = true,
  ) {
    return this.listeningService.markMentionRead(workspaceId, mentionId, isRead);
  }

  @Get('analytics')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get aggregate sentiment metrics, breakdown, and reach statistics' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'queryId', required: false, description: 'Optional query filter' })
  async getAnalytics(
    @Param('workspaceId') workspaceId: string,
    @Query('queryId') queryId?: string,
  ) {
    return this.listeningService.getListeningAnalytics(workspaceId, queryId);
  }
}
