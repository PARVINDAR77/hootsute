import { Injectable, Logger } from '@nestjs/common';
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

export type MockPublishBehavior =
  | 'SUCCESS'
  | 'AMBIGUOUS_TIMEOUT'
  | 'AUTH_FAILURE'
  | 'RATE_LIMITED'
  | 'DEFINITIVE_FAILURE';

@Injectable()
export class MockSocialPublisherService implements SocialPublisher {
  private readonly logger = new Logger(MockSocialPublisherService.name);

  public behavior: MockPublishBehavior = 'SUCCESS';
  public publishedCalls: {
    targetId: string;
    accountId: string;
    platform: string;
    timestamp: Date;
  }[] = [];

  private publishedPostsStore = new Map<string, { externalPostId: string; externalPostUrl: string }>();

  setBehavior(behavior: MockPublishBehavior) {
    this.behavior = behavior;
  }

  reset() {
    this.behavior = 'SUCCESS';
    this.publishedCalls = [];
    this.publishedPostsStore.clear();
  }

  async publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    _decryptedToken: string,
  ): Promise<PublishResult> {
    this.publishedCalls.push({
      targetId: target.id,
      accountId: account.id,
      platform: target.platform,
      timestamp: new Date(),
    });

    this.logger.log(
      `[MockPublisher] publish called for target [${target.id}], platform: [${target.platform}], behavior: [${this.behavior}]`,
    );

    if (this.behavior === 'AUTH_FAILURE') {
      return {
        success: false,
        outcome: AttemptOutcome.AUTH_FAILURE,
        sanitizedErrorCode: 'MOCK_TOKEN_EXPIRED',
        sanitizedErrorMessage: 'Mock access token expired or revoked',
      };
    }

    if (this.behavior === 'RATE_LIMITED') {
      return {
        success: false,
        outcome: AttemptOutcome.RATE_LIMITED,
        sanitizedErrorCode: 'MOCK_RATE_LIMITED',
        sanitizedErrorMessage: 'Mock rate limit reached (simulated 429)',
      };
    }

    if (this.behavior === 'DEFINITIVE_FAILURE') {
      return {
        success: false,
        outcome: AttemptOutcome.DEFINITIVE_FAILURE,
        sanitizedErrorCode: 'MOCK_VALIDATION_ERROR',
        sanitizedErrorMessage: 'Mock content failed platform validation rules',
      };
    }

    if (this.behavior === 'AMBIGUOUS_TIMEOUT') {
      // Simulate post being created on platform, but network timing out before return
      const fakeExternalId = `mock_ambiguous_${Date.now()}`;
      const fakeExternalUrl = `https://mock.platform.com/posts/${fakeExternalId}`;
      this.publishedPostsStore.set(target.id, {
        externalPostId: fakeExternalId,
        externalPostUrl: fakeExternalUrl,
      });

      return {
        success: false,
        outcome: AttemptOutcome.AMBIGUOUS_TIMEOUT,
        sanitizedErrorCode: 'NETWORK_TIMEOUT',
        sanitizedErrorMessage: 'Simulated socket timeout on provider publish',
      };
    }

    // Default SUCCESS
    const externalPostId = `mock_${target.platform.toLowerCase()}_${Date.now()}`;
    const externalPostUrl = `https://mock.${target.platform.toLowerCase()}.com/p/${externalPostId}`;

    this.publishedPostsStore.set(target.id, { externalPostId, externalPostUrl });

    return {
      success: true,
      externalPostId,
      externalPostUrl,
      outcome: AttemptOutcome.SUCCESS,
      rawResponse: { mock: true, id: externalPostId },
    };
  }

  async verifyExistingPost(
    target: ScheduledPostTarget,
    _snapshot: ScheduledPostContentSnapshot,
    _account: SocialAccount,
    _decryptedToken: string,
  ): Promise<VerifyPostResult> {
    const existing = this.publishedPostsStore.get(target.id);
    if (existing) {
      return {
        found: true,
        externalPostId: existing.externalPostId,
        externalPostUrl: existing.externalPostUrl,
        postedAt: new Date(),
      };
    }
    return { found: false };
  }
}
