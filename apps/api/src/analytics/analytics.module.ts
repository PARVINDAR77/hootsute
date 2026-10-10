import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsDataService } from './services/analytics-data.service';
import { MetaFacebookAnalyticsAdapter } from './providers/meta-facebook-analytics.adapter';
import { MetaInstagramAnalyticsAdapter } from './providers/meta-instagram-analytics.adapter';
import { MockSocialAnalyticsAdapter } from './providers/mock-social-analytics.adapter';
import { AnalyticsAdapterFactory } from './providers/analytics-adapter.factory';
import { AnalyticsSyncService } from './services/analytics-sync.service';
import { AnalyticsSyncSweeperService } from './services/analytics-sync-sweeper.service';
import { AnalyticsSyncController } from './controllers/analytics-sync.controller';
import { AnalyticsDashboardController } from './controllers/analytics-dashboard.controller';

import { AiProviderModule } from '../content-generation/ai-provider/ai-provider.module';
import { GrowthInsightsEngineService } from './services/growth-insights-engine.service';

@Module({
  imports: [PrismaModule, SocialAccountsModule, AiProviderModule],
  controllers: [AnalyticsSyncController, AnalyticsDashboardController],
  providers: [
    AnalyticsRepository,
    AnalyticsDataService,
    MetaFacebookAnalyticsAdapter,
    MetaInstagramAnalyticsAdapter,
    MockSocialAnalyticsAdapter,
    AnalyticsAdapterFactory,
    AnalyticsSyncService,
    AnalyticsSyncSweeperService,
    GrowthInsightsEngineService,
  ],
  exports: [
    AnalyticsRepository,
    AnalyticsDataService,
    AnalyticsSyncService,
    AnalyticsAdapterFactory,
    MockSocialAnalyticsAdapter,
    GrowthInsightsEngineService,
  ],
})
export class AnalyticsModule {}

