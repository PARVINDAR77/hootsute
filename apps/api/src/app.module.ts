import './common/utils/bigint-serializer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from './config/configuration';
import { validateEnvironment } from './config/env-validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SocialAccountsModule } from './social-accounts/social-accounts.module';
import { BrandProfileModule } from './brand-profile/brand-profile.module';
import { OccasionsModule } from './occasions/occasions.module';
import { ContentDraftsModule } from './content-drafts/content-drafts.module';
import { ContentGenerationModule } from './content-generation/content-generation.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { PublishingModule } from './publishing/publishing.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { InboxModule } from './inbox/inbox.module';
import { MediaModule } from './media/media.module';
import { BillingModule } from './billing/billing.module';
import { AutomationsModule } from './automations/automations.module';
import { LinksModule } from './links/links.module';
import { ListeningModule } from './listening/listening.module';
import { ApprovalWorkflowsModule } from './approval-workflows/approval-workflows.module';
import { ReportsModule } from './reports/reports.module';
import { CompetitorsModule } from './competitors/competitors.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MailModule } from './mail/mail.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { RedisThrottlerStorage } from './common/throttler/redis-throttler-storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttler.ttl', 60) * 1000,
            limit: config.get<number>('throttler.limit', 100),
          },
        ],
        storage: new RedisThrottlerStorage(config),
      }),
    }),
    PrismaModule,
    MailModule,
    PushNotificationsModule,
    HealthModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    SocialAccountsModule,
    BrandProfileModule,
    OccasionsModule,
    ContentDraftsModule,
    ContentGenerationModule,
    WhatsAppModule,
    PublishingModule,
    AnalyticsModule,
    InboxModule,
    MediaModule,
    BillingModule,
    AutomationsModule,
    LinksModule,
    ListeningModule,
    ApprovalWorkflowsModule,
    ReportsModule,
    CompetitorsModule,
    WebhooksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
