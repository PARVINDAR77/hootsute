import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingProvider } from './billing-provider.interface';
import { StripeBillingProvider } from './stripe-billing.provider';
import { MockBillingProvider } from './mock-billing.provider';

@Injectable()
export class BillingProviderFactory {
  private readonly logger = new Logger(BillingProviderFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeProvider: StripeBillingProvider,
    private readonly mockProvider: MockBillingProvider,
  ) {}

  getProvider(): BillingProvider {
    const nodeEnv = (
      this.configService.get<string>('nodeEnv') ||
      this.configService.get<string>('NODE_ENV') ||
      'development'
    ).toLowerCase();
    const providerSetting = (this.configService.get<string>('BILLING_PROVIDER') || 'mock').toLowerCase();
    const isProduction = nodeEnv === 'production';

    if (isProduction) {
      if (providerSetting === 'mock' || providerSetting === 'local_mock') {
        this.logger.error('CRITICAL: Attempted to use mock billing in production environment!');
        throw new InternalServerErrorException('Invalid billing provider configuration in production');
      }
      return this.stripeProvider;
    }

    if (providerSetting === 'mock' || providerSetting === 'local_mock' || nodeEnv === 'test') {
      return this.mockProvider;
    }

    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      this.logger.warn('STRIPE_SECRET_KEY is missing; falling back to mock billing provider in non-production mode');
      return this.mockProvider;
    }

    return this.stripeProvider;
  }
}
