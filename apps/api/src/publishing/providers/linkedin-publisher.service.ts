import { Injectable, Logger } from '@nestjs/common';
import {
  ScheduledPostTarget,
  SocialAccount,
  AttemptOutcome,
} from '@prisma/client';
import { ScheduledPostContentSnapshot, SocialAccountType, SocialPlatform } from '@packages/shared';
import { SocialPublisher, PublishResult, VerifyPostResult } from './social-publisher.interface';

@Injectable()
export class LinkedInPublisherService implements SocialPublisher {
  private readonly logger = new Logger(LinkedInPublisherService.name);

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult> {
    this.logger.log(`Publishing to LinkedIn [${account.accountType}] for account [${account.id}]`);

    const variant =
      snapshot.variants.find((v) => v.id === target.variantId) ||
      snapshot.variants.find((v) => v.platform === SocialPlatform.LINKEDIN) ||
      snapshot.variants[0];

    const messageText = this.buildPostMessage(variant);

    // In mock/test environments
    if (decryptedToken.startsWith('mock_')) {
      const mockPostId = `urn:li:share:mock_${Date.now()}`;
      return {
        success: true,
        externalPostId: mockPostId,
        externalPostUrl: `https://www.linkedin.com/feed/update/${mockPostId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: { id: mockPostId, status: 'PUBLISHED', text: messageText },
      };
    }

    try {
      const isCompanyPage = account.accountType === SocialAccountType.LINKEDIN_PAGE;
      const authorUrn = isCompanyPage
        ? `urn:li:organization:${account.providerAccountId}`
        : `urn:li:person:${account.providerAccountId}`;

      const payload = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: messageText,
            },
            shareMediaCategory: variant?.mediaAssetUrl ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          outcome: AttemptOutcome.DEFINITIVE_FAILURE,
          sanitizedErrorCode: `LINKEDIN_API_${res.status}`,
          sanitizedErrorMessage: errorText.slice(0, 300),
        };
      }

      const data = await res.json();
      const externalId = data.id || `urn:li:share:${Date.now()}`;

      return {
        success: true,
        externalPostId: externalId,
        externalPostUrl: `https://www.linkedin.com/feed/update/${externalId}`,
        outcome: AttemptOutcome.SUCCESS,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`LinkedIn publishing network error: ${err.message}`, err.stack);
      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'LINKEDIN_NETWORK_ERROR',
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
