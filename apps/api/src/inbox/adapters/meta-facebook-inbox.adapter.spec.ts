import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetaFacebookInboxAdapter } from './meta-facebook-inbox.adapter';
import { SocialAccount, SocialPlatform, SocialAccountType, SocialConnectionStatus } from '@prisma/client';

describe('MetaFacebookInboxAdapter', () => {
  let adapter: MetaFacebookInboxAdapter;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'META_API_VERSION') return 'v21.0';
      return defaultValue;
    }),
  };

  const sampleAccount: SocialAccount = {
    id: 'acc-fb-1',
    workspaceId: 'ws-1',
    provider: 'META_FACEBOOK',
    providerAccountId: 'page-12345',
    accountName: 'Acme Brand Page',
    accountUsername: 'acmebrand',
    accountType: SocialAccountType.FACEBOOK_PAGE,
    profileImageUrl: 'https://cdn.example.com/page.jpg',
    connectionStatus: SocialConnectionStatus.CONNECTED,
    encryptedAccessToken: 'encrypted:token',
    grantedScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_engagement'],
    tokenExpiresAt: new Date(Date.now() + 86400000),
    lastValidatedAt: new Date(),
    connectedByUserId: 'user-1',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaFacebookInboxAdapter,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    adapter = module.get<MetaFacebookInboxAdapter>(MetaFacebookInboxAdapter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkPermissionHealth', () => {
    it('returns healthy when both read and reply scopes are granted', () => {
      const health = adapter.checkPermissionHealth(sampleAccount);
      expect(health.canRead).toBe(true);
      expect(health.canReply).toBe(true);
      expect(health.missingScopes).toHaveLength(0);
      expect(health.warningMessage).toBeNull();
    });

    it('identifies missing pages_manage_engagement and sets read-only warning', () => {
      const readOnlyAccount = {
        ...sampleAccount,
        grantedScopes: ['pages_show_list', 'pages_read_engagement'],
      };
      const health = adapter.checkPermissionHealth(readOnlyAccount);
      expect(health.canRead).toBe(true);
      expect(health.canReply).toBe(false);
      expect(health.missingScopes).toContain('pages_manage_engagement');
      expect(health.warningMessage).toContain('Read-only access');
    });

    it('identifies missing pages_read_engagement scope', () => {
      const noReadAccount = {
        ...sampleAccount,
        grantedScopes: ['pages_show_list'],
      };
      const health = adapter.checkPermissionHealth(noReadAccount);
      expect(health.canRead).toBe(false);
      expect(health.canReply).toBe(false);
      expect(health.missingScopes).toContain('pages_read_engagement');
    });
  });

  describe('fetchRecentInteractions', () => {
    it('parses Facebook posts and comments into normalized interaction items', async () => {
      const mockApiResponse = {
        data: [
          {
            id: 'post-101',
            message: 'Check out our new launch!',
            created_time: '2026-10-09T10:00:00+0000',
            permalink_url: 'https://facebook.com/101',
            comments: {
              data: [
                {
                  id: 'comment-201',
                  message: 'What is the price?',
                  created_time: '2026-10-09T10:15:00+0000',
                  like_count: 3,
                  from: { id: 'user-999', name: 'Jane Doe' },
                  comments: {
                    data: [
                      {
                        id: 'reply-301',
                        message: 'Price is $49!',
                        created_time: '2026-10-09T10:20:00+0000',
                        from: { id: 'page-12345', name: 'Acme Brand Page' }, // Page author
                        like_count: 1,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
        paging: { cursors: { after: 'cursor_xyz' } },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as any);

      const result = await adapter.fetchRecentInteractions(sampleAccount, 'decrypted-token');

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('cursor_xyz');

      // Top comment
      const commentItem = result.items[0];
      expect(commentItem.externalInteractionId).toBe('comment-201');
      expect(commentItem.interactionType).toBe('COMMENT');
      expect(commentItem.authorName).toBe('Jane Doe');
      expect(commentItem.isFromPageOrAccount).toBe(false);
      expect(commentItem.content).toBe('What is the price?');

      // Reply
      const replyItem = result.items[1];
      expect(replyItem.externalInteractionId).toBe('reply-301');
      expect(replyItem.interactionType).toBe('REPLY');
      expect(replyItem.parentExternalId).toBe('comment-201');
      expect(replyItem.isFromPageOrAccount).toBe(true);
      expect(replyItem.content).toBe('Price is $49!');
    });
  });

  describe('postReply', () => {
    it('blocks reply when pages_manage_engagement permission is missing', async () => {
      const readOnlyAccount = {
        ...sampleAccount,
        grantedScopes: ['pages_read_engagement'],
      };

      const result = await adapter.postReply(
        readOnlyAccount,
        'decrypted-token',
        { id: 'int-1', externalInteractionId: 'comment-201' } as any,
        'Thank you!',
      );

      expect(result.success).toBe(false);
      expect(result.outcome).toBe('PERMISSION_DENIED');
      expect(result.sanitizedErrorCode).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('submits reply and returns SUCCESS when provider confirms publish', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'reply-new-999' }),
      } as any);

      const result = await adapter.postReply(
        sampleAccount,
        'decrypted-token',
        { id: 'int-1', externalInteractionId: 'comment-201' } as any,
        'Thank you for reaching out!',
      );

      expect(result.success).toBe(true);
      expect(result.outcome).toBe('SUCCESS');
      expect(result.externalReplyId).toBe('reply-new-999');
    });

    it('classifies token expiration as AUTH_FAILURE', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Session has expired',
            code: 190,
            error_subcode: 463,
          },
        }),
      } as any);

      const result = await adapter.postReply(
        sampleAccount,
        'decrypted-token',
        { id: 'int-1', externalInteractionId: 'comment-201' } as any,
        'Thank you!',
      );

      expect(result.success).toBe(false);
      expect(result.outcome).toBe('AUTH_FAILURE');
      expect(result.sanitizedErrorCode).toBe('TOKEN_REVOKED_OR_EXPIRED');
    });
  });
});
