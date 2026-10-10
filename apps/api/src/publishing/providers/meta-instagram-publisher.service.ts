import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ScheduledPostTarget,
  SocialAccount,
  AttemptOutcome,
} from '@prisma/client';
import { ScheduledPostContentSnapshot } from '@packages/shared';
import {
  SocialPublisher,
  PublishResult,
  VerifyPostResult,
} from './social-publisher.interface';

@Injectable()
export class MetaInstagramPublisherService implements SocialPublisher {
  private readonly logger = new Logger(MetaInstagramPublisherService.name);
  private readonly apiVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.apiVersion = this.configService.get<string>('META_API_VERSION') || 'v21.0';
  }

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult> {
    const igUserId = account.providerAccountId;
    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === 'INSTAGRAM') ||
      snapshot.variants[0];

    // Instagram strictly requires a media asset (photo/video)
    if (!variant?.mediaAssetUrl) {
      return {
        success: false,
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'INSTAGRAM_MEDIA_REQUIRED',
        sanitizedErrorMessage: 'Instagram posts require a public media URL. Plain text posting is unsupported by Instagram Graph API.',
      };
    }

    const caption = this.buildCaption(variant);

    try {
      // Step 1: Create Instagram media container
      const containerUrl = `https://graph.facebook.com/${this.apiVersion}/${igUserId}/media`;
      const containerRes = await fetch(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: variant.mediaAssetUrl,
          caption,
          access_token: decryptedToken,
        }),
      });

      const containerData = await containerRes.json().catch(() => null);

      if (!containerRes.ok || containerData?.error) {
        return this.classifyError(containerData?.error, containerRes.status);
      }

      const creationId = containerData.id;

      // Step 2: Publish media container
      const publishUrl = `https://graph.facebook.com/${this.apiVersion}/${igUserId}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: decryptedToken,
        }),
      });

      const publishData = await publishRes.json().catch(() => null);

      if (!publishRes.ok || publishData?.error) {
        return this.classifyError(publishData?.error, publishRes.status);
      }

      const externalPostId = publishData.id;
      const externalPostUrl = `https://www.instagram.com/p/${externalPostId}/`;

      return {
        success: true,
        externalPostId,
        externalPostUrl,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: { id: publishData.id, creation_id: creationId },
      };
    } catch (err: any) {
      this.logger.error(`Network error during Instagram publish: ${err.message}`);
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'NETWORK_TIMEOUT',
        sanitizedErrorMessage: 'Network timeout during Instagram media publish',
      };
    }
  }

  async verifyExistingPost(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<VerifyPostResult> {
    const igUserId = account.providerAccountId;
    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === 'INSTAGRAM') ||
      snapshot.variants[0];

    const expectedCaption = this.buildCaption(variant).trim();

    try {
      const mediaListUrl = `https://graph.facebook.com/${this.apiVersion}/${igUserId}/media?limit=10&fields=id,caption,permalink,timestamp&access_token=${decryptedToken}`;
      const res = await fetch(mediaListUrl);
      const data = await res.json();

      if (res.ok && Array.isArray(data?.data)) {
        for (const item of data.data) {
          if (item.caption && item.caption.trim() === expectedCaption) {
            const postedTime = item.timestamp ? new Date(item.timestamp) : new Date();
            // Disregard historical posts published prior to target creation (prevents false matches on repeated captions)
            if (target.createdAt && postedTime < new Date(new Date(target.createdAt).getTime() - 15 * 60 * 1000)) {
              continue;
            }
            return {
              found: true,
              externalPostId: item.id,
              externalPostUrl: item.permalink || `https://www.instagram.com/p/${item.id}/`,
              postedAt: postedTime,
            };
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Instagram verification query error: ${err.message}`);
    }

    return { found: false };
  }

  private buildCaption(variant: any): string {
    if (!variant) return '';
    let caption = variant.body;
    if (variant.callToAction) {
      caption += `\n\n👉 ${variant.callToAction}`;
    }
    if (variant.hashtags?.length) {
      caption += `\n\n${variant.hashtags.join(' ')}`;
    }
    return caption;
  }

  private classifyError(error: any, statusCode: number): PublishResult {
    const code = error?.code;
    const subcode = error?.error_subcode;
    const message = error?.message || 'Instagram API error';

    // OAuth token error
    if (code === 190 || [458, 460, 463, 467].includes(subcode)) {
      return {
        success: false,
        outcome: AttemptOutcome.AUTH_FAILURE,
        sanitizedErrorCode: 'TOKEN_REVOKED_OR_EXPIRED',
        sanitizedErrorMessage: 'Instagram access token is expired or revoked. Please reconnect account.',
      };
    }

    // Daily limit or rate limit (Instagram max 50 posts per 24 hours)
    if (code === 4 || code === 17 || statusCode === 429 || message.includes('24-hour limit')) {
      return {
        success: false,
        outcome: AttemptOutcome.RATE_LIMITED,
        sanitizedErrorCode: 'INSTAGRAM_RATE_LIMIT',
        sanitizedErrorMessage: 'Instagram publish rate limit or 24-hour limit exceeded. Retrying later.',
      };
    }

    return {
      success: false,
      outcome: AttemptOutcome.DEFINITIVE_FAILURE,
      sanitizedErrorCode: `INSTAGRAM_ERR_${code || statusCode}`,
      sanitizedErrorMessage: message.slice(0, 300),
    };
  }
}
