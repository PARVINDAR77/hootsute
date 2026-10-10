import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipientConsentStatus } from '@prisma/client';
import { CreateRecipientConsentDto } from '../dto/create-recipient-consent.dto';

@Injectable()
export class WhatsAppConsentService {
  private readonly logger = new Logger(WhatsAppConsentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes any input phone number to strict E.164 (+CountryCodeNumber)
   */
  normalizePhoneNumber(raw: string): string {
    const cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');
    const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

    if (!/^\+[1-9]\d{7,14}$/.test(formatted)) {
      throw new BadRequestException(
        `Invalid phone number format "${raw}". Must be valid E.164 (e.g. +919876543210 or +15551234567)`,
      );
    }

    return formatted;
  }

  async addRecipient(
    workspaceId: string,
    dto: CreateRecipientConsentDto,
    adminUserId: string,
  ) {
    if (!dto.consentAcknowledged) {
      throw new BadRequestException(
        'Explicit consent acknowledgement is required to register a WhatsApp notification recipient.',
      );
    }

    const normalizedPhone = this.normalizePhoneNumber(dto.phoneNumber);

    const existing = await this.prisma.whatsAppRecipientConsent.findUnique({
      where: {
        workspaceId_phoneNumber: {
          workspaceId,
          phoneNumber: normalizedPhone,
        },
      },
    });

    if (existing) {
      if (existing.status === RecipientConsentStatus.OPTED_IN) {
        throw new ConflictException(
          `Recipient with phone number ${normalizedPhone} is already registered and opted in.`,
        );
      }

      // Re-opt-in previously opted-out recipient
      const updated = await this.prisma.whatsAppRecipientConsent.update({
        where: { id: existing.id },
        data: {
          displayName: dto.displayName.trim(),
          userId: dto.userId || null,
          status: RecipientConsentStatus.OPTED_IN,
          optedInAt: new Date(),
          optedOutAt: null,
          consentSource: 'ADMIN_RE_REGISTRATION',
        },
      });

      return updated;
    }

    const recipient = await this.prisma.whatsAppRecipientConsent.create({
      data: {
        workspaceId,
        userId: dto.userId || null,
        phoneNumber: normalizedPhone,
        displayName: dto.displayName.trim(),
        status: RecipientConsentStatus.OPTED_IN,
        consentSource: 'WORKSPACE_ADMIN_REGISTRATION',
        optedInAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: adminUserId,
        action: 'WHATSAPP_RECIPIENT_REGISTER',
        entityType: 'WhatsAppRecipientConsent',
        entityId: recipient.id,
        metadata: {
          displayName: recipient.displayName,
          maskedPhone: this.maskPhoneNumber(recipient.phoneNumber),
        },
      },
    });

    return recipient;
  }

  async listRecipients(workspaceId: string) {
    return this.prisma.whatsAppRecipientConsent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async revokeConsent(
    workspaceId: string,
    recipientId: string,
    adminUserId: string,
  ) {
    const recipient = await this.prisma.whatsAppRecipientConsent.findUnique({
      where: { id: recipientId },
    });

    if (!recipient || recipient.workspaceId !== workspaceId) {
      throw new NotFoundException(`Recipient with ID ${recipientId} not found in this workspace`);
    }

    const updated = await this.prisma.whatsAppRecipientConsent.update({
      where: { id: recipientId },
      data: {
        status: RecipientConsentStatus.OPTED_OUT,
        optedOutAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: adminUserId,
        action: 'WHATSAPP_RECIPIENT_OPT_OUT',
        entityType: 'WhatsAppRecipientConsent',
        entityId: recipient.id,
        metadata: {
          displayName: recipient.displayName,
          maskedPhone: this.maskPhoneNumber(recipient.phoneNumber),
        },
      },
    });

    return updated;
  }

  async handleInboundOptOut(rawPhoneNumber: string) {
    const normalizedPhone = this.normalizePhoneNumber(rawPhoneNumber);

    const result = await this.prisma.whatsAppRecipientConsent.updateMany({
      where: {
        phoneNumber: normalizedPhone,
        status: RecipientConsentStatus.OPTED_IN,
      },
      data: {
        status: RecipientConsentStatus.OPTED_OUT,
        optedOutAt: new Date(),
      },
    });

    this.logger.log(
      `Inbound STOP received. Revoked WhatsApp consent for ${this.maskPhoneNumber(normalizedPhone)} (${result.count} workspaces updated).`,
    );

    return result.count;
  }

  maskPhoneNumber(phone: string): string {
    if (phone.length < 8) return '***';
    return `${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}`;
  }
}
