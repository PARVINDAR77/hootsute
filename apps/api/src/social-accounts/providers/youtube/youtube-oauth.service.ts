import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateSocialAccount, SocialAccountType, SocialProvider } from '@packages/shared';

export interface YouTubeOAuthResult {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  accounts: CandidateSocialAccount[];
}

@Injectable()
export class YouTubeOAuthService {
  private readonly logger = new Logger(YouTubeOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('YOUTUBE_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('YOUTUBE_CLIENT_SECRET') || '';
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const providerSetting = (this.configService.get<string>('SOCIAL_PROVIDER') || '').toLowerCase();
    this.isMock = nodeEnv === 'test' || providerSetting === 'mock' || !this.clientId;
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    if (this.isMock) {
      return `${redirectUri}?code=mock_youtube_code_${Date.now()}&state=${encodeURIComponent(state)}`;
    }

    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    );
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
  }

  async exchangeCodeAndFetchAccounts(code: string, redirectUri: string): Promise<YouTubeOAuthResult> {
    if (this.isMock || code.startsWith('mock_')) {
      this.logger.debug('Using mock YouTube OAuth exchange');
      const suffix = Date.now().toString().slice(-4);
      return {
        accessToken: `mock_youtube_token_${Date.now()}`,
        expiresIn: 3600,
        accounts: [
          {
            id: `UC_mock_channel_${suffix}`,
            name: 'Official Brand Studio TV',
            username: `brandstudio_${suffix}`,
            category: 'YouTube Channel',
            accountType: SocialAccountType.YOUTUBE_CHANNEL,
            provider: SocialProvider.YOUTUBE,
            profileImageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=150',
            isAlreadyConnected: false,
          },
        ],
      };
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`YouTube token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const chRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const chData = await chRes.json();
      const channels = Array.isArray(chData.items) ? chData.items : [];

      const accounts: CandidateSocialAccount[] = channels.map((ch: any) => ({
        id: ch.id,
        name: ch.snippet?.title || 'YouTube Channel',
        username: ch.snippet?.customUrl?.replace(/^@/, '') || ch.id,
        category: 'YouTube Channel',
        accountType: SocialAccountType.YOUTUBE_CHANNEL,
        provider: SocialProvider.YOUTUBE,
        profileImageUrl: ch.snippet?.thumbnails?.default?.url || null,
        isAlreadyConnected: false,
      }));

      return {
        accessToken,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        accounts,
      };
    } catch (err: any) {
      this.logger.error(`YouTube OAuth error: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message || 'YouTube authentication failed');
    }
  }
}
