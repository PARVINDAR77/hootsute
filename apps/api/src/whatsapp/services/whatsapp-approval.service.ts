import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppActionTokenService } from './whatsapp-action-token.service';
import { WhatsAppConsentService } from './whatsapp-consent.service';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WHATSAPP_CLIENT, WhatsAppClient } from '../provider/whatsapp-client.interface';
import { DraftStatus, WorkspaceRole, RecipientConsentStatus } from '@prisma/client';

export interface ReviewDraftDetails {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  draft: {
    id: string;
    title: string;
    objective: string;
    contentType: string;
    language: string;
    status: DraftStatus;
    rejectionReason: string | null;
    approvedAt: Date | null;
    createdBy: { id: string; name: string };
    createdAt: Date;
    variants: any[];
  };
  reviewer: {
    id: string;
    displayName: string;
    phoneNumber: string;
    maskedPhone: string;
  };
  canApprove: boolean;
  cannotApproveReason?: string;
  tokenExpiresAt: string;
}

@Injectable()
export class WhatsAppApprovalService {
  private readonly logger = new Logger(WhatsAppApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: WhatsAppActionTokenService,
    private readonly consentService: WhatsAppConsentService,
    private readonly configService: WhatsAppConfigService,
    @Inject(WHATSAPP_CLIENT) private readonly whatsAppClient: WhatsAppClient,
  ) {}

