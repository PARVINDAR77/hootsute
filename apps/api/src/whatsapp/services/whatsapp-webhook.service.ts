import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppConsentService } from './whatsapp-consent.service';
import { WhatsAppApprovalService } from './whatsapp-approval.service';
import { WhatsAppMessageStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly consentService: WhatsAppConsentService,
    private readonly approvalService: WhatsAppApprovalService,
  ) {
    this.appSecret = this.configService.get<string>('whatsapp.appSecret') || '';
    this.verifyToken = this.configService.get<string>('whatsapp.verifyToken') || 'omnisocial_wa_verify_token';
  }

  /**
   * Verifies the initial Meta Webhook subscription handshake
   */
  verifyChallenge(mode: string, token: string, challenge: string): string {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Meta WhatsApp webhook subscription verified successfully');
      return challenge;
    }

    this.logger.warn(`Webhook subscription verification failed. Token mismatch or mode: ${mode}`);
    throw new ForbiddenException('Invalid webhook verification token or subscription mode');
  }

  /**
   * Validates Meta X-Hub-Signature-256 header using raw request buffer
   */
  verifySignature(rawBody: Buffer, signatureHeader?: string): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      this.logger.warn('Missing or malformed X-Hub-Signature-256 header on incoming webhook');
      throw new UnauthorizedException('Missing or invalid X-Hub-Signature-256 header');
    }

    const nodeEnv = (
      this.configService.get<string>('nodeEnv') ||
      process.env.NODE_ENV ||
      'development'
    ).toLowerCase();
    const isProduction = nodeEnv === 'production';

    if (!this.appSecret) {
      if (isProduction) {
        this.logger.error('WhatsApp app secret is not configured; refusing unverified webhooks in production.');
        throw new UnauthorizedException('WhatsApp webhook verification secret is not configured on server.');
      }
      this.logger.warn(
        'META_WHATSAPP_APP_SECRET is not configured. Webhook signature verification bypassed in non-production development mode.',
      );
      return true;
    }

    const providedSignature = signatureHeader.substring(7); // Remove 'sha256='
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex');

    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      this.logger.error('Webhook signature mismatch. Potential unauthorized or spoofed event!');
      throw new UnauthorizedException('Invalid webhook HMAC-SHA256 signature');
    }

    return true;
  }

  /**
   * Processes incoming Meta webhook events (statuses & messages) with idempotency deduplication
   */
  async processWebhookPayload(payload: any): Promise<{ processed: number; duplicates: number }> {
    if (!payload?.entry || !Array.isArray(payload.entry)) {
      return { processed: 0, duplicates: 0 };
    }

    let processedCount = 0;
    let duplicateCount = 0;

    for (const entry of payload.entry) {
      const changes = entry.changes;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // 1. Process Delivery Statuses (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            const wamid = statusObj.id;
            const statusStr = (statusObj.status || '').toLowerCase();
            const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp, 10) * 1000) : new Date();

            const eventId = `status_${wamid}_${statusStr}_${statusObj.timestamp || ''}`;

            // Deduplication Check
            const existingEvent = await this.prisma.whatsAppWebhookEvent.findUnique({
              where: { eventId },
            });

            if (existingEvent) {
              duplicateCount++;
              continue;
            }

            // Map Meta status to Prisma enum
            let mappedStatus: WhatsAppMessageStatus = WhatsAppMessageStatus.SENT;
            let statusField: any = {};

            if (statusStr === 'sent') {
              mappedStatus = WhatsAppMessageStatus.SENT;
              statusField.sentAt = timestamp;
            } else if (statusStr === 'delivered') {
              mappedStatus = WhatsAppMessageStatus.DELIVERED;
              statusField.deliveredAt = timestamp;
            } else if (statusStr === 'read') {
              mappedStatus = WhatsAppMessageStatus.READ;
              statusField.readAt = timestamp;
            } else if (statusStr === 'failed') {
              mappedStatus = WhatsAppMessageStatus.FAILED;
              const errorInfo = statusObj.errors?.[0];
              statusField.errorMessage = errorInfo
                ? `Meta Error ${errorInfo.code}: ${errorInfo.title || errorInfo.message}`
                : 'Delivery failed';
            }

            // Update Notification Message in DB
            await this.prisma.whatsAppNotificationMessage.updateMany({
              where: { providerMessageId: wamid },
              data: {
                status: mappedStatus,
                ...statusField,
              },
            });

            // Save Deduplication Event
            await this.prisma.whatsAppWebhookEvent.create({
              data: {
                eventId,
                eventType: `status_${statusStr}`,
                payload: statusObj,
              },
            });

            processedCount++;
          }
        }

        // 2. Process Inbound Messages (e.g. Opt-Out "STOP")
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            const messageId = message.id;
            const fromNumber = message.from; // Sender phone number without '+'
            const textBody = (message.text?.body || '').trim().toUpperCase();

            const eventId = `msg_${messageId}`;

            const existingEvent = await this.prisma.whatsAppWebhookEvent.findUnique({
              where: { eventId },
            });

            if (existingEvent) {
              duplicateCount++;
              continue;
            }

            // Check if user requested Opt-Out
            if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT'].includes(textBody)) {
              await this.consentService.handleInboundOptOut(fromNumber);
            } else {
              // Check if user replied with an approval command or quick-reply button
              const replyContent =
                message.interactive?.button_reply?.id ||
                message.interactive?.button_reply?.title ||
                message.text?.body ||
                '';
              if (replyContent) {
                await this.approvalService.handleInboundApprovalReply(fromNumber, replyContent);
              }
            }

            await this.prisma.whatsAppWebhookEvent.create({
              data: {
                eventId,
                eventType: 'inbound_message',
                payload: message,
              },
            });

            processedCount++;
          }
        }
      }
    }

    return { processed: processedCount, duplicates: duplicateCount };
  }
}
