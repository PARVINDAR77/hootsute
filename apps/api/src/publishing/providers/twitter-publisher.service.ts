import { Injectable, Logger } from '@nestjs/common';
import {
  ScheduledPostTarget,
  SocialAccount,
  AttemptOutcome,
} from '@prisma/client';
import { ScheduledPostContentSnapshot, SocialPlatform } from '@packages/shared';
import { SocialPublisher, PublishResult, VerifyPostResult } from './social-publisher.interface';

@Injectable()
export class TwitterPublisherService implements SocialPublisher {
  private readonly logger = new Logger(TwitterPublisherService.name);

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult> {
    this.logger.log(`Publishing Tweet for account [${account.id}] (@${account.accountUsername})`);

    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === SocialPlatform.TWITTER_X) ||
      snapshot.variants[0];

    const tweetText = this.buildPostMessage(variant);

    // Character limit verification (280 characters for standard tweet)
    if (tweetText.length > 280) {
      return {
        success: false,
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'TWITTER_CHARACTER_LIMIT_EXCEEDED',
        sanitizedErrorMessage: `Tweet caption exceeds the 280-character maximum limit (${tweetText.length} characters).`,
      };
    }

    // In mock/test environments
    if (decryptedToken.startsWith('mock_')) {
      const mockTweetId = `mock_tw_${Date.now()}`;
      return {
        success: true,
        externalPostId: mockTweetId,
        externalPostUrl: `https://twitter.com/${account.accountUsername || 'user'}/status/${mockTweetId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: { id: mockTweetId, text: tweetText },
      };
    }

    try {
      const payload: Record<string, any> = {
        text: tweetText,
      };

      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          outcome: AttemptOutcome.DEFINITIVE_FAILURE,
          sanitizedErrorCode: `TWITTER_API_${res.status}`,
          sanitizedErrorMessage: errorText.slice(0, 300),
        };
      }

      const data = await res.json();
      const tweetId = data.data?.id || `tw_${Date.now()}`;

      return {
        success: true,
        externalPostId: tweetId,
        externalPostUrl: `https://twitter.com/${account.accountUsername || 'user'}/status/${tweetId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`Twitter publishing error: ${err.message}`, err.stack);
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'TWITTER_NETWORK_ERROR',
        sanitizedErrorMessage: err.message,
      };
    }
  }

  async verifyExistingPost(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<VerifyPostResult> {
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
}
