import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SocialAccountsService } from './social-accounts.service';
import { SelectAccountsDto } from './dto/select-accounts.dto';
import { InitiateOAuthDto } from './dto/initiate-oauth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../common/guards/workspace-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import { RequireWorkspaceRole } from '../common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { SocialProvider } from '@packages/shared';

@ApiTags('Social Accounts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId/social-accounts')
export class SocialAccountsController {
  constructor(private readonly socialAccountsService: SocialAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List connected social accounts for the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Connected accounts list (credentials omitted)' })
  async listAccounts(@Param('workspaceId') workspaceId: string) {
    return this.socialAccountsService.listAccounts(workspaceId);
  }

  @Post('meta/connect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Initiate Meta OAuth 2.0 flow (ADMIN or OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'OAuth authorization URL and state returned' })
  @ApiResponse({ status: 400, description: 'Meta credentials not configured' })
  async initiateMeta(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateOAuthDto,
  ) {
    return this.socialAccountsService.initiateMetaOAuth(workspaceId, user.id, dto?.redirectUri);
  }

  @Post('linkedin/connect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Initiate LinkedIn OAuth 2.0 flow (ADMIN or OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'OAuth authorization URL and state returned' })
  async initiateLinkedIn(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateOAuthDto,
  ) {
    return this.socialAccountsService.initiateLinkedInOAuth(workspaceId, user.id, dto?.redirectUri);
  }

  @Post('twitter/connect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Initiate Twitter / X OAuth 2.0 flow (ADMIN or OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'OAuth authorization URL and state returned' })
  async initiateTwitter(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateOAuthDto,
  ) {
    return this.socialAccountsService.initiateTwitterOAuth(workspaceId, user.id, dto?.redirectUri);
  }

  @Post('pinterest/connect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Initiate Pinterest OAuth 2.0 flow (ADMIN or OWNER only)' })
  async initiatePinterest(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateOAuthDto,
  ) {
    return this.socialAccountsService.initiateProviderOAuth(
      workspaceId,
      user.id,
      SocialProvider.PINTEREST,
      dto?.redirectUri,
    );
  }

  @Post('youtube/connect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Initiate YouTube OAuth 2.0 flow (ADMIN or OWNER only)' })
  async initiateYouTube(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateOAuthDto,
  ) {
    return this.socialAccountsService.initiateProviderOAuth(
      workspaceId,
      user.id,
      SocialProvider.YOUTUBE,
      dto?.redirectUri,
    );
  }

  @Post('tiktok/connect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Initiate TikTok OAuth 2.0 flow (ADMIN or OWNER only)' })
  async initiateTikTok(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateOAuthDto,
  ) {
    return this.socialAccountsService.initiateProviderOAuth(
      workspaceId,
      user.id,
      SocialProvider.TIKTOK,
      dto?.redirectUri,
    );
  }

  @Post('threads/connect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Initiate Threads OAuth 2.0 flow (ADMIN or OWNER only)' })
  async initiateThreads(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateOAuthDto,
  ) {
    return this.socialAccountsService.initiateProviderOAuth(
      workspaceId,
      user.id,
      SocialProvider.THREADS,
      dto?.redirectUri,
    );
  }

  @Get('candidates')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve discovered candidate accounts awaiting selection' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'sessionToken', description: 'Ephemeral OAuth session token' })
  @ApiResponse({ status: 200, description: 'Discovered candidate social accounts' })
  async getDiscoveredCandidates(
    @Param('workspaceId') workspaceId: string,
    @Query('sessionToken') sessionToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!sessionToken) {
      throw new BadRequestException('Query parameter sessionToken is required');
    }
    return this.socialAccountsService.getCandidateAccounts(workspaceId, sessionToken, user.id);
  }

  @Get('meta/candidates')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve discovered Meta candidate accounts awaiting selection' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiQuery({ name: 'sessionToken', description: 'Ephemeral OAuth session token' })
  @ApiResponse({ status: 200, description: 'Candidate Facebook Pages and Instagram accounts' })
  async getCandidates(
    @Param('workspaceId') workspaceId: string,
    @Query('sessionToken') sessionToken: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!sessionToken) {
      throw new BadRequestException('Query parameter sessionToken is required');
    }
    return this.socialAccountsService.getCandidateAccounts(workspaceId, sessionToken, user.id);
  }

  @Post('select')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Save selected social accounts' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Accounts connected with encrypted credentials' })
  async selectDiscoveredAccounts(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelectAccountsDto,
  ) {
    return this.socialAccountsService.selectAccounts(workspaceId, user.id, dto);
  }

  @Post('meta/select')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Save selected Facebook Pages or Instagram accounts' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Accounts connected with encrypted credentials' })
  async selectAccounts(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelectAccountsDto,
  ) {
    return this.socialAccountsService.selectAccounts(workspaceId, user.id, dto);
  }

  @Post(':accountId/reconnect')
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Reconnect an expired or revoked social account' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'accountId', description: 'Social Account UUID' })
  @ApiResponse({ status: 200, description: 'Reauthorization initiated' })
  async reconnectAccount(
    @Param('workspaceId') workspaceId: string,
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialAccountsService.reconnectAccount(workspaceId, accountId, user.id);
  }

  @Delete(':accountId')
  @HttpCode(HttpStatus.OK)
  @RequireWorkspaceRole(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Disconnect and delete a social account' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'accountId', description: 'Social Account UUID' })
  @ApiResponse({ status: 200, description: 'Account disconnected successfully' })
  async disconnectAccount(
    @Param('workspaceId') workspaceId: string,
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialAccountsService.disconnectAccount(workspaceId, accountId, user.id);
  }
}
