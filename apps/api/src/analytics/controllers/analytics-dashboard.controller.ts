import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole, User } from '@prisma/client';
import { AnalyticsDataService } from '../services/analytics-data.service';
import { GrowthInsightsEngineService } from '../services/growth-insights-engine.service';
import {
  OverviewQueryDto,
  TimeseriesQueryDto,
  DashboardPostsQueryDto,
  TopPerformingQueryDto,
} from '../dto/analytics-dashboard.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class GenerateInsightsBodyDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsBoolean()
  useAiEnrichment?: boolean;
}

@Controller('workspaces/:workspaceId/analytics')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class AnalyticsDashboardController {
  constructor(
    private readonly analyticsDataService: AnalyticsDataService,
    private readonly growthInsightsEngine: GrowthInsightsEngineService,
  ) {}

  /**
   * Retrieves KPI overview cards with strict preceding period comparisons.
   */
  @Get('overview')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async getOverview(
    @Param('workspaceId') workspaceId: string,
    @Query() query: OverviewQueryDto,
  ) {
    const data = await this.analyticsDataService.getOverview(workspaceId, query);
    return {
      success: true,
      data,
    };
  }

  /**
   * Retrieves continuous daily time-series performance data points.
   */
  @Get('timeseries')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async getTimeseries(
    @Param('workspaceId') workspaceId: string,
    @Query() query: TimeseriesQueryDto,
  ) {
    const data = await this.analyticsDataService.getTimeseries(workspaceId, query);
    return {
      success: true,
      data,
    };
  }

  /**
   * Retrieves paginated post performance records with sorting and platform linkage.
   */
  @Get('posts')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async getDashboardPosts(
    @Param('workspaceId') workspaceId: string,
    @Query() query: DashboardPostsQueryDto,
  ) {
    const data = await this.analyticsDataService.getDashboardPosts(workspaceId, query);
    return {
      success: true,
      data: data.items,
      pagination: data.pagination,
    };
  }

  /**
   * Retrieves ranked top-performing posts by user-selected metric.
   */
  @Get('top-performing')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async getTopPerforming(
    @Param('workspaceId') workspaceId: string,
    @Query() query: TopPerformingQueryDto,
  ) {
    const data = await this.analyticsDataService.getTopPerforming(workspaceId, query);
    return {
      success: true,
      data,
    };
  }

  /**
   * Retrieves evidence-backed growth insights for the workspace.
   */
  @Get('insights')
  @RequireWorkspaceRoles(
    WorkspaceRole.VIEWER,
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async listInsights(@Param('workspaceId') workspaceId: string) {
    const data = await this.analyticsDataService.listGrowthInsights(workspaceId);
    return {
      success: true,
      data,
    };
  }

  /**
   * Dismisses a growth insight with actor auditing.
   * Viewers are disallowed from dismissing insights.
   */
  @Post('insights/:insightId/dismiss')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspaceRoles(
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async dismissInsight(
    @Param('workspaceId') workspaceId: string,
    @Param('insightId') insightId: string,
    @CurrentUser() user: User,
  ) {
    const data = await this.analyticsDataService.dismissGrowthInsight(
      workspaceId,
      insightId,
      user.id,
    );
    return {
      success: true,
      message: 'Growth insight successfully dismissed',
      data,
    };
  }

  /**
   * Triggers deterministic growth insights evaluation across the 5 supported categories.
   * Restricted to EDITOR, ADMIN, OWNER roles.
   */
  @Post('insights/generate')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspaceRoles(
    WorkspaceRole.EDITOR,
    WorkspaceRole.ADMIN,
    WorkspaceRole.OWNER,
  )
  async generateInsights(
    @Param('workspaceId') workspaceId: string,
    @Body() body: GenerateInsightsBodyDto,
    @Req() req: any,
  ) {
    const isPrivileged =
      req.workspaceMember?.role === WorkspaceRole.ADMIN ||
      req.workspaceMember?.role === WorkspaceRole.OWNER;
    const effectiveForce = isPrivileged && !!body?.force;

    const report = await this.growthInsightsEngine.generateInsights(workspaceId, {
      force: effectiveForce,
      useAiEnrichment: body?.useAiEnrichment,
    });

    return {
      success: true,
      message: `Evaluated 5 growth insight rules: ${report.generatedCount} generated/updated, ${report.skippedCount} skipped.`,
      data: report,
    };
  }
}
