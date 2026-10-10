import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WHATSAPP_CLIENT, WhatsAppClient } from '../provider/whatsapp-client.interface';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WhatsAppConsentService } from './whatsapp-consent.service';
import { WhatsAppActionTokenService } from './whatsapp-action-token.service';
import {
  RecipientConsentStatus,
  WhatsAppMessageStatus,
  SocialPlatform,
  DraftStatus,
} from '@prisma/client';

@Injectable()
export class WhatsAppNotificationService {
  private readonly logger = new Logger(WhatsAppNotificationService.name);
  private readonly reviewBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(WHATSAPP_CLIENT) private readonly whatsAppClient: WhatsAppClient,
    private readonly configManager: WhatsAppConfigService,
    private readonly consentManager: WhatsAppConsentService,
    private readonly actionTokenManager: WhatsAppActionTokenService,
  ) {
    this.reviewBaseUrl =
      this.configService.get<string>('whatsapp.reviewBaseUrl') || 'http://localhost:3000';
  }

  async sendDraftPreview(
    workspaceId: string,
    draftId: string,
    recipientConsentIds: string[],
    actorUserId: string,
    targetPlatform?: SocialPlatform,
  ) {
    // 1. Fetch Draft and verify ownership
    const draft = await this.prisma.contentDraft.findUnique({
      where: { id: draftId },
      include: {
        workspace: true,
        createdBy: true,
        variants: true,
      },
    });

    if (!draft || draft.workspaceId !== workspaceId) {
      throw new NotFoundException(`Draft with ID ${draftId} does not exist in this workspace`);
    }

    if (draft.variants.length === 0) {
      throw new BadRequestException('Cannot request WhatsApp preview for a draft without any platform variants.');
    }

    const selectedVariant = targetPlatform
      ? draft.variants.find((v) => v.platform === targetPlatform) || draft.variants[0]
      : draft.variants[0];

    // 2. Fetch Workspace WhatsApp configuration
    const workspaceCredentials = await this.configManager.getDecryptedToken(workspaceId);

    // 3. Process each recipient
    const dispatchResults = [];

    for (const recipientId of recipientConsentIds) {
      const recipient = await this.prisma.whatsAppRecipientConsent.findUnique({
        where: { id: recipientId },
      });

      if (!recipient || recipient.workspaceId !== workspaceId) {
        throw new NotFoundException(`Recipient ${recipientId} does not belong to this workspace`);
      }

      // Strict Consent Enforcement
      if (recipient.status !== RecipientConsentStatus.OPTED_IN) {
        throw new BadRequestException(
          `Recipient ${recipient.displayName} (${this.consentManager.maskPhoneNumber(
            recipient.phoneNumber,
          )}) is not currently opted in to receive WhatsApp notifications.`,
        );
      }

      // Generate signed, tamper-proof review token
      const actionToken = this.actionTokenManager.generateToken(
        workspaceId,
        draftId,
        recipient.id,
        24, // 24-hour validity
      );

      const templateName = 'content_draft_approval_request';
      const bodyParameters = [
        draft.workspace.name,
        draft.title,
        selectedVariant.platform,
        draft.createdBy.name,
      ];

      // Create initial DB record in QUEUED status
      const messageRecord = await this.prisma.whatsAppNotificationMessage.create({
        data: {
          workspaceId,
          draftId,
          recipientConsentId: recipient.id,
          templateName,
          language: draft.language || 'en',
          parameters: {
            workspaceName: draft.workspace.name,
            draftTitle: draft.title,
            platform: selectedVariant.platform,
            authorName: draft.createdBy.name,
            actionToken,
          },
          status: WhatsAppMessageStatus.QUEUED,
        },
      });

      try {
        // Send via WhatsApp Client (Mock or Meta Cloud API)
        const sendResult = await this.whatsAppClient.sendMessage({
          to: recipient.phoneNumber,
          templateName,
          languageCode: draft.language || 'en',
          bodyParameters,
          buttonUrlParameter: actionToken,
          accessToken: workspaceCredentials?.accessToken,
          phoneNumberId: workspaceCredentials?.phoneNumberId,
        });

        // Update record with provider message ID (wamid)
        const updatedRecord = await this.prisma.whatsAppNotificationMessage.update({
          where: { id: messageRecord.id },
          data: {
            providerMessageId: sendResult.messageId,
            status: WhatsAppMessageStatus.SENT,
            sentAt: new Date(),
          },
        });

        dispatchResults.push(updatedRecord);
      } catch (err: any) {
        this.logger.error(
          `Failed to dispatch WhatsApp message to ${this.consentManager.maskPhoneNumber(
            recipient.phoneNumber,
          )}: ${err.message}`,
        );

        await this.prisma.whatsAppNotificationMessage.update({
          where: { id: messageRecord.id },
          data: {
            status: WhatsAppMessageStatus.FAILED,
            errorMessage: err.message,
          },
        });

        throw err;
      }
    }

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId,
        action: 'WHATSAPP_PREVIEW_DISPATCH',
        entityType: 'ContentDraft',
        entityId: draftId,
        metadata: {
          recipientsCount: dispatchResults.length,
          platform: selectedVariant.platform,
        },
      },
    });

    return {
      success: true,
      message: `WhatsApp preview notification dispatched to ${dispatchResults.length} reviewer(s).`,
      dispatchedCount: dispatchResults.length,
      messages: dispatchResults,
    };
  }

  async getDraftWhatsAppHistory(workspaceId: string, draftId: string) {
    return this.prisma.whatsAppNotificationMessage.findMany({
      where: {
        workspaceId,
        draftId,
      },
      include: {
        recipient: {
          select: {
            id: true,
            displayName: true,
            phoneNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
