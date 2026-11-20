import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateSocialAccount, SocialAccountType, SocialProvider } from '@packages/shared';

export interface ThreadsOAuthResult {
  accessToken: string;
  expiresIn?: number;
  accounts: CandidateSocialAccount[];
}

@Injectable()
export class ThreadsOAuthService {
  private readonly logger = new Logger(ThreadsOAuthService.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.appId =
      this.configService.get<string>('THREADS_APP_ID') ||
      this.configService.get<string>('META_APP_ID') ||
      '';
    this.appSecret =
      this.configService.get<string>('THREADS_APP_SECRET') ||
      this.configService.get<string>('META_APP_SECRET') ||
      '';
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const providerSetting = (this.configService.get<string>('SOCIAL_PROVIDER') || '').toLowerCase();
    this.isMock = nodeEnv === 'test' || providerSetting === 'mock' || !this.appId;
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    if (this.isMock) {
      return `${redirectUri}?code=mock_threads_code_${Date.now()}&state=${encodeURIComponent(state)}`;
    }

    const scope = encodeURIComponent('threads_basic,threads_content_publish,threads_manage_insights');
    return `https://threads.net/oauth/authorize?client_id=${this.appId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;
  }

  async exchangeCodeAndFetchAccounts(code: string, redirectUri: string): Promise<ThreadsOAuthResult> {
    if (this.isMock || code.startsWith('mock_')) {
      this.logger.debug('Using mock Threads OAuth exchange');
      const suffix = Date.now().toString().slice(-4);
      return {
        accessToken: `mock_threads_token_${Date.now()}`,
        expiresIn: 5184000,
        accounts: [
          {
            id: `threads_user_${suffix}`,
            name: 'Brand Threads Official',
            username: `brand_threads_${suffix}`,
            category: 'Threads Profile',
            accountType: SocialAccountType.THREADS_PROFILE,
            provider: SocialProvider.THREADS,
            profileImageUrl: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=150',
            isAlreadyConnected: false,
          },
        ],
      };
    }

    try {
      const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.appId,
          client_secret: this.appSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Threads token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const meRes = await fetch(
        `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${encodeURIComponent(
          accessToken,
        )}`,
      );
      const me = await meRes.json();

      const account: CandidateSocialAccount = {
        id: me.id || `threads_${Date.now()}`,
        name: me.name || me.username || 'Threads Profile',
        username: me.username,
        category: 'Threads Profile',
        accountType: SocialAccountType.THREADS_PROFILE,
        provider: SocialProvider.THREADS,
        profileImageUrl: me.threads_profile_picture_url || null,
        isAlreadyConnected: false,
      };

      return {
        accessToken,
        expiresIn: tokenData.expires_in,
        accounts: [account],
      };
    } catch (err: any) {
      this.logger.error(`Threads OAuth error: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message || 'Threads authentication failed');
    }
  }
}
