import { Module } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';
import { OAuthController } from './oauth.controller';
import { TokenVaultService } from './token-vault/token-vault.service';
import { MetaOAuthService } from './providers/meta/meta-oauth.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialAccountsController, OAuthController],
  providers: [SocialAccountsService, TokenVaultService, MetaOAuthService],
  exports: [SocialAccountsService, TokenVaultService, MetaOAuthService],
})
export class SocialAccountsModule {}
