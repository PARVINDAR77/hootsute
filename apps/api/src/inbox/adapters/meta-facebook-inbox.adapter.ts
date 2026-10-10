import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAccount, SocialInteraction, SocialPlatform, InteractionType } from '@prisma/client';
import {
  SocialInboxAdapter,
  FetchInteractionsResult,
  NormalizedInboundInteraction,
  InboxReplyResult,
  PermissionHealth,
} from '../interfaces/social-inbox-adapter.interface';

@Injectable()
export class MetaFacebookInboxAdapter implements SocialInboxAdapter {
  private readonly logger = new Logger(MetaFacebookInboxAdapter.name);
  private readonly apiVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.apiVersion = this.configService.get<string>('META_API_VERSION') || 'v21.0';
  }

  checkPermissionHealth(account: SocialAccount): PermissionHealth {
    const scopes = account.grantedScopes || [];
    const canRead = scopes.includes('pages_read_engagement');
    const canReply = scopes.includes('pages_manage_engagement') || scopes.includes('pages_manage_posts');

    const missingScopes: string[] = [];
    if (!canRead) missingScopes.push('pages_read_engagement');
    if (!canReply) missingScopes.push('pages_manage_engagement');

    let warningMessage: string | null = null;
    if (!canReply && canRead) {
      warningMessage = 'Read-only access: Reauthorization required with "pages_manage_engagement" to post replies.';
    } else if (!canRead) {
      warningMessage = 'Permission missing: "pages_read_engagement" required to read Page comments.';
    }

    return {
      canRead,
      canReply,
      missingScopes,
      warningMessage,
    };
  }

  async fetchRecentInteractions(
    account: SocialAccount,
    decryptedToken: string,
    options?: { since?: Date; cursor?: string; limit?: number },
  ): Promise<FetchInteractionsResult> {
    const pageId = account.providerAccountId;
    const limit = options?.limit || 20;

    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${pageId}/feed`);
    url.searchParams.set(
      'fields',
      'id,message,created_time,permalink_url,comments.limit(50){id,message,from,created_time,parent,like_count,comments.limit(25){id,message,from,created_time,from,parent,like_count}}',
    );
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('access_token', decryptedToken);

    if (options?.cursor) {
      url.searchParams.set('after', options.cursor);
    }
    if (options?.since) {
      url.searchParams.set('since', String(Math.floor(options.since.getTime() / 1000)));
    }

    try {
      const res = await fetch(url.toString(), { method: 'GET' });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        this.logger.warn(`Failed to fetch Facebook Page feed: ${data?.error?.message || res.statusText}`);
        return { items: [], nextCursor: null, hasMore: false };
      }

      const items: NormalizedInboundInteraction[] = [];
      const posts = data?.data || [];

      for (const post of posts) {
        const postId = post.id;
        const postUrl = post.permalink_url || `https://www.facebook.com/${postId}`;
        const topComments = post.comments?.data || [];

        for (const comment of topComments) {
          if (!comment.id) continue;

          const isPageAuthor = comment.from?.id === pageId;
          items.push({
            externalInteractionId: comment.id,
            platform: SocialPlatform.FACEBOOK,
            interactionType: InteractionType.COMMENT,
            parentExternalId: null,
            externalPostId: postId,
            externalPostUrl: postUrl,
            authorProviderId: comment.from?.id || 'unknown_fb_user',
            authorName: comment.from?.name || 'Facebook User',
            authorUsername: null,
            authorProfileUrl: null,
            content: comment.message || '',
            publishedAt: comment.created_time ? new Date(comment.created_time) : new Date(),
            isFromPageOrAccount: isPageAuthor,
            rawMetadata: {
              likeCount: comment.like_count || 0,
              postId,
            },
          });

          // Check nested replies
          const subReplies = comment.comments?.data || [];
          for (const reply of subReplies) {
            if (!reply.id) continue;
            const isReplyPageAuthor = reply.from?.id === pageId;
            items.push({
              externalInteractionId: reply.id,
              platform: SocialPlatform.FACEBOOK,
              interactionType: InteractionType.REPLY,
              parentExternalId: comment.id,
              externalPostId: postId,
              externalPostUrl: postUrl,
              authorProviderId: reply.from?.id || 'unknown_fb_user',
              authorName: reply.from?.name || 'Facebook User',
              authorUsername: null,
              authorProfileUrl: null,
              content: reply.message || '',
              publishedAt: reply.created_time ? new Date(reply.created_time) : new Date(),
              isFromPageOrAccount: isReplyPageAuthor,
              rawMetadata: {
                likeCount: reply.like_count || 0,
                parentCommentId: comment.id,
                postId,
              },
            });
          }
        }
      }

      const nextCursor = data?.paging?.cursors?.after || null;
      return {
        items,
        nextCursor,
        hasMore: Boolean(nextCursor && items.length > 0),
      };
    } catch (err: any) {
      this.logger.error(`Error connecting to Facebook Graph API for inbox: ${err.message}`);
      return { items: [], nextCursor: null, hasMore: false };
    }
  }

  async postReply(
    account: SocialAccount,
    decryptedToken: string,
    parentInteraction: SocialInteraction,
    replyContent: string,
  ): Promise<InboxReplyResult> {
    const health = this.checkPermissionHealth(account);
    if (!health.canReply) {
      return {
        success: false,
        outcome: 'PERMISSION_DENIED',
        sanitizedErrorCode: 'INSUFFICIENT_PERMISSIONS',
        sanitizedErrorMessage:
          'Account lacks "pages_manage_engagement" permission. Reauthorization required to post replies.',
      };
    }

    const targetCommentId = parentInteraction.externalInteractionId;
    const url = `https://graph.facebook.com/${this.apiVersion}/${targetCommentId}/comments`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyContent,
          access_token: decryptedToken,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        return this.classifyReplyError(data?.error, res.status);
      }

      return {
        success: true,
        outcome: 'SUCCESS',
        externalReplyId: data?.id || null,
        rawResponse: { id: data?.id },
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        this.logger.warn(`Reply timeout for comment [${targetCommentId}]: outcome ambiguous`);
        return {
          success: false,
          outcome: 'AMBIGUOUS_TIMEOUT',
          sanitizedErrorCode: 'REQUEST_TIMEOUT',
          sanitizedErrorMessage:
            'Request to Meta timed out after submission. Outcome is ambiguous; reconciliation required.',
        };
      }

      this.logger.error(`Network error submitting Facebook reply: ${err.message}`);
      return {
        success: false,
        outcome: 'AMBIGUOUS_TIMEOUT',
        sanitizedErrorCode: 'NETWORK_FAILURE',
        sanitizedErrorMessage: `Communication failure during reply submission: ${err.message}`,
      };
    }
  }

  private classifyReplyError(error: any, statusCode: number): InboxReplyResult {
    const code = error?.code;
    const subcode = error?.error_subcode;
    const message = error?.message || 'Meta API reply failure';

    if (code === 190 || [458, 460, 463, 467].includes(subcode)) {
      return {
        success: false,
        outcome: 'AUTH_FAILURE',
        sanitizedErrorCode: 'TOKEN_REVOKED_OR_EXPIRED',
        sanitizedErrorMessage: 'Page access token is expired or revoked. Please reconnect the Facebook Page.',
      };
    }

    if (code === 200 || code === 10 || code === 298) {
      return {
        success: false,
        outcome: 'PERMISSION_DENIED',
        sanitizedErrorCode: 'PERMISSION_DENIED',
        sanitizedErrorMessage: 'Facebook Page lacks required permissions to reply to this interaction.',
      };
    }

    if (code === 4 || code === 17 || code === 32 || statusCode === 429) {
      return {
        success: false,
        outcome: 'RATE_LIMITED',
        sanitizedErrorCode: 'RATE_LIMITED',
        sanitizedErrorMessage: 'Meta API rate limit reached. Please back off before attempting further replies.',
      };
    }

    return {
      success: false,
      outcome: 'DEFINITIVE_FAILURE',
      sanitizedErrorCode: `META_ERR_${code || 'UNKNOWN'}`,
      sanitizedErrorMessage: message,
      rawResponse: { code, subcode, message },
    };
  }

  async checkReplyStatus(
    account: SocialAccount,
    decryptedToken: string,
    parentInteraction: SocialInteraction,
    replyContent: string,
    publishedAfter?: Date,
  ): Promise<import('../interfaces/social-inbox-adapter.interface').CheckReplyStatusResult> {
    const pageId = account.providerAccountId;
    const targetCommentId = parentInteraction.externalInteractionId;
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${targetCommentId}/comments`);
    url.searchParams.set('fields', 'id,message,created_time,from');
    url.searchParams.set('limit', '25');
    url.searchParams.set('access_token', decryptedToken);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url.toString(), { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) {
        return {
          status: 'AMBIGUOUS',
          reason: data?.error?.message || 'Error checking Facebook comment replies edge',
        };
      }

      const comments: any[] = data?.data || [];
      const match = comments.find((c: any) => {
        const isFromPage = c.from?.id === pageId;
        const textMatch = (c.message || '').trim() === replyContent.trim();
        return isFromPage && textMatch;
      });

      if (match) {
        return {
          status: 'CONFIRMED_SENT',
          externalReplyId: match.id,
        };
      }

      // Protect against Meta eventual consistency: if attempt is younger than 60s, do not assume absence
      const attemptAgeMs = publishedAfter ? Math.max(0, Date.now() - new Date(publishedAfter).getTime()) : 90_000;
      if (attemptAgeMs < 60_000) {
        return {
          status: 'AMBIGUOUS',
          reason: 'Reply not visible on edge yet; within provider eventual consistency window (< 60s).',
        };
      }

      return {
        status: 'CONFIRMED_NOT_SENT',
        canRetry: true,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      return {
        status: 'AMBIGUOUS',
        reason: err.message,
      };
    }
  }
}
