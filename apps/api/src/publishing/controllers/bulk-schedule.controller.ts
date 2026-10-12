import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  Header,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { BulkScheduleService } from '../services/bulk-schedule.service';
import { ValidateBulkScheduleDto } from '../dto/validate-bulk-schedule.dto';
import { ImportBulkScheduleDto } from '../dto/import-bulk-schedule.dto';

@ApiTags('Bulk Scheduling & CSV Import')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/bulk-schedule')
export class BulkScheduleController {
  constructor(private readonly bulkScheduleService: BulkScheduleService) {}

  @Get('template')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Download sample RFC 4180 CSV bulk scheduling template' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="omnisocial_bulk_schedule_template.csv"')
  async downloadTemplate(
    @Param('workspaceId') _workspaceId: string,
    @Res() res: Response,
  ) {
    const csv = this.bulkScheduleService.generateCsvTemplate();
    return res.send(csv);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Perform dry-run pre-flight validation on CSV post content' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Line-by-line linting and account mapping feedback' })
  async validateBulkSchedule(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ValidateBulkScheduleDto,
  ) {
    return this.bulkScheduleService.validateBulkSchedule(workspaceId, dto.csvContent);
  }

  @Post('import')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Commit validated batch rows into scheduled calendar posts' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Posts and targets scheduled successfully' })
  async importBulkSchedule(
    @Param('workspaceId') workspaceId: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ImportBulkScheduleDto,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.EDITOR;
    return this.bulkScheduleService.importBulkSchedule(
      workspaceId,
      user.id,
      memberRole,
      dto.rows,
    );
  }
}
