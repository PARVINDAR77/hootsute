import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { CompetitorCategory, AnalyticsMetricPeriod } from '@packages/shared';
import { CompetitorsService } from '../services/competitors.service';
import {
  CreateCompetitorProfileDto,
  UpdateCompetitorProfileDto,
  AddCompetitorAccountDto,
  CompetitorBenchmarkQueryDto,
} from '../dto/competitor.dto';

@ApiTags('Competitor Benchmarking & Public Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/competitors')
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @Post()
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Create a new tracked competitor profile' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Competitor profile created successfully' })
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCompetitorProfileDto,
  ) {
    return this.competitorsService.create(workspaceId, dto);
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all tracked competitors for the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'category', enum: CompetitorCategory, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('category') category?: CompetitorCategory,
    @Query('isActive') isActive?: string,
  ) {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.competitorsService.findAll(workspaceId, { category, isActive: activeBool });
  }

  @Get('benchmark/summary')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get side-by-side comparative benchmarking analytics summary' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'period', enum: AnalyticsMetricPeriod, required: false })
  async getBenchmarkSummary(
    @Param('workspaceId') workspaceId: string,
    @Query('period') period?: AnalyticsMetricPeriod,
  ) {
    return this.competitorsService.getComparisonSummary(workspaceId, period || AnalyticsMetricPeriod.DAY);
  }

  @Post('benchmark/sync')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger synchronization of competitor public telemetry snapshots' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async syncSnapshots(@Param('workspaceId') workspaceId: string) {
    return this.competitorsService.syncSnapshots(workspaceId);
  }

  @Get(':id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get single competitor profile with tracked channels and snapshots' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Competitor Profile UUID' })
  async findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.competitorsService.findOne(workspaceId, id);
  }

  @Patch(':id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update competitor profile information' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Competitor Profile UUID' })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompetitorProfileDto,
  ) {
    return this.competitorsService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Delete competitor profile and remove from tracking' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Competitor Profile UUID' })
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.competitorsService.remove(workspaceId, id);
  }

  @Post(':id/accounts')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Add or update a social channel to track for this competitor' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Competitor Profile UUID' })
  async addAccount(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: AddCompetitorAccountDto,
  ) {
    return this.competitorsService.addAccount(workspaceId, id, dto);
  }

  @Delete(':id/accounts/:accountId')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Remove a social channel from a competitor profile' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Competitor Profile UUID' })
  @ApiParam({ name: 'accountId', description: 'Competitor Social Account UUID' })
  async removeAccount(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Param('accountId') accountId: string,
  ) {
    return this.competitorsService.removeAccount(workspaceId, id, accountId);
  }
}
