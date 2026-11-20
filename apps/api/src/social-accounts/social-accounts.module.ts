import { Module } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';
import { OAuthController } from './oauth.controller';
import { TokenVaultService } from './token-vault/token-vault.service';
import { MetaOAuthService } from './providers/meta/meta-oauth.service';
import { LinkedInOAuthService } from './providers/linkedin/linkedin-oauth.service';
import { TwitterOAuthService } from './providers/twitter/twitter-oauth.service';
import { PinterestOAuthService } from './providers/pinterest/pinterest-oauth.service';
import { YouTubeOAuthService } from './providers/youtube/youtube-oauth.service';
import { TikTokOAuthService } from './providers/tiktok/tiktok-oauth.service';
import { ThreadsOAuthService } from './providers/threads/threads-oauth.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialAccountsController, OAuthController],
  providers: [
    SocialAccountsService,
    TokenVaultService,
    MetaOAuthService,
    LinkedInOAuthService,
    TwitterOAuthService,
    PinterestOAuthService,
    YouTubeOAuthService,
    TikTokOAuthService,
    ThreadsOAuthService,
  ],
  exports: [
    SocialAccountsService,
    TokenVaultService,
    MetaOAuthService,
    LinkedInOAuthService,
    TwitterOAuthService,
    PinterestOAuthService,
    YouTubeOAuthService,
    TikTokOAuthService,
    ThreadsOAuthService,
  ],
})
export class SocialAccountsModule {}
