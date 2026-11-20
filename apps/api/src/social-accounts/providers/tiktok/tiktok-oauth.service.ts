import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateSocialAccount, SocialAccountType, SocialProvider } from '@packages/shared';

export interface TikTokOAuthResult {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  accounts: CandidateSocialAccount[];
}

@Injectable()
export class TikTokOAuthService {
  private readonly logger = new Logger(TikTokOAuthService.name);
  private readonly clientKey: string;
  private readonly clientSecret: string;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.clientKey = this.configService.get<string>('TIKTOK_CLIENT_KEY') || '';
    this.clientSecret = this.configService.get<string>('TIKTOK_CLIENT_SECRET') || '';
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const providerSetting = (this.configService.get<string>('SOCIAL_PROVIDER') || '').toLowerCase();
    this.isMock = nodeEnv === 'test' || providerSetting === 'mock' || !this.clientKey;
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    if (this.isMock) {
      return `${redirectUri}?code=mock_tiktok_code_${Date.now()}&state=${encodeURIComponent(state)}`;
    }

    const scope = encodeURIComponent('user.info.basic,video.publish,video.upload');
    return `https://www.tiktok.com/v2/auth/authorize/?client_key=${this.clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${encodeURIComponent(state)}`;
  }

  async exchangeCodeAndFetchAccounts(code: string, redirectUri: string): Promise<TikTokOAuthResult> {
    if (this.isMock || code.startsWith('mock_')) {
      this.logger.debug('Using mock TikTok OAuth exchange');
      const suffix = Date.now().toString().slice(-4);
      return {
        accessToken: `mock_tiktok_token_${Date.now()}`,
        expiresIn: 86400,
        accounts: [
          {
            id: `tt_biz_${suffix}`,
            name: 'Brand TikTok Official',
            username: `brand_tiktok_${suffix}`,
            category: 'TikTok Business',
            accountType: SocialAccountType.TIKTOK_BUSINESS,
            provider: SocialProvider.TIKTOK,
            profileImageUrl: 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=150',
            isAlreadyConnected: false,
          },
        ],
      };
    }

    try {
      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`TikTok token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const userRes = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const userJson = await userRes.json();
      const user = userJson.data?.user || {};

      const account: CandidateSocialAccount = {
        id: user.open_id || tokenData.open_id || `tt_${Date.now()}`,
        name: user.display_name || user.username || 'TikTok Account',
        username: user.username || user.display_name,
        category: 'TikTok Business',
        accountType: SocialAccountType.TIKTOK_BUSINESS,
        provider: SocialProvider.TIKTOK,
        profileImageUrl: user.avatar_url || null,
        isAlreadyConnected: false,
      };

      return {
        accessToken,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        accounts: [account],
      };
    } catch (err: any) {
      this.logger.error(`TikTok OAuth error: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message || 'TikTok authentication failed');
    }
  }
}
