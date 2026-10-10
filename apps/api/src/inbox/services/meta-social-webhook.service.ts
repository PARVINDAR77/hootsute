import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialPlatform, InteractionType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class MetaSocialWebhookService {
  private readonly logger = new Logger(MetaSocialWebhookService.name);
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.appSecret =
      this.configService.get<string>('META_APP_SECRET') ||
      this.configService.get<string>('meta.appSecret') ||
      process.env.META_APP_SECRET ||
      '';
    this.verifyToken =
      this.configService.get<string>('META_WEBHOOK_VERIFY_TOKEN') ||
      this.configService.get<string>('meta.webhookVerifyToken') ||
      process.env.META_WEBHOOK_VERIFY_TOKEN ||
      'omnisocial_meta_social_verify_token';
  }

  verifyChallenge(mode?: string, token?: string, challenge?: string): string {
    if (mode === 'subscribe' && token === this.verifyToken && challenge) {
      this.logger.log('Meta Social Webhook subscription handshake verified successfully');
      return challenge;
    }
    this.logger.warn(`Meta Social Webhook handshake failed. Mode: ${mode}, Token matched: ${token === this.verifyToken}`);
    throw new ForbiddenException('Invalid webhook verification token or subscription mode');
  }

  verifySignature(rawBody: Buffer, signatureHeader?: string): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      this.logger.warn('Missing or malformed X-Hub-Signature-256 header on incoming Meta webhook');
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
        this.logger.error('Meta app secret is not configured; refusing to accept unverified webhooks in production.');
        throw new UnauthorizedException('Webhook verification secret is not configured on server.');
      }
      this.logger.warn('META_APP_SECRET is not configured. Webhook signature check bypassed in non-production mode.');
      return true;
    }

    const providedSignature = signatureHeader.substring(7);
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
      this.logger.error('Meta Social Webhook signature mismatch! Unauthorized or spoofed event.');
      throw new UnauthorizedException('Invalid webhook HMAC-SHA256 signature');
    }

    return true;
  }

  async processWebhookPayload(payload: any): Promise<{ processed: number; duplicates: number }> {
    if (!payload?.entry || !Array.isArray(payload.entry)) {
      return { processed: 0, duplicates: 0 };
    }

    let processedCount = 0;
    let duplicateCount = 0;

    for (const entry of payload.entry) {
      const entryId = entry.id; // Page ID or IG User ID
      const changes = entry.changes || [];

      for (const change of changes) {
        const field = change.field;
        const value = change.value;
        if (!value) continue;

        // Generate deterministic event ID for deduplication
        const eventId = `meta_${payload.object || 'obj'}_${entryId}_${field}_${value.comment_id || value.id || ''}_${value.created_time || entry.time || Date.now()}`;

        const existingEvent = await this.prisma.socialWebhookEvent.findUnique({
          where: { eventId },
        });

        if (existingEvent) {
          duplicateCount++;
          continue;
        }

        // Record webhook event log
        await this.prisma.socialWebhookEvent.create({
          data: {
            eventId,
            provider: payload.object === 'instagram' ? 'META_INSTAGRAM' : 'META_FACEBOOK',
            eventType: field,
            payload: change,
            status: 'PROCESSED',
          },
        });

        // Find associated social account
        const account = await this.prisma.socialAccount.findFirst({
          where: { providerAccountId: entryId },
        });

        if (!account) {
          this.logger.debug(`No connected social account matches entry [${entryId}]`);
          processedCount++;
          continue;
        }

        // Handle Facebook feed comment/reply
        if (field === 'feed' && (value.item === 'comment' || value.verb === 'add')) {
          const commentId = value.comment_id;
          const parentId = value.parent_id !== value.post_id ? value.parent_id : null;
          const isPageAuthor = value.from?.id === account.providerAccountId;

          await this.prisma.socialInteraction.upsert({
            where: {
              socialAccountId_externalInteractionId: {
                socialAccountId: account.id,
                externalInteractionId: commentId,
              },
            },
            create: {
              workspaceId: account.workspaceId,
              socialAccountId: account.id,
              platform: SocialPlatform.FACEBOOK,
              interactionType: parentId ? InteractionType.REPLY : InteractionType.COMMENT,
              externalInteractionId: commentId,
              parentExternalId: parentId,
              externalPostId: value.post_id,
              authorProviderId: value.from?.id || 'unknown_fb_user',
              authorName: value.from?.name || 'Facebook User',
              content: value.message || '',
              publishedAt: value.created_time ? new Date(value.created_time * 1000) : new Date(),
              isFromPageOrAccount: isPageAuthor,
              workflowStatus: 'OPEN',
              isRead: false,
              rawMetadata: value,
            },
            update: {
              content: value.message || '',
              rawMetadata: value,
            },
          });
          processedCount++;
        }

        // Handle Instagram comments
        if (field === 'comments') {
          const commentId = value.id;
          const parentId = value.parent_id || null;
          const isAccountAuthor = Boolean(
            account.accountUsername &&
              value.from?.username?.toLowerCase() === account.accountUsername.toLowerCase(),
          );

          await this.prisma.socialInteraction.upsert({
            where: {
              socialAccountId_externalInteractionId: {
                socialAccountId: account.id,
                externalInteractionId: commentId,
              },
            },
            create: {
              workspaceId: account.workspaceId,
              socialAccountId: account.id,
              platform: SocialPlatform.INSTAGRAM,
              interactionType: parentId ? InteractionType.REPLY : InteractionType.COMMENT,
              externalInteractionId: commentId,
              parentExternalId: parentId,
              externalPostId: value.media?.id || null,
              authorProviderId: value.from?.id || value.from?.username || 'instagram_user',
              authorName: value.from?.username || 'Instagram User',
              authorUsername: value.from?.username || null,
              content: value.text || '',
              publishedAt: new Date(),
              isFromPageOrAccount: isAccountAuthor,
              workflowStatus: 'OPEN',
              isRead: false,
              rawMetadata: value,
            },
            update: {
              content: value.text || '',
              rawMetadata: value,
            },
          });
          processedCount++;
        }

        // Handle Instagram mentions
        if (field === 'mentions') {
          const mentionId = value.comment_id || value.media_id;
          if (mentionId) {
            await this.prisma.socialInteraction.upsert({
              where: {
                socialAccountId_externalInteractionId: {
                  socialAccountId: account.id,
                  externalInteractionId: mentionId,
                },
              },
              create: {
                workspaceId: account.workspaceId,
                socialAccountId: account.id,
                platform: SocialPlatform.INSTAGRAM,
                interactionType: InteractionType.MENTION,
                externalInteractionId: mentionId,
                parentExternalId: null,
                externalPostId: value.media_id || null,
                authorProviderId: 'instagram_user',
                authorName: 'Instagram User',
                authorUsername: null,
                content: 'Mentioned your account in a post or comment',
                publishedAt: new Date(),
                isFromPageOrAccount: false,
                workflowStatus: 'OPEN',
                isRead: false,
                rawMetadata: value,
              },
              update: {
                rawMetadata: value,
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
