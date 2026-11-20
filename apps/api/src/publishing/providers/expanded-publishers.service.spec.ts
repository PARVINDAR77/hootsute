import { PinterestPublisherService } from './pinterest-publisher.service';
import { YouTubePublisherService } from './youtube-publisher.service';
import { TikTokPublisherService } from './tiktok-publisher.service';
import { ThreadsPublisherService } from './threads-publisher.service';
import { AttemptOutcome } from '@prisma/client';
import { SocialPlatform } from '@packages/shared';

describe('Expanded Social Platform Publishers (Pinterest, YouTube, TikTok, Threads)', () => {
  const mockTarget: any = { id: 'target-1', variantId: 'var-1' };
  const mockAccount: any = {
    id: 'acc-1',
    providerAccountId: 'ext-123',
    accountName: 'Acme Brand',
    accountUsername: 'acmebrand',
    metadata: {},
  };

  it('PinterestPublisherService publishes a Pin in mock mode', async () => {
    const svc = new PinterestPublisherService();
    const res = await svc.publish(
      mockTarget,
      {
        title: 'Spring Collection',
        variants: [{ id: 'var-1', platform: SocialPlatform.PINTEREST, headline: 'Spring Pin', body: 'Fresh styles!', hashtags: ['#Spring'] }],
      } as any,
      mockAccount,
      'mock_pinterest_token',
    );
    expect(res.success).toBe(true);
    expect(res.outcome).toBe(AttemptOutcome.SUCCESS);
    expect(res.externalPostUrl).toContain('pinterest.com/pin/');
  });

  it('YouTubePublisherService publishes video metadata in mock mode', async () => {
    const svc = new YouTubePublisherService();
    const res = await svc.publish(
      mockTarget,
      {
        title: 'Product Keynote',
        variants: [{ id: 'var-1', platform: SocialPlatform.YOUTUBE, headline: 'Keynote Recap', body: 'Watch highlights', hashtags: ['#Tech'] }],
      } as any,
      mockAccount,
      'mock_youtube_token',
    );
    expect(res.success).toBe(true);
    expect(res.externalPostUrl).toContain('youtube.com/watch?v=');
  });

  it('TikTokPublisherService publishes short-form post in mock mode', async () => {
    const svc = new TikTokPublisherService();
    const res = await svc.publish(
      mockTarget,
      {
        title: 'Behind the Scenes',
        variants: [{ id: 'var-1', platform: SocialPlatform.TIKTOK, body: 'Quick studio tour!', hashtags: ['#BTS'] }],
      } as any,
      mockAccount,
      'mock_tiktok_token',
    );
    expect(res.success).toBe(true);
    expect(res.externalPostUrl).toContain('tiktok.com/@acmebrand');
  });

  it('ThreadsPublisherService enforces 500-character limit and publishes in mock mode', async () => {
    const svc = new ThreadsPublisherService();
    const tooLong = await svc.publish(
      mockTarget,
      {
        title: 'Long Thread',
        variants: [{ id: 'var-1', platform: SocialPlatform.THREADS, body: 'a'.repeat(505), hashtags: [] }],
      } as any,
      mockAccount,
      'mock_threads_token',
    );
    expect(tooLong.success).toBe(false);
    expect(tooLong.sanitizedErrorCode).toBe('THREADS_CHARACTER_LIMIT_EXCEEDED');

    const ok = await svc.publish(
      mockTarget,
      {
        title: 'Short Thread',
        variants: [{ id: 'var-1', platform: SocialPlatform.THREADS, body: 'Hello Threads!', hashtags: ['#Launch'] }],
      } as any,
      mockAccount,
      'mock_threads_token',
    );
    expect(ok.success).toBe(true);
    expect(ok.externalPostUrl).toContain('threads.net/@acmebrand');
  });
});
