import { Injectable, BadRequestException } from '@nestjs/common';
import { SocialPlatform, SocialAccount } from '@prisma/client';
import { SocialInboxAdapter } from '../interfaces/social-inbox-adapter.interface';
import { MetaFacebookInboxAdapter } from './meta-facebook-inbox.adapter';
import { MetaInstagramInboxAdapter } from './meta-instagram-inbox.adapter';

@Injectable()
export class InboxAdapterFactory {
  constructor(
    private readonly facebookAdapter: MetaFacebookInboxAdapter,
    private readonly instagramAdapter: MetaInstagramInboxAdapter,
  ) {}

  getAdapter(account: SocialAccount): SocialInboxAdapter {
    if (account.provider === 'META_FACEBOOK' || account.accountType === 'FACEBOOK_PAGE') {
      return this.facebookAdapter;
    }

    if (
      account.provider === 'META_INSTAGRAM' ||
      account.accountType === 'INSTAGRAM_BUSINESS' ||
      account.accountType === 'INSTAGRAM_CREATOR'
    ) {
      return this.instagramAdapter;
    }

    throw new BadRequestException(
      `Unsupported social account provider [${account.provider}] for Unified Social Inbox.`,
    );
  }

  getAdapterByPlatform(platform: SocialPlatform): SocialInboxAdapter {
    if (platform === SocialPlatform.FACEBOOK) {
      return this.facebookAdapter;
    }
    if (platform === SocialPlatform.INSTAGRAM) {
      return this.instagramAdapter;
    }
    throw new BadRequestException(`Unsupported social platform [${platform}] for Unified Social Inbox.`);
  }
}
