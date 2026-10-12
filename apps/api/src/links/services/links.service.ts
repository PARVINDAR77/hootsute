import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  ShortenedLinkDto,
  LinkClickAnalyticsDto,
  LinkClickEventDto,
} from '@packages/shared';
import { CreateLinkDto } from '../dto/create-link.dto';

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('SHORT_URL_BASE') ||
      this.config.get<string>('APP_URL') ||
      'http://localhost:3001';
  }

  /**
   * Generates a collision-resistant random short code (Base62)
   */
  private generateRandomCode(length = 7): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  /**
   * Constructs the full destination URL with UTM parameters properly encoded
   */
  buildDestinationUrl(originalUrl: string, utmParams?: CreateLinkDto['utmParameters']): string {
    try {
      const url = new URL(originalUrl);
      if (utmParams) {
        if (utmParams.utmSource) url.searchParams.set('utm_source', utmParams.utmSource);
        if (utmParams.utmMedium) url.searchParams.set('utm_medium', utmParams.utmMedium);
        if (utmParams.utmCampaign) url.searchParams.set('utm_campaign', utmParams.utmCampaign);
        if (utmParams.utmTerm) url.searchParams.set('utm_term', utmParams.utmTerm);
        if (utmParams.utmContent) url.searchParams.set('utm_content', utmParams.utmContent);
      }
      return url.toString();
    } catch {
      throw new BadRequestException(`Invalid URL format: "${originalUrl}"`);
    }
  }

  /**
   * Creates a shortened link with optional custom code and UTM parameters
   */
  async createShortLink(
    workspaceId: string,
    userId: string,
    dto: CreateLinkDto,
  ): Promise<ShortenedLinkDto> {
    let shortCode = dto.customCode ? dto.customCode.trim() : '';

    if (shortCode) {
      // Check if custom code is already taken
      const existing = await this.prisma.shortenedLink.findUnique({
        where: { shortCode },
      });
      if (existing) {
        throw new ConflictException(`The custom short code "${shortCode}" is already in use`);
      }
    } else {
      // Generate a unique random code with retry on collision
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 5) {
        shortCode = this.generateRandomCode(7);
        const existing = await this.prisma.shortenedLink.findUnique({
          where: { shortCode },
        });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new ConflictException('Failed to generate a unique short code. Please try again.');
      }
    }

    const destinationUrl = this.buildDestinationUrl(dto.originalUrl, dto.utmParameters);

    const link = await this.prisma.shortenedLink.create({
      data: {
        workspaceId,
        createdById: userId,
        originalUrl: dto.originalUrl,
        shortCode,
        title: dto.title || null,
        utmSource: dto.utmParameters?.utmSource || null,
        utmMedium: dto.utmParameters?.utmMedium || null,
        utmCampaign: dto.utmParameters?.utmCampaign || null,
        utmTerm: dto.utmParameters?.utmTerm || null,
        utmContent: dto.utmParameters?.utmContent || null,
        destinationUrl,
      },
    });

    return this.mapToDto(link);
  }

  /**
   * Retrieves all active shortened links for a workspace with search filtering
   */
  async getWorkspaceLinks(workspaceId: string, search?: string): Promise<ShortenedLinkDto[]> {
    const whereClause: any = {
      workspaceId,
      deletedAt: null,
    };

    if (search && search.trim().length > 0) {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { shortCode: { contains: q, mode: 'insensitive' } },
        { originalUrl: { contains: q, mode: 'insensitive' } },
        { utmCampaign: { contains: q, mode: 'insensitive' } },
      ];
    }

    const links = await this.prisma.shortenedLink.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return links.map((l) => this.mapToDto(l));
  }

  /**
   * Retrieves click analytics, device breakdowns, and referrer statistics for a link
   */
  async getLinkAnalytics(workspaceId: string, linkId: string): Promise<LinkClickAnalyticsDto> {
    const link = await this.prisma.shortenedLink.findFirst({
      where: { id: linkId, workspaceId, deletedAt: null },
    });

    if (!link) {
      throw new NotFoundException(`Shortened link [${linkId}] not found in this workspace`);
    }

    // Retrieve click events
    const clickEvents = await this.prisma.linkClickEvent.findMany({
      where: { shortenedLinkId: link.id },
      orderBy: { clickedAt: 'desc' },
      take: 200,
    });

    // Unique clicks approximation via distinct IP hashes
    const uniqueIps = new Set(clickEvents.map((c) => c.ipHash).filter(Boolean));
    const uniqueClicksEstimate = uniqueIps.size > 0 ? uniqueIps.size : clickEvents.length;

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    clickEvents.forEach((ev) => {
      const dev = ev.deviceType || 'DESKTOP';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    const totalEvents = clickEvents.length || 1;
    const deviceBreakdown = Object.entries(deviceCounts).map(([deviceType, count]) => ({
      deviceType,
      count,
      percentage: Math.round((count / totalEvents) * 100),
    }));

    // Top referrers
    const referrerCounts: Record<string, number> = {};
    clickEvents.forEach((ev) => {
      const ref = ev.referrer || 'Direct / None';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });

    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Clicks over time (grouped by YYYY-MM-DD)
    const dailyCounts: Record<string, number> = {};
    clickEvents.forEach((ev) => {
      const day = ev.clickedAt.toISOString().slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const clicksOverTime = Object.entries(dailyCounts)
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentEvents: LinkClickEventDto[] = clickEvents.slice(0, 25).map((ev) => ({
      id: ev.id,
      shortenedLinkId: ev.shortenedLinkId,
      clickedAt: ev.clickedAt.toISOString(),
      referrer: ev.referrer,
      deviceType: (ev.deviceType as any) || 'DESKTOP',
      browser: ev.browser,
      os: ev.os,
      countryCode: ev.countryCode,
    }));

    return {
      link: this.mapToDto(link),
      totalClicks: link.totalClicks,
      uniqueClicksEstimate,
      clicksOverTime,
      deviceBreakdown,
      topReferrers,
      recentEvents,
    };
  }

  /**
   * Soft deletes a shortened link
   */
  async deleteLink(workspaceId: string, linkId: string): Promise<{ success: boolean }> {
    const link = await this.prisma.shortenedLink.findFirst({
      where: { id: linkId, workspaceId, deletedAt: null },
    });

    if (!link) {
      throw new NotFoundException(`Shortened link [${linkId}] not found in this workspace`);
    }

    await this.prisma.shortenedLink.update({
      where: { id: link.id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Resolves a public short code, records click telemetry asynchronously, and returns destination URL
   */
  async resolveAndRecordClick(
    shortCode: string,
    meta: {
      ip?: string;
      userAgent?: string;
      referrer?: string;
      countryCode?: string;
    },
  ): Promise<string> {
    const link = await this.prisma.shortenedLink.findFirst({
      where: { shortCode, deletedAt: null },
    });

    if (!link) {
      throw new NotFoundException(`Short link "${shortCode}" does not exist or has expired`);
    }

    // Hash IP for GDPR compliance
    const ipHash = meta.ip
      ? crypto.createHash('sha256').update(meta.ip).digest('hex').slice(0, 16)
      : null;

    // Parse simple device type & browser from user-agent
    const ua = meta.userAgent || '';
    let deviceType = 'DESKTOP';
    if (/mobile|iphone|ipod|android.*mobile|phone/i.test(ua)) deviceType = 'MOBILE';
    else if (/tablet|ipad|android/i.test(ua)) deviceType = 'TABLET';

    let browser = 'Unknown';
    if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/edg/i.test(ua)) browser = 'Edge';

    let os = 'Unknown';
    if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    // Parse referrer host
    let referrerHost: string | null = null;
    if (meta.referrer) {
      try {
        referrerHost = new URL(meta.referrer).hostname;
      } catch {
        referrerHost = meta.referrer.slice(0, 100);
      }
    }

    // Update click count and record event concurrently
    await Promise.all([
      this.prisma.shortenedLink.update({
        where: { id: link.id },
        data: {
          totalClicks: { increment: 1 },
          lastClickedAt: new Date(),
        },
      }),
      this.prisma.linkClickEvent.create({
        data: {
          shortenedLinkId: link.id,
          ipHash,
          referrer: referrerHost,
          userAgent: ua.slice(0, 255),
          deviceType,
          browser,
          os,
          countryCode: meta.countryCode || null,
        },
      }),
    ]).catch((err) => {
      this.logger.error(`Failed to record click event for [${shortCode}]: ${err.message}`);
    });

    return link.destinationUrl;
  }

  private mapToDto(link: any): ShortenedLinkDto {
    return {
      id: link.id,
      workspaceId: link.workspaceId,
      createdById: link.createdById,
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      shortUrl: `${this.baseUrl}/api/v1/links/r/${link.shortCode}`,
      title: link.title,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign,
      utmTerm: link.utmTerm,
      utmContent: link.utmContent,
      destinationUrl: link.destinationUrl,
      totalClicks: link.totalClicks,
      lastClickedAt: link.lastClickedAt ? link.lastClickedAt.toISOString() : null,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString(),
    };
  }
}
