import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { SocialAccountsService } from './social-accounts.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('OAuth Callback')
@Controller('oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly socialAccountsService: SocialAccountsService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('meta/callback')
  @ApiOperation({ summary: 'Official Meta OAuth 2.0 redirect callback endpoint' })
  @ApiQuery({ name: 'code', required: false, description: 'Authorization code from Meta' })
  @ApiQuery({ name: 'state', required: false, description: 'CSRF state parameter' })
  @ApiQuery({ name: 'error', required: false, description: 'Error code if user denied' })
  @ApiQuery({ name: 'error_description', required: false, description: 'Error description' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend candidate selection page' })
  async handleMetaCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';

    if (error) {
      this.logger.warn(`Meta OAuth was denied or failed: ${error} - ${errorDescription}`);
      const targetUrl = `${frontendUrl}/settings/social-accounts?error=${encodeURIComponent(
        errorDescription || error || 'Authorization was cancelled or denied by user',
      )}`;
      return res.redirect(targetUrl);
    }

    if (!code || !state) {
      throw new BadRequestException('Missing authorization code or state in callback query');
    }

    try {
      const result = await this.socialAccountsService.handleMetaCallback(code, state);
      return res.redirect(result.redirectUrl);
    } catch (err: any) {
      this.logger.error(`Error processing Meta OAuth callback: ${err.message}`);
      const targetUrl = `${frontendUrl}/settings/social-accounts?error=${encodeURIComponent(
        err.message || 'OAuth verification failed',
      )}`;
      return res.redirect(targetUrl);
    }
  }

  @Public()
  @Get('linkedin/callback')
  @ApiOperation({ summary: 'Official LinkedIn OAuth 2.0 redirect callback endpoint' })
  @ApiQuery({ name: 'code', required: false, description: 'Authorization code from LinkedIn' })
  @ApiQuery({ name: 'state', required: false, description: 'CSRF state parameter' })
  @ApiQuery({ name: 'error', required: false, description: 'Error code if user denied' })
  @ApiQuery({ name: 'error_description', required: false, description: 'Error description' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend candidate selection page' })
  async handleLinkedInCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';

    if (error) {
      this.logger.warn(`LinkedIn OAuth was denied or failed: ${error} - ${errorDescription}`);
      const targetUrl = `${frontendUrl}/settings/social-accounts?error=${encodeURIComponent(
        errorDescription || error || 'Authorization was cancelled or denied by user',
      )}`;
      return res.redirect(targetUrl);
    }

    if (!code || !state) {
      throw new BadRequestException('Missing authorization code or state in callback query');
    }

    try {
      const result = await this.socialAccountsService.handleLinkedInCallback(code, state);
      return res.redirect(result.redirectUrl);
    } catch (err: any) {
      this.logger.error(`Error processing LinkedIn OAuth callback: ${err.message}`);
      const targetUrl = `${frontendUrl}/settings/social-accounts?error=${encodeURIComponent(
        err.message || 'LinkedIn OAuth verification failed',
      )}`;
      return res.redirect(targetUrl);
    }
  }

  @Public()
  @Get('twitter/callback')
  @ApiOperation({ summary: 'Official Twitter / X OAuth 2.0 redirect callback endpoint' })
  @ApiQuery({ name: 'code', required: false, description: 'Authorization code from Twitter/X' })
  @ApiQuery({ name: 'state', required: false, description: 'CSRF state parameter' })
  @ApiQuery({ name: 'error', required: false, description: 'Error code if user denied' })
  @ApiQuery({ name: 'error_description', required: false, description: 'Error description' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend candidate selection page' })
  async handleTwitterCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';

    if (error) {
      this.logger.warn(`Twitter OAuth was denied or failed: ${error} - ${errorDescription}`);
      const targetUrl = `${frontendUrl}/settings/social-accounts?error=${encodeURIComponent(
        errorDescription || error || 'Authorization was cancelled or denied by user',
      )}`;
      return res.redirect(targetUrl);
    }

    if (!code || !state) {
      throw new BadRequestException('Missing authorization code or state in callback query');
    }

    try {
      const result = await this.socialAccountsService.handleTwitterCallback(code, state);
      return res.redirect(result.redirectUrl);
    } catch (err: any) {
      this.logger.error(`Error processing Twitter OAuth callback: ${err.message}`);
      const targetUrl = `${frontendUrl}/settings/social-accounts?error=${encodeURIComponent(
        err.message || 'Twitter OAuth verification failed',
      )}`;
      return res.redirect(targetUrl);
    }
  }
}
