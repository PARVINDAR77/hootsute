import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from '../../common/guards/workspace-auth.guard';
import { RequireWorkspaceRoles } from '../../common/decorators/workspace-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceRole, SocialPlatform } from '@prisma/client';
import { WhatsAppConfigService } from '../services/whatsapp-config.service';
import { WhatsAppConsentService } from '../services/whatsapp-consent.service';
import { WhatsAppNotificationService } from '../services/whatsapp-notification.service';
import { UpsertWhatsAppConfigDto } from '../dto/upsert-whatsapp-config.dto';
import { CreateRecipientConsentDto } from '../dto/create-recipient-consent.dto';
import { SendPreviewDto } from '../dto/send-preview.dto';

@ApiTags('WhatsApp Business Integration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
@Controller('workspaces/:workspaceId')
export class WhatsAppSettingsController {
  constructor(
    private readonly configService: WhatsAppConfigService,
    private readonly consentService: WhatsAppConsentService,
    private readonly notificationService: WhatsAppNotificationService,
  ) {}

  @Get('whatsapp/settings')
  @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Get workspace WhatsApp Business settings' })
  async getSettings(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    const config = await this.configService.getWorkspaceConfig(workspaceId);
    return {
      success: true,
      data: config,
    };
  }

  @Put('whatsapp/settings')
  @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Configure workspace WhatsApp Business credentials' })
  async upsertSettings(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: UpsertWhatsAppConfigDto,
    @CurrentUser('id') userId: string,
  ) {
    const config = await this.configService.upsertWorkspaceConfig(workspaceId, dto, userId);
    return {
      success: true,
      message: 'Workspace WhatsApp configuration updated successfully',
      data: config,
    };
  }

  @Get('whatsapp/recipients')
  @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'List registered notification recipients and consent status' })
  async listRecipients(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    const recipients = await this.consentService.listRecipients(workspaceId);
    return {
      success: true,
      data: recipients,
    };
  }

  @Post('whatsapp/recipients')
  @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Register reviewer phone number with consent acknowledgement' })
  async addRecipient(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: CreateRecipientConsentDto,
    @CurrentUser('id') userId: string,
  ) {
    const recipient = await this.consentService.addRecipient(workspaceId, dto, userId);
    return {
      success: true,
      message: 'Reviewer registered successfully with active WhatsApp notification consent',
      data: recipient,
    };
  }

  @Delete('whatsapp/recipients/:recipientId')
  @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Revoke reviewer consent and suppress notifications' })
  async revokeRecipient(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
    @CurrentUser('id') userId: string,
  ) {
    const updated = await this.consentService.revokeConsent(workspaceId, recipientId, userId);
    return {
      success: true,
      message: 'Reviewer consent revoked. Notifications permanently suppressed.',
      data: updated,
    };
  }

  @Post('content-drafts/:draftId/whatsapp-preview')
  @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Dispatch WhatsApp approval preview notification to reviewers' })
  async sendPreview(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('draftId', ParseUUIDPipe) draftId: string,
    @Body() dto: SendPreviewDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.notificationService.sendDraftPreview(
      workspaceId,
      draftId,
      dto.recipientConsentIds,
      userId,
      dto.platform,
    );
    return result;
  }

  @Get('content-drafts/:draftId/whatsapp-history')
  @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Retrieve WhatsApp notification delivery history for a draft' })
  async getHistory(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('draftId', ParseUUIDPipe) draftId: string,
  ) {
    const history = await this.notificationService.getDraftWhatsAppHistory(workspaceId, draftId);
    return {
      success: true,
      data: history,
    };
  }
}


