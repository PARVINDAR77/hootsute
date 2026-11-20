import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SentimentAnalyzerService } from './sentiment-analyzer.service';
import { CreateListeningQueryDto } from '../dto/create-listening-query.dto';
import { UpdateListeningQueryDto } from '../dto/update-listening-query.dto';
import { ListeningFeedFilterDto } from '../dto/listening-feed-filter.dto';
import {
  ListeningQueryDto,
  ListeningMentionDto,
  ListeningAnalyticsSummaryDto,
} from '@packages/shared';
import { SocialPlatform, ListeningSentiment } from '@prisma/client';

@Injectable()
export class ListeningService {
  private readonly logger = new Logger(ListeningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sentimentAnalyzer: SentimentAnalyzerService,
  ) {}

  /**
   * Creates a new listening query for the workspace and seeds starter mentions
   */
  async createListeningQuery(
    workspaceId: string,
    userId: string,
    dto: CreateListeningQueryDto,
  ): Promise<ListeningQueryDto> {
    const existing = await this.prisma.listeningQuery.findFirst({
      where: {
        workspaceId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException(`A listening query with the name "${dto.name}" already exists.`);
    }

    const query = await this.prisma.listeningQuery.create({
      data: {
        workspaceId,
        createdById: userId,
        name: dto.name,
        keywords: dto.keywords,
        excludedKeywords: dto.excludedKeywords || [],
        platforms: dto.platforms,
        languages: dto.languages || ['en'],
        sentimentFilter: dto.sentimentFilter || 'ALL',
        isActive: true,
      },
    });

    // Seed realistic sample mentions for the newly created query
    await this.seedSampleMentionsForQuery(
      workspaceId,
      query.id,
      query.name,
      query.keywords,
      query.platforms,
    );

    return this.mapQueryToDto(query, 0);
  }

  /**
   * Retrieves all listening queries for a workspace with mention counters
   */
  async getListeningQueries(workspaceId: string): Promise<ListeningQueryDto[]> {
    const queries = await this.prisma.listeningQuery.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { mentions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return queries.map((q) => this.mapQueryToDto(q, q._count.mentions));
  }

  /**
   * Retrieves a single listening query by ID
   */
  async getListeningQueryById(workspaceId: string, queryId: string): Promise<ListeningQueryDto> {
    const query = await this.prisma.listeningQuery.findFirst({
      where: { id: queryId, workspaceId },
      include: {
        _count: {
          select: { mentions: true },
        },
      },
    });

    if (!query) {
      throw new NotFoundException(`Listening query with ID "${queryId}" not found.`);
    }

    return this.mapQueryToDto(query, query._count.mentions);
  }

  /**
   * Updates an existing listening query
   */
  async updateListeningQuery(
    workspaceId: string,
    queryId: string,
    dto: UpdateListeningQueryDto,
  ): Promise<ListeningQueryDto> {
    const existing = await this.prisma.listeningQuery.findFirst({
      where: { id: queryId, workspaceId },
    });

    if (!existing) {
      throw new NotFoundException(`Listening query with ID "${queryId}" not found.`);
    }

    const updated = await this.prisma.listeningQuery.update({
      where: { id: queryId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.keywords ? { keywords: dto.keywords } : {}),
        ...(dto.excludedKeywords !== undefined ? { excludedKeywords: dto.excludedKeywords } : {}),
        ...(dto.platforms ? { platforms: dto.platforms } : {}),
        ...(dto.languages ? { languages: dto.languages } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sentimentFilter ? { sentimentFilter: dto.sentimentFilter } : {}),
      },
      include: {
        _count: {
          select: { mentions: true },
        },
      },
    });

    return this.mapQueryToDto(updated, updated._count.mentions);
  }

  /**
   * Deletes a listening query and its associated mentions
   */
  async deleteListeningQuery(workspaceId: string, queryId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.listeningQuery.findFirst({
      where: { id: queryId, workspaceId },
    });

    if (!existing) {
      throw new NotFoundException(`Listening query with ID "${queryId}" not found.`);
    }

    await this.prisma.listeningQuery.delete({
      where: { id: queryId },
    });

    return { success: true };
  }

  /**
   * Retrieves paginated mentions stream with advanced filters
   */
  async getListeningFeed(
    workspaceId: string,
    filter: ListeningFeedFilterDto,
  ): Promise<{ data: ListeningMentionDto[]; total: number; page: number; limit: number }> {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId,
    };

    if (filter.queryId) {
      where.queryId = filter.queryId;
    }

    if (filter.sentiment && filter.sentiment !== 'ALL') {
      where.sentiment = filter.sentiment;
    }

    if (filter.platform) {
      where.platform = filter.platform;
    }

    if (filter.onlyStarred) {
      where.isStarred = true;
    }

    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      where.OR = [
        { content: { contains: term, mode: 'insensitive' } },
        { authorHandle: { contains: term, mode: 'insensitive' } },
        { authorName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [mentions, total] = await Promise.all([
      this.prisma.listeningMention.findMany({
        where,
        include: {
          query: {
            select: { name: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.listeningMention.count({ where }),
    ]);

    return {
      data: mentions.map((m) => this.mapMentionToDto(m, m.query?.name)),
      total,
      page,
      limit,
    };
  }

  /**
   * Toggles the starred state of a mention
   */
  async toggleStarMention(workspaceId: string, mentionId: string): Promise<ListeningMentionDto> {
    const existing = await this.prisma.listeningMention.findFirst({
      where: { id: mentionId, workspaceId },
      include: { query: { select: { name: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Mention with ID "${mentionId}" not found.`);
    }

    const updated = await this.prisma.listeningMention.update({
      where: { id: mentionId },
      data: { isStarred: !existing.isStarred },
      include: { query: { select: { name: true } } },
    });

    return this.mapMentionToDto(updated, updated.query?.name);
  }

  /**
   * Marks a mention as read or unread
   */
  async markMentionRead(
    workspaceId: string,
    mentionId: string,
    isRead = true,
  ): Promise<ListeningMentionDto> {
    const existing = await this.prisma.listeningMention.findFirst({
      where: { id: mentionId, workspaceId },
      include: { query: { select: { name: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Mention with ID "${mentionId}" not found.`);
    }

    const updated = await this.prisma.listeningMention.update({
      where: { id: mentionId },
      data: { isRead },
      include: { query: { select: { name: true } } },
    });

    return this.mapMentionToDto(updated, updated.query?.name);
  }

  /**
   * Aggregates brand sentiment analytics and trends across listening mentions
   */
  async getListeningAnalytics(
    workspaceId: string,
    queryId?: string,
  ): Promise<ListeningAnalyticsSummaryDto> {
    const where: any = { workspaceId };
    if (queryId) {
      where.queryId = queryId;
    }

    const mentions = await this.prisma.listeningMention.findMany({
      where,
      orderBy: { publishedAt: 'asc' },
    });

    const totalMentions = mentions.length;
    let estimatedTotalReach = 0;
    let sentimentScoreSum = 0;

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    const platformCounts: Record<string, number> = {};
    const authorStats: Record<
      string,
      { authorHandle: string; authorName?: string | null; platform: SocialPlatform; followersCount: number; mentionsCount: number }
    > = {};

    const dailyGroups: Record<
      string,
      { positive: number; neutral: number; negative: number; total: number }
    > = {};

    for (const m of mentions) {
      estimatedTotalReach += m.reachEstimate || 0;
      sentimentScoreSum += m.sentimentScore || 0;

      if (m.sentiment === 'POSITIVE') positiveCount++;
      else if (m.sentiment === 'NEGATIVE') negativeCount++;
      else neutralCount++;

      // Platform stats
      platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;

      // Author stats
      if (!authorStats[m.authorHandle]) {
        authorStats[m.authorHandle] = {
          authorHandle: m.authorHandle,
          authorName: m.authorName,
          platform: m.platform,
          followersCount: m.authorFollowersCount,
          mentionsCount: 0,
        };
      }
      authorStats[m.authorHandle].mentionsCount += 1;

      // Daily time-series
      const dayKey = m.publishedAt.toISOString().slice(0, 10);
      if (!dailyGroups[dayKey]) {
        dailyGroups[dayKey] = { positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      dailyGroups[dayKey].total += 1;
      if (m.sentiment === 'POSITIVE') dailyGroups[dayKey].positive += 1;
      else if (m.sentiment === 'NEGATIVE') dailyGroups[dayKey].negative += 1;
      else dailyGroups[dayKey].neutral += 1;
    }

    const divisor = totalMentions || 1;
    const averageSentimentScore = totalMentions > 0 ? parseFloat((sentimentScoreSum / totalMentions).toFixed(2)) : 0.0;

    const sentimentBreakdown = [
      {
        sentiment: ListeningSentiment.POSITIVE,
        count: positiveCount,
        percentage: Math.round((positiveCount / divisor) * 100),
      },
      {
        sentiment: ListeningSentiment.NEUTRAL,
        count: neutralCount,
        percentage: Math.round((neutralCount / divisor) * 100),
      },
      {
        sentiment: ListeningSentiment.NEGATIVE,
        count: negativeCount,
        percentage: Math.round((negativeCount / divisor) * 100),
      },
    ];

    const mentionsOverTime = Object.entries(dailyGroups)
      .map(([date, counts]) => ({
        date,
        positive: counts.positive,
        neutral: counts.neutral,
        negative: counts.negative,
        total: counts.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topAuthors = Object.values(authorStats)
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, 6);

    const platformBreakdown = Object.entries(platformCounts).map(([platform, count]) => ({
      platform: platform as any,
      count,
      percentage: Math.round((count / divisor) * 100),
    }));

    const topAuthorsFormatted = topAuthors.map((a) => ({
      ...a,
      platform: a.platform as any,
    }));

    return {
      totalMentions,
      estimatedTotalReach,
      averageSentimentScore,
      sentimentBreakdown: sentimentBreakdown as any,
      mentionsOverTime,
      topAuthors: topAuthorsFormatted,
      platformBreakdown,
    };
  }

  /**
   * Seeds realistic sample mentions matching keywords across requested platforms
   */
  async seedSampleMentionsForQuery(
    workspaceId: string,
    queryId: string,
    queryName: string,
    keywords: string[],
    platforms: SocialPlatform[],
  ): Promise<void> {
    const mainKeyword = keywords[0] || 'OmniSocial';
    const now = Date.now();

    const sampleTemplates = [
      {
        platform: SocialPlatform.TWITTER_X,
        authorHandle: '@tech_growth_guru',
        authorName: 'Alex Rivers',
        followersCount: 14200,
        content: `Just switched our agency publishing workflow to ${mainKeyword}. The multi-network queue and AI hashtag recommendations are awesome! Huge time saver.`,
        engagementCount: 42,
        reachEstimate: 12500,
        hoursAgo: 3,
      },
      {
        platform: SocialPlatform.LINKEDIN,
        authorHandle: 'sarah-jenkins-cmo',
        authorName: 'Sarah Jenkins',
        followersCount: 28500,
        content: `Evaluating social media toolkits for our 2026 Q3 rollout. Testing ${mainKeyword} alongside legacy solutions. The multi-level approval matrix and bulk multi-network publishing workflow are solid for client sign-offs.`,
        engagementCount: 89,
        reachEstimate: 24000,
        hoursAgo: 8,
      },
      {
        platform: SocialPlatform.TWITTER_X,
        authorHandle: '@digital_dan',
        authorName: 'Dan Sullivan',
        followersCount: 3800,
        content: `Anyone else experiencing slow CSV bulk upload times on ${mainKeyword}? File with 80 posts threw an error on line 42. Could be better formatted error messaging.`,
        engagementCount: 11,
        reachEstimate: 2900,
        hoursAgo: 14,
      },
      {
        platform: SocialPlatform.INSTAGRAM,
        authorHandle: 'creative_agency_la',
        authorName: 'Studio Nova LA',
        followersCount: 52000,
        content: `Sneak peek behind our weekly content planning routine! We organize our Instagram carousels and festival promos with ${mainKeyword}. Love the clean calendar view! ✨🔥`,
        engagementCount: 320,
        reachEstimate: 45000,
        hoursAgo: 22,
      },
      {
        platform: SocialPlatform.TWITTER_X,
        authorHandle: '@saas_founder_jack',
        authorName: 'Jack Vance',
        followersCount: 18900,
        content: `The new branded link shortener with custom UTM presets in ${mainKeyword} is fantastic. Attribution tracking just got 10x easier.`,
        engagementCount: 65,
        reachEstimate: 16000,
        hoursAgo: 30,
      },
      {
        platform: SocialPlatform.LINKEDIN,
        authorHandle: 'elena-rostova-growth',
        authorName: 'Elena Rostova',
        followersCount: 9400,
        content: `Honest review: ${mainKeyword} is good for scheduling, but would love to see deeper social listening and competitor keyword alerts added soon.`,
        engagementCount: 34,
        reachEstimate: 8100,
        hoursAgo: 45,
      },
    ];

    // Filter by requested platforms (or default to sample platform if only 1 platform configured)
    const validPlatforms = platforms.length > 0 ? platforms : [SocialPlatform.TWITTER_X];

    for (let i = 0; i < sampleTemplates.length; i++) {
      const template = sampleTemplates[i];
      const platformToUse = validPlatforms.includes(template.platform)
        ? template.platform
        : validPlatforms[i % validPlatforms.length];

      const externalId = `sim_${queryId.slice(0, 8)}_${i + 1}`;
      const publishedAt = new Date(now - template.hoursAgo * 3600000);

      const sentimentResult = this.sentimentAnalyzer.analyze(template.content);

      try {
        await this.prisma.listeningMention.upsert({
          where: {
            platform_externalId: {
              platform: platformToUse,
              externalId,
            },
          },
          create: {
            queryId,
            workspaceId,
            platform: platformToUse,
            externalId,
            authorHandle: template.authorHandle,
            authorName: template.authorName,
            authorAvatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${template.authorHandle}`,
            authorFollowersCount: template.followersCount,
            content: template.content,
            url: `https://${platformToUse.toLowerCase()}.com/post/${externalId}`,
            publishedAt,
            sentiment: sentimentResult.sentiment,
            sentimentScore: sentimentResult.sentimentScore,
            reachEstimate: template.reachEstimate,
            engagementCount: template.engagementCount,
            isRead: false,
            isStarred: i === 0,
          },
          update: {},
        });
      } catch (err: any) {
        this.logger.warn(`Could not seed mention ${externalId}: ${err.message}`);
      }
    }
  }

  private mapQueryToDto(query: any, count = 0): ListeningQueryDto {
    return {
      id: query.id,
      workspaceId: query.workspaceId,
      createdById: query.createdById,
      name: query.name,
      keywords: query.keywords,
      excludedKeywords: query.excludedKeywords,
      platforms: query.platforms as any,
      languages: query.languages,
      isActive: query.isActive,
      sentimentFilter: query.sentimentFilter,
      totalMentions: count,
      createdAt: query.createdAt.toISOString(),
      updatedAt: query.updatedAt.toISOString(),
    };
  }

  private mapMentionToDto(mention: any, queryName?: string): ListeningMentionDto {
    return {
      id: mention.id,
      queryId: mention.queryId,
      queryName: queryName || undefined,
      workspaceId: mention.workspaceId,
      platform: mention.platform as any,
      externalId: mention.externalId,
      authorHandle: mention.authorHandle,
      authorName: mention.authorName,
      authorAvatarUrl: mention.authorAvatarUrl,
      authorFollowersCount: mention.authorFollowersCount,
      content: mention.content,
      url: mention.url,
      publishedAt: mention.publishedAt.toISOString(),
      sentiment: mention.sentiment as any,
      sentimentScore: mention.sentimentScore,
      reachEstimate: mention.reachEstimate,
      engagementCount: mention.engagementCount,
      isRead: mention.isRead,
      isStarred: mention.isStarred,
      createdAt: mention.createdAt.toISOString(),
    };
  }
}
