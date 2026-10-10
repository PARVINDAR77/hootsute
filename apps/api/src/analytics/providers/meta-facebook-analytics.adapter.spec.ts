import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetaFacebookAnalyticsAdapter } from './meta-facebook-analytics.adapter';
import { SocialPlatform, SocialProvider, SocialAccountType, SocialConnectionStatus } from '@prisma/client';

describe('MetaFacebookAnalyticsAdapter', () => {
  let adapter: MetaFacebookAnalyticsAdapter;
  let originalFetch: typeof global.fetch;

  const mockAccount = {
    id: 'acc-fb-1',
    workspaceId: 'ws-1',
    provider: SocialProvider.META_FACEBOOK,
    providerAccountId: 'page-123456',
    accountName: 'Test Brand Page',
    accountType: SocialAccountType.FACEBOOK_PAGE,
    connectionStatus: SocialConnectionStatus.CONNECTED,
    encryptedAccessToken: 'token',
    grantedScopes: ['pages_show_list', 'pages_read_engagement'], // Missing read_insights (Tier 1 only)
    connectedByUserId: 'user-1',
    lastValidatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    accountUsername: null,
    profileImageUrl: null,
    tokenExpiresAt: null,
    metadata: null,
  };

  beforeEach(async () => {
    originalFetch = global.fetch;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaFacebookAnalyticsAdapter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('v21.0'),
          },
        },
      ],
    }).compile();

    adapter = module.get<MetaFacebookAnalyticsAdapter>(MetaFacebookAnalyticsAdapter);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('ingests Tier 1 public counters when read_insights is not granted', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('fields=followers_count')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              id: 'page-123456',
              followers_count: 3200,
              fan_count: 3150,
            }),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const metrics = await adapter.fetchAccountMetrics(mockAccount, 'decrypted_token');

    expect(metrics.platform).toBe(SocialPlatform.FACEBOOK);
    expect(metrics.followersCount).toBe(3200);
    expect(metrics.reach).toBeNull(); // Missing scope -> null
    expect(metrics.impressions).toBeNull();
    expect(metrics.hasScopeForDeepInsights).toBe(false);
    expect(metrics.provenance).toBe('META_GRAPH_V21_TIER1_PUBLIC');
  });

  it('ingests Tier 2 deep insights when read_insights is granted', async () => {
    const accountWithInsights = {
      ...mockAccount,
      grantedScopes: ['pages_show_list', 'pages_read_engagement', 'read_insights'],
    };

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('fields=followers_count')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              id: 'page-123456',
              followers_count: 5000,
            }),
        });
      }
      if (url.includes('/insights')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              data: [
                {
                  name: 'page_impressions',
                  values: [{ value: 12500 }],
                },
                {
                  name: 'page_post_engagements',
                  values: [{ value: 890 }],
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const metrics = await adapter.fetchAccountMetrics(accountWithInsights, 'decrypted_token');

    expect(metrics.followersCount).toBe(5000);
    expect(metrics.impressions).toBe(12500);
    expect(metrics.engagementTotal).toBe(890);
    expect(metrics.hasScopeForDeepInsights).toBe(true);
    expect(metrics.provenance).toBe('META_GRAPH_V21_TIER2_INSIGHTS');
  });

  it('fetches post metrics with public reactions and comments', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('reactions.summary(true)')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              id: 'post-111',
              reactions: { summary: { total_count: 75 } },
              comments: { summary: { total_count: 18 } },
              shares: { count: 9 },
            }),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const postMetrics = await adapter.fetchPostMetrics(mockAccount, 'post-111', 'decrypted_token');

    expect(postMetrics.externalPostId).toBe('post-111');
    expect(postMetrics.likesCount).toBe(75);
    expect(postMetrics.commentsCount).toBe(18);
    expect(postMetrics.sharesCount).toBe(9);
    expect(postMetrics.reach).toBeNull(); // Tier 1 without read_insights
    expect(postMetrics.hasScopeForDeepInsights).toBe(false);
  });
});
