import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateSocialAccount, SocialAccountType, SocialProvider } from '@packages/shared';

export interface PinterestOAuthResult {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  accounts: CandidateSocialAccount[];
}

@Injectable()
export class PinterestOAuthService {
  private readonly logger = new Logger(PinterestOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('PINTEREST_APP_ID') || '';
    this.clientSecret = this.configService.get<string>('PINTEREST_APP_SECRET') || '';
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const providerSetting = (this.configService.get<string>('SOCIAL_PROVIDER') || '').toLowerCase();
    this.isMock = nodeEnv === 'test' || providerSetting === 'mock' || !this.clientId;
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    if (this.isMock) {
      return `${redirectUri}?code=mock_pinterest_code_${Date.now()}&state=${encodeURIComponent(state)}`;
    }

    const scope = encodeURIComponent('boards:read,boards:write,pins:read,pins:write,user_accounts:read');
    return `https://www.pinterest.com/oauth/?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=${scope}&state=${encodeURIComponent(state)}`;
  }

  async exchangeCodeAndFetchAccounts(code: string, redirectUri: string): Promise<PinterestOAuthResult> {
    if (this.isMock || code.startsWith('mock_')) {
      this.logger.debug('Using mock Pinterest OAuth exchange');
      const suffix = Date.now().toString().slice(-4);
      return {
        accessToken: `mock_pinterest_token_${Date.now()}`,
        expiresIn: 2592000,
        accounts: [
          {
            id: `pin_biz_${suffix}`,
            name: 'Brand Inspiration Boards',
            username: `brand_pins_${suffix}`,
            category: 'Pinterest Business',
            accountType: SocialAccountType.PINTEREST_BUSINESS,
            provider: SocialProvider.PINTEREST,
            profileImageUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=150',
            isAlreadyConnected: false,
          },
        ],
      };
    }

    try {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Pinterest token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userRes.json();

      const account: CandidateSocialAccount = {
        id: userData.username || `pin_${Date.now()}`,
        name: userData.business_name || userData.username || 'Pinterest Business',
        username: userData.username,
        category: 'Pinterest Business',
        accountType: SocialAccountType.PINTEREST_BUSINESS,
        provider: SocialProvider.PINTEREST,
        profileImageUrl: userData.profile_image || null,
        isAlreadyConnected: false,
      };

      return {
        accessToken,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        accounts: [account],
      };
    } catch (err: any) {
      this.logger.error(`Pinterest OAuth error: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message || 'Pinterest authentication failed');
    }
  }
}
