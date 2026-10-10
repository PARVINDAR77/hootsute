import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { ScheduledPostsRepository } from './repositories/scheduled-posts.repository';
import { ScheduledPostsService } from './services/scheduled-posts.service';
import { ScheduledPostsController } from './controllers/scheduled-posts.controller';
import { MetaFacebookPublisherService } from './providers/meta-facebook-publisher.service';
import { MetaInstagramPublisherService } from './providers/meta-instagram-publisher.service';
import { MockSocialPublisherService } from './providers/mock-social-publisher.service';
import { PublisherFactoryService } from './providers/publisher-factory.service';
import { PublishingReconcilerService } from './services/publishing-reconciler.service';
import { PublishingDispatcherService } from './services/publishing-dispatcher.service';
import { ScheduledPostSweeperService } from './services/scheduled-post-sweeper.service';

@Module({
  imports: [
    PrismaModule,
    SocialAccountsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [ScheduledPostsController],
  providers: [
    ScheduledPostsRepository,
    ScheduledPostsService,
    MetaFacebookPublisherService,
    MetaInstagramPublisherService,
    MockSocialPublisherService,
    PublisherFactoryService,
    PublishingReconcilerService,
    PublishingDispatcherService,
    ScheduledPostSweeperService,
  ],
  exports: [
    ScheduledPostsRepository,
    ScheduledPostsService,
    PublishingDispatcherService,
    PublishingReconcilerService,
    MockSocialPublisherService,
  ],
})
export class PublishingModule {}
