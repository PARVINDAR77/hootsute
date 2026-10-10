import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole, User } from '@prisma/client';
import { AnalyticsSyncService } from '../services/analytics-sync.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';

import { IsOptional, IsUUID, IsBoolean } from 'class-validator';

class TriggerSyncBodyDto {
  @IsOptional()
  @IsUUID()
  socialAccountId?: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

@Controller('workspaces/:workspaceId/analytics')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class AnalyticsSyncController {
  constructor(
    private readonly syncService: AnalyticsSyncService,
    private readonly repository: AnalyticsRepository,
  ) {}

  /**
   * Retrieves synchronization health, freshness timestamps, and permission error indicators.
   */
  @Get('sync-status')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async getSyncStatus(
    @Param('workspaceId') workspaceId: string,
    @Query('socialAccountId') socialAccountId?: string,
  ) {
    const freshness = await this.repository.getSyncFreshness(workspaceId, socialAccountId);
    return {
      success: true,
      data: freshness,
    };
  }

  /**
   * Triggers an on-demand manual synchronization for the workspace or a specific account.
   * Throttled to 1 call per 15 minutes to conserve provider API limits.
   */
  @Post('sync-now')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspaceRoles(
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async triggerManualSync(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: User,
    @Body() body: TriggerSyncBodyDto,
    @Req() req: any,
  ) {
    const isPrivileged =
      req.workspaceMember?.role === WorkspaceRole.ADMIN ||
      req.workspaceMember?.role === WorkspaceRole.OWNER;
    const effectiveForce = isPrivileged && !!body?.force;

    const result = await this.syncService.triggerManualSync(
      workspaceId,
      user.id,
      body?.socialAccountId,
      effectiveForce,
    );

    return {
      success: !result.throttled,
      message: result.message,
      data: {
        throttled: result.throttled,
        lastSuccessfulSyncAt: result.lastSuccessfulSyncAt,
      },
    };
  }
}
