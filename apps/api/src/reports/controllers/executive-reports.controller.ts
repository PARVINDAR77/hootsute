import {
  Controller,
  Get,
  Post,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { WorkspaceRole } from '@prisma/client';
import { ExecutiveReportsService } from '../services/executive-reports.service';
import { CreateReportScheduleDto } from '../dto/create-report-schedule.dto';
import { UpdateReportScheduleDto } from '../dto/update-report-schedule.dto';
import { GenerateReportDto } from '../dto/generate-report.dto';

@ApiTags('Executive Reports & Automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/reports')
export class ExecutiveReportsController {
  constructor(private readonly reportsService: ExecutiveReportsService) {}

  // ----------------------------------------------------
  // Report Schedules
  // ----------------------------------------------------

  @Post('schedules')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Create an automated executive report schedule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Report schedule configured successfully' })
  async createSchedule(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportScheduleDto,
  ) {
    return this.reportsService.createSchedule(workspaceId, user.id, dto);
  }

  @Get('schedules')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all executive report delivery schedules' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async getSchedules(@Param('workspaceId') workspaceId: string) {
    return this.reportsService.getSchedules(workspaceId);
  }

  @Get('schedules/:id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get details for a specific report schedule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  async getScheduleById(
    @Param('workspaceId') workspaceId: string,
    @Param('id') scheduleId: string,
  ) {
    return this.reportsService.getScheduleById(workspaceId, scheduleId);
  }

  @Put('schedules/:id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update an executive report schedule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  async updateSchedule(
    @Param('workspaceId') workspaceId: string,
    @Param('id') scheduleId: string,
    @Body() dto: UpdateReportScheduleDto,
  ) {
    return this.reportsService.updateSchedule(workspaceId, scheduleId, dto);
  }

  @Delete('schedules/:id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an executive report schedule' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  async deleteSchedule(
    @Param('workspaceId') workspaceId: string,
    @Param('id') scheduleId: string,
  ) {
    return this.reportsService.deleteSchedule(workspaceId, scheduleId);
  }

  // ----------------------------------------------------
  // Generated Reports
  // ----------------------------------------------------

  @Post('generate')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Synthesize and generate an executive report on demand' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async generateReport(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reportsService.generateReport(workspaceId, dto);
  }

  @Get('history')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Retrieve archive of generated executive reports' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  async getGeneratedReports(@Param('workspaceId') workspaceId: string) {
    return this.reportsService.getGeneratedReports(workspaceId);
  }

  @Get('history/:id')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Fetch an executive report by ID with HTML payload' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  async getGeneratedReportById(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.reportsService.getGeneratedReportById(workspaceId, id);
  }

  @Delete('history/:id')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a generated executive report' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  async deleteGeneratedReport(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.reportsService.deleteGeneratedReport(workspaceId, id);
  }
}
