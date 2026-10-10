import { Injectable, BadRequestException } from '@nestjs/common';
import { SocialProvider, SocialAccount } from '@prisma/client';
import { SocialAnalyticsAdapter } from './social-analytics.interface';
import { MetaFacebookAnalyticsAdapter } from './meta-facebook-analytics.adapter';
import { MetaInstagramAnalyticsAdapter } from './meta-instagram-analytics.adapter';
import { MockSocialAnalyticsAdapter } from './mock-social-analytics.adapter';

@Injectable()
export class AnalyticsAdapterFactory {
  private useMock: boolean = false;

  constructor(
    private readonly facebookAdapter: MetaFacebookAnalyticsAdapter,
    private readonly instagramAdapter: MetaInstagramAnalyticsAdapter,
    private readonly mockAdapter: MockSocialAnalyticsAdapter,
  ) {}

  /**
   * Toggles mock adapter for unit/integration testing environments.
   */
  setUseMock(value: boolean) {
    this.useMock = value;
  }

  getAdapter(account: SocialAccount): SocialAnalyticsAdapter {
    if (this.useMock) {
      return this.mockAdapter;
    }

    switch (account.provider) {
      case SocialProvider.META_FACEBOOK:
        return this.facebookAdapter;

      case SocialProvider.META_INSTAGRAM:
        return this.instagramAdapter;

      default:
        throw new BadRequestException(
          `Analytics collection for provider [${account.provider}] is currently unsupported.`,
        );
    }
  }
}
