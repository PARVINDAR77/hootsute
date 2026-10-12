import {
  Controller,
  Get,
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
import { Public } from '../../common/decorators/public.decorator';
import { WhiteLabelService } from '../services/white-label.service';
import { UpsertWhiteLabelConfigDto } from '../dto/upsert-white-label.dto';

@ApiTags('White-Label Agency Portal')
@Controller()
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  @Get('workspaces/:workspaceId/white-label')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get white-label branding configuration for workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async getConfig(@Param('workspaceId') workspaceId: string) {
    return this.whiteLabelService.getConfig(workspaceId);
  }

  @Put('workspaces/:workspaceId/white-label')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Create or update white-label branding settings' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async upsertConfig(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpsertWhiteLabelConfigDto,
  ) {
    return this.whiteLabelService.upsertConfig(workspaceId, dto);
  }

  @Delete('workspaces/:workspaceId/white-label')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset white-label branding to system default' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async resetConfig(@Param('workspaceId') workspaceId: string) {
    return this.whiteLabelService.resetConfig(workspaceId);
  }

  @Public()
  @Get('white-label/public/:domainOrSlug')
  @ApiOperation({ summary: 'Public endpoint to load agency branding tokens for custom domains or client portal' })
  @ApiParam({ name: 'domainOrSlug', description: 'Custom domain hostname or workspace slug' })
  async getPublicPortalConfig(@Param('domainOrSlug') domainOrSlug: string) {
    return this.whiteLabelService.getPublicPortalConfig(domainOrSlug);
  }
}
