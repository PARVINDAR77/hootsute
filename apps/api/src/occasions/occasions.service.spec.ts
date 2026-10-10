import { Test, TestingModule } from '@nestjs/testing';
import { OccasionsService } from './occasions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('OccasionsService', () => {
  let service: OccasionsService;
  let prisma: any;

  const mockPrismaService = {
    festivalOccasion: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccasionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OccasionsService>(OccasionsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listOccasions', () => {
    it('should query active occasions with pagination', async () => {
      prisma.festivalOccasion.count.mockResolvedValue(12);
      prisma.festivalOccasion.findMany.mockResolvedValue([
        { id: '1', slug: 'diwali', name: 'Diwali' },
        { id: '2', slug: 'holi', name: 'Holi' },
      ]);

      const result = await service.listOccasions({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 12,
        totalPages: 2,
      });
      expect(prisma.festivalOccasion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should apply category and dateType filters', async () => {
      prisma.festivalOccasion.count.mockResolvedValue(1);
      prisma.festivalOccasion.findMany.mockResolvedValue([
        { id: '1', slug: 'diwali', category: 'Major Festival', dateType: 'LUNAR_CALENDAR' },
      ]);

      const result = await service.listOccasions({
        category: 'Major Festival',
        dateType: 'LUNAR_CALENDAR',
      });

      expect(result.items).toHaveLength(1);
      expect(prisma.festivalOccasion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            category: { equals: 'Major Festival', mode: 'insensitive' },
            dateType: { equals: 'LUNAR_CALENDAR', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('getOccasionBySlug', () => {
    it('should return occasion when found and active', async () => {
      const occasion = { id: '1', slug: 'diwali', name: 'Diwali', isActive: true };
      prisma.festivalOccasion.findUnique.mockResolvedValue(occasion);

      const result = await service.getOccasionBySlug('diwali');
      expect(result).toEqual(occasion);
      expect(prisma.festivalOccasion.findUnique).toHaveBeenCalledWith({
        where: { slug: 'diwali' },
      });
    });

    it('should throw NotFoundException if occasion does not exist or inactive', async () => {
      prisma.festivalOccasion.findUnique.mockResolvedValue(null);

      await expect(service.getOccasionBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