  /**
   * Resolves token and returns rich preview data for the reviewer web UI
   */
  async resolveReviewDetails(token: string): Promise<ReviewDraftDetails> {
    const payload = this.tokenService.verifyToken(token);

    const draft = await this.prisma.contentDraft.findUnique({
      where: { id: payload.draftId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        variants: true,
      },
    });

    if (!draft || draft.workspaceId !== payload.workspaceId) {
      throw new NotFoundException('Content draft associated with this review link could not be found');
    }

    const recipient = await this.prisma.whatsAppRecipientConsent.findUnique({
      where: { id: payload.recipientConsentId },
    });

    if (!recipient || recipient.workspaceId !== payload.workspaceId) {
      throw new NotFoundException('Reviewer consent record associated with this token could not be found');
    }

    // Four-Eyes Principle evaluation
    let canApprove = true;
    let cannotApproveReason: string | undefined;

    if (recipient.userId && recipient.userId === draft.createdByUserId) {
      // Check if user is Workspace Owner (Owners are exempt from self-approval block)
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: draft.workspaceId,
            userId: recipient.userId,
          },
        },
      });

      if (!membership || membership.role !== WorkspaceRole.OWNER) {
        canApprove = false;
        cannotApproveReason =
          'You created this content draft. Under four-eyes approval policy, approval must be granted by another reviewer or the workspace owner.';
      }
    }

    return {
      workspace: draft.workspace,
      draft: {
        id: draft.id,
        title: draft.title,
        objective: draft.objective,
        contentType: draft.contentType,
        language: draft.language,
        status: draft.status,
        rejectionReason: draft.rejectionReason,
        approvedAt: draft.approvedAt,
        createdBy: draft.createdBy,
        createdAt: draft.createdAt,
        variants: draft.variants,
      },
      reviewer: {
        id: recipient.id,
        displayName: recipient.displayName,
        phoneNumber: recipient.phoneNumber,
        maskedPhone: this.consentService.maskPhoneNumber(recipient.phoneNumber),
      },
      canApprove,
      cannotApproveReason,
      tokenExpiresAt: new Date(payload.expiresAt).toISOString(),
    };
  }

  /**
   * Approves a draft using a valid action token
   */
  async approveViaActionToken(token: string) {
    const payload = this.tokenService.verifyToken(token);

    const draft = await this.prisma.contentDraft.findUnique({
      where: { id: payload.draftId },
      include: { workspace: true },
    });

    if (!draft || draft.workspaceId !== payload.workspaceId) {
      throw new NotFoundException('Draft not found');
    }

    const recipient = await this.prisma.whatsAppRecipientConsent.findUnique({
      where: { id: payload.recipientConsentId },
    });

    if (!recipient || recipient.workspaceId !== payload.workspaceId) {
      throw new NotFoundException('Recipient not found');
    }

    // Four-Eyes Check
    if (recipient.userId && recipient.userId === draft.createdByUserId) {
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: draft.workspaceId,
            userId: recipient.userId,
          },
        },
      });

      if (!membership || membership.role !== WorkspaceRole.OWNER) {
        throw new ForbiddenException(
          'Four-eyes policy violation: You cannot approve your own content draft. Another reviewer or owner must approve it.',
        );
      }
    }

    // Idempotency: If already approved, return without duplicating revision
    if (draft.status === DraftStatus.APPROVED) {
      return {
        success: true,
        message: 'Draft is already approved',
        alreadyProcessed: true,
        data: draft,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDraft = await tx.contentDraft.update({
        where: { id: draft.id },
        data: {
          status: DraftStatus.APPROVED,
          approvedAt: new Date(),
          approvedByUserId: recipient.userId || null,
          rejectionReason: null,
        },
        include: { variants: true },
      });

      const nextRev = await this.getNextRevisionNumber(tx, draft.id);

      await tx.contentRevision.create({
        data: {
          draftId: draft.id,
          revisionNumber: nextRev,
          action: 'APPROVE',
          promptSummary: `Approved via WhatsApp reviewer action by ${recipient.displayName} (${this.consentService.maskPhoneNumber(
            recipient.phoneNumber,
          )})`,
          outputSnapshot: {
            status: DraftStatus.APPROVED,
            channel: 'WHATSAPP_ACTION_TOKEN',
            reviewer: recipient.displayName,
          },
          createdByUserId: recipient.userId || draft.createdByUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: draft.workspaceId,
          actorUserId: recipient.userId || null,
          action: 'WHATSAPP_DRAFT_APPROVE',
          entityType: 'ContentDraft',
          entityId: draft.id,
          metadata: {
            reviewerName: recipient.displayName,
            reviewerPhone: this.consentService.maskPhoneNumber(recipient.phoneNumber),
            channel: 'WHATSAPP',
          },
        },
      });

      return {
        success: true,
        message: `Draft "${draft.title}" approved successfully.`,
        data: updatedDraft,
      };
    });
  }

  /**
   * Rejects a draft with mandatory reason using a valid action token
   */
  async rejectViaActionToken(token: string, rawReason: string) {
    const payload = this.tokenService.verifyToken(token);

    const reason = (rawReason || '').trim();
    if (!reason || reason.length < 3) {
      throw new BadRequestException('A descriptive rejection or change request reason is required (minimum 3 characters)');
    }

    const draft = await this.prisma.contentDraft.findUnique({
      where: { id: payload.draftId },
    });

    if (!draft || draft.workspaceId !== payload.workspaceId) {
      throw new NotFoundException('Draft not found');
    }

    if (draft.status === DraftStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an already approved draft. Create a new revision instead.');
    }

    const recipient = await this.prisma.whatsAppRecipientConsent.findUnique({
      where: { id: payload.recipientConsentId },
    });

    if (!recipient || recipient.workspaceId !== payload.workspaceId) {
      throw new NotFoundException('Recipient not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDraft = await tx.contentDraft.update({
        where: { id: draft.id },
        data: {
          status: DraftStatus.REJECTED,
          rejectionReason: reason,
        },
        include: { variants: true },
      });

      const nextRev = await this.getNextRevisionNumber(tx, draft.id);

      await tx.contentRevision.create({
        data: {
          draftId: draft.id,
          revisionNumber: nextRev,
          action: 'REJECT',
          promptSummary: `Rejected via WhatsApp reviewer action: "${reason}" by ${recipient.displayName}`,
          outputSnapshot: {
            status: DraftStatus.REJECTED,
            rejectionReason: reason,
            channel: 'WHATSAPP_ACTION_TOKEN',
          },
          createdByUserId: recipient.userId || draft.createdByUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: draft.workspaceId,
          actorUserId: recipient.userId || null,
          action: 'WHATSAPP_DRAFT_REJECT',
          entityType: 'ContentDraft',
          entityId: draft.id,
          metadata: {
            reviewerName: recipient.displayName,
            reviewerPhone: this.consentService.maskPhoneNumber(recipient.phoneNumber),
            rejectionReason: reason,
            channel: 'WHATSAPP',
          },
        },
      });

      return {
        success: true,
        message: `Draft "${draft.title}" marked as rejected. Creator notified of requested changes.`,
        data: updatedDraft,
      };
    });
  }

  /**
   * Handles inbound interactive button click or text message reply from WhatsApp
   */
  async handleInboundApprovalReply(fromPhoneNumber: string, textOrPayload: string) {
    const normalizedPhone = this.consentService.normalizePhoneNumber(fromPhoneNumber);
    const trimmed = textOrPayload.trim();

    // Check if recipient is registered and opted in
    const recipient = await this.prisma.whatsAppRecipientConsent.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        status: RecipientConsentStatus.OPTED_IN,
      },
    });

    if (!recipient) {
      this.logger.debug(`Inbound message from unregistered or opted-out number ${this.consentService.maskPhoneNumber(normalizedPhone)}`);
      return { processed: false, reason: 'unregistered_or_opted_out' };
    }

    // Find the latest pending notification message sent to this reviewer
    const latestNotification = await this.prisma.whatsAppNotificationMessage.findFirst({
      where: {
        recipientConsentId: recipient.id,
        draft: {
          status: { in: [DraftStatus.IN_REVIEW, DraftStatus.DRAFT] },
        },
      },
      include: {
        draft: {
          include: { workspace: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestNotification || !latestNotification.draft) {
      this.logger.debug(`No active draft awaiting approval found for reviewer ${recipient.displayName}`);
      return { processed: false, reason: 'no_active_draft' };
    }

    const draft = latestNotification.draft;
    const isApprove = /^APPROVE|^YES|^ACCEPT/i.test(trimmed);
    const isReject = /^REJECT|^NO|^CHANGES/i.test(trimmed);

    if (!isApprove && !isReject) {
      return { processed: false, reason: 'unrecognized_command' };
    }

    const workspaceCredentials = await this.configService.getDecryptedToken(draft.workspaceId);

    if (isApprove) {
      // Check Four-Eyes
      if (recipient.userId && recipient.userId === draft.createdByUserId) {
        const membership = await this.prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: draft.workspaceId,
              userId: recipient.userId,
            },
          },
        });

        if (!membership || membership.role !== WorkspaceRole.OWNER) {
          // Send four-eyes policy notification
          await this.whatsAppClient.sendTextMessage({
            to: recipient.phoneNumber,
            text: `⚠️ Approval could not be processed: You created draft "${draft.title}". Under four-eyes policy, another reviewer or the workspace owner must approve it.`,
            accessToken: workspaceCredentials?.accessToken,
            phoneNumberId: workspaceCredentials?.phoneNumberId,
          });
          return { processed: false, reason: 'four_eyes_violation' };
        }
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.contentDraft.update({
          where: { id: draft.id },
          data: {
            status: DraftStatus.APPROVED,
            approvedAt: new Date(),
            approvedByUserId: recipient.userId || null,
          },
        });

        const nextRev = await this.getNextRevisionNumber(tx, draft.id);

        await tx.contentRevision.create({
          data: {
            draftId: draft.id,
            revisionNumber: nextRev,
            action: 'APPROVE',
            promptSummary: `Approved via inbound WhatsApp reply from ${recipient.displayName}`,
            outputSnapshot: { status: DraftStatus.APPROVED, channel: 'WHATSAPP_INBOUND_MSG' },
            createdByUserId: recipient.userId || draft.createdByUserId,
          },
        });

        await tx.auditLog.create({
          data: {
            workspaceId: draft.workspaceId,
            actorUserId: recipient.userId || null,
            action: 'WHATSAPP_INBOUND_APPROVE',
            entityType: 'ContentDraft',
            entityId: draft.id,
            metadata: {
              reviewerName: recipient.displayName,
              reviewerPhone: this.consentService.maskPhoneNumber(recipient.phoneNumber),
            },
          },
        });
      });

      // Send confirmation receipt to reviewer
      await this.whatsAppClient.sendTextMessage({
        to: recipient.phoneNumber,
        text: `✅ Success! Draft *"${draft.title}"* has been approved and moved to the publishing schedule.`,
        accessToken: workspaceCredentials?.accessToken,
        phoneNumberId: workspaceCredentials?.phoneNumberId,
      });

      return { processed: true, action: 'APPROVE', draftId: draft.id };
    } else {
      // Reject
      const reasonPart = trimmed.replace(/^REJECT:?|^NO:?|^CHANGES:?/i, '').trim();
      const reason = reasonPart.length > 0 ? reasonPart : 'Changes requested via WhatsApp response';

      await this.prisma.$transaction(async (tx) => {
        await tx.contentDraft.update({
          where: { id: draft.id },
          data: {
            status: DraftStatus.REJECTED,
            rejectionReason: reason,
          },
        });

        const nextRev = await this.getNextRevisionNumber(tx, draft.id);

        await tx.contentRevision.create({
          data: {
            draftId: draft.id,
            revisionNumber: nextRev,
            action: 'REJECT',
            promptSummary: `Rejected via inbound WhatsApp reply from ${recipient.displayName}: "${reason}"`,
            outputSnapshot: { status: DraftStatus.REJECTED, rejectionReason: reason, channel: 'WHATSAPP_INBOUND_MSG' },
            createdByUserId: recipient.userId || draft.createdByUserId,
          },
        });

        await tx.auditLog.create({
          data: {
            workspaceId: draft.workspaceId,
            actorUserId: recipient.userId || null,
            action: 'WHATSAPP_INBOUND_REJECT',
            entityType: 'ContentDraft',
            entityId: draft.id,
            metadata: {
              reviewerName: recipient.displayName,
              reviewerPhone: this.consentService.maskPhoneNumber(recipient.phoneNumber),
              reason,
            },
          },
        });
      });

      // Send rejection receipt to reviewer
      await this.whatsAppClient.sendTextMessage({
        to: recipient.phoneNumber,
        text: `❌ Draft *"${draft.title}"* marked as rejected with reason: "${reason}". Creator has been notified.`,
        accessToken: workspaceCredentials?.accessToken,
        phoneNumberId: workspaceCredentials?.phoneNumberId,
      });

      return { processed: true, action: 'REJECT', draftId: draft.id };
    }
  }

  private async getNextRevisionNumber(tx: any, draftId: string): Promise<number> {
    const latest = await tx.contentRevision.findFirst({
      where: { draftId },
      orderBy: { revisionNumber: 'desc' },
      select: { revisionNumber: true },
    });
    return (latest?.revisionNumber || 0) + 1;
  }
}
