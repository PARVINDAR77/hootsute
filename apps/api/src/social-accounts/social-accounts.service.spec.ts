import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAccountsService } from './social-accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenVaultService } from './token-vault/token-vault.service';
import { MetaOAuthService } from './providers/meta/meta-oauth.service';
import { LinkedInOAuthService } from './providers/linkedin/linkedin-oauth.service';
import { TwitterOAuthService } from './providers/twitter/twitter-oauth.service';
import {
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
} from '@packages/shared';
import * as crypto from 'crypto';

describe('SocialAccountsService', () => {
  let service: SocialAccountsService;
  let prisma: any;
  let tokenVault: any;
  let metaOAuth: any;
  let linkedinOAuth: any;
  let twitterOAuth: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      oAuthState: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      oAuthSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      socialAccount: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    tokenVault = {
      encrypt: jest.fn().mockImplementation((val) => `encrypted_${val}`),
      decrypt: jest.fn().mockImplementation((val) => val.replace('encrypted_', '')),
    };

    metaOAuth = {
      isConfigured: jest.fn().mockReturnValue(true),
      getAuthorizationUrl: jest.fn().mockReturnValue('https://facebook.com/dialog/oauth?sample'),
      handleOAuthCallback: jest.fn(),
    };

    linkedinOAuth = {
      generateAuthorizationUrl: jest.fn().mockReturnValue('https://linkedin.com/oauth/v2/authorization?sample'),
      exchangeCodeAndFetchAccounts: jest.fn(),
    };

    twitterOAuth = {
      generateAuthorizationUrl: jest.fn().mockReturnValue('https://twitter.com/i/oauth2/authorize?sample'),
      exchangeCodeAndFetchAccounts: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'META_OAUTH_REDIRECT_URI') return 'http://localhost:4000/api/v1/oauth/meta/callback';
        if (key === 'LINKEDIN_OAUTH_REDIRECT_URI') return 'http://localhost:4000/api/v1/oauth/linkedin/callback';
        if (key === 'TWITTER_OAUTH_REDIRECT_URI') return 'http://localhost:4000/api/v1/oauth/twitter/callback';
        if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialAccountsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TokenVaultService, useValue: tokenVault },
        { provide: MetaOAuthService, useValue: metaOAuth },
        { provide: LinkedInOAuthService, useValue: linkedinOAuth },
        { provide: TwitterOAuthService, useValue: twitterOAuth },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SocialAccountsService>(SocialAccountsService);
  });

  describe('initiateMetaOAuth', () => {
    it('should generate an OAuth state and return authorization URL', async () => {
      const result = await service.initiateMetaOAuth('ws-1', 'user-1');

      expect(result.authorizationUrl).toBe('https://facebook.com/dialog/oauth?sample');
      expect(result.state).toBeDefined();
      expect(result.state.length).toBe(64); // 32-byte hex
      expect(prisma.oAuthState.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'user-1',
          provider: SocialProvider.META_FACEBOOK,
        }),
      });
    });

    it('should throw BadRequestException if Meta credentials are not configured', async () => {
      metaOAuth.isConfigured.mockReturnValue(false);

      await expect(service.initiateMetaOAuth('ws-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handleMetaCallback', () => {
    it('should reject invalid or unknown state parameter', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue(null);

      await expect(service.handleMetaCallback('valid-code', 'unknown-state')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject reused OAuth state', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue({
        id: 'state-1',
        state: 'used-state',
        usedAt: new Date(),
      });

      await expect(service.handleMetaCallback('code', 'used-state')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject expired OAuth state', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue({
        id: 'state-1',
        state: 'expired-state',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // in the past
      });

      await expect(service.handleMetaCallback('code', 'expired-state')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should exchange code and create encrypted candidate session', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue({
        id: 'state-1',
        state: 'valid-state',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        workspaceId: 'ws-1',
        userId: 'user-1',
        redirectUri: 'http://localhost:4000/api/v1/oauth/meta/callback',
      });

      metaOAuth.handleOAuthCallback.mockResolvedValue({
        userAccessToken: 'short-tok',
        longLivedUserToken: 'long-tok',
        expiresAt: new Date(Date.now() + 86400000),
        grantedScopes: ['pages_show_list'],
        pages: [
          {
            id: 'page-123',
            name: 'Acme Media Page',
            pageAccessToken: 'page-token-secret-xyz',
          },
        ],
      });

      const res = await service.handleMetaCallback('code', 'valid-state');

      expect(res.redirectUrl).toContain('/settings/social-accounts/connect?session=');
      expect(prisma.oAuthState.update).toHaveBeenCalledWith({
        where: { id: 'state-1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.oAuthSession.create).toHaveBeenCalled();
      expect(tokenVault.encrypt).toHaveBeenCalled();
    });
  });

  describe('selectAccounts', () => {
    it('should reject selection if session is expired or consumed', async () => {
      prisma.oAuthSession.findUnique.mockResolvedValue({
        id: 'session-1',
        workspaceId: 'ws-1',
        userId: 'user-1',
        consumedAt: new Date(), // already consumed
      });

      await expect(
        service.selectAccounts('ws-1', 'user-1', {
          sessionToken: 'raw-token',
          selectedAccounts: [
            {
              providerAccountId: 'page-123',
              provider: SocialProvider.META_FACEBOOK,
              accountType: SocialAccountType.FACEBOOK_PAGE,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject selection if session workspace does not match (tenant isolation)', async () => {
      prisma.oAuthSession.findUnique.mockResolvedValue({
        id: 'session-1',
        workspaceId: 'other-ws',
        userId: 'user-1',
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60000),
      });

      await expect(
        service.selectAccounts('ws-1', 'user-1', {
          sessionToken: 'raw-token',
          selectedAccounts: [
            {
              providerAccountId: 'page-123',
              provider: SocialProvider.META_FACEBOOK,
              accountType: SocialAccountType.FACEBOOK_PAGE,
            },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should encrypt tokens, upsert SocialAccount, and write audit log', async () => {
      const candidatePayload = JSON.stringify({
        pages: [
          {
            id: 'page-123',
            name: 'Acme Official',
            username: 'acme_official',
            category: 'Retail',
            pageAccessToken: 'raw-page-access-token-999',
          },
        ],
        grantedScopes: ['pages_manage_posts'],
        expiresAt: null,
      });

      prisma.oAuthSession.findUnique.mockResolvedValue({
        id: 'session-1',
        workspaceId: 'ws-1',
        userId: 'user-1',
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        encryptedPayload: `encrypted_${candidatePayload}`,
      });

      prisma.socialAccount.upsert.mockResolvedValue({
        id: 'sa-1',
        workspaceId: 'ws-1',
        provider: SocialProvider.META_FACEBOOK,
        providerAccountId: 'page-123',
        accountName: 'Acme Official',
        accountUsername: 'acme_official',
        accountType: SocialAccountType.FACEBOOK_PAGE,
        connectionStatus: SocialConnectionStatus.CONNECTED,
        encryptedAccessToken: 'encrypted_raw-page-access-token-999',
        grantedScopes: ['pages_manage_posts'],
      });

      const result = await service.selectAccounts('ws-1', 'user-1', {
        sessionToken: 'raw-token',
        selectedAccounts: [
          {
            providerAccountId: 'page-123',
            provider: SocialProvider.META_FACEBOOK,
            accountType: SocialAccountType.FACEBOOK_PAGE,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.accounts.length).toBe(1);
      // Access tokens MUST be redacted from response
      expect((result.accounts[0] as any).encryptedAccessToken).toBeUndefined();

      expect(prisma.socialAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId_provider_providerAccountId: {
              workspaceId: 'ws-1',
              provider: SocialProvider.META_FACEBOOK,
              providerAccountId: 'page-123',
            },
          },
        }),
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          actorUserId: 'user-1',
          action: 'SOCIAL_ACCOUNT_CONNECT',
        }),
      });
    });
  });

  describe('disconnectAccount', () => {
    it('should reject disconnect if account belongs to different workspace', async () => {
      prisma.socialAccount.findUnique.mockResolvedValue({
        id: 'sa-1',
        workspaceId: 'ws-2', // different workspace
        accountName: 'Acme Page',
      });

      await expect(service.disconnectAccount('ws-1', 'sa-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete connection record and log audit event', async () => {
      prisma.socialAccount.findUnique.mockResolvedValue({
        id: 'sa-1',
        workspaceId: 'ws-1',
        accountName: 'Acme Page',
        provider: SocialProvider.META_FACEBOOK,
        providerAccountId: 'page-123',
        accountType: SocialAccountType.FACEBOOK_PAGE,
      });

      const res = await service.disconnectAccount('ws-1', 'sa-1', 'user-1');

      expect(res.success).toBe(true);
      expect(prisma.socialAccount.delete).toHaveBeenCalledWith({ where: { id: 'sa-1' } });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          actorUserId: 'user-1',
          action: 'SOCIAL_ACCOUNT_DISCONNECT',
        }),
      });
    });
  });

  describe('Multi-Network: LinkedIn OAuth & Selection', () => {
    it('should generate an OAuth state and return LinkedIn authorization URL', async () => {
      const result = await service.initiateLinkedInOAuth('ws-1', 'user-1');

      expect(result.authorizationUrl).toBe('https://linkedin.com/oauth/v2/authorization?sample');
      expect(result.state).toBeDefined();
      expect(result.provider).toBe(SocialProvider.LINKEDIN);
      expect(prisma.oAuthState.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'user-1',
          provider: SocialProvider.LINKEDIN,
        }),
      });
    });

    it('should handle LinkedIn callback, exchange tokens and save encrypted session', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue({
        id: 'state-li-1',
        state: 'valid-li-state',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        workspaceId: 'ws-1',
        userId: 'user-1',
        redirectUri: 'http://localhost:4000/api/v1/oauth/linkedin/callback',
      });

      linkedinOAuth.exchangeCodeAndFetchAccounts.mockResolvedValue({
        accessToken: 'li-access-token-secret',
        expiresIn: 3600,
        accounts: [
          {
            id: 'li-person-123',
            name: 'Jane Doe',
            username: 'janedoe',
            accountType: SocialAccountType.LINKEDIN_PROFILE,
            provider: SocialProvider.LINKEDIN,
          },
        ],
      });

      const res = await service.handleLinkedInCallback('li-auth-code', 'valid-li-state');

      expect(res.redirectUrl).toContain('/settings/social-accounts/connect?session=');
      expect(prisma.oAuthSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'user-1',
          provider: SocialProvider.LINKEDIN,
        }),
      });
    });

    it('should select and connect a LinkedIn account with encrypted token', async () => {
      const sessionToken = 'li-session-token';
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

      prisma.oAuthSession.findUnique.mockResolvedValue({
        id: 'session-li-1',
        sessionTokenHash,
        workspaceId: 'ws-1',
        userId: 'user-1',
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        encryptedPayload: 'encrypted_payload',
      });

      tokenVault.decrypt.mockReturnValue(
        JSON.stringify({
          accounts: [
            {
              id: 'li-person-123',
              name: 'Jane Doe',
              username: 'janedoe',
              category: 'Personal Profile',
              accountType: SocialAccountType.LINKEDIN_PROFILE,
              provider: SocialProvider.LINKEDIN,
            },
          ],
          accessToken: 'li-access-token-secret',
          grantedScopes: ['openid', 'profile', 'w_member_social'],
          expiresAt: null,
        }),
      );

      prisma.socialAccount.upsert.mockResolvedValue({
        id: 'sa-li-1',
        workspaceId: 'ws-1',
        provider: SocialProvider.LINKEDIN,
        providerAccountId: 'li-person-123',
        accountName: 'Jane Doe',
        accountType: SocialAccountType.LINKEDIN_PROFILE,
        encryptedAccessToken: 'encrypted_token',
      });

      const res = await service.selectAccounts('ws-1', 'user-1', {
        sessionToken,
        selectedAccounts: [
          {
            provider: SocialProvider.LINKEDIN,
            providerAccountId: 'li-person-123',
            accountType: SocialAccountType.LINKEDIN_PROFILE,
          },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.accounts.length).toBe(1);
      expect(prisma.socialAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId_provider_providerAccountId: {
              workspaceId: 'ws-1',
              provider: SocialProvider.LINKEDIN,
              providerAccountId: 'li-person-123',
            },
          },
        }),
      );
    });
  });

  describe('Multi-Network: Twitter / X OAuth & Selection', () => {
    it('should generate an OAuth state and return Twitter authorization URL', async () => {
      const result = await service.initiateTwitterOAuth('ws-1', 'user-1');

      expect(result.authorizationUrl).toBe('https://twitter.com/i/oauth2/authorize?sample');
      expect(result.state).toBeDefined();
      expect(result.provider).toBe(SocialProvider.TWITTER_X);
      expect(prisma.oAuthState.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'user-1',
          provider: SocialProvider.TWITTER_X,
        }),
      });
    });

    it('should handle Twitter callback, exchange tokens and save encrypted session', async () => {
      prisma.oAuthState.findUnique.mockResolvedValue({
        id: 'state-tw-1',
        state: 'valid-tw-state',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        workspaceId: 'ws-1',
        userId: 'user-1',
        redirectUri: 'http://localhost:4000/api/v1/oauth/twitter/callback',
      });

      twitterOAuth.exchangeCodeAndFetchAccounts.mockResolvedValue({
        accessToken: 'tw-access-token-secret',
        expiresIn: 7200,
        accounts: [
          {
            id: 'tw-user-789',
            name: 'Tech Brand (@techbrand)',
            username: 'techbrand',
            accountType: SocialAccountType.TWITTER_PROFILE,
            provider: SocialProvider.TWITTER_X,
          },
        ],
      });

      const res = await service.handleTwitterCallback('tw-auth-code', 'valid-tw-state');

      expect(res.redirectUrl).toContain('/settings/social-accounts/connect?session=');
      expect(prisma.oAuthSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'user-1',
          provider: SocialProvider.TWITTER_X,
        }),
      });
    });
  });
});
