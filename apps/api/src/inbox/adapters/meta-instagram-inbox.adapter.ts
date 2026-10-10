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
export class MetaInstagramInboxAdapter implements SocialInboxAdapter {
  private readonly logger = new Logger(MetaInstagramInboxAdapter.name);
  private readonly apiVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.apiVersion = this.configService.get<string>('META_API_VERSION') || 'v21.0';
  }

  checkPermissionHealth(account: SocialAccount): PermissionHealth {
    const scopes = account.grantedScopes || [];
    const hasBasic = scopes.includes('instagram_basic');
    const hasManageComments = scopes.includes('instagram_manage_comments');

    const canRead = hasBasic && hasManageComments;
    const canReply = hasManageComments;

    const missingScopes: string[] = [];
    if (!hasBasic) missingScopes.push('instagram_basic');
    if (!hasManageComments) missingScopes.push('instagram_manage_comments');

    let warningMessage: string | null = null;
    if (!hasManageComments) {
      warningMessage = 'Reauthorization required: "instagram_manage_comments" scope needed to manage Instagram comments.';
    } else if (!hasBasic) {
      warningMessage = 'Permission missing: "instagram_basic" required to read Instagram profile and media.';
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
    const igUserId = account.providerAccountId;
    const limit = options?.limit || 20;

    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${igUserId}/media`);
    url.searchParams.set(
      'fields',
      'id,caption,timestamp,permalink,comments.limit(50){id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}}',
    );
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('access_token', decryptedToken);

    if (options?.cursor) {
      url.searchParams.set('after', options.cursor);
    }
    if (options?.since) {
      url.searchParams.set('since', String(Math.floor(options.since.getTime() / 1000)));
    }

    const items: NormalizedInboundInteraction[] = [];

    try {
      const res = await fetch(url.toString(), { method: 'GET' });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        this.logger.warn(`Failed to fetch Instagram media comments: ${data?.error?.message || res.statusText}`);
      } else {
        const mediaList = data?.data || [];
        for (const media of mediaList) {
          const mediaId = media.id;
          const mediaUrl = media.permalink || null;
          const comments = media.comments?.data || [];

          for (const comment of comments) {
            if (!comment.id) continue;
            const isAccountAuthor = Boolean(
              account.accountUsername &&
                comment.username?.toLowerCase() === account.accountUsername.toLowerCase(),
            );

            items.push({
              externalInteractionId: comment.id,
              platform: SocialPlatform.INSTAGRAM,
              interactionType: InteractionType.COMMENT,
              parentExternalId: null,
              externalPostId: mediaId,
              externalPostUrl: mediaUrl,
              authorProviderId: comment.username || 'instagram_user',
              authorName: comment.username || 'Instagram User',
              authorUsername: comment.username || null,
              authorProfileUrl: comment.username ? `https://instagram.com/${comment.username}` : null,
              content: comment.text || '',
              publishedAt: comment.timestamp ? new Date(comment.timestamp) : new Date(),
              isFromPageOrAccount: isAccountAuthor,
              rawMetadata: {
                likeCount: comment.like_count || 0,
                mediaId,
              },
            });

            // Process nested replies
            const replies = comment.replies?.data || [];
            for (const reply of replies) {
              if (!reply.id) continue;
              const isReplyAccountAuthor = Boolean(
                account.accountUsername &&
                  reply.username?.toLowerCase() === account.accountUsername.toLowerCase(),
              );

              items.push({
                externalInteractionId: reply.id,
                platform: SocialPlatform.INSTAGRAM,
                interactionType: InteractionType.REPLY,
                parentExternalId: comment.id,
                externalPostId: mediaId,
                externalPostUrl: mediaUrl,
                authorProviderId: reply.username || 'instagram_user',
                authorName: reply.username || 'Instagram User',
                authorUsername: reply.username || null,
                authorProfileUrl: reply.username ? `https://instagram.com/${reply.username}` : null,
                content: reply.text || '',
                publishedAt: reply.timestamp ? new Date(reply.timestamp) : new Date(),
                isFromPageOrAccount: isReplyAccountAuthor,
                rawMetadata: {
                  likeCount: reply.like_count || 0,
                  parentCommentId: comment.id,
                  mediaId,
                },
              });
            }
          }
        }
      }

      // Also try fetching mentioned comments if possible
      try {
        const mentionsUrl = new URL(`https://graph.facebook.com/${this.apiVersion}/${igUserId}/mentioned_comments`);
        mentionsUrl.searchParams.set('fields', 'id,text,timestamp,media{id,permalink}');
        mentionsUrl.searchParams.set('limit', '10');
        mentionsUrl.searchParams.set('access_token', decryptedToken);

        const mentionsRes = await fetch(mentionsUrl.toString(), { method: 'GET' });
        const mentionsData = await mentionsRes.json().catch(() => null);

        if (mentionsRes.ok && mentionsData?.data) {
          for (const mention of mentionsData.data) {
            if (!mention.id) continue;
            // Avoid duplicate if already collected
            if (items.some((i) => i.externalInteractionId === mention.id)) continue;

            items.push({
              externalInteractionId: mention.id,
              platform: SocialPlatform.INSTAGRAM,
              interactionType: InteractionType.MENTION,
              parentExternalId: null,
              externalPostId: mention.media?.id || null,
              externalPostUrl: mention.media?.permalink || null,
              authorProviderId: 'instagram_user',
              authorName: 'Instagram User',
              authorUsername: null,
              authorProfileUrl: null,
              content: mention.text || '',
              publishedAt: mention.timestamp ? new Date(mention.timestamp) : new Date(),
              isFromPageOrAccount: false,
              rawMetadata: {
                isMention: true,
                mediaId: mention.media?.id,
              },
            });
          }
        }
      } catch (mentionErr: any) {
        this.logger.debug(`Instagram mentioned_comments edge not available: ${mentionErr.message}`);
      }

      const nextCursor = data?.paging?.cursors?.after || null;
      return {
        items,
        nextCursor,
        hasMore: Boolean(nextCursor && items.length > 0),
      };
    } catch (err: any) {
      this.logger.error(`Error connecting to Instagram Graph API for inbox: ${err.message}`);
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
          'Account lacks "instagram_manage_comments" permission. Reauthorization required to post replies.',
      };
    }

    const targetCommentId = parentInteraction.externalInteractionId;
    const url = `https://graph.facebook.com/${this.apiVersion}/${targetCommentId}/replies`;

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
        this.logger.warn(`Instagram reply timeout for comment [${targetCommentId}]: outcome ambiguous`);
        return {
          success: false,
          outcome: 'AMBIGUOUS_TIMEOUT',
          sanitizedErrorCode: 'REQUEST_TIMEOUT',
          sanitizedErrorMessage:
            'Request to Instagram timed out after submission. Outcome is ambiguous; reconciliation required.',
        };
      }

      this.logger.error(`Network error submitting Instagram reply: ${err.message}`);
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
    const message = error?.message || 'Meta Instagram API reply failure';

    if (code === 190 || [458, 460, 463, 467].includes(subcode)) {
      return {
        success: false,
        outcome: 'AUTH_FAILURE',
        sanitizedErrorCode: 'TOKEN_REVOKED_OR_EXPIRED',
        sanitizedErrorMessage: 'Instagram access token is expired or revoked. Please reconnect the account.',
      };
    }

    if (code === 200 || code === 10 || code === 298) {
      return {
        success: false,
        outcome: 'PERMISSION_DENIED',
        sanitizedErrorCode: 'PERMISSION_DENIED',
        sanitizedErrorMessage: 'Instagram account lacks required permissions to reply to this interaction.',
      };
    }

    if (code === 4 || code === 17 || code === 32 || statusCode === 429) {
      return {
        success: false,
        outcome: 'RATE_LIMITED',
        sanitizedErrorCode: 'RATE_LIMITED',
        sanitizedErrorMessage: 'Instagram API rate limit reached. Please back off before attempting further replies.',
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
    const targetCommentId = parentInteraction.externalInteractionId;
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${targetCommentId}/replies`);
    url.searchParams.set('fields', 'id,text,timestamp,from,username');
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
          reason: data?.error?.message || 'Error checking Instagram replies edge',
        };
      }

      const replies: any[] = data?.data || [];
      const match = replies.find((r: any) => {
        return (r.text || '').trim() === replyContent.trim();
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
