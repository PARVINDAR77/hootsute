import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { MediaService } from './media.service';
import { CreateUploadSessionDto } from './dto/create-upload-session.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { QueryMediaDto } from './dto/query-media.dto';

@ApiTags('Media Asset Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post(['upload-sessions', 'upload-session'])
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Initiate a secure media upload session and obtain a signed upload URL' })
  @ApiResponse({ status: 201, description: 'Upload session initialized successfully' })
  async createUploadSession(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateUploadSessionDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const session = await this.mediaService.createUploadSession(workspaceId, userId, dto);
    return {
      success: true,
      data: session,
      message: 'Upload session initialized. Upload file directly to uploadUrl using specified HTTP method.',
    };
  }

  @Post(':assetId/complete')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and finalize an uploaded media asset' })
  @ApiResponse({ status: 200, description: 'Media asset verified and marked READY' })
  async completeUpload(
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    const asset = await this.mediaService.completeUpload(workspaceId, assetId, dto);
    return {
      success: true,
      data: asset,
      message: 'Media asset verified and ready for use in drafts and social posts',
    };
  }

  @Post('direct-upload')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Direct server-mediated file upload' })
  async directUpload(
    @Param('workspaceId') workspaceId: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required in multipart/form-data field "file"');
    }

    const userId = req.user.id;
    const asset = await this.mediaService.directUpload(workspaceId, userId, file);
    return {
      success: true,
      data: asset,
      message: 'File uploaded and verified successfully',
    };
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'List and search workspace media assets with pagination' })
  async getMediaAssets(
    @Param('workspaceId') workspaceId: string,
    @Query() query: QueryMediaDto,
  ) {
    const result = await this.mediaService.getMediaAssets(workspaceId, query);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':assetId')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Get single media asset details by ID' })
  async getMediaAsset(
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
  ) {
    const asset = await this.mediaService.getMediaAssetById(workspaceId, assetId);
    return {
      success: true,
      data: asset,
    };
  }

  @Get([':assetId/access-url', ':assetId/download-url'])
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER, WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Generate a short-lived download or preview signed URL' })
  async getAccessUrl(
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
    @Query('ttl') ttl?: number,
  ) {
    const access = await this.mediaService.getAccessUrl(workspaceId, assetId, ttl ? Number(ttl) : undefined);
    return {
      success: true,
      data: access,
    };
  }

  @Delete(':assetId')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a media asset with safety protection against active scheduled posts' })
  async deleteMediaAsset(
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.workspaceMember?.role || 'EDITOR';
    const result = await this.mediaService.deleteMediaAsset(workspaceId, userId, userRole, assetId);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post(':assetId/retry-processing')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR, WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Retry processing for a failed upload' })
  async retryProcessing(
    @Param('workspaceId') workspaceId: string,
    @Param('assetId') assetId: string,
  ) {
    const asset = await this.mediaService.retryProcessing(workspaceId, assetId);
    return {
      success: true,
      data: asset,
      message: 'Processing retried successfully',
    };
  }
}
