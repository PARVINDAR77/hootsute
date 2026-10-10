import { SocialAccount, SocialInteraction, SocialPlatform, InteractionType } from '@prisma/client';

export interface NormalizedInboundInteraction {
  externalInteractionId: string;
  platform: SocialPlatform;
  interactionType: InteractionType;
  parentExternalId?: string | null;
  externalPostId?: string | null;
  externalPostUrl?: string | null;
  authorProviderId: string;
  authorName: string;
  authorUsername?: string | null;
  authorProfileUrl?: string | null;
  content: string;
  publishedAt: Date;
  isFromPageOrAccount: boolean;
  rawMetadata?: Record<string, any>;
}

export type ReplyOutcome =
  | 'SUCCESS'
  | 'DEFINITIVE_FAILURE'
  | 'AMBIGUOUS_TIMEOUT'
  | 'AUTH_FAILURE'
  | 'RATE_LIMITED'
  | 'PERMISSION_DENIED';

export interface InboxReplyResult {
  success: boolean;
  outcome: ReplyOutcome;
  externalReplyId?: string | null;
  sanitizedErrorCode?: string | null;
  sanitizedErrorMessage?: string | null;
  rawResponse?: Record<string, any> | null;
}

export interface FetchInteractionsResult {
  items: NormalizedInboundInteraction[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface PermissionHealth {
  canRead: boolean;
  canReply: boolean;
  missingScopes: string[];
  warningMessage?: string | null;
}

export interface CheckReplyStatusResult {
  status: 'CONFIRMED_SENT' | 'CONFIRMED_NOT_SENT' | 'AMBIGUOUS' | 'UNSUPPORTED';
  externalReplyId?: string | null;
  reason?: string;
  canRetry?: boolean;
}

export interface SocialInboxAdapter {
  fetchRecentInteractions(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; cursor?: string; limit?: number },
  ): Promise<FetchInteractionsResult>;

  postReply(
    account: SocialAccount,
    decryptedToken: string,
    parentInteraction: SocialInteraction,
    replyContent: string,
  ): Promise<InboxReplyResult>;

  checkPermissionHealth(account: SocialAccount): PermissionHealth;

  checkReplyStatus?(
    account: SocialAccount,
    decryptedToken: string,
    parentInteraction: SocialInteraction,
    replyContent: string,
    publishedAfter?: Date,
  ): Promise<CheckReplyStatusResult>;
}
