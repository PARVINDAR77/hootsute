import { Injectable, Logger } from '@nestjs/common';
import { ScheduledPostTarget, SocialAccount, AttemptOutcome } from '@prisma/client';
import { ScheduledPostContentSnapshot, SocialPlatform } from '@packages/shared';
import { SocialPublisher, PublishResult, VerifyPostResult } from './social-publisher.interface';

@Injectable()
export class PinterestPublisherService implements SocialPublisher {
  private readonly logger = new Logger(PinterestPublisherService.name);

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult> {
    this.logger.log(`Publishing Pin for Pinterest account [${account.id}] (@${account.accountUsername})`);

    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === SocialPlatform.PINTEREST) ||
      snapshot.variants[0];

    const title = (variant?.headline || snapshot.title || 'New Pin').slice(0, 100);
    const description = this.buildDescription(variant).slice(0, 500);

    if (decryptedToken.startsWith('mock_')) {
      const mockPinId = `mock_pin_${Date.now()}`;
      return {
        success: true,
        externalPostId: mockPinId,
        externalPostUrl: `https://www.pinterest.com/pin/${mockPinId}/`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: { id: mockPinId, title, description },
      };
    }

    try {
      const metadata = (account.metadata as Record<string, any>) || {};
      const boardId = metadata.defaultBoardId || metadata.boardId;

      const payload: Record<string, any> = {
        title,
        description,
        ...(boardId ? { board_id: boardId } : {}),
        ...(variant?.linkUrl ? { link: variant.linkUrl } : {}),
        ...(variant?.mediaAssetUrl
          ? {
              media_source: {
                source_type: 'image_url',
                url: variant.mediaAssetUrl,
              },
            }
          : {}),
      };

      const res = await fetch('https://api.pinterest.com/v5/pins', {
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
          sanitizedErrorCode: `PINTEREST_API_${res.status}`,
          sanitizedErrorMessage: errorText.slice(0, 300),
        };
      }

      const data = await res.json();
      const pinId = data.id || `pin_${Date.now()}`;
      return {
        success: true,
        externalPostId: pinId,
        externalPostUrl: `https://www.pinterest.com/pin/${pinId}/`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`Pinterest publishing error: ${err.message}`, err.stack);
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'PINTEREST_NETWORK_ERROR',
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
    if (variant.hashtags?.length) text += `\n\n${variant.hashtags.join(' ')}`;
    return text.trim();
  }
}
