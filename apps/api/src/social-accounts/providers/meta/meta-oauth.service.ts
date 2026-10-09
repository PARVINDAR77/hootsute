import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MetaOAuthResult,
  MetaPageCandidate,
  MetaTokenDebugInfo,
} from './meta-provider.interface';

@Injectable()
export class MetaOAuthService {
  private readonly logger = new Logger(MetaOAuthService.name);

  private readonly appId: string;
  private readonly appSecret: string;
  private readonly apiVersion: string;
  private readonly defaultRedirectUri: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('META_APP_ID') || '';
    this.appSecret = this.configService.get<string>('META_APP_SECRET') || '';
    this.apiVersion = this.configService.get<string>('META_API_VERSION') || 'v21.0';
    this.defaultRedirectUri =
      this.configService.get<string>('META_OAUTH_REDIRECT_URI') ||
      'http://localhost:4000/api/v1/oauth/meta/callback';
  }

  isConfigured(): boolean {
    return Boolean(this.appId && this.appSecret && this.appId.trim() !== '' && this.appSecret.trim() !== '');
  }

  getRequiredScopes(): string[] {
    return [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ];
  }

  getAuthorizationUrl(state: string, customRedirectUri?: string): string {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Meta application credentials (META_APP_ID / META_APP_SECRET) are not configured on this server.',
      );
    }

    const redirectUri = customRedirectUri || this.defaultRedirectUri;
    const scopes = this.getRequiredScopes().join(',');

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      state,
      scope: scopes,
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, redirectUri?: string): Promise<MetaOAuthResult> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Meta credentials are not configured.');
    }

    const effectiveRedirectUri = redirectUri || this.defaultRedirectUri;

    // 1. Exchange authorization code for short-lived user access token
    const tokenExchangeUrl = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?` +
      new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: effectiveRedirectUri,
        code,
      }).toString();

    let shortLivedToken: string;
    try {
      const response = await fetch(tokenExchangeUrl, { method: 'GET' });
      const data = await response.json();

      if (!response.ok || data.error) {
        this.logger.error(`Meta token exchange failed: ${data.error?.message || 'Unknown error'}`);
        throw new BadRequestException(
          data.error?.message || 'Failed to exchange authorization code with Meta',
        );
      }

      shortLivedToken = data.access_token;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Network error during Meta token exchange: ${err.message}`);
      throw new InternalServerErrorException('Provider API communication failure during OAuth exchange');
    }

    // 2. Exchange for 60-day long-lived user access token
    const longLivedExchangeUrl = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      }).toString();

    let longLivedToken = shortLivedToken;
    let expiresAt: Date | null = null;

    try {
      const response = await fetch(longLivedExchangeUrl, { method: 'GET' });
      const data = await response.json();

      if (response.ok && data.access_token) {
        longLivedToken = data.access_token;
        if (data.expires_in) {
          expiresAt = new Date(Date.now() + data.expires_in * 1000);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not exchange long-lived token, falling back to short-lived: ${err.message}`);
    }

    // 3. Inspect token debug status for granted scopes and validity
    const debugUrl = `https://graph.facebook.com/${this.apiVersion}/debug_token?` +
      new URLSearchParams({
        input_token: longLivedToken,
        access_token: `${this.appId}|${this.appSecret}`,
      }).toString();

    let grantedScopes: string[] = [];
    try {
      const response = await fetch(debugUrl, { method: 'GET' });
      const data = await response.json();
      if (response.ok && data.data) {
        const debugInfo = data.data as MetaTokenDebugInfo;
        if (!debugInfo.isValid) {
          throw new UnauthorizedException('Meta access token is invalid or was revoked by user');
        }
        grantedScopes = debugInfo.scopes || [];
        if (debugInfo.expiresAt && !expiresAt) {
          expiresAt = new Date(debugInfo.expiresAt * 1000);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Debug token inspection error: ${err.message}`);
    }

    // 4. Discover Facebook Pages & linked Instagram Accounts
    const accountsUrl = `https://graph.facebook.com/${this.apiVersion}/me/accounts?` +
      new URLSearchParams({
        fields: 'id,name,username,category,tasks,access_token,instagram_business_account{id,username,name,profile_picture_url}',
        access_token: longLivedToken,
      }).toString();

    const pages: MetaPageCandidate[] = [];
    try {
      const response = await fetch(accountsUrl, { method: 'GET' });
      const data = await response.json();

      if (!response.ok || data.error) {
        this.logger.error(`Failed to fetch Meta accounts: ${data.error?.message || 'Unknown error'}`);
        throw new BadRequestException('Failed to retrieve authorized Facebook Pages from Meta');
      }

      const rawPages = Array.isArray(data.data) ? data.data : [];

      for (const p of rawPages) {
        const igData = p.instagram_business_account;
        pages.push({
          id: p.id,
          name: p.name,
          username: p.username || null,
          category: p.category || null,
          tasks: Array.isArray(p.tasks) ? p.tasks : [],
          pageAccessToken: p.access_token,
          instagramBusinessAccount: igData
            ? {
                id: igData.id,
                name: igData.name || igData.username,
                username: igData.username,
                profilePictureUrl: igData.profile_picture_url || null,
              }
            : null,
        });
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Error querying Meta /me/accounts: ${err.message}`);
      throw new InternalServerErrorException('Failed to fetch authorized pages from Meta Graph API');
    }

    return {
      userAccessToken: shortLivedToken,
      longLivedUserToken: longLivedToken,
      expiresAt,
      grantedScopes,
      pages,
    };
  }
}
