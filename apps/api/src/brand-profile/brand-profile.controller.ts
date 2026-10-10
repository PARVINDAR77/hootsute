import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { BrandProfileService } from './brand-profile.service';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';

@ApiTags('Brand Profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/brand-profile')
export class BrandProfileController {
  constructor(private readonly brandProfileService: BrandProfileService) {}

  @Get()
  @RequireWorkspaceRoles(WorkspaceRole.VIEWER)
  @ApiOperation({
    summary: 'Retrieve workspace brand profile',
    description: 'Returns the brand profile guidelines, voice, colors, and audience info for the specified workspace.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Unique workspace identifier' })
  @SwaggerResponse({ status: 200, description: 'Brand profile returned successfully' })
  @SwaggerResponse({ status: 403, description: 'Forbidden - not a member of this workspace' })
  @SwaggerResponse({ status: 404, description: 'Workspace not found' })
  async getBrandProfile(@Param('workspaceId') workspaceId: string) {
    const profile = await this.brandProfileService.getBrandProfile(workspaceId);
    return {
      success: true,
      data: profile,
    };
  }

  @Put()
  @RequireWorkspaceRoles(WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update workspace brand profile',
    description: 'Upserts brand voice, target audience, brand colors, guidelines, and contact details. Requires ADMIN or OWNER role.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Unique workspace identifier' })
  @SwaggerResponse({ status: 200, description: 'Brand profile upserted successfully' })
  @SwaggerResponse({ status: 400, description: 'Validation error in colors, URLs, or languages' })
  @SwaggerResponse({ status: 403, description: 'Forbidden - requires ADMIN or OWNER role' })
  async upsertBrandProfile(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertBrandProfileDto,
  ) {
    const profile = await this.brandProfileService.upsertBrandProfile(
      workspaceId,
      user.id,
      dto,
    );
    return {
      success: true,
      message: 'Brand profile updated successfully',
      data: profile,
    };
  }
}
