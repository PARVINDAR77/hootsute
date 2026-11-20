import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TokenVaultService } from './token-vault/token-vault.service';
import { MetaOAuthService } from './providers/meta/meta-oauth.service';
import { LinkedInOAuthService } from './providers/linkedin/linkedin-oauth.service';
import { TwitterOAuthService } from './providers/twitter/twitter-oauth.service';
import { PinterestOAuthService } from './providers/pinterest/pinterest-oauth.service';
import { YouTubeOAuthService } from './providers/youtube/youtube-oauth.service';
import { TikTokOAuthService } from './providers/tiktok/tiktok-oauth.service';
import { ThreadsOAuthService } from './providers/threads/threads-oauth.service';
import {
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
  CandidateSocialAccount,
} from '@packages/shared';
import { SelectAccountsDto } from './dto/select-accounts.dto';
import { MetaPageCandidate } from './providers/meta/meta-provider.interface';
import * as crypto from 'crypto';

interface SessionDecryptedPayload {
  pages?: MetaPageCandidate[];
  accounts?: CandidateSocialAccount[];
  accessToken?: string;
  grantedScopes: string[];
  expiresAt: string | null;
}

@Injectable()
export class SocialAccountsService {
  private readonly logger = new Logger(SocialAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenVaultService: TokenVaultService,
    private readonly metaOAuthService: MetaOAuthService,
    private readonly linkedinOAuthService: LinkedInOAuthService,
    private readonly twitterOAuthService: TwitterOAuthService,
    private readonly configService: ConfigService,
    @Optional() private readonly pinterestOAuthService?: PinterestOAuthService,
    @Optional() private readonly youtubeOAuthService?: YouTubeOAuthService,
    @Optional() private readonly tiktokOAuthService?: TikTokOAuthService,
    @Optional() private readonly threadsOAuthService?: ThreadsOAuthService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Initiates Meta OAuth 2.0 flow:
   * Generates secure single-use state, saves state to DB, and returns authorization URL.
   */
  async initiateMetaOAuth(workspaceId: string, userId: string, customRedirectUri?: string) {
    if (!this.metaOAuthService.isConfigured()) {
      throw new BadRequestException(
        'Meta integration is not configured. Please configure META_APP_ID and META_APP_SECRET in the server environment.',
      );
    }

    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const serverRedirectUri =
      customRedirectUri ||
      this.configService.get<string>('META_OAUTH_REDIRECT_URI') ||
      'http://localhost:4000/api/v1/oauth/meta/callback';

    await this.prisma.oAuthState.create({
      data: {
        state,
        workspaceId,
        userId,
        provider: SocialProvider.META_FACEBOOK,
        redirectUri: serverRedirectUri,
        expiresAt,
      },
    });

    const authorizationUrl = this.metaOAuthService.getAuthorizationUrl(state, serverRedirectUri);

    this.logger.log(`Initiated Meta OAuth for workspace [${workspaceId}] user [${userId}]`);

    return {
      authorizationUrl,
      state,
      provider: SocialProvider.META_FACEBOOK,
      expiresAt,
    };
  }

  /**
   * Handles incoming OAuth callback from Meta dialog:
   * Validates state, exchanges code for long-lived tokens, discovers accounts,
   * stores encrypted candidate session, and returns redirect URL.
   */
  async handleMetaCallback(code: string, state: string) {
    const stateRecord = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!stateRecord) {
      throw new BadRequestException('Invalid or unknown OAuth state parameter');
    }

    if (stateRecord.usedAt) {
      throw new BadRequestException('OAuth state has already been used');
    }

    if (stateRecord.expiresAt < new Date()) {
      throw new BadRequestException('OAuth state has expired');
    }

    // Atomically mark state as used
    await this.prisma.oAuthState.update({
      where: { id: stateRecord.id },
      data: { usedAt: new Date() },
    });

    // Exchange code with Meta Graph API
    const metaResult = await this.metaOAuthService.handleOAuthCallback(
      code,
      stateRecord.redirectUri,
    );

    // Create an encrypted candidate session so access tokens are never in client memory
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(sessionToken);

    const payload: SessionDecryptedPayload = {
      pages: metaResult.pages,
      grantedScopes: metaResult.grantedScopes,
      expiresAt: metaResult.expiresAt ? metaResult.expiresAt.toISOString() : null,
    };

    const encryptedPayload = this.tokenVaultService.encrypt(JSON.stringify(payload));
    const sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes to pick accounts

    await this.prisma.oAuthSession.create({
      data: {
        sessionTokenHash,
        workspaceId: stateRecord.workspaceId,
        userId: stateRecord.userId,
        provider: SocialProvider.META_FACEBOOK,
        encryptedPayload,
        expiresAt: sessionExpiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/settings/social-accounts/connect?session=${sessionToken}&workspaceId=${stateRecord.workspaceId}`;

    return { redirectUrl, sessionToken, workspaceId: stateRecord.workspaceId };
  }

  /**
   * Initiates LinkedIn OAuth 2.0 flow:
   * Generates secure single-use state, saves state to DB, and returns authorization URL.
   */
  async initiateLinkedInOAuth(workspaceId: string, userId: string, customRedirectUri?: string) {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const serverRedirectUri =
      customRedirectUri ||
      this.configService.get<string>('LINKEDIN_OAUTH_REDIRECT_URI') ||
      'http://localhost:4000/api/v1/oauth/linkedin/callback';

    await this.prisma.oAuthState.create({
      data: {
        state,
        workspaceId,
        userId,
        provider: SocialProvider.LINKEDIN,
        redirectUri: serverRedirectUri,
        expiresAt,
      },
    });

    const authorizationUrl = this.linkedinOAuthService.generateAuthorizationUrl(state, serverRedirectUri);

    this.logger.log(`Initiated LinkedIn OAuth for workspace [${workspaceId}] user [${userId}]`);

    return {
      authorizationUrl,
      state,
      provider: SocialProvider.LINKEDIN,
      expiresAt,
    };
  }

  /**
   * Handles incoming OAuth callback from LinkedIn:
   */
  async handleLinkedInCallback(code: string, state: string) {
    const stateRecord = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!stateRecord) {
      throw new BadRequestException('Invalid or unknown OAuth state parameter');
    }

    if (stateRecord.usedAt) {
      throw new BadRequestException('OAuth state has already been used');
    }

    if (stateRecord.expiresAt < new Date()) {
      throw new BadRequestException('OAuth state has expired');
    }

    await this.prisma.oAuthState.update({
      where: { id: stateRecord.id },
      data: { usedAt: new Date() },
    });

    const liResult = await this.linkedinOAuthService.exchangeCodeAndFetchAccounts(
      code,
      stateRecord.redirectUri,
    );

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(sessionToken);

    const expiresAt = liResult.expiresIn
      ? new Date(Date.now() + liResult.expiresIn * 1000).toISOString()
      : null;

    const payload: SessionDecryptedPayload = {
      accounts: liResult.accounts,
      accessToken: liResult.accessToken,
      grantedScopes: ['openid', 'profile', 'email', 'w_member_social'],
      expiresAt,
    };

    const encryptedPayload = this.tokenVaultService.encrypt(JSON.stringify(payload));
    const sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.oAuthSession.create({
      data: {
        sessionTokenHash,
        workspaceId: stateRecord.workspaceId,
        userId: stateRecord.userId,
        provider: SocialProvider.LINKEDIN,
        encryptedPayload,
        expiresAt: sessionExpiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/settings/social-accounts/connect?session=${sessionToken}&workspaceId=${stateRecord.workspaceId}`;

    return { redirectUrl, sessionToken, workspaceId: stateRecord.workspaceId };
  }

  /**
   * Initiates Twitter / X OAuth 2.0 flow:
   */
  async initiateTwitterOAuth(workspaceId: string, userId: string, customRedirectUri?: string) {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const serverRedirectUri =
      customRedirectUri ||
      this.configService.get<string>('TWITTER_OAUTH_REDIRECT_URI') ||
      'http://localhost:4000/api/v1/oauth/twitter/callback';

    await this.prisma.oAuthState.create({
      data: {
        state,
        workspaceId,
        userId,
        provider: SocialProvider.TWITTER_X,
        redirectUri: serverRedirectUri,
        expiresAt,
      },
    });

    const authorizationUrl = this.twitterOAuthService.generateAuthorizationUrl(state, serverRedirectUri);

    this.logger.log(`Initiated Twitter OAuth for workspace [${workspaceId}] user [${userId}]`);

    return {
      authorizationUrl,
      state,
      provider: SocialProvider.TWITTER_X,
      expiresAt,
    };
  }

  /**
   * Handles incoming OAuth callback from Twitter / X:
   */
  async handleTwitterCallback(code: string, state: string) {
    const stateRecord = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!stateRecord) {
      throw new BadRequestException('Invalid or unknown OAuth state parameter');
    }

    if (stateRecord.usedAt) {
      throw new BadRequestException('OAuth state has already been used');
    }

    if (stateRecord.expiresAt < new Date()) {
      throw new BadRequestException('OAuth state has expired');
    }

    await this.prisma.oAuthState.update({
      where: { id: stateRecord.id },
      data: { usedAt: new Date() },
    });

    const twResult = await this.twitterOAuthService.exchangeCodeAndFetchAccounts(
      code,
      stateRecord.redirectUri,
    );

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(sessionToken);

    const expiresAt = twResult.expiresIn
      ? new Date(Date.now() + twResult.expiresIn * 1000).toISOString()
      : null;

    const payload: SessionDecryptedPayload = {
      accounts: twResult.accounts,
      accessToken: twResult.accessToken,
      grantedScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      expiresAt,
    };

    const encryptedPayload = this.tokenVaultService.encrypt(JSON.stringify(payload));
    const sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.oAuthSession.create({
      data: {
        sessionTokenHash,
        workspaceId: stateRecord.workspaceId,
        userId: stateRecord.userId,
        provider: SocialProvider.TWITTER_X,
        encryptedPayload,
        expiresAt: sessionExpiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/settings/social-accounts/connect?session=${sessionToken}&workspaceId=${stateRecord.workspaceId}`;

    return { redirectUrl, sessionToken, workspaceId: stateRecord.workspaceId };
  }

  /**
   * Retrieves available candidate accounts for selection:
   * Strips all raw access tokens and annotates which accounts are already connected.
   */
  async getCandidateAccounts(workspaceId: string, sessionToken: string, userId: string) {
    const sessionTokenHash = this.hashToken(sessionToken);

    const session = await this.prisma.oAuthSession.findUnique({
      where: { sessionTokenHash },
    });

    if (!session) {
      throw new NotFoundException('Invalid or expired OAuth selection session');
    }

    if (session.workspaceId !== workspaceId) {
      throw new ForbiddenException('OAuth session does not belong to this workspace');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('OAuth session was initiated by a different user');
    }

    if (session.consumedAt) {
      throw new BadRequestException('This selection session has already been completed');
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Selection session has expired. Please reauthorize.');
    }

    const decryptedJson = this.tokenVaultService.decrypt(session.encryptedPayload);
    const payload: SessionDecryptedPayload = JSON.parse(decryptedJson);

    // Check which accounts are currently active in this workspace
    const existingAccounts = await this.prisma.socialAccount.findMany({
      where: {
        workspaceId,
        connectionStatus: SocialConnectionStatus.CONNECTED,
      },
      select: { providerAccountId: true, provider: true },
    });

    const existingSet = new Set(
      existingAccounts.map((a) => `${a.provider}:${a.providerAccountId}`),
    );

    const candidates: CandidateSocialAccount[] = [];

    if (payload.pages && Array.isArray(payload.pages)) {
      for (const page of payload.pages) {
        // Facebook Page Candidate
        candidates.push({
          id: page.id,
          name: page.name,
          username: page.username || null,
          category: page.category || null,
          accountType: SocialAccountType.FACEBOOK_PAGE,
          provider: SocialProvider.META_FACEBOOK,
          profileImageUrl: null,
          tasks: page.tasks,
          isAlreadyConnected: existingSet.has(`${SocialProvider.META_FACEBOOK}:${page.id}`),
          instagramBusinessAccount: page.instagramBusinessAccount
            ? {
                id: page.instagramBusinessAccount.id,
                name: page.instagramBusinessAccount.name,
                username: page.instagramBusinessAccount.username,
                profilePictureUrl: page.instagramBusinessAccount.profilePictureUrl || null,
              }
            : null,
        });

        // If page has a connected Instagram Professional account, add it as a separate candidate
        if (page.instagramBusinessAccount) {
          const ig = page.instagramBusinessAccount;
          candidates.push({
            id: ig.id,
            name: ig.name,
            username: ig.username,
            category: 'Instagram Business',
            accountType: SocialAccountType.INSTAGRAM_BUSINESS,
            provider: SocialProvider.META_INSTAGRAM,
            profileImageUrl: ig.profilePictureUrl || null,
            isAlreadyConnected: existingSet.has(`${SocialProvider.META_INSTAGRAM}:${ig.id}`),
            instagramBusinessAccount: null,
          });
        }
      }
    } else if (payload.accounts && Array.isArray(payload.accounts)) {
      for (const acc of payload.accounts) {
        candidates.push({
          ...acc,
          isAlreadyConnected: existingSet.has(`${acc.provider}:${acc.id}`),
        });
      }
    }

    return {
      workspaceId,
      expiresAt: session.expiresAt,
      accounts: candidates,
    };
  }

  /**
   * Persists user-selected accounts:
   * Encrypts the individual access token with AES-256-GCM, upserts into SocialAccount,
   * invalidates session token, and records audit event.
   */
  async selectAccounts(workspaceId: string, userId: string, dto: SelectAccountsDto) {
    if (!dto.selectedAccounts || dto.selectedAccounts.length === 0) {
      throw new BadRequestException('Please select at least one social media account to connect');
    }

    const sessionTokenHash = this.hashToken(dto.sessionToken);
    const session = await this.prisma.oAuthSession.findUnique({
      where: { sessionTokenHash },
    });

    if (!session) {
      throw new NotFoundException('Invalid or expired selection session');
    }

    if (session.workspaceId !== workspaceId) {
      throw new ForbiddenException('OAuth session does not belong to this workspace');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('OAuth session was initiated by a different user');
    }

    if (session.consumedAt) {
      throw new BadRequestException('Selection session has already been consumed');
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Selection session has expired');
    }

    // Decrypt the payload containing actual page access tokens
    const decryptedJson = this.tokenVaultService.decrypt(session.encryptedPayload);
    const payload: SessionDecryptedPayload = JSON.parse(decryptedJson);

    const connectedAccounts = [];

    // Process each selected account
    for (const item of dto.selectedAccounts) {
      let tokenToEncrypt: string | null = null;
      let accountName = '';
      let accountUsername: string | null = null;
      let profileImageUrl: string | null = null;
      let metadata: any = {};

      if (item.accountType === SocialAccountType.FACEBOOK_PAGE) {
        const page = payload.pages?.find((p) => p.id === item.providerAccountId);
        if (!page) {
          throw new BadRequestException(`Facebook Page [${item.providerAccountId}] not found in authorization session`);
        }
        tokenToEncrypt = page.pageAccessToken;
        accountName = page.name;
        accountUsername = page.username || null;
        metadata = { category: page.category, tasks: page.tasks };
      } else if (item.accountType === SocialAccountType.INSTAGRAM_BUSINESS) {
        const pageWithIg = payload.pages?.find(
          (p) => p.instagramBusinessAccount?.id === item.providerAccountId,
        );
        if (!pageWithIg || !pageWithIg.instagramBusinessAccount) {
          throw new BadRequestException(
            `Instagram Business account [${item.providerAccountId}] not found in authorization session`,
          );
        }
        tokenToEncrypt = pageWithIg.pageAccessToken;
        accountName = pageWithIg.instagramBusinessAccount.name;
        accountUsername = pageWithIg.instagramBusinessAccount.username;
        profileImageUrl = pageWithIg.instagramBusinessAccount.profilePictureUrl || null;
        metadata = { linkedFacebookPageId: pageWithIg.id, linkedFacebookPageName: pageWithIg.name };
      } else if (
        item.accountType === SocialAccountType.LINKEDIN_PAGE ||
        item.accountType === SocialAccountType.LINKEDIN_PROFILE ||
        item.accountType === SocialAccountType.TWITTER_PROFILE ||
        item.accountType === SocialAccountType.PINTEREST_BUSINESS ||
        item.accountType === SocialAccountType.YOUTUBE_CHANNEL ||
        item.accountType === SocialAccountType.TIKTOK_BUSINESS ||
        item.accountType === SocialAccountType.TIKTOK_CREATOR ||
        item.accountType === SocialAccountType.THREADS_PROFILE
      ) {
        const found = payload.accounts?.find((a) => a.id === item.providerAccountId);
        if (!found) {
          throw new BadRequestException(
            `Account [${item.providerAccountId}] not found in authorization session`,
          );
        }
        tokenToEncrypt = payload.accessToken || null;
        accountName = found.name;
        accountUsername = found.username || null;
        profileImageUrl = found.profileImageUrl || null;
        metadata = { category: found.category };
      }

      if (!tokenToEncrypt) {
        throw new BadRequestException('Missing credential for selected account');
      }

      const encryptedAccessToken = this.tokenVaultService.encrypt(tokenToEncrypt);
      const tokenExpiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;

      // Upsert into SocialAccount (guaranteeing unique constraint per workspace, provider, providerAccountId)
      const saved = await this.prisma.socialAccount.upsert({
        where: {
          workspaceId_provider_providerAccountId: {
            workspaceId,
            provider: item.provider,
            providerAccountId: item.providerAccountId,
          },
        },
        create: {
          workspaceId,
          provider: item.provider,
          providerAccountId: item.providerAccountId,
          accountName,
          accountUsername,
          accountType: item.accountType,
          profileImageUrl,
          connectionStatus: SocialConnectionStatus.CONNECTED,
          encryptedAccessToken,
          grantedScopes: payload.grantedScopes,
          tokenExpiresAt,
          lastValidatedAt: new Date(),
          connectedByUserId: userId,
          metadata,
        },
        update: {
          accountName,
          accountUsername,
          profileImageUrl,
          connectionStatus: SocialConnectionStatus.CONNECTED,
          encryptedAccessToken,
          grantedScopes: payload.grantedScopes,
          tokenExpiresAt,
          lastValidatedAt: new Date(),
          connectedByUserId: userId,
          metadata,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          workspaceId,
          actorUserId: userId,
          action: 'SOCIAL_ACCOUNT_CONNECT',
          entityType: 'SocialAccount',
          entityId: saved.id,
          metadata: {
            provider: saved.provider,
            accountType: saved.accountType,
            accountName: saved.accountName,
            providerAccountId: saved.providerAccountId,
          },
        },
      });

      // Exclude encrypted token from response
      const { encryptedAccessToken: _, ...safeAccount } = saved;
      connectedAccounts.push(safeAccount);
    }

    // Mark session as consumed
    await this.prisma.oAuthSession.update({
      where: { id: session.id },
      data: { consumedAt: new Date() },
    });

    this.logger.log(
      `Successfully connected ${connectedAccounts.length} social accounts to workspace [${workspaceId}]`,
    );

    return {
      success: true,
      message: `Successfully connected ${connectedAccounts.length} account(s)`,
      accounts: connectedAccounts,
    };
  }

  /**
   * Lists connected social accounts for an authorized workspace.
   * Access tokens are strictly excluded.
   */
  async listAccounts(workspaceId: string) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workspaceId: true,
        provider: true,
        providerAccountId: true,
        accountName: true,
        accountUsername: true,
        accountType: true,
        profileImageUrl: true,
        connectionStatus: true,
        grantedScopes: true,
        tokenExpiresAt: true,
        lastValidatedAt: true,
        connectedByUserId: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    });

    return accounts;
  }

  /**
   * Disconnects a social account from a workspace:
   * Enforces tenant boundary and deletes the connection record.
   */
  async disconnectAccount(workspaceId: string, accountId: string, actorUserId: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.workspaceId !== workspaceId) {
      throw new NotFoundException('Social account not found in this workspace');
    }

    await this.prisma.$transaction([
      this.prisma.socialAccount.delete({
        where: { id: accountId },
      }),
      this.prisma.auditLog.create({
        data: {
          workspaceId,
          actorUserId,
          action: 'SOCIAL_ACCOUNT_DISCONNECT',
          entityType: 'SocialAccount',
          entityId: accountId,
          metadata: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accountName: account.accountName,
            accountType: account.accountType,
          },
        },
      }),
    ]);

    this.logger.log(`Disconnected account [${accountId}] '${account.accountName}' from workspace [${workspaceId}]`);

    return {
      success: true,
      message: `Successfully disconnected ${account.accountName}`,
    };
  }

  /**
   * Reconnects an account: generates a fresh OAuth URL for reauthorization.
   */
  async reconnectAccount(workspaceId: string, accountId: string, userId: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.workspaceId !== workspaceId) {
      throw new NotFoundException('Social account not found in this workspace');
    }

    if (account.provider === SocialProvider.LINKEDIN) {
      return this.initiateLinkedInOAuth(workspaceId, userId);
    }
    if (account.provider === SocialProvider.TWITTER_X) {
      return this.initiateTwitterOAuth(workspaceId, userId);
    }
    if (account.provider === SocialProvider.PINTEREST) {
      return this.initiateProviderOAuth(workspaceId, userId, SocialProvider.PINTEREST);
    }
    if (account.provider === SocialProvider.YOUTUBE) {
      return this.initiateProviderOAuth(workspaceId, userId, SocialProvider.YOUTUBE);
    }
    if (account.provider === SocialProvider.TIKTOK) {
      return this.initiateProviderOAuth(workspaceId, userId, SocialProvider.TIKTOK);
    }
    if (account.provider === SocialProvider.THREADS) {
      return this.initiateProviderOAuth(workspaceId, userId, SocialProvider.THREADS);
    }
    return this.initiateMetaOAuth(workspaceId, userId);
  }

  /**
   * Unified OAuth 2.0 initiator for Pinterest, YouTube, TikTok, and Threads.
   */
  async initiateProviderOAuth(
    workspaceId: string,
    userId: string,
    provider: SocialProvider,
    customRedirectUri?: string,
  ) {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const routeMap: Record<string, { envKey: string; defaultUri: string; svc: any }> = {
      [SocialProvider.PINTEREST]: {
        envKey: 'PINTEREST_OAUTH_REDIRECT_URI',
        defaultUri: 'http://localhost:4000/api/v1/oauth/pinterest/callback',
        svc: this.pinterestOAuthService,
      },
      [SocialProvider.YOUTUBE]: {
        envKey: 'YOUTUBE_OAUTH_REDIRECT_URI',
        defaultUri: 'http://localhost:4000/api/v1/oauth/youtube/callback',
        svc: this.youtubeOAuthService,
      },
      [SocialProvider.TIKTOK]: {
        envKey: 'TIKTOK_OAUTH_REDIRECT_URI',
        defaultUri: 'http://localhost:4000/api/v1/oauth/tiktok/callback',
        svc: this.tiktokOAuthService,
      },
      [SocialProvider.THREADS]: {
        envKey: 'THREADS_OAUTH_REDIRECT_URI',
        defaultUri: 'http://localhost:4000/api/v1/oauth/threads/callback',
        svc: this.threadsOAuthService,
      },
    };

    const entry = routeMap[provider];
    if (!entry?.svc) {
      throw new BadRequestException(`OAuth provider [${provider}] is not registered`);
    }

    const serverRedirectUri =
      customRedirectUri || this.configService.get<string>(entry.envKey) || entry.defaultUri;

    await this.prisma.oAuthState.create({
      data: {
        state,
        workspaceId,
        userId,
        provider,
        redirectUri: serverRedirectUri,
        expiresAt,
      },
    });

    const authorizationUrl = entry.svc.generateAuthorizationUrl(state, serverRedirectUri);
    this.logger.log(`Initiated ${provider} OAuth for workspace [${workspaceId}] user [${userId}]`);

    return {
      authorizationUrl,
      state,
      provider,
      expiresAt,
    };
  }

  /**
   * Unified OAuth 2.0 callback handler for Pinterest, YouTube, TikTok, and Threads.
   */
  async handleProviderCallback(provider: SocialProvider, code: string, state: string) {
    const stateRecord = await this.prisma.oAuthState.findUnique({ where: { state } });

    if (!stateRecord) {
      throw new BadRequestException('Invalid or unknown OAuth state parameter');
    }
    if (stateRecord.usedAt) {
      throw new BadRequestException('OAuth state has already been used');
    }
    if (stateRecord.expiresAt < new Date()) {
      throw new BadRequestException('OAuth state has expired');
    }

    await this.prisma.oAuthState.update({
      where: { id: stateRecord.id },
      data: { usedAt: new Date() },
    });

    const svcMap: Record<string, { svc: any; scopes: string[] }> = {
      [SocialProvider.PINTEREST]: {
        svc: this.pinterestOAuthService,
        scopes: ['boards:read', 'boards:write', 'pins:read', 'pins:write'],
      },
      [SocialProvider.YOUTUBE]: {
        svc: this.youtubeOAuthService,
        scopes: ['youtube.upload', 'youtube.readonly'],
      },
      [SocialProvider.TIKTOK]: {
        svc: this.tiktokOAuthService,
        scopes: ['user.info.basic', 'video.publish', 'video.upload'],
      },
      [SocialProvider.THREADS]: {
        svc: this.threadsOAuthService,
        scopes: ['threads_basic', 'threads_content_publish', 'threads_manage_insights'],
      },
    };

    const entry = svcMap[provider];
    if (!entry?.svc) {
      throw new BadRequestException(`OAuth provider [${provider}] is not registered`);
    }

    const result = await entry.svc.exchangeCodeAndFetchAccounts(code, stateRecord.redirectUri);

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(sessionToken);

    const expiresAt = result.expiresIn
      ? new Date(Date.now() + result.expiresIn * 1000).toISOString()
      : null;

    const payload: SessionDecryptedPayload = {
      accounts: result.accounts,
      accessToken: result.accessToken,
      grantedScopes: entry.scopes,
      expiresAt,
    };

    const encryptedPayload = this.tokenVaultService.encrypt(JSON.stringify(payload));
    const sessionExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.oAuthSession.create({
      data: {
        sessionTokenHash,
        workspaceId: stateRecord.workspaceId,
        userId: stateRecord.userId,
        provider,
        encryptedPayload,
        expiresAt: sessionExpiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/settings/social-accounts/connect?session=${sessionToken}&workspaceId=${stateRecord.workspaceId}`;

    return { redirectUrl, sessionToken, workspaceId: stateRecord.workspaceId };
  }
}
