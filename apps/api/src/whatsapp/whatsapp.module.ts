import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

import { WHATSAPP_CLIENT } from './provider/whatsapp-client.interface';
import { createWhatsAppClient } from './provider/whatsapp-client.factory';

import { WhatsAppConfigService } from './services/whatsapp-config.service';
import { WhatsAppConsentService } from './services/whatsapp-consent.service';
import { WhatsAppActionTokenService } from './services/whatsapp-action-token.service';
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service';
import { WhatsAppNotificationService } from './services/whatsapp-notification.service';
import { WhatsAppApprovalService } from './services/whatsapp-approval.service';

import { WhatsAppSettingsController } from './controllers/whatsapp-settings.controller';
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller';
import { WhatsAppReviewLinkController } from './controllers/whatsapp-review-link.controller';

@Module({
  imports: [PrismaModule, ConfigModule, SocialAccountsModule],
  controllers: [
    WhatsAppSettingsController,
    WhatsAppWebhookController,
    WhatsAppReviewLinkController,
  ],
  providers: [
    WhatsAppConfigService,
    WhatsAppConsentService,
    WhatsAppActionTokenService,
    WhatsAppWebhookService,
    WhatsAppNotificationService,
    WhatsAppApprovalService,
    {
      provide: WHATSAPP_CLIENT,
      useFactory: createWhatsAppClient,
      inject: [ConfigService],
    },
  ],
  exports: [
    WhatsAppConfigService,
    WhatsAppConsentService,
    WhatsAppActionTokenService,
    WhatsAppWebhookService,
    WhatsAppNotificationService,
    WhatsAppApprovalService,
    WHATSAPP_CLIENT,
  ],
})
export class WhatsAppModule {}
