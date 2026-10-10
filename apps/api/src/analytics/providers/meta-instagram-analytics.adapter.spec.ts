import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetaInstagramAnalyticsAdapter } from './meta-instagram-analytics.adapter';
import { SocialPlatform, SocialProvider, SocialAccountType, SocialConnectionStatus } from '@prisma/client';

describe('MetaInstagramAnalyticsAdapter', () => {
  let adapter: MetaInstagramAnalyticsAdapter;
  let originalFetch: typeof global.fetch;

  const mockAccount = {
    id: 'acc-ig-1',
    workspaceId: 'ws-1',
    provider: SocialProvider.META_INSTAGRAM,
    providerAccountId: 'ig-user-789',
    accountName: 'Test Instagram Creator',
    accountType: SocialAccountType.INSTAGRAM_CREATOR,
    connectionStatus: SocialConnectionStatus.CONNECTED,
    encryptedAccessToken: 'token',
    grantedScopes: ['instagram_basic'], // Missing instagram_manage_insights
    connectedByUserId: 'user-1',
    lastValidatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    accountUsername: 'test_creator',
    profileImageUrl: null,
    tokenExpiresAt: null,
    metadata: null,
  };

  beforeEach(async () => {
    originalFetch = global.fetch;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaInstagramAnalyticsAdapter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('v21.0'),
          },
        },
      ],
    }).compile();

    adapter = module.get<MetaInstagramAnalyticsAdapter>(MetaInstagramAnalyticsAdapter);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('clamps lookback date to maximum 30 days', async () => {
    let capturedUrl = '';
    const accountWithInsights = {
      ...mockAccount,
      grantedScopes: ['instagram_basic', 'instagram_manage_insights'],
    };

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('fields=followers_count')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () => Promise.resolve({ followers_count: 8500 }),
        });
      }
      if (url.includes('/insights')) {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    // Requesting a lookback 90 days ago (forbidden by Meta Graph API)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await adapter.fetchAccountMetrics(accountWithInsights, 'token', { since: ninetyDaysAgo });

    // Verify since parameter in capturedUrl is NOT 90 days ago (~7.7M sec ago) but clamped to <= 30 days (~2.59M sec ago)
    const urlObj = new URL(capturedUrl);
    const sinceEpoch = parseInt(urlObj.searchParams.get('since') || '0', 10);
    const earliestAllowedEpoch = Math.floor((Date.now() - 31 * 24 * 60 * 60 * 1000) / 1000);

    expect(sinceEpoch).toBeGreaterThan(earliestAllowedEpoch);
  });

  it('fetches Tier 1 public counters when instagram_manage_insights is missing', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('fields=followers_count')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              followers_count: 4200,
              follows_count: 350,
              media_count: 65,
            }),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const metrics = await adapter.fetchAccountMetrics(mockAccount, 'token');

    expect(metrics.platform).toBe(SocialPlatform.INSTAGRAM);
    expect(metrics.followersCount).toBe(4200);
    expect(metrics.reach).toBeNull();
    expect(metrics.hasScopeForDeepInsights).toBe(false);
    expect(metrics.provenance).toBe('META_GRAPH_V21_TIER1_PUBLIC');
  });

  it('fetches media metrics including video watch time and plays', async () => {
    const accountWithInsights = {
      ...mockAccount,
      grantedScopes: ['instagram_basic', 'instagram_manage_insights'],
    };

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('fields=id,media_type')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              id: 'media-reel-1',
              media_type: 'VIDEO',
              like_count: 140,
              comments_count: 22,
              timestamp: '2026-10-09T12:00:00Z',
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
                { name: 'impressions', values: [{ value: 4500 }] },
                { name: 'reach', values: [{ value: 2800 }] },
                { name: 'saved', values: [{ value: 65 }] },
                { name: 'shares', values: [{ value: 34 }] },
                { name: 'plays', values: [{ value: 3100 }] },
              ],
            }),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const postMetrics = await adapter.fetchPostMetrics(
      accountWithInsights,
      'media-reel-1',
      'token',
    );

    expect(postMetrics.externalPostId).toBe('media-reel-1');
    expect(postMetrics.likesCount).toBe(140);
    expect(postMetrics.commentsCount).toBe(22);
    expect(postMetrics.impressions).toBe(4500);
    expect(postMetrics.reach).toBe(2800);
    expect(postMetrics.savesCount).toBe(65);
    expect(postMetrics.videoViews).toBe(3100);
    expect(postMetrics.hasScopeForDeepInsights).toBe(true);
  });
});
