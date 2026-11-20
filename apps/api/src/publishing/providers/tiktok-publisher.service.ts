import { Injectable, Logger } from '@nestjs/common';
import { ScheduledPostTarget, SocialAccount, AttemptOutcome } from '@prisma/client';
import { ScheduledPostContentSnapshot, SocialPlatform } from '@packages/shared';
import { SocialPublisher, PublishResult, VerifyPostResult } from './social-publisher.interface';

@Injectable()
export class TikTokPublisherService implements SocialPublisher {
  private readonly logger = new Logger(TikTokPublisherService.name);

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult> {
    this.logger.log(`Publishing to TikTok account [${account.id}] (@${account.accountUsername})`);

    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === SocialPlatform.TIKTOK) ||
      snapshot.variants[0];

    const caption = this.buildCaption(variant).slice(0, 2200);

    if (decryptedToken.startsWith('mock_')) {
      const mockPublishId = `mock_tt_${Date.now()}`;
      return {
        success: true,
        externalPostId: mockPublishId,
        externalPostUrl: `https://www.tiktok.com/@${account.accountUsername || 'brand'}/video/${mockPublishId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: { publish_id: mockPublishId, caption },
      };
    }

    try {
      const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title: caption,
            privacy_level: 'PUBLIC_TO_EVERYONE',
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: variant?.mediaAssetUrl || '',
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          outcome: AttemptOutcome.DEFINITIVE_FAILURE,
          sanitizedErrorCode: `TIKTOK_API_${res.status}`,
          sanitizedErrorMessage: errorText.slice(0, 300),
        };
      }

      const data = await res.json();
      const publishId = data.data?.publish_id || `tt_${Date.now()}`;
      return {
        success: true,
        externalPostId: publishId,
        externalPostUrl: `https://www.tiktok.com/@${account.accountUsername || 'brand'}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`TikTok publishing error: ${err.message}`, err.stack);
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'TIKTOK_NETWORK_ERROR',
        sanitizedErrorMessage: err.message,
      };
    }
  }

  async verifyExistingPost(): Promise<VerifyPostResult> {
    return { found: false };
  }

  private buildCaption(variant: any): string {
    if (!variant) return '';
    let text = variant.headline ? `${variant.headline}\n` : '';
    text += variant.body || '';
    if (variant.hashtags?.length) text += `\n\n${variant.hashtags.join(' ')}`;
    return text.trim();
  }
}
