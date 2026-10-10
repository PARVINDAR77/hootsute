import {
  ScheduledPostTarget,
  SocialAccount,
  AttemptOutcome,
} from '@prisma/client';
import { ScheduledPostContentSnapshot } from '@packages/shared';

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  externalPostUrl?: string;
  outcome: AttemptOutcome;
  sanitizedErrorCode?: string;
  sanitizedErrorMessage?: string;
  rawResponse?: Record<string, any>;
}

export interface VerifyPostResult {
  found: boolean;
  externalPostId?: string;
  externalPostUrl?: string;
  postedAt?: Date;
  sanitizedMetadata?: Record<string, any>;
}

export interface SocialPublisher {
  publish(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<PublishResult>;

  verifyExistingPost(
    target: ScheduledPostTarget,
    snapshot: ScheduledPostContentSnapshot,
    account: SocialAccount,
    decryptedToken: string,
  ): Promise<VerifyPostResult>;
}

export const SOCIAL_PUBLISHER = Symbol('SOCIAL_PUBLISHER');
