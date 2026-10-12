import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { LinksService } from '../services/links.service';
import { CreateLinkDto } from '../dto/create-link.dto';

@ApiTags('Links & UTM Attribution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Create a shortened branded link with UTM tracking parameters' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Shortened link created successfully' })
  async createLink(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLinkDto,
  ) {
    return this.linksService.createShortLink(workspaceId, user.id, dto);
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all shortened links for the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'search', required: false, description: 'Filter by title, slug, or destination URL' })
  async getWorkspaceLinks(
    @Param('workspaceId') workspaceId: string,
    @Query('search') search?: string,
  ) {
    return this.linksService.getWorkspaceLinks(workspaceId, search);
  }

  @Get(':linkId/analytics')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Retrieve click metrics, device breakdowns, and referrers for a link' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'linkId', description: 'Shortened Link UUID' })
  async getLinkAnalytics(
    @Param('workspaceId') workspaceId: string,
    @Param('linkId') linkId: string,
  ) {
    return this.linksService.getLinkAnalytics(workspaceId, linkId);
  }

  @Delete(':linkId')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a shortened link' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'linkId', description: 'Shortened Link UUID' })
  async deleteLink(
    @Param('workspaceId') workspaceId: string,
    @Param('linkId') linkId: string,
  ) {
    return this.linksService.deleteLink(workspaceId, linkId);
  }
}
