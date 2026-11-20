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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { WorkspaceRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ContentDraftsService } from './content-drafts.service';
import { CreateContentDraftDto } from './dto/create-draft.dto';
import { UpdateContentDraftDto } from './dto/update-draft.dto';
import { QueryDraftsDto } from './dto/query-drafts.dto';
import { RegenerateVariantDto } from './dto/regenerate-variant.dto';
import { TranslateVariantDto } from './dto/translate-variant.dto';
import { AdaptVariantDto } from './dto/adapt-variant.dto';
import { BulkApproveDraftsDto } from './dto/bulk-approve.dto';
import { RejectDraftDto } from './dto/approval-action.dto';
import { GenerateCreativeBriefDto } from './dto/creative-brief.dto';

@ApiTags('Content Drafts & Approval')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/content-drafts')
export class ContentDraftsController {
  constructor(private readonly draftsService: ContentDraftsService) {}

  @Post()
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Create a new content draft' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @SwaggerResponse({ status: 201, description: 'Draft created successfully' })
  async createDraft(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContentDraftDto,
  ) {
    const draft = await this.draftsService.createDraft(workspaceId, user.id, dto);
    return {
      success: true,
      data: draft,
    };
  }

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List workspace content drafts with filters and pagination' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @SwaggerResponse({ status: 200, description: 'List of drafts returned' })
  async listDrafts(
    @Param('workspaceId') workspaceId: string,
    @Query() query: QueryDraftsDto,
  ) {
    const result = await this.draftsService.listDrafts(workspaceId, query);
    return {
      success: true,
      data: result.items,
      pagination: result.pagination,
    };
  }

  @Post('bulk-approve')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk approve multiple campaign drafts (ADMIN or OWNER only)' })
  async bulkApproveDrafts(
    @Param('workspaceId') workspaceId: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkApproveDraftsDto,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.ADMIN;
    const result = await this.draftsService.bulkApproveDrafts(
      workspaceId,
      dto.draftIds,
      memberRole,
      user.id,
    );
    return {
      success: true,
      message: `Approved ${result.approvedIds.length} campaign draft(s)`,
      data: result,
    };
  }

  @Get(':draftId')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Retrieve content draft by ID with variants and revisions' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Draft details returned' })
  @SwaggerResponse({ status: 404, description: 'Draft not found in workspace' })
  async getDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
  ) {
    const draft = await this.draftsService.getDraft(workspaceId, draftId);
    return {
      success: true,
      data: draft,
    };
  }

  @Patch(':draftId')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Update editable fields of draft and its variants' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Draft updated successfully' })
  async updateDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateContentDraftDto,
  ) {
    const updated = await this.draftsService.updateDraft(workspaceId, draftId, user.id, dto);
    return {
      success: true,
      data: updated,
    };
  }

  @Post(':draftId/duplicate')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Duplicate an existing draft and all its platform variants' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Draft duplicated successfully' })
  async duplicateDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const copy = await this.draftsService.duplicateDraft(workspaceId, draftId, user.id);
    return {
      success: true,
      data: copy,
    };
  }

  @Delete(':draftId')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Delete a draft according to authorization and status policy' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Draft deleted successfully' })
  async deleteDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.EDITOR;
    const result = await this.draftsService.deleteDraft(
      workspaceId,
      draftId,
      memberRole,
      user.id,
    );
    return result;
  }

  @Post(':draftId/variants/:variantId/regenerate')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate whole variant or a specific field using AI provider' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @ApiParam({ name: 'variantId', description: 'Variant ID' })
  @SwaggerResponse({ status: 200, description: 'Variant regenerated and revision recorded' })
  async regenerateVariant(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegenerateVariantDto,
  ) {
    const variant = await this.draftsService.regenerateVariant(
      workspaceId,
      draftId,
      variantId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: variant,
    };
  }

  @Post(':draftId/variants/:variantId/translate')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Translate variant to target language using AI' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @ApiParam({ name: 'variantId', description: 'Variant ID' })
  @SwaggerResponse({ status: 200, description: 'Variant translated successfully' })
  async translateVariant(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TranslateVariantDto,
  ) {
    const variant = await this.draftsService.translateVariant(
      workspaceId,
      draftId,
      variantId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: variant,
    };
  }

  @Post(':draftId/variants/:variantId/adapt')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adapt variant content to another target social platform' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @ApiParam({ name: 'variantId', description: 'Variant ID' })
  @SwaggerResponse({ status: 200, description: 'Variant adapted successfully' })
  async adaptVariant(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdaptVariantDto,
  ) {
    const variant = await this.draftsService.adaptVariant(
      workspaceId,
      draftId,
      variantId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: variant,
    };
  }

  @Post(':draftId/variants/:variantId/creative-brief')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate structured visual creative brief for image direction' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @ApiParam({ name: 'variantId', description: 'Variant ID' })
  @SwaggerResponse({ status: 200, description: 'Creative brief generated' })
  async generateCreativeBrief(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateCreativeBriefDto,
  ) {
    const variant = await this.draftsService.generateCreativeBrief(
      workspaceId,
      draftId,
      variantId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: variant,
    };
  }

  @Get(':draftId/revisions')
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Retrieve append-only revision history of a draft' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Revision history list' })
  async getRevisions(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
  ) {
    const revisions = await this.draftsService.getRevisions(workspaceId, draftId);
    return {
      success: true,
      data: revisions,
    };
  }

  @Post(':draftId/submit-review')
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit draft for review (DRAFT -> IN_REVIEW)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Draft submitted for review' })
  async submitReview(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const draft = await this.draftsService.submitReview(workspaceId, draftId, user.id);
    return {
      success: true,
      message: 'Draft submitted for review',
      data: draft,
    };
  }

  @Post(':draftId/approve')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve draft (IN_REVIEW -> APPROVED). ADMIN or OWNER only.' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Draft approved' })
  async approveDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.ADMIN;
    const draft = await this.draftsService.approveDraft(
      workspaceId,
      draftId,
      user.id,
      memberRole,
    );
    return {
      success: true,
      message: 'Draft approved successfully',
      data: draft,
    };
  }

  @Post(':draftId/reject')
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject draft with mandatory reason (IN_REVIEW -> REJECTED). ADMIN or OWNER only.' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'draftId', description: 'Draft ID' })
  @SwaggerResponse({ status: 200, description: 'Draft rejected with reason' })
  async rejectDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Req() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectDraftDto,
  ) {
    const memberRole = req.workspaceMember?.role || WorkspaceRole.ADMIN;
    const draft = await this.draftsService.rejectDraft(
      workspaceId,
      draftId,
      user.id,
      memberRole,
      dto,
    );
    return {
      success: true,
      message: 'Draft rejected with feedback',
      data: draft,
    };
  }
}
