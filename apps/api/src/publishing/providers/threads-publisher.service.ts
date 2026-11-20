import { Injectable, Logger } from '@nestjs/common';
import { ScheduledPostTarget, SocialAccount, AttemptOutcome } from '@prisma/client';
import { ScheduledPostContentSnapshot, SocialPlatform } from '@packages/shared';
import { SocialPublisher, PublishResult, VerifyPostResult } from './social-publisher.interface';

@Injectable()
export class ThreadsPublisherService implements SocialPublisher {
  private readonly logger = new Logger(ThreadsPublisherService.name);

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult> {
    this.logger.log(`Publishing to Threads profile [${account.id}] (@${account.accountUsername})`);

    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === SocialPlatform.THREADS) ||
      snapshot.variants[0];

    const text = this.buildMessage(variant);

    if (text.length > 500) {
      return {
        success: false,
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'THREADS_CHARACTER_LIMIT_EXCEEDED',
        sanitizedErrorMessage: `Threads post exceeds the 500-character maximum limit (${text.length} characters).`,
      };
    }

    if (decryptedToken.startsWith('mock_')) {
      const mockThreadId = `mock_threads_${Date.now()}`;
      return {
        success: true,
        externalPostId: mockThreadId,
        externalPostUrl: `https://www.threads.net/@${account.accountUsername || 'brand'}/post/${mockThreadId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: { id: mockThreadId, text },
      };
    }

    try {
      const userId = account.providerAccountId;
      const createParams = new URLSearchParams({
        media_type: variant?.mediaAssetUrl ? 'IMAGE' : 'TEXT',
        text,
        access_token: decryptedToken,
        ...(variant?.mediaAssetUrl ? { image_url: variant.mediaAssetUrl } : {}),
      });

      const createRes = await fetch(
        `https://graph.threads.net/v1.0/${userId}/threads?${createParams.toString()}`,
        { method: 'POST' },
      );

      if (!createRes.ok) {
        const errText = await createRes.text();
        return {
          success: false,
          outcome: AttemptOutcome.DEFINITIVE_FAILURE,
          sanitizedErrorCode: `THREADS_API_${createRes.status}`,
          sanitizedErrorMessage: errText.slice(0, 300),
        };
      }

      const container = await createRes.json();
      const publishRes = await fetch(
        `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${container.id}&access_token=${encodeURIComponent(
          decryptedToken,
        )}`,
        { method: 'POST' },
      );

      if (!publishRes.ok) {
        const errText = await publishRes.text();
        return {
          success: false,
          outcome: AttemptOutcome.DEFINITIVE_FAILURE,
          sanitizedErrorCode: `THREADS_PUBLISH_${publishRes.status}`,
          sanitizedErrorMessage: errText.slice(0, 300),
        };
      }

      const published = await publishRes.json();
      const postId = published.id || container.id || `threads_${Date.now()}`;
      return {
        success: true,
        externalPostId: postId,
        externalPostUrl: `https://www.threads.net/@${account.accountUsername || 'brand'}/post/${postId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: published,
      };
    } catch (err: any) {
      this.logger.error(`Threads publishing error: ${err.message}`, err.stack);
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'THREADS_NETWORK_ERROR',
        sanitizedErrorMessage: err.message,
      };
    }
  }

  async verifyExistingPost(): Promise<VerifyPostResult> {
    return { found: false };
  }

  private buildMessage(variant: any): string {
    if (!variant) return '';
    let msg = variant.headline ? `${variant.headline}\n\n` : '';
    msg += variant.body || '';
    if (variant.hashtags?.length) msg += `\n\n${variant.hashtags.join(' ')}`;
    return msg.trim();
  }
}
