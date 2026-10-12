import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateSocialAccount, SocialAccountType, SocialProvider } from '@packages/shared';

export interface TwitterOAuthResult {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  accounts: CandidateSocialAccount[];
}

@Injectable()
export class TwitterOAuthService {
  private readonly logger = new Logger(TwitterOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('TWITTER_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('TWITTER_CLIENT_SECRET') || '';
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const providerSetting = (this.configService.get<string>('SOCIAL_PROVIDER') || '').toLowerCase();
    this.isMock = nodeEnv === 'test' || providerSetting === 'mock' || !this.clientId;
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    if (this.isMock) {
      return `${redirectUri}?code=mock_twitter_code_${Date.now()}&state=${encodeURIComponent(state)}`;
    }

    const scope = encodeURIComponent('tweet.read tweet.write users.read offline.access');
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${scope}&state=${encodeURIComponent(state)}&code_challenge=challenge&code_challenge_method=plain`;
  }

  async exchangeCodeAndFetchAccounts(code: string, redirectUri: string): Promise<TwitterOAuthResult> {
    if (this.isMock || code.startsWith('mock_')) {
      this.logger.debug('Using mock Twitter/X OAuth exchange');
      const mockTwitterId = 'mock_tw_user_789';

      return {
        accessToken: `mock_tw_token_${Date.now()}`,
        expiresIn: 7200,
        accounts: [
          {
            id: mockTwitterId,
            name: 'Brand Channel (@OmniSocialAI)',
            username: 'OmniSocialAI',
            category: 'Twitter/X Handle',
            accountType: SocialAccountType.TWITTER_PROFILE,
            provider: SocialProvider.TWITTER_X,
            profileImageUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=150',
            isAlreadyConnected: false,
          },
        ],
      };
    }

    try {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: 'challenge',
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Twitter/X token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile from Twitter v2
      const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const userData = await userRes.json();
      const user = userData.data;

      const twitterAccount: CandidateSocialAccount = {
        id: user.id,
        name: user.name,
        username: user.username,
        category: 'Twitter/X Handle',
        accountType: SocialAccountType.TWITTER_PROFILE,
        provider: SocialProvider.TWITTER_X,
        profileImageUrl: user.profile_image_url || null,
        isAlreadyConnected: false,
      };

      return {
        accessToken,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        accounts: [twitterAccount],
      };
    } catch (err: any) {
      this.logger.error(`Twitter/X OAuth error: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message || 'Twitter authentication failed');
    }
  }
}
