import { Injectable, Logger } from '@nestjs/common';
import { ScheduledPostTarget, SocialAccount, AttemptOutcome } from '@prisma/client';
import { ScheduledPostContentSnapshot, SocialPlatform } from '@packages/shared';
import { SocialPublisher, PublishResult, VerifyPostResult } from './social-publisher.interface';

@Injectable()
export class YouTubePublisherService implements SocialPublisher {
  private readonly logger = new Logger(YouTubePublisherService.name);

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult> {
    this.logger.log(`Publishing to YouTube channel [${account.id}] (${account.accountName})`);

    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === SocialPlatform.YOUTUBE) ||
      snapshot.variants[0];

    const title = (variant?.headline || snapshot.title || 'New Video Update').slice(0, 100);
    const description = this.buildDescription(variant).slice(0, 5000);

    if (decryptedToken.startsWith('mock_')) {
      const mockVideoId = `mock_yt_${Date.now()}`;
      return {
        success: true,
        externalPostId: mockVideoId,
        externalPostUrl: `https://www.youtube.com/watch?v=${mockVideoId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: { id: mockVideoId, title, description },
      };
    }

    try {
      const res = await fetch(
        'https://www.googleapis.com/youtube/v3/videos?part=snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              title,
              description,
              tags: (variant?.hashtags || []).map((h: string) => h.replace(/^#/, '')),
              categoryId: '22',
            },
            status: {
              privacyStatus: 'public',
            },
          }),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          outcome: AttemptOutcome.DEFINITIVE_FAILURE,
          sanitizedErrorCode: `YOUTUBE_API_${res.status}`,
          sanitizedErrorMessage: errorText.slice(0, 300),
        };
      }

      const data = await res.json();
      const videoId = data.id || `yt_${Date.now()}`;
      return {
        success: true,
        externalPostId: videoId,
        externalPostUrl: `https://www.youtube.com/watch?v=${videoId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`YouTube publishing error: ${err.message}`, err.stack);
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'YOUTUBE_NETWORK_ERROR',
        sanitizedErrorMessage: err.message,
      };
    }
  }

  async verifyExistingPost(): Promise<VerifyPostResult> {
    return { found: false };
  }

  private buildDescription(variant: any): string {
    if (!variant) return '';
    let text = variant.body || '';
    if (variant.callToAction) text += `\n\n${variant.callToAction}`;
    if (variant.linkUrl) text += `\n${variant.linkUrl}`;
    if (variant.hashtags?.length) text += `\n\n${variant.hashtags.join(' ')}`;
    return text.trim();
  }
}
