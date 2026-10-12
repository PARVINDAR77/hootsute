import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingProviderFactory } from './providers/billing-provider.factory';
import { StripeBillingProvider } from './providers/stripe-billing.provider';
import { MockBillingProvider } from './providers/mock-billing.provider';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    BillingProviderFactory,
    StripeBillingProvider,
    MockBillingProvider,
  ],
  exports: [BillingService, BillingProviderFactory],
})
export class BillingModule {}
