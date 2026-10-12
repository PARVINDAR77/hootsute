import { Module } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';
import { OAuthController } from './oauth.controller';
import { TokenVaultService } from './token-vault/token-vault.service';
import { MetaOAuthService } from './providers/meta/meta-oauth.service';
import { LinkedInOAuthService } from './providers/linkedin/linkedin-oauth.service';
import { TwitterOAuthService } from './providers/twitter/twitter-oauth.service';
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
  ],
  exports: [
    SocialAccountsService,
    TokenVaultService,
    MetaOAuthService,
    LinkedInOAuthService,
    TwitterOAuthService,
  ],
})
export class SocialAccountsModule {}
