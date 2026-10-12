import { Test, TestingModule } from '@nestjs/testing';
import { ListeningService } from './listening.service';
import { SentimentAnalyzerService } from './sentiment-analyzer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SocialPlatform, ListeningSentiment } from '@packages/shared';

describe('ListeningService', () => {
  let service: ListeningService;
  let prisma: any;
  let sentimentAnalyzer: SentimentAnalyzerService;

  const mockWorkspaceId = 'ws-test-111';
  const mockUserId = 'usr-test-222';
  const mockQueryId = 'qry-test-333';
  const mockMentionId = 'men-test-444';

  const mockDbQuery = {
    id: mockQueryId,
    workspaceId: mockWorkspaceId,
    createdById: mockUserId,
    name: 'Brand Mentions',
    keywords: ['omnisocial', 'hootsuite'],
    excludedKeywords: ['jobs'],
    platforms: [SocialPlatform.TWITTER_X, SocialPlatform.LINKEDIN],
    languages: ['en'],
    isActive: true,
    sentimentFilter: 'ALL',
    createdAt: new Date('2026-05-01T10:00:00Z'),
    updatedAt: new Date('2026-05-01T10:00:00Z'),
    _count: { mentions: 5 },
  };

  const mockDbMention = {
    id: mockMentionId,
    queryId: mockQueryId,
    workspaceId: mockWorkspaceId,
    platform: SocialPlatform.TWITTER_X,
    externalId: 'ext_999',
    authorHandle: '@tech_reviewer',
    authorName: 'Tech Reviewer',
    authorAvatarUrl: 'https://example.com/avatar.jpg',
    authorFollowersCount: 15000,
    content: 'Loving the new features on omnisocial!',
    url: 'https://twitter.com/tech_reviewer/status/ext_999',
    publishedAt: new Date('2026-05-02T12:00:00Z'),
    sentiment: 'POSITIVE',
    sentimentScore: 0.65,
    reachEstimate: 14000,
    engagementCount: 45,
    isRead: false,
    isStarred: false,
    createdAt: new Date('2026-05-02T12:05:00Z'),
    query: { name: 'Brand Mentions' },
  };

  beforeEach(async () => {
    prisma = {
      listeningQuery: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      listeningMention: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListeningService,
        SentimentAnalyzerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ListeningService>(ListeningService);
    sentimentAnalyzer = module.get<SentimentAnalyzerService>(SentimentAnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createListeningQuery', () => {
    it('should throw BadRequestException if query with same name exists', async () => {
      prisma.listeningQuery.findFirst.mockResolvedValue(mockDbQuery);

      await expect(
        service.createListeningQuery(mockWorkspaceId, mockUserId, {
          name: 'Brand Mentions',
          keywords: ['omnisocial'],
          platforms: [SocialPlatform.TWITTER_X],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create query and seed starter mentions', async () => {
      prisma.listeningQuery.findFirst.mockResolvedValue(null);
      prisma.listeningQuery.create.mockResolvedValue(mockDbQuery);
      prisma.listeningMention.upsert.mockResolvedValue({});

      const result = await service.createListeningQuery(mockWorkspaceId, mockUserId, {
        name: 'Brand Mentions',
        keywords: ['omnisocial'],
        platforms: [SocialPlatform.TWITTER_X, SocialPlatform.LINKEDIN],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(mockQueryId);
      expect(prisma.listeningQuery.create).toHaveBeenCalled();
      expect(prisma.listeningMention.upsert).toHaveBeenCalled();
    });
  });

  describe('getListeningQueries', () => {
    it('should return list of queries with total mentions', async () => {
      prisma.listeningQuery.findMany.mockResolvedValue([mockDbQuery]);

      const result = await service.getListeningQueries(mockWorkspaceId);

      expect(result).toHaveLength(1);
      expect(result[0].totalMentions).toBe(5);
    });
  });

  describe('updateListeningQuery', () => {
    it('should throw NotFoundException if query does not exist', async () => {
      prisma.listeningQuery.findFirst.mockResolvedValue(null);

      await expect(
        service.updateListeningQuery(mockWorkspaceId, 'non-existent', {
          name: 'New Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update query when found', async () => {
      prisma.listeningQuery.findFirst.mockResolvedValue(mockDbQuery);
      prisma.listeningQuery.update.mockResolvedValue({
        ...mockDbQuery,
        name: 'Updated Name',
      });

      const result = await service.updateListeningQuery(mockWorkspaceId, mockQueryId, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deleteListeningQuery', () => {
    it('should delete query when found', async () => {
      prisma.listeningQuery.findFirst.mockResolvedValue(mockDbQuery);
      prisma.listeningQuery.delete.mockResolvedValue(mockDbQuery);

      const result = await service.deleteListeningQuery(mockWorkspaceId, mockQueryId);
      expect(result).toEqual({ success: true });
    });
  });

  describe('getListeningFeed', () => {
    it('should return paginated mentions with filters', async () => {
      prisma.listeningMention.findMany.mockResolvedValue([mockDbMention]);
      prisma.listeningMention.count.mockResolvedValue(1);

      const result = await service.getListeningFeed(mockWorkspaceId, {
        queryId: mockQueryId,
        sentiment: ListeningSentiment.POSITIVE,
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].authorHandle).toBe('@tech_reviewer');
    });
  });

  describe('toggleStarMention and markRead', () => {
    it('should toggle star state', async () => {
      prisma.listeningMention.findFirst.mockResolvedValue(mockDbMention);
      prisma.listeningMention.update.mockResolvedValue({
        ...mockDbMention,
        isStarred: true,
      });

      const result = await service.toggleStarMention(mockWorkspaceId, mockMentionId);
      expect(result.isStarred).toBe(true);
    });

    it('should mark mention as read', async () => {
      prisma.listeningMention.findFirst.mockResolvedValue(mockDbMention);
      prisma.listeningMention.update.mockResolvedValue({
        ...mockDbMention,
        isRead: true,
      });

      const result = await service.markMentionRead(mockWorkspaceId, mockMentionId, true);
      expect(result.isRead).toBe(true);
    });
  });

  describe('getListeningAnalytics', () => {
    it('should calculate sentiment breakdown, reach, and top authors correctly', async () => {
      prisma.listeningMention.findMany.mockResolvedValue([
        mockDbMention,
        {
          ...mockDbMention,
          id: 'men-2',
          sentiment: 'NEGATIVE',
          sentimentScore: -0.5,
          authorHandle: '@critic_jane',
          authorFollowersCount: 25000,
          reachEstimate: 20000,
          platform: SocialPlatform.LINKEDIN,
          publishedAt: new Date('2026-05-02T14:00:00Z'),
        },
      ]);

      const analytics = await service.getListeningAnalytics(mockWorkspaceId);

      expect(analytics.totalMentions).toBe(2);
      expect(analytics.estimatedTotalReach).toBe(34000);
      expect(analytics.sentimentBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sentiment: ListeningSentiment.POSITIVE, count: 1 }),
          expect.objectContaining({ sentiment: ListeningSentiment.NEGATIVE, count: 1 }),
        ]),
      );
      expect(analytics.topAuthors[0].authorHandle).toBe('@critic_jane');
    });
  });
});
