import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialPlatform, SocialProvider } from '@prisma/client';
import { SocialPublisher } from './social-publisher.interface';
import { MetaFacebookPublisherService } from './meta-facebook-publisher.service';
import { MetaInstagramPublisherService } from './meta-instagram-publisher.service';
import { LinkedInPublisherService } from './linkedin-publisher.service';
import { TwitterPublisherService } from './twitter-publisher.service';
import { MockSocialPublisherService } from './mock-social-publisher.service';

@Injectable()
export class PublisherFactoryService {
  private readonly logger = new Logger(PublisherFactoryService.name);
  private readonly isMock: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly facebookPublisher: MetaFacebookPublisherService,
    private readonly instagramPublisher: MetaInstagramPublisherService,
    private readonly linkedinPublisher: LinkedInPublisherService,
    private readonly twitterPublisher: TwitterPublisherService,
    private readonly mockPublisher: MockSocialPublisherService,
  ) {
    const nodeEnv = this.configService.get<string>('nodeEnv', 'development');
    const providerSetting = (this.configService.get<string>('PUBLISHING_PROVIDER') || '').toLowerCase();
    this.isMock = nodeEnv === 'test' || providerSetting === 'mock';
  }

  getPublisher(platform: SocialPlatform, provider?: SocialProvider): SocialPublisher {
    if (this.isMock) {
      return this.mockPublisher;
    }

    if (platform === SocialPlatform.FACEBOOK || provider === SocialProvider.META_FACEBOOK) {
      return this.facebookPublisher;
    }

    if (platform === SocialPlatform.INSTAGRAM || provider === SocialProvider.META_INSTAGRAM) {
      return this.instagramPublisher;
    }

    if (platform === SocialPlatform.LINKEDIN || provider === SocialProvider.LINKEDIN) {
      return this.linkedinPublisher;
    }

    if (platform === SocialPlatform.TWITTER_X || provider === SocialProvider.TWITTER_X) {
      return this.twitterPublisher;
    }

    this.logger.warn(`No live publisher configured for platform [${platform}], using mock adapter`);
    return this.mockPublisher;
  }
}

