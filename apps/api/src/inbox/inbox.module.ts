import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { InboxController } from './controllers/inbox.controller';
import { MetaSocialWebhookController } from './controllers/meta-social-webhook.controller';
import { InboxService } from './services/inbox.service';
import { InboxSyncService } from './services/inbox-sync.service';
import { MetaSocialWebhookService } from './services/meta-social-webhook.service';
import { MetaFacebookInboxAdapter } from './adapters/meta-facebook-inbox.adapter';
import { MetaInstagramInboxAdapter } from './adapters/meta-instagram-inbox.adapter';
import { InboxAdapterFactory } from './adapters/inbox-adapter.factory';

import { InboxReplyReconcilerService } from './services/inbox-reply-reconciler.service';

import { InboxModerationController } from './controllers/inbox-moderation.controller';
import { InboxModerationService } from './services/inbox-moderation.service';

@Module({
  imports: [ConfigModule, PrismaModule, SocialAccountsModule],
  controllers: [InboxController, MetaSocialWebhookController, InboxModerationController],
  providers: [
    InboxService,
    InboxSyncService,
    MetaSocialWebhookService,
    InboxReplyReconcilerService,
    InboxModerationService,
    MetaFacebookInboxAdapter,
    MetaInstagramInboxAdapter,
    InboxAdapterFactory,
  ],
  exports: [
    InboxService,
    InboxSyncService,
    MetaSocialWebhookService,
    InboxReplyReconcilerService,
    InboxModerationService,
  ],
})
export class InboxModule {}
