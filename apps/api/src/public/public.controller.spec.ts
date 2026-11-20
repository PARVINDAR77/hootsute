import { PublicController } from './public.controller';

describe('PublicController', () => {
  const mockPublicService = {
    getPlatformOverview: jest.fn(),
    submitContactInquiry: jest.fn(),
  };

  let controller: PublicController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PublicController(mockPublicService as any);
  });

  it('returns real platform overview metrics', async () => {
    mockPublicService.getPlatformOverview.mockResolvedValue({
      supportedPlatformsCount: 8,
      supportedPlatforms: [
        'INSTAGRAM',
        'FACEBOOK',
        'TWITTER_X',
        'LINKEDIN',
        'PINTEREST',
        'YOUTUBE',
        'TIKTOK',
        'THREADS',
      ],
      activeWorkspacesCount: 3,
      connectedAccountsCount: 12,
      publishedPostsCount: 45,
      aiDraftsGeneratedCount: 60,
    });

    const res = await controller.getOverview();
    expect(res.supportedPlatformsCount).toBe(8);
    expect(res.activeWorkspacesCount).toBe(3);
  });

  it('submits contact inquiry with request metadata', async () => {
    mockPublicService.submitContactInquiry.mockResolvedValue({
      id: 'inq-1',
      name: 'Alex Rivera',
      email: 'alex@company.com',
      subject: 'Demo request',
      status: 'RECEIVED',
    });

    const res = await controller.submitContact(
      {
        name: 'Alex Rivera',
        email: 'alex@company.com',
        company: 'Acme',
        subject: 'Demo request',
        message: 'We want to evaluate OmniSocial AI for our agency team.',
      },
      { headers: { 'user-agent': 'jest-test' }, ip: '127.0.0.1' } as any,
    );

    expect(mockPublicService.submitContactInquiry).toHaveBeenCalledTimes(1);
    expect(res.inquiry.id).toBe('inq-1');
  });
});
