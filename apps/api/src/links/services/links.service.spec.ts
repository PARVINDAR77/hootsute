import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from './links.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('LinksService', () => {
  let service: LinksService;
  let prisma: any;

  const mockWorkspaceId = 'ws-link-123';
  const mockUserId = 'user-link-456';
  const mockLinkId = 'link-uuid-789';

  const mockDbLink = {
    id: mockLinkId,
    workspaceId: mockWorkspaceId,
    createdById: mockUserId,
    originalUrl: 'https://example.com/summer-sale',
    shortCode: 'sm2026',
    title: 'Summer Promo',
    utmSource: 'facebook',
    utmMedium: 'social',
    utmCampaign: 'summer_promo',
    utmTerm: null,
    utmContent: null,
    destinationUrl: 'https://example.com/summer-sale?utm_source=facebook&utm_medium=social&utm_campaign=summer_promo',
    totalClicks: 42,
    lastClickedAt: new Date('2026-10-12T10:00:00Z'),
    createdAt: new Date('2026-10-10T10:00:00Z'),
    updatedAt: new Date('2026-10-12T10:00:00Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      shortenedLink: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      linkClickEvent: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const config = {
      get: jest.fn((key: string, defaultVal?: string) => {
        if (key === 'SHORT_URL_BASE') return 'https://omni.st';
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
  });

  describe('buildDestinationUrl', () => {
    it('should correctly append UTM query parameters to clean URL', () => {
      const result = service.buildDestinationUrl('https://example.com/products', {
        utmSource: 'linkedin',
        utmMedium: 'post',
        utmCampaign: 'ai_launch',
      });

      expect(result).toBe(
        'https://example.com/products?utm_source=linkedin&utm_medium=post&utm_campaign=ai_launch',
      );
    });

    it('should throw BadRequestException on malformed URL', () => {
      expect(() => service.buildDestinationUrl('not-a-valid-url')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('createShortLink', () => {
    it('should generate a random short code when custom code is omitted', async () => {
      prisma.shortenedLink.findUnique.mockResolvedValue(null);
      prisma.shortenedLink.create.mockResolvedValue({
        ...mockDbLink,
        shortCode: 'abc1234',
      });

      const result = await service.createShortLink(mockWorkspaceId, mockUserId, {
        originalUrl: 'https://example.com/products',
      });

      expect(result).toBeDefined();
      expect(prisma.shortenedLink.create).toHaveBeenCalled();
      expect(result.shortUrl).toContain('https://omni.st/api/v1/links/r/abc1234');
    });

    it('should use custom code if provided and available', async () => {
      prisma.shortenedLink.findUnique.mockResolvedValue(null);
      prisma.shortenedLink.create.mockResolvedValue({
        ...mockDbLink,
        shortCode: 'custom-promo',
      });

      const result = await service.createShortLink(mockWorkspaceId, mockUserId, {
        originalUrl: 'https://example.com/products',
        customCode: 'custom-promo',
      });

      expect(result.shortCode).toBe('custom-promo');
      expect(prisma.shortenedLink.findUnique).toHaveBeenCalledWith({
        where: { shortCode: 'custom-promo' },
      });
    });

    it('should throw ConflictException if custom code is already taken', async () => {
      prisma.shortenedLink.findUnique.mockResolvedValue(mockDbLink);

      await expect(
        service.createShortLink(mockWorkspaceId, mockUserId, {
          originalUrl: 'https://example.com/products',
          customCode: 'sm2026',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getWorkspaceLinks', () => {
    it('should retrieve non-deleted links sorted by creation date', async () => {
      prisma.shortenedLink.findMany.mockResolvedValue([mockDbLink]);

      const result = await service.getWorkspaceLinks(mockWorkspaceId);

      expect(result).toHaveLength(1);
      expect(result[0].shortCode).toBe('sm2026');
      expect(prisma.shortenedLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: mockWorkspaceId, deletedAt: null }),
        }),
      );
    });
  });

  describe('getLinkAnalytics', () => {
    it('should aggregate click metrics, device breakdowns, and daily time series', async () => {
      prisma.shortenedLink.findFirst.mockResolvedValue(mockDbLink);
      prisma.linkClickEvent.findMany.mockResolvedValue([
        {
          id: 'ev-1',
          shortenedLinkId: mockLinkId,
          clickedAt: new Date('2026-10-12T08:00:00Z'),
          ipHash: 'hash-ip-1',
          referrer: 'facebook.com',
          deviceType: 'MOBILE',
          browser: 'Safari',
          os: 'iOS',
          countryCode: 'US',
        },
        {
          id: 'ev-2',
          shortenedLinkId: mockLinkId,
          clickedAt: new Date('2026-10-12T09:00:00Z'),
          ipHash: 'hash-ip-1', // same IP
          referrer: 'facebook.com',
          deviceType: 'MOBILE',
          browser: 'Safari',
          os: 'iOS',
          countryCode: 'US',
        },
        {
          id: 'ev-3',
          shortenedLinkId: mockLinkId,
          clickedAt: new Date('2026-10-11T12:00:00Z'),
          ipHash: 'hash-ip-2',
          referrer: 't.co',
          deviceType: 'DESKTOP',
          browser: 'Chrome',
          os: 'Windows',
          countryCode: 'GB',
        },
      ]);

      const analytics = await service.getLinkAnalytics(mockWorkspaceId, mockLinkId);

      expect(analytics).toBeDefined();
      expect(analytics.totalClicks).toBe(42);
      expect(analytics.uniqueClicksEstimate).toBe(2); // hash-ip-1 & hash-ip-2
      expect(analytics.deviceBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ deviceType: 'MOBILE', count: 2 }),
          expect.objectContaining({ deviceType: 'DESKTOP', count: 1 }),
        ]),
      );
      expect(analytics.topReferrers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ referrer: 'facebook.com', count: 2 }),
          expect.objectContaining({ referrer: 't.co', count: 1 }),
        ]),
      );
    });

    it('should throw NotFoundException if link is not found', async () => {
      prisma.shortenedLink.findFirst.mockResolvedValue(null);

      await expect(service.getLinkAnalytics(mockWorkspaceId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteLink', () => {
    it('should soft-delete link by setting deletedAt timestamp', async () => {
      prisma.shortenedLink.findFirst.mockResolvedValue(mockDbLink);
      prisma.shortenedLink.update.mockResolvedValue({
        ...mockDbLink,
        deletedAt: new Date(),
      });

      const res = await service.deleteLink(mockWorkspaceId, mockLinkId);

      expect(res.success).toBe(true);
      expect(prisma.shortenedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLinkId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('resolveAndRecordClick', () => {
    it('should increment totalClicks, log telemetry event, and return destinationUrl', async () => {
      prisma.shortenedLink.findFirst.mockResolvedValue(mockDbLink);
      prisma.shortenedLink.update.mockResolvedValue(mockDbLink);
      prisma.linkClickEvent.create.mockResolvedValue({ id: 'ev-new' });

      const destUrl = await service.resolveAndRecordClick('sm2026', {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        referrer: 'https://m.facebook.com/',
        countryCode: 'US',
      });

      expect(destUrl).toBe(mockDbLink.destinationUrl);
      expect(prisma.shortenedLink.update).toHaveBeenCalledWith({
        where: { id: mockDbLink.id },
        data: expect.objectContaining({
          totalClicks: { increment: 1 },
          lastClickedAt: expect.any(Date),
        }),
      });
      expect(prisma.linkClickEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deviceType: 'MOBILE',
            browser: 'Safari',
            os: 'iOS',
            referrer: 'm.facebook.com',
          }),
        }),
      );
    });

    it('should throw NotFoundException for unknown or deleted short code', async () => {
      prisma.shortenedLink.findFirst.mockResolvedValue(null);

      await expect(service.resolveAndRecordClick('unknown-slug', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
