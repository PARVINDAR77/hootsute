import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';

export interface PublicPlatformOverview {
  supportedPlatformsCount: number;
  supportedPlatforms: string[];
  activeWorkspacesCount: number;
  connectedAccountsCount: number;
  publishedPostsCount: number;
  aiDraftsGeneratedCount: number;
}

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submitContactInquiry(
    dto: CreateContactInquiryDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const inquiry = await this.prisma.contactInquiry.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        company: dto.company?.trim() || null,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        ipAddress: meta?.ipAddress || null,
        userAgent: meta?.userAgent?.slice(0, 250) || null,
        status: 'RECEIVED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    });

    this.logger.log(`Public contact inquiry recorded [${inquiry.id}] from ${inquiry.email}`);
    return inquiry;
  }

  async getPlatformOverview(): Promise<PublicPlatformOverview> {
    const [activeWorkspacesCount, connectedAccountsCount, publishedPostsCount, aiDraftsGeneratedCount] =
      await Promise.all([
        this.prisma.workspace.count({ where: { status: 'ACTIVE' } }),
        this.prisma.socialAccount.count({ where: { connectionStatus: 'CONNECTED' } }),
        this.prisma.scheduledPost.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.contentDraft.count(),
      ]);

    return {
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
      activeWorkspacesCount,
      connectedAccountsCount,
      publishedPostsCount,
      aiDraftsGeneratedCount,
    };
  }
}
