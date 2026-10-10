import {
  Controller,
  Post,
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
import { Throttle } from '@nestjs/throttler';
import { ContentGenerationService } from './content-generation.service';
import { GenerateContentDto } from './dto/generate-content.dto';

@ApiTags('AI Content Generation')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/content-generation')
export class ContentGenerationController {
  constructor(private readonly generationService: ContentGenerationService) {}

  @Post('generate')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @RequireWorkspaceRoles(WorkspaceRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate multi-platform marketing content using real AI provider',
    description: 'Synthesizes brand profile, festival occasion, campaign objective, and audience constraints into validated platform variants.',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @SwaggerResponse({ status: 200, description: 'Content successfully generated and saved as draft' })
  @SwaggerResponse({ status: 400, description: 'Validation error in request parameters' })
  @SwaggerResponse({ status: 502, description: 'AI provider error or malformed response' })
  @SwaggerResponse({ status: 503, description: 'AI provider unconfigured or rate limited' })
  async generateContent(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateContentDto,
  ) {
    const draft = await this.generationService.generateContent(
      workspaceId,
      user.id,
      dto,
    );
    return {
      success: true,
      message: 'Content generated successfully',
      data: draft,
    };
  }
}
