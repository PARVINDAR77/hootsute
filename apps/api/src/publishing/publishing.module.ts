import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { ScheduledPostsRepository } from './repositories/scheduled-posts.repository';
import { ScheduledPostsService } from './services/scheduled-posts.service';
import { ScheduledPostsController } from './controllers/scheduled-posts.controller';
import { BulkScheduleController } from './controllers/bulk-schedule.controller';
import { BulkScheduleService } from './services/bulk-schedule.service';
import { MetaFacebookPublisherService } from './providers/meta-facebook-publisher.service';
import { MetaInstagramPublisherService } from './providers/meta-instagram-publisher.service';
import { LinkedInPublisherService } from './providers/linkedin-publisher.service';
import { TwitterPublisherService } from './providers/twitter-publisher.service';
import { PinterestPublisherService } from './providers/pinterest-publisher.service';
import { YouTubePublisherService } from './providers/youtube-publisher.service';
import { TikTokPublisherService } from './providers/tiktok-publisher.service';
import { ThreadsPublisherService } from './providers/threads-publisher.service';
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
  controllers: [ScheduledPostsController, BulkScheduleController],
  providers: [
    ScheduledPostsRepository,
    ScheduledPostsService,
    BulkScheduleService,
    MetaFacebookPublisherService,
    MetaInstagramPublisherService,
    LinkedInPublisherService,
    TwitterPublisherService,
    PinterestPublisherService,
    YouTubePublisherService,
    TikTokPublisherService,
    ThreadsPublisherService,
    MockSocialPublisherService,
    PublisherFactoryService,
    PublishingReconcilerService,
    PublishingDispatcherService,
    ScheduledPostSweeperService,
  ],
  exports: [
    ScheduledPostsRepository,
    ScheduledPostsService,
    BulkScheduleService,
    PublishingDispatcherService,
    PublishingReconcilerService,
    LinkedInPublisherService,
    TwitterPublisherService,
    PinterestPublisherService,
    YouTubePublisherService,
    TikTokPublisherService,
    ThreadsPublisherService,
    MockSocialPublisherService,
  ],
})
export class PublishingModule {}
