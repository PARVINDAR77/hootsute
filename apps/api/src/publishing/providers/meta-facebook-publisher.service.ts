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
export class MetaFacebookPublisherService implements SocialPublisher {
  private readonly logger = new Logger(MetaFacebookPublisherService.name);
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
    const pageId = account.providerAccountId;
    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === 'FACEBOOK') ||
      snapshot.variants[0];

    const messageText = this.buildPostMessage(variant);

    try {
      if (variant?.mediaAssetUrl) {
        // Photo publish endpoint
        const photoUrl = `https://graph.facebook.com/${this.apiVersion}/${pageId}/photos`;
        const res = await fetch(photoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: variant.mediaAssetUrl,
            caption: messageText,
            access_token: decryptedToken,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || data?.error) {
          return this.classifyError(data?.error, res.status);
        }

        const externalPostId = data.post_id || data.id;
        const externalPostUrl = `https://www.facebook.com/${externalPostId}`;

        return {
          success: true,
          externalPostId,
          externalPostUrl,
          outcome: AttemptOutcome.SUCCESS,
          rawResponse: { id: data.id, post_id: data.post_id },
        };
      } else {
        // Plain text or link feed publish endpoint
        const feedUrl = `https://graph.facebook.com/${this.apiVersion}/${pageId}/feed`;
        const res = await fetch(feedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            link: variant?.linkUrl || undefined,
            access_token: decryptedToken,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || data?.error) {
          return this.classifyError(data?.error, res.status);
        }

        const externalPostId = data.id;
        const externalPostUrl = `https://www.facebook.com/${externalPostId}`;

        return {
          success: true,
          externalPostId,
          externalPostUrl,
          outcome: AttemptOutcome.SUCCESS,
          rawResponse: { id: data.id },
        };
      }
    } catch (err: any) {
      this.logger.error(`Network or transport failure publishing to Facebook: ${err.message}`);
      // Ambiguous outcome if network timed out after request was sent
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'NETWORK_TIMEOUT',
        sanitizedErrorMessage: 'Network timeout during provider request dispatch',
      };
    }
  }

  async verifyExistingPost(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<VerifyPostResult> {
    const pageId = account.providerAccountId;
    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === 'FACEBOOK') ||
      snapshot.variants[0];

    const expectedText = this.buildPostMessage(variant).trim();

    try {
      const feedUrl = `https://graph.facebook.com/${this.apiVersion}/${pageId}/feed?limit=10&fields=id,message,created_time,permalink_url&access_token=${decryptedToken}`;
      const res = await fetch(feedUrl);
      const data = await res.json();

      if (res.ok && Array.isArray(data?.data)) {
        for (const item of data.data) {
          if (item.message && item.message.trim() === expectedText) {
            const createdTime = item.created_time ? new Date(item.created_time) : new Date();
            // Disregard historical posts published prior to target creation (prevents false matches on repeated captions)
            if (target.createdAt && createdTime < new Date(new Date(target.createdAt).getTime() - 15 * 60 * 1000)) {
              continue;
            }
            return {
              found: true,
              externalPostId: item.id,
              externalPostUrl: item.permalink_url || `https://www.facebook.com/${item.id}`,
              postedAt: createdTime,
            };
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Verification check failed on Facebook: ${err.message}`);
    }

    return { found: false };
  }

  private buildPostMessage(variant: any): string {
    if (!variant) return '';
    let msg = '';
    if (variant.headline) {
      msg += `${variant.headline}\n\n`;
    }
    msg += variant.body;
    if (variant.callToAction) {
      msg += `\n\n👉 ${variant.callToAction}`;
    }
    if (variant.hashtags?.length) {
      msg += `\n\n${variant.hashtags.join(' ')}`;
    }
    return msg;
  }

  private classifyError(error: any, statusCode: number): PublishResult {
    const code = error?.code;
    const subcode = error?.error_subcode;
    const message = error?.message || 'Meta API error occurred';

    // OAuth token expiry or revocation (190, subcodes 458, 460, 463, 467)
    if (code === 190 || [458, 460, 463, 467].includes(subcode)) {
      return {
        success: false,
        outcome: AttemptOutcome.AUTH_FAILURE,
        sanitizedErrorCode: 'TOKEN_REVOKED_OR_EXPIRED',
        sanitizedErrorMessage: 'Facebook Page access token is expired or revoked. Please reconnect account.',
      };
    }

    // Rate limiting (code 4, 17, 32)
    if (code === 4 || code === 17 || code === 32 || statusCode === 429) {
      return {
        success: false,
        outcome: AttemptOutcome.RATE_LIMITED,
        sanitizedErrorCode: 'META_RATE_LIMIT',
        sanitizedErrorMessage: 'Facebook publishing rate limit reached. Retrying with backoff.',
      };
    }

    return {
      success: false,
      outcome: AttemptOutcome.DEFINITIVE_FAILURE,
      sanitizedErrorCode: `META_ERR_${code || statusCode}`,
      sanitizedErrorMessage: message.slice(0, 300),
    };
  }
}
