import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateSocialAccount, SocialAccountType, SocialProvider } from '@packages/shared';

export interface LinkedInOAuthResult {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  accounts: CandidateSocialAccount[];
}

@Injectable()
export class LinkedInOAuthService {
  private readonly logger = new Logger(LinkedInOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET') || '';
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const providerSetting = (this.configService.get<string>('SOCIAL_PROVIDER') || '').toLowerCase();
    this.isMock = nodeEnv === 'test' || providerSetting === 'mock' || !this.clientId;
  }

  generateAuthorizationUrl(state: string, redirectUri: string): string {
    if (this.isMock) {
      return `${redirectUri}?code=mock_linkedin_code_${Date.now()}&state=${encodeURIComponent(state)}`;
    }

    const scope = encodeURIComponent('openid profile email w_member_social r_organization_social w_organization_social');
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${encodeURIComponent(state)}&scope=${scope}`;
  }

  async exchangeCodeAndFetchAccounts(code: string, redirectUri: string): Promise<LinkedInOAuthResult> {
    if (this.isMock || code.startsWith('mock_')) {
      this.logger.debug('Using mock LinkedIn OAuth exchange');
      const mockPersonId = 'mock_li_person_123';
      const mockOrgId = 'mock_li_org_456';

      return {
        accessToken: `mock_li_token_${Date.now()}`,
        expiresIn: 5184000, // 60 days
        accounts: [
          {
            id: mockPersonId,
            name: 'Professional Profile (LinkedIn)',
            username: 'linkedin_user',
            category: 'Personal Profile',
            accountType: SocialAccountType.LINKEDIN_PROFILE,
            provider: SocialProvider.LINKEDIN,
            profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isAlreadyConnected: false,
          },
          {
            id: mockOrgId,
            name: 'OmniSocial AI Company Page',
            username: 'omnisocial-ai',
            category: 'Company Page',
            accountType: SocialAccountType.LINKEDIN_PAGE,
            provider: SocialProvider.LINKEDIN,
            profileImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            isAlreadyConnected: false,
          },
        ],
      };
    }

    try {
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`LinkedIn token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile via OpenID UserInfo endpoint
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const userData = await userRes.json();
      const personAccount: CandidateSocialAccount = {
        id: userData.sub,
        name: userData.name || 'LinkedIn Profile',
        username: userData.email || userData.sub,
        category: 'Personal Profile',
        accountType: SocialAccountType.LINKEDIN_PROFILE,
        provider: SocialProvider.LINKEDIN,
        profileImageUrl: userData.picture || null,
        isAlreadyConnected: false,
      };

      return {
        accessToken,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token,
        accounts: [personAccount],
      };
    } catch (err: any) {
      this.logger.error(`LinkedIn OAuth error: ${err.message}`, err.stack);
      throw new InternalServerErrorException(err.message || 'LinkedIn authentication failed');
    }
  }
}
