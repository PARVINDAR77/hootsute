import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInPublisherService } from './linkedin-publisher.service';
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

describe('LinkedInPublisherService', () => {
  let service: LinkedInPublisherService;

  const mockTarget: any = {
    id: 'target-li-1',
    scheduledPostId: 'post-1',
    socialAccountId: 'acc-li-1',
    platform: SocialPlatform.LINKEDIN,
    status: PublishTargetStatus.PENDING,
    variantId: 'var-li-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSnapshot: any = {
    draftId: 'draft-li-1',
    approvedRevisionNumber: 1,
    title: 'LinkedIn Announcement',
    variants: [
      {
        id: 'var-li-1',
        platform: 'LINKEDIN',
        headline: 'Exciting News',
        body: 'We are expanding our social integrations to LinkedIn!',
        callToAction: 'Check out our blog',
        hashtags: ['#B2B', '#SaaS'],
      },
    ],
  };

  const mockCompanyAccount: any = {
    id: 'acc-li-org-1',
    workspaceId: 'ws-1',
    provider: SocialProvider.LINKEDIN,
    providerAccountId: 'org-998877',
    accountName: 'Acme Corp',
    accountUsername: 'acme-corp',
    accountType: SocialAccountType.LINKEDIN_PAGE,
    profileImageUrl: null,
    connectionStatus: 'CONNECTED' as any,
    encryptedAccessToken: 'enc-token',
    grantedScopes: ['w_organization_social'],
    tokenExpiresAt: null,
    lastValidatedAt: new Date(),
    connectedByUserId: 'user-1',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfileAccount: SocialAccount = {
    id: 'acc-li-person-1',
    workspaceId: 'ws-1',
    provider: SocialProvider.LINKEDIN,
    providerAccountId: 'person-112233',
    accountName: 'John Doe',
    accountUsername: 'johndoe',
    accountType: SocialAccountType.LINKEDIN_PROFILE,
    profileImageUrl: null,
    connectionStatus: 'CONNECTED' as any,
    encryptedAccessToken: 'enc-token',
    grantedScopes: ['w_member_social'],
    tokenExpiresAt: null,
    lastValidatedAt: new Date(),
    connectedByUserId: 'user-1',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinkedInPublisherService],
    }).compile();

    service = module.get<LinkedInPublisherService>(LinkedInPublisherService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should publish successfully using mock token in test mode', async () => {
    const res = await service.publish(mockTarget, mockSnapshot, mockCompanyAccount, 'mock_token_123');

    expect(res.success).toBe(true);
    expect(res.outcome).toBe(AttemptOutcome.SUCCESS);
    expect(res.externalPostId).toContain('urn:li:share:mock_');
    expect(res.externalPostUrl).toContain('https://www.linkedin.com/feed/update/');
  });

  it('should dispatch to LinkedIn UGC API with organization URN for company pages', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'urn:li:share:live_12345' }),
    } as any);

    const res = await service.publish(mockTarget, mockSnapshot, mockCompanyAccount, 'real_live_token');

    expect(res.success).toBe(true);
    expect(res.outcome).toBe(AttemptOutcome.SUCCESS);
    expect(res.externalPostId).toBe('urn:li:share:live_12345');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.linkedin.com/v2/ugcPosts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer real_live_token',
        }),
        body: expect.stringContaining('urn:li:organization:org-998877'),
      }),
    );
  });

  it('should dispatch to LinkedIn UGC API with person URN for personal profiles', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'urn:li:share:person_post_54321' }),
    } as any);

    const res = await service.publish(mockTarget, mockSnapshot, mockProfileAccount, 'real_live_token');

    expect(res.success).toBe(true);
    expect(res.outcome).toBe(AttemptOutcome.SUCCESS);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.linkedin.com/v2/ugcPosts',
      expect.objectContaining({
        body: expect.stringContaining('urn:li:person:person-112233'),
      }),
    );
  });

  it('should return DEFINITIVE_FAILURE when LinkedIn API returns 400 Bad Request', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Invalid UGC post payload parameters',
    } as any);

    const res = await service.publish(mockTarget, mockSnapshot, mockCompanyAccount, 'real_live_token');

    expect(res.success).toBe(false);
    expect(res.outcome).toBe(AttemptOutcome.DEFINITIVE_FAILURE);
    expect(res.sanitizedErrorCode).toBe('LINKEDIN_API_400');
    expect(res.sanitizedErrorMessage).toContain('Invalid UGC post');
  });

  it('should return AMBIGUOUS_TIMEOUT on network exception during fetch', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Socket hung up'));

    const res = await service.publish(mockTarget, mockSnapshot, mockCompanyAccount, 'real_live_token');

    expect(res.success).toBe(false);
    expect(res.outcome).toBe(AttemptOutcome.AMBIGUOUS_TIMEOUT);
    expect(res.sanitizedErrorCode).toBe('LINKEDIN_NETWORK_ERROR');
  });
});
