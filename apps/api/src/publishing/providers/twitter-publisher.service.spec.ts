import { Test, TestingModule } from '@nestjs/testing';
import { TwitterPublisherService } from './twitter-publisher.service';
import {
  AttemptOutcome,
  ScheduledPostTarget,
  SocialAccount,
  SocialAccountType,
  SocialPlatform,
  SocialProvider,
  PublishTargetStatus,
} from '@prisma/client';
import { ScheduledPostContentSnapshot } from '@packages/shared';

describe('TwitterPublisherService', () => {
  let service: TwitterPublisherService;

  const mockTarget: any = {
    id: 'target-tw-1',
    scheduledPostId: 'post-tw-1',
    socialAccountId: 'acc-tw-1',
    platform: SocialPlatform.TWITTER_X,
    status: PublishTargetStatus.PENDING,
    variantId: 'var-tw-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSnapshot: any = {
    draftId: 'draft-tw-1',
    approvedRevisionNumber: 1,
    title: 'Twitter Update',
    variants: [
      {
        id: 'var-tw-1',
        platform: 'TWITTER_X',
        body: 'Exciting news! OmniSocial AI now supports Twitter / X scheduling and publishing.',
        hashtags: ['#OmniSocial', '#AI'],
      },
    ],
  };

  const mockAccount: any = {
    id: 'acc-tw-1',
    workspaceId: 'ws-1',
    provider: SocialProvider.TWITTER_X,
    providerAccountId: 'tw-user-12345',
    accountName: 'Tech Brand',
    accountUsername: 'TechBrandHQ',
    accountType: SocialAccountType.TWITTER_PROFILE,
    profileImageUrl: null,
    connectionStatus: 'CONNECTED' as any,
    encryptedAccessToken: 'enc-tw-token',
    grantedScopes: ['tweet.read', 'tweet.write'],
    tokenExpiresAt: null,
    lastValidatedAt: new Date(),
    connectedByUserId: 'user-1',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwitterPublisherService],
    }).compile();

    service = module.get<TwitterPublisherService>(TwitterPublisherService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should enforce 280-character maximum limit and definitively fail if exceeded', async () => {
    const longSnapshot: ScheduledPostContentSnapshot = {
      ...mockSnapshot,
      variants: [
        {
          id: 'var-tw-1',
          platform: 'TWITTER_X' as any,
          body: 'A'.repeat(300),
          hashtags: [],
        },
      ],
    };

    const res = await service.publish(mockTarget, longSnapshot, mockAccount, 'mock_token');

    expect(res.success).toBe(false);
    expect(res.outcome).toBe(AttemptOutcome.DEFINITIVE_FAILURE);
    expect(res.sanitizedErrorCode).toBe('TWITTER_CHARACTER_LIMIT_EXCEEDED');
    expect(res.sanitizedErrorMessage).toContain('exceeds the 280-character maximum limit');
  });

  it('should publish successfully using mock token in test mode', async () => {
    const res = await service.publish(mockTarget, mockSnapshot, mockAccount, 'mock_token_xyz');

    expect(res.success).toBe(true);
    expect(res.outcome).toBe(AttemptOutcome.SUCCESS);
    expect(res.externalPostId).toContain('mock_tw_');
    expect(res.externalPostUrl).toContain('https://twitter.com/TechBrandHQ/status/');
  });

  it('should dispatch to Twitter v2 /2/tweets with JSON payload', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '178901234567890' } }),
    } as any);

    const res = await service.publish(mockTarget, mockSnapshot, mockAccount, 'live_twitter_token');

    expect(res.success).toBe(true);
    expect(res.outcome).toBe(AttemptOutcome.SUCCESS);
    expect(res.externalPostId).toBe('178901234567890');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.twitter.com/2/tweets',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer live_twitter_token',
        }),
      }),
    );
  });

  it('should return DEFINITIVE_FAILURE on 403 Forbidden duplicate tweet error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'You are not allowed to create a duplicate Tweet.',
    } as any);

    const res = await service.publish(mockTarget, mockSnapshot, mockAccount, 'live_twitter_token');

    expect(res.success).toBe(false);
    expect(res.outcome).toBe(AttemptOutcome.DEFINITIVE_FAILURE);
    expect(res.sanitizedErrorCode).toBe('TWITTER_API_403');
  });

  it('should return AMBIGUOUS_TIMEOUT on network connection failure', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ETIMEDOUT'));

    const res = await service.publish(mockTarget, mockSnapshot, mockAccount, 'live_twitter_token');

    expect(res.success).toBe(false);
    expect(res.outcome).toBe(AttemptOutcome.AMBIGUOUS_TIMEOUT);
    expect(res.sanitizedErrorCode).toBe('TWITTER_NETWORK_ERROR');
  });
});
